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

## Two ways in

**Fixed templates** (`templates.ts`) — what the weekly cron walks. Three
parameterised queries, chosen by ISO week.

**Free text** (`intent.ts`) — the dashboard form at
`/dashboard/articles/generate`, and `?topic=` on the cron route.

Both converge on `generateRankingFromResolved`. Selection differs; prose,
faithfulness checking, draft insert and rollback are identical.

### Why free text is safe here

The model is used as a **query parser**, not a fact source:

```
free text -> query parameters (model) -> films + facts (TMDB) -> prose (model, fenced)
```

It reads "netflix and chill" and decides *which query to run*. TMDB still decides
which films come back and in what order. The parser may only express: genre,
streaming provider (US), one director, a release-year range, ordering, and count.

Everything it emits is validated against live TMDB lookups. An invented genre or
provider is a **hard failure**, never a dropped filter — dropping it would leave
an unconstrained `vote_average.desc` sweep that still returns plenty of rows, so
nothing downstream would notice. Same failure shape as the `NaN` count bug.

A topic that constrains nothing at all is refused in code, independent of the
model's own `supported` flag — otherwise a model that approves everything would
make that flag decoration.

Measured behaviour:

| Topic | Outcome |
|---|---|
| `10 best horror movies` | genre: Horror · by audience score |
| `top movies ranked of taika watiti` (sic) | directed by Taika Waititi — misspelling resolved to the canonical TMDB name |
| `netflix and chill` | genre: Romance + Comedy · streaming on Netflix (US) |
| `best sci-fi of the 90s` | genre: Science Fiction · released 1990–1999 |
| `weekend watch` | **refused** — "too vague and does not specify a genre, provider, director, or year range" |
| `thrillers that flopped but aged well` | **refused** — "TMDB does not record box office performance or whether a film has aged well" |

The resolved query is shown back to the editor on success. That is the actual
safety mechanism: it is what lets a human judge whether "Netflix and Chill" was a
fair framing of `Romance + Comedy + provider=8 + rating desc`. The headline may
keep the requested framing; it may not claim anything the query did not
constrain.

Adding a fixed template means adding a query that provably supports its claim.

## Part two, and not repeating yourself

The query is deterministic, so re-running a topic returns identical films. "10
best horror movies part 2" would have duplicated part one exactly.

`articles.query_signature` stores the canonical constraints a ranking was built
from — genres, provider, director, year range, ordering — deliberately **not** the
count or the part number, so "10 best horror movies" and "another five horror
movies" share a signature. The parser emits a `part` number; when it is 2 or more,
every film used by earlier articles with the same signature is excluded.

Canonicalisation is the fragile bit: the two halves of a part-1/part-2 pair come
from two separate LLM calls, so genre ids are sorted numerically and the director
is stored as a stable TMDB id rather than the typed name.

`buildSignature` lives in `templates.ts` and is used by **both** entry points, so a
fixed template and the free-text parser emit the same shape. Without that a "part
2" typed into the dashboard could never continue from a cron-generated list.
Verified end to end: a template-generated `best_genre_year horror 2015` and a
free-text "best horror movies of 2015 part 2" both produced
`g=27;p=;d=;y=2015-2015;s=rating`, exclusion fired on 6 films, zero overlap.

Two guards:

