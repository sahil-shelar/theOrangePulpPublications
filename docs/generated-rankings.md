# Generated Rankings articles

Automated first drafts for `type: 'list'` articles. TMDB supplies the facts,
Gemini writes the prose, a human publishes. Nothing here ever publishes on its
own.

## Pipeline

```
fixed template  ->  TMDB query  ->  upsert movies  ->  Gemini (schema-constrained)
                ->  validate against supplied facts  ->  insert article + list_items (DRAFT)
```

| Stage | File |
|---|---|
| Template registry | `src/lib/generation/templates.ts` |
| Generator | `src/lib/generation/rankings.ts` |
| Gemini client + model ladder | `src/lib/services/gemini.ts` |
| TMDB queries | `src/lib/services/tmdb.ts` |
| Cron entry point | `src/app/api/cron/generate/route.ts` |

## Environment

Both must be set locally **and** in Vercel project settings, or the cron 401s
or throws:

| Variable | Purpose |
|---|---|
| `GEMINI_API_KEY` | Google AI Studio key |
| `CRON_SECRET` | Vercel sends it as `Authorization: Bearer …`. The route fails closed if unset — an absent secret rejects everyone rather than allowing everyone. |
| `GENERATED_AUTHOR_ID` | Optional. Author drafts are attributed to. Falls back to an author matching /editorial\|orange pulp\|staff/, then the first author row. |

## Schedule

`vercel.json` runs it Mondays 06:00 UTC. The route picks a slot from a
deterministic weekly rotation keyed off the ISO week, so re-firing inside the
same week repeats the same angle instead of stacking new ones.

Vercel Hobby allows 2 cron jobs at once-per-day granularity. If that becomes
limiting, a local crontab hitting the deployed URL with the same bearer token
works identically — that is how Project3 schedules its pipeline.

## Manual runs

Still behind the secret:

```bash
S=$(grep -m1 '^CRON_SECRET=' .env.local | cut -d= -f2)

curl -H "Authorization: Bearer $S" \
  "http://localhost:3000/api/cron/generate?template=best_genre_year&genre=thriller&year=2019&count=8"

curl -H "Authorization: Bearer $S" \
  "http://localhost:3000/api/cron/generate?template=top_by_director&person=Steven%20Spielberg&count=6"

curl -H "Authorization: Bearer $S" \
  "http://localhost:3000/api/cron/generate?template=highest_rated_genre_decade&genre=science%20fiction&decade=1990&count=6"
```

Every run inserts a `jobs` row and writes its outcome to `job_logs`, so failures
are auditable in the dashboard rather than only in function logs.

## Why templates are a closed set

An editor picks from three parameterised templates rather than typing a free
prompt. Each template maps to one TMDB query, so the facts handed to the model
are fully determined by the query.

Free text breaks that. "Underrated 90s thrillers that flopped but aged well" has
no TMDB signal for *flopped* or *aged well*, so the model fills the gap from
training data — which is the failure mode measured below.

Adding a template means adding a query that provably supports its claim.

## Safety rails, and why each exists

**Drafts only.** `status` is hardcoded `'draft'`.

**Measured fabrication.** Given only title/year/director/genre, the model
asserted plot detail that was never supplied — "every staircase and hidden
room" (Parasite), "music conservatory" (Whiplash), "every translated phrase"
(Arrival). The rule *"never add a fact"* was stated first, in caps, and ignored
by every model tested. Two mitigations followed:

- TMDB `synopsis` is supplied so the model has real material. The prompt frames
  it as a *fence, not a source* — without that framing the blurbs degraded into
  synopsis paraphrase instead of editorial takes.
- `director` and `country` are supplied, because without them the model named
  them anyway from training data ("Todd Phillips", "Argentine"). Correct, but
  unsupplied and therefore unverifiable. Supplying them turns invention into
  attribution.

Neither mitigation *verifies* anything. Aesthetic claims ("urgent handheld
camerawork") remain unverifiable by construction. That is what the human gate is
for.

**`pull_quote` is never written.** It renders at 4xl in quotation marks and reads
as attributable to a named person. A generated one is a fabricated quote.

**Faithfulness check before any write.** `assertFaithful` requires the returned
`(rank, title)` set to equal the supplied set exactly. `gemini-2.5-flash` was
observed attaching the wrong film's blurb to rank 1; unchecked, that binds a
blurb to the wrong `movie_id` under `list_items`' `UNIQUE(article_id, rank)` and
renders publicly. A mismatch rejects the whole generation.

**Rollback on partial failure.** If `list_items` insert fails the article row is
deleted — an article with no items renders as an empty list.

**No prompt example naming a real film.** An earlier "good example" used Parasite
and rank 1 returned it near-verbatim. The example is now a hypothetical.

## Model ladder

```
gemini-3.6-flash        thinkingLevel: LOW   <- lead
gemini-3.5-flash-lite
gemini-2.5-flash
```

- Explicit IDs, no `gemini-flash-latest` — a moving alias would let the house
  voice drift without a deploy.
- `gemini-2.5-pro` is excluded. It still appears in `models.list()` but
  generation returns 429 with `limit: 0` on the free tier (measured 2026-08-06).
- Three separate quota pools, so a per-model daily cap degrades instead of
  failing the run.
- `thinkingLevel: LOW` cut thinking from ~2,100 tokens to 0 with output equal or
  better. Typical run: ~1,600 in / ~600 out.
- Retry classification differs from Project3 on purpose: a serverless invocation
  caps at 60s, so a minute-quota error advances to the next model rather than
  sleeping 60s.

`responseSchema` (not just `responseMimeType`) is what makes the response safe to
`JSON.parse` strictly — no fence-stripping needed. It constrains shape, never
truth.

## Known limits

- Only one director is supplied per film. `parseTmdbToInternalMovie` takes the
  first `job === 'Director'` credit, so on a co-directed film (Bacurau) the other
  director is absent from the facts.
- Blurbs land at 19–24 words against a stated 25–35. Within the accepted 15–60
  validation band, so runs pass; tighten the prompt if it matters.
- No dashboard trigger yet — generation is cron or curl only.
- Spotlight generation is not built. It needs `/person/{id}` plus
  `/person/{id}/combined_credits`, and `pull_quote` must stay hand-written.
