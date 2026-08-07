'use server'

import { createClient } from '@/lib/supabase/server'
import { Database } from '@/types/database'
import { handleSupabaseError } from '@/utils/supabase-error'
import { revalidatePath, updateTag } from 'next/cache'
import { currentDataOrigin, isDataOrigin, type DataOrigin } from '@/lib/data-origin'

type ArticleInsert = Database['public']['Tables']['articles']['Insert']
type ArticleUpdate = Database['public']['Tables']['articles']['Update']

const ROLE_RANK: Record<string, number> = { admin: 3, editor: 2, writer: 1 }
const hasRole = (user: any, minRole: string) =>
  (ROLE_RANK[user?.app_metadata?.role ?? 'writer'] ?? 1) >= (ROLE_RANK[minRole] ?? 1)

export async function createArticle(data: ArticleInsert) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  // Writers can only save drafts, never publish directly
  if (!hasRole(user, 'editor') && data.status === 'published') {
    data = { ...data, status: 'draft' }
  }

  const { data: article, error } = await supabase
    .from('articles')
    .insert({
      ...data,
      // Set from the runtime, and NOT overridable by the caller — an article
      // written against localhost stays local until someone promotes it. Placed
      // after the spread deliberately: this must win over anything the form sent.
      origin: articleOriginFor(user),
    })
    .select()
    .single()

  if (error) return handleSupabaseError(error)

  revalidatePath('/')
  updateTag('articles')
  return { data: article }
}

/**
 * Which environment tag a new article gets.
 *
 * Normally just the runtime's own origin. The exception is test accounts: signing
 * in as a seeded/QA account ON production and writing an article would otherwise
 * produce production content, which is the other half of what the separation is
 * for. TEST_ACCOUNT_EMAILS is a comma-separated list; anything on it writes local
 * rows wherever it is signed in.
 */
function articleOriginFor(user: { email?: string | null }): DataOrigin {
  const testers = (process.env.TEST_ACCOUNT_EMAILS ?? '')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean)

  const email = user.email?.toLowerCase()
  if (email && testers.includes(email)) return 'local'
  return currentDataOrigin()
}

/**
 * Promote an article to production — the "Push to prod" action.
 *
 * This is the ONLY way a local or seeded row becomes publicly visible on the
 * deployed site, and it is deliberately a separate, explicit step rather than
 * something publishing does implicitly: `status: 'published'` answers "is this
 * finished", `origin` answers "which site is this for", and conflating them is
 * how the seed data went live in the first place.
 *
 * Editor and above, matching who is allowed to publish.
 */
export async function setArticleOrigin(id: string, origin: DataOrigin) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")
  if (!hasRole(user, 'editor')) {
    return { error: 'Only editors and admins can change where an article is published.' }
  }
  if (!isDataOrigin(origin)) return { error: `"${origin}" is not a valid origin.` }

  const { data: article, error } = await supabase
    .from('articles')
    .update({ origin })
    .eq('id', id)
    .select('id, slug, type, origin, status')
    .single()

  if (error) return handleSupabaseError(error)

  revalidatePath('/')
  revalidatePath('/dashboard/articles')
  updateTag('articles')
  return { data: article }
}

export async function updateArticle(id: string, data: ArticleUpdate) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  // Writers cannot publish
  if (!hasRole(user, 'editor') && data.status === 'published') {
    return { error: 'Writers cannot publish articles. Submit for review instead.' }
  }

  // `origin` is not editable through the article form — moving a row between
  // environments goes through setArticleOrigin, which checks the editor role and
  // is an explicit, auditable action rather than a side effect of saving a draft.
  const safe: ArticleUpdate = { ...data }
  delete (safe as { origin?: unknown }).origin

  const { data: article, error } = await supabase
    .from('articles')
    .update(safe)
    .eq('id', id)
    .select()
    .single()

  if (error) return handleSupabaseError(error)

  revalidatePath('/')
  updateTag('articles')
  if (article.slug) revalidatePath(`/${article.type}s/${article.slug}`)
  return { data: article }
}

export async function deleteArticle(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  if (!hasRole(user, 'admin')) {
    throw new Error("Forbidden: Only admins can delete articles")
  }

  const { error } = await supabase.from('articles').delete().eq('id', id)
  if (error) return handleSupabaseError(error)

  revalidatePath('/')
  updateTag('articles')
  return { success: true }
}

type ListItemInput = {
  rank: number
  movie_id?: string | null
  custom_title?: string | null
  blurb?: string | null
  item_rating?: number | null
}

export async function replaceListItems(articleId: string, items: ListItemInput[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const { error: delErr } = await supabase.from('list_items').delete().eq('article_id', articleId)
  if (delErr) return handleSupabaseError(delErr)

  if (items.length > 0) {
    const { error: insErr } = await supabase.from('list_items').insert(
      items.map(item => ({ ...item, article_id: articleId }))
    )
    if (insErr) return handleSupabaseError(insErr)
  }

  updateTag('articles')
  return { success: true }
}

type SpotlightWorkInput = {
  rank: number
  movie_id?: string | null
  custom_title?: string | null
  note?: string | null
}

export async function replaceSpotlightWorks(articleId: string, works: SpotlightWorkInput[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const { error: delErr } = await supabase.from('spotlight_works').delete().eq('article_id', articleId)
  if (delErr) return handleSupabaseError(delErr)

  if (works.length > 0) {
    const { error: insErr } = await supabase.from('spotlight_works').insert(
      works.map(work => ({ ...work, article_id: articleId }))
    )
    if (insErr) return handleSupabaseError(insErr)
  }

  updateTag('articles')
  return { success: true }
}

export async function incrementViewCount(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.rpc('increment_view_count', { article_id: id })
  if (error) return handleSupabaseError(error)
  return { success: true }
}
