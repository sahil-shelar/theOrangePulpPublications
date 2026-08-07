// One-off migration: reclassify seeded demo articles as `origin = 'seed'`.
//
// Why. The dev server and the deployed site share one Supabase project, so
// `npm run seed` wrote 350 demo articles at `status: 'published'` straight onto
// production. They have no cover images, titles like "The Evolution of Modern
// Cinema (626)", and they buried the real content.
//
// 20260808000000_article_data_origin.sql adds the `origin` column and sets every
// existing row to 'production' — deliberately, so applying the migration changes
// nothing visible. This script is the reviewable second step that moves the
// seeded rows to 'seed', at which point production stops showing them and local
// still does.
//
//   npm run backfill:origins              # dry run — reports, writes nothing
//   npm run backfill:origins -- --apply   # writes
//
// Identification is EXACT, not a heuristic. The seeder derives each article's id
// from sha256("article-<seedKey>-<i>") (scripts/seed/helpers.ts), so this
// recomputes the same 350 ids and matches on primary key. Titles and null cover
// images were tempting but would also catch a real article an editor happened to
// publish without a cover.
//
// Safe to re-run, and reversible: `--restore` puts the same ids back to
// 'production' if this turns out to be wrong.

import { supabase } from './seed/config'
import { getDeterministicUuid } from './seed/helpers'
import { seededArticleIds } from './seed/article-plan'

/** Supabase rejects very large `.in()` lists, and 350 ids is already a long URL. */
const CHUNK = 50

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size))
  return out
}

async function main() {
  const apply = process.argv.includes('--apply')
  const restore = process.argv.includes('--restore')
  const target = restore ? 'production' : 'seed'

  const ids = seededArticleIds(getDeterministicUuid)
  console.log(
    `Computed ${ids.length} seeded article ids. Received args: ${JSON.stringify(process.argv.slice(2))}\n` +
    (apply
      ? `APPLYING — setting origin='${target}' on rows that exist. This writes to the live Supabase project.\n`
      : `Dry run. To write, run:  npm run backfill:origins -- --apply${restore ? ' --restore' : ''}\n` +
        '(the bare `--` matters; without it npm keeps the flag for itself)\n')
  )

  // Only touch rows that are actually there. A seeded id that was deleted by
  // hand must not be resurrected, and reporting "350 updated" when 12 exist
  // would be a lie about what happened.
  const present: { id: string; title: string; origin: string; status: string }[] = []
  for (const part of chunk(ids, CHUNK)) {
    const { data, error } = await supabase
      .from('articles')
      .select('id, title, origin, status')
      .in('id', part)
    if (error) {
      if (/column .*origin.* does not exist/i.test(error.message)) {
        throw new Error(
          'The `origin` column is not there yet. Apply ' +
          'supabase/migrations/20260808000000_article_data_origin.sql first — it is ' +
          'backwards compatible and changes nothing visible on its own.'
        )
      }
      throw new Error(`Lookup failed: ${error.message}`)
    }
    present.push(...((data ?? []) as typeof present))
  }

  const needsChange = present.filter(a => a.origin !== target)

  console.log(`  ${present.length} of those ids exist in the database.`)
  console.log(`  ${present.length - needsChange.length} already have origin='${target}'.`)
  console.log(`  ${needsChange.length} would change.\n`)

  if (needsChange.length > 0) {
    for (const row of needsChange.slice(0, 5)) {
      console.log(`    e.g. "${row.title}" — ${row.origin} -> ${target} (status: ${row.status})`)
    }
    if (needsChange.length > 5) console.log(`    ...and ${needsChange.length - 5} more`)
    console.log()
  }

  // What production keeps. Worth printing before any write: if this number is 0,
  // the migration or the id list is wrong and applying would empty the site.
  let query = supabase
    .from('articles')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'published')
    .eq('origin', 'production')

  // `.not('id', 'in', '()')` is a syntax error, so only exclude when there is
  // something to exclude — which is also the already-migrated re-run case.
  if (needsChange.length > 0) {
    query = query.not('id', 'in', `(${needsChange.map(r => r.id).join(',')})`)
  }

  const { count: productionAfter } = await query

  console.log(`Production would show ${productionAfter ?? 0} published articles after this.`)
  if ((productionAfter ?? 0) === 0) {
    console.log('  REFUSING: that would leave production with nothing. Check the migration ran.')
    process.exitCode = 1
    return
  }

  if (!apply || needsChange.length === 0) {
    console.log(apply ? '\nNothing to do.' : '\nDry run — nothing written.')
    return
  }

  let updated = 0
  for (const part of chunk(needsChange.map(r => r.id), CHUNK)) {
    const { error, count } = await supabase
      .from('articles')
      .update({ origin: target }, { count: 'exact' })
      .in('id', part)
    if (error) throw new Error(`Update failed: ${error.message}`)
    updated += count ?? 0
  }

  console.log(`\nUpdated ${updated} articles to origin='${target}'.`)
  console.log('Production listings are cached for 60s — give it a minute, or redeploy.')
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