- `part >= 2` with no earlier article of that signature is **refused** ("generate
  part one first") rather than silently producing a duplicate part one.
- Pages 1..3 are fetched and concatenated, never `page=2` alone —
  `vote_average.desc` reorders as vote counts move, so page 2 is not a stable
  window onto results 21–40. If exclusion leaves fewer than 5 unused films, the run
  fails saying earlier parts exhausted the query.

## Vote-count floor scales with query breadth

A flat floor of 150 produced garbage. "10 best horror movies" returned *Succubus*,
*La Leyenda de los Chaneques* and *Michael Jackson's Thriller* above *Alien* and
*The Shining*, because an obscure title with 160 votes at 8.0 outranks a canonical
one at 7.9.

| Query shape | Floor |
|---|---|
| director | 150 — their filmography is small and every entry is legitimately theirs |
| provider or year bound | 600 |
| genre alone, across all cinema | 3000 |
| sorted by popularity or recency | 100 |

Plus `without_genres=10770` (TV Movie) and `with_runtime.gte=60`, which is what
removes broadcast specials, shorts and music videos. After both changes the same
query returns Psycho, The Shining, Alien, The Thing, Rosemary's Baby, The Exorcist.

The generated cover image uses the top film's **backdrop**, not its poster — the
hero renders full-bleed at 55–70vh, where a 2:3 poster is cropped to a sliver.

## Previewing before publishing

`/preview/[id]` renders any article, published or not, using the same four detail
views the public site uses.

- Outside `/dashboard` on purpose: under the dashboard layout the sidebar changes
  the available width, so the preview would not match the real page. Here it
  inherits the same root layout, header, footer and theme.
- Keyed on **id**, not slug: a preview keyed on slug would collide with the public
  article route and share its 60s `getCachedPublicArticleBySlug` cache.
- Gated in middleware alongside `/dashboard`, re-checked in the page, and
  `Disallow: /preview/` in robots.txt — it serves unpublished content.
- A sticky "PREVIEW — NOT LIVE" banner with the status, so a screenshot of the
  middle of the page cannot be mistaken for the live site.
- `ViewCounter` opts out via a `PreviewProvider` context, so previewing a draft
  does not inflate its view count. A context rather than a `preview` prop threaded
  through four views — only ViewCounter needs to know.

The Eye button on `/dashboard/articles` used to point at the public URL, which
404s for drafts; it now points here, and published rows get a separate "View live"
link.

## TMDB reliability

`tmdbFetchJson` retries (4 attempts, exponential backoff) and then **throws**.
Selection calls must not degrade to `[]`: a swallowed `ECONNRESET` once surfaced
as *"only 0 qualifying titles for Denis Villeneuve"* — an infrastructure failure
wearing an editorial message — and another produced `list_items` rows with a null
`movie_id`, i.e. cards with no poster and no link, while the run reported success.

Two things that matter for the retry to work at all:

- **Retries set `cache: 'no-store'`.** Only the first attempt joins the Next
  fetch cache. Next memoizes an identical cached fetch for the render *including
  its rejection*, so a retry with the same options replays the failure instead of
  hitting the network. Observed: 3/3 in-route attempts failing while a fresh
  process succeeded on attempt 2.
- **Detail fetches are capped at 4 concurrent.** One `Promise.all` over 15 films
  drew repeated connection resets from TMDB. That burst was the root cause of the
  null `movie_id` rows, not TMDB being unreliable in general.

Public listing pages (trending, now playing) still degrade gracefully — an empty
carousel beats a broken page.

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

**Zero-item articles are refused at three layers.** The rollback above only
fires on an insert *error*, and inserting an empty array succeeds — so
`?count=abc` once produced `ok: true` with an article containing no items.
Closed by: an integer guard on every numeric query param (400, no coercion),
`Number.isFinite` in `clampCount`, and an explicit floor in `requireEnough` and
`assertFaithful`. `count` is clamped to 5–15, so `count=0` yields 5 and
`count=999` yields 15.

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

## Ratings

`list_items.item_rating` is documented out of 5 and the detail view renders it as
`{rating}/5` over five stars. TMDB scores out of 10, so the generator halves the
value (`toFiveScale`) and rounds to one decimal to match `DECIMAL(3,1)`. Writing
`vote_average` straight through produced "8.5/5" with every star filled.

## Known limits

- Only one director is supplied per film. `parseTmdbToInternalMovie` takes the
  first `job === 'Director'` credit, so on a co-directed film (Bacurau) the other
  director is absent from the facts.
- Blurbs land at 19–24 words against a stated 25–35. Within the accepted 15–60
  validation band, so runs pass; tighten the prompt if it matters.
- No dashboard trigger yet — generation is cron or curl only.
- Spotlight generation is not built. It needs `/person/{id}` plus
  `/person/{id}/combined_credits`, and `pull_quote` must stay hand-written.
