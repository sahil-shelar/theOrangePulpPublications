// Gemini wrapper for editorial generation.
//
// Model ladder is pinned to explicit IDs on purpose. `gemini-flash-latest` is a
// moving alias, so leading with it would let the house voice drift without a
// deploy. `gemini-2.5-pro` is deliberately absent: it still appears in
// models.list() but generation against it returns 429 with `limit: 0` on the
// free tier (measured 2026-08-06), so leading with it burns a request per run.
//
// The three entries below draw on separate quota pools, so a per-model daily
// cap degrades instead of failing the run.

import { GoogleGenAI, ThinkingLevel, type SchemaUnion } from '@google/genai'

export const MODEL_LADDER = [
  'gemini-3.6-flash',
  'gemini-3.5-flash-lite',
  'gemini-2.5-flash',
] as const

const MAX_ATTEMPTS_PER_MODEL = 2

// Vercel caps a serverless invocation at 60s, so Project3's "sleep 60s and
// retry the same model" strategy would kill the request. Here a minute-quota
// error moves to the next model instead, and only short backoffs are honoured.
const MAX_BACKOFF_MS = 8_000

let client: GoogleGenAI | null = null

function getClient(): GoogleGenAI {
  if (!client) {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) throw new Error('GEMINI_API_KEY is not set.')
    client = new GoogleGenAI({ apiKey })
  }
  return client
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

type Classified =
  | { action: 'retry'; waitMs: number }
  | { action: 'nextModel' }

function classify(err: unknown, attempt: number): Classified {
  const message = err instanceof Error ? err.message : String(err)

  // Overloaded — the same model will likely succeed shortly.
  if (message.includes('503') || message.includes('UNAVAILABLE')) {
    return { action: 'retry', waitMs: Math.min(2_000 * (attempt + 1), MAX_BACKOFF_MS) }
  }

  if (message.includes('429') || message.includes('RESOURCE_EXHAUSTED')) {
    // A daily cap will not clear during this run. Anything else might, but only
    // if the suggested delay fits inside the invocation budget.
    if (message.includes('PerDay')) return { action: 'nextModel' }
    const suggested = message.match(/'retryDelay':\s*'(\d+)s'/)
    const waitMs = suggested ? Number(suggested[1]) * 1_000 : Infinity
    return waitMs <= MAX_BACKOFF_MS ? { action: 'retry', waitMs } : { action: 'nextModel' }
  }

  // 400/404 and anything unrecognised: this model is not going to work.
  return { action: 'nextModel' }
}

export type GenerateJsonArgs = {
  systemInstruction: string
  prompt: string
  schema: SchemaUnion
  /** Thinking costs far more than the response for rewriting supplied facts.
   *  Measured: LOW gave 0 thinking tokens and output equal or better than the
   *  ~2,100 the default spent. */
  thinkingLevel?: ThinkingLevel
  temperature?: number
}

export type GenerateJsonResult<T> = {
  data: T
  model: string
  usage: { input: number; output: number; thoughts: number; total: number }
}

/**
 * Generate schema-constrained JSON, walking the model ladder on failure.
 *
 * `responseSchema` (not just `responseMimeType`) is what makes the result
 * parseable with a strict JSON.parse — no fence-stripping or lenient-parse
 * fallback is needed. Verified across every model in the ladder.
 *
 * Note the schema constrains *shape*, never truth. Callers must validate the
 * content against the facts they supplied.
 */
export async function generateJson<T>({
  systemInstruction,
  prompt,
  schema,
  thinkingLevel = ThinkingLevel.LOW,
  temperature = 1.0,
}: GenerateJsonArgs): Promise<GenerateJsonResult<T>> {
  const ai = getClient()
  const failures: string[] = []

  for (const model of MODEL_LADDER) {
    for (let attempt = 0; attempt < MAX_ATTEMPTS_PER_MODEL; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
            responseSchema: schema,
            thinkingConfig: { thinkingLevel },
            temperature,
          },
        })

        const text = response.text
        if (!text) throw new Error('Empty response body.')

        const usageMeta = response.usageMetadata
        return {
          data: JSON.parse(text) as T,
          model,
          usage: {
            input: usageMeta?.promptTokenCount ?? 0,
            output: usageMeta?.candidatesTokenCount ?? 0,
            thoughts: usageMeta?.thoughtsTokenCount ?? 0,
            total: usageMeta?.totalTokenCount ?? 0,
          },
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        failures.push(`${model}: ${message.slice(0, 160)}`)

        const next = classify(err, attempt)
        if (next.action === 'nextModel') break
        await sleep(next.waitMs)
      }
    }
  }

  throw new Error(`All Gemini models failed.\n${failures.join('\n')}`)
}
