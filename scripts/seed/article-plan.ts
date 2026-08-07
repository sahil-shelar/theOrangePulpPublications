// The single definition of what `npm run seed` creates, shared by the seeder and
// by scripts/backfill-origins.ts.
//
// These two used to hold separate copies of the same five numbers. That is a
// silent-drift hazard with a nasty failure mode: raising a count in the seeder
// without raising it here would leave the extra seeded articles classified as
// production data and therefore live on the real site — the exact bug the origin
// column exists to prevent.
//
// `seedKey` is NOT the article type. It feeds the deterministic UUID, so it has
// to survive type renames — 'feature' rows became type 'list' and kept their key
// so re-seeding updates the same rows instead of creating duplicates.

export const ARTICLE_SEED_PLAN = [
  { type: 'review', count: 120, seedKey: 'review' },
  { type: 'news', count: 120, seedKey: 'news' },
  { type: 'spotlight', count: 40, seedKey: 'spotlight' },
  { type: 'list', count: 40, seedKey: 'feature' },
  { type: 'list', count: 30, seedKey: 'ranking' },
] as const

/** Every article id `npm run seed` would write, in plan order. */
export function seededArticleIds(uuidFor: (seed: string) => string): string[] {
  const ids: string[] = []
  for (const { seedKey, count } of ARTICLE_SEED_PLAN) {
    for (let i = 0; i < count; i++) ids.push(uuidFor(`article-${seedKey}-${i}`))
  }
  return ids
}
