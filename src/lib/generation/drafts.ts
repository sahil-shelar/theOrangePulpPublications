// Helpers shared by every generated-draft pipeline (rankings, spotlights).
//
// Extracted rather than duplicated: uniqueSlug in particular is correctness
// relevant — two pipelines with their own copy would be free to diverge on
// collision handling, and a slug collision surfaces as a 404 on a published
// article rather than as an error at write time.

import type { createAdminClient } from '@/lib/supabase/admin'

type Admin = ReturnType<typeof createAdminClient>

/** 80 chars because articles.slug is bounded and a long generated headline would
 *  otherwise be truncated by the database rather than here. */
export const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80)

/** Resolve the author generated drafts are attributed to. */
export async function resolveAuthorId(supabase: Admin) {
  if (process.env.GENERATED_AUTHOR_ID) return process.env.GENERATED_AUTHOR_ID

  const { data } = await supabase.from('authors').select('id, name').limit(50)
  if (!data?.length) return null
  const editorial = data.find(a => /editorial|orange pulp|staff/i.test(a.name ?? ''))
  return (editorial ?? data[0]).id
}

export async function uniqueSlug(supabase: Admin, base: string) {
  for (let suffix = 0; suffix < 20; suffix++) {
    const candidate = suffix === 0 ? base : `${base}-${suffix + 1}`
    const { data } = await supabase.from('articles').select('id').eq('slug', candidate).maybeSingle()
    if (!data) return candidate
  }
  throw new Error(`Could not find a free slug for "${base}".`)
}
