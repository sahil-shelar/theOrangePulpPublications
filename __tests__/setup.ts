import '@testing-library/jest-dom'
import fetch, { Headers, Request, Response } from 'node-fetch'
import { ReadableStream, WritableStream, TransformStream } from 'node:stream/web'

if (!globalThis.fetch) {
  globalThis.fetch = fetch as any
  globalThis.Headers = Headers as any
  globalThis.Request = Request as any
  globalThis.Response = Response as any
}

// The jsdom environment does not expose the WHATWG stream globals even though
// the underlying Node runtime has them. @google/genai reaches for ReadableStream
// at module load, so importing anything under src/lib/generation threw
// "ReadableStream is not defined" before a test could run. Sourced from
// node:stream/web rather than shimmed, so behaviour matches the real runtime.
for (const [name, impl] of [
  ['ReadableStream', ReadableStream],
  ['WritableStream', WritableStream],
  ['TransformStream', TransformStream],
] as const) {
  if (!(name in globalThis)) (globalThis as any)[name] = impl
}
