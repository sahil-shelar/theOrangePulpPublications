// Which environment a row was created in, and which rows this environment shows.
//
// The dev server and the deployed site share one Supabase project — there is no
// separate local database. Without a partition, anything written while poking at
// localhost:3000 is immediately live on theorangepulp.blog, which is how 350
// seeded demo articles ended up published on production with no cover images.
//
// So every article carries the origin it was written from, and a production read
// only returns production rows. Local keeps seeing everything, because the point
// of local is to see what you just made.
//
//   localhost / vercel preview  -> writes 'local', reads everything
//   vercel production           -> writes 'production', reads 'production'
//   npm run seed                -> writes 'seed', never visible on production
//
// Promotion is explicit: the dashboard's "Push to prod" button flips a row to
// 'production'. Nothing is promoted automatically.

export const DATA_ORIGINS = ['production', 'local', 'seed'] as const
export type DataOrigin = (typeof DATA_ORIGINS)[number]

export function isDataOrigin(value: unknown): value is DataOrigin {
  return typeof value === 'string' && (DATA_ORIGINS as readonly string[]).includes(value)
}

/**
 * The origin rows written by THIS runtime are tagged with.
 *
 * `VERCEL_ENV` is set by Vercel to 'production' | 'preview' | 'development' and
 * is absent when running `next dev` locally. Only a real production deployment
 * writes production rows; a preview deployment is a test environment and is
 * treated exactly like localhost.
 *
 * `DATA_ORIGIN` overrides both, for the rare case of pointing a local process at
 * production deliberately. It is read from the server environment only — never
 * NEXT_PUBLIC_, because a value the browser can read is a value the browser can
 * be lied to about.
 */
export function currentDataOrigin(): DataOrigin {
  const override = process.env.DATA_ORIGIN
  if (isDataOrigin(override)) return override
  // 'seed' is never a runtime origin — only the seeder writes it, explicitly.
  return process.env.VERCEL_ENV === 'production' ? 'production' : 'local'
}

/**
 * Which origins the current runtime is allowed to SHOW on public pages.
 *
 * Production shows production rows and nothing else. Everywhere else shows all
 * three, so a local run displays local drafts, promoted content and seed data
 * together — which is what makes local useful for checking a layout against a
 * full listing page.
 */
export function visibleDataOrigins(): readonly DataOrigin[] {
  return currentDataOrigin() === 'production' ? (['production'] as const) : DATA_ORIGINS
}

/**
 * Cache-key fragment for `unstable_cache`.
 *
 * Reads that filter on origin MUST include this in their key array. The filter
 * lives inside the cached function, so without it the first caller's result is
 * cached and replayed for every other origin — the cache would hand production
 * rows to a local request and vice versa.
 */
export function dataOriginCacheKey(): string {
  return `origin:${currentDataOrigin()}`
}
