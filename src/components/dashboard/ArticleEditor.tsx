// @ts-nocheck
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createArticle, updateArticle, deleteArticle, replaceListItems, replaceSpotlightWorks } from '@/lib/actions/articles'
import { ArticleWithRelations } from '@/types/models'
import Link from 'next/link'
import { Eye, Save, Trash2, Send, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
import ImagePicker from '@/components/dashboard/ImagePicker'
import ListItemsEditor, { ListItemDraft, emptyListItem } from '@/components/dashboard/ListItemsEditor'
import SpotlightWorksEditor, { SpotlightWorkDraft, emptySpotlightWork } from '@/components/dashboard/SpotlightWorksEditor'
import { typeToRoute } from '@/lib/utils'
import { STORAGE_BUCKETS } from '@/lib/api/storage'
import AIAssistantPanel from './AIAssistantPanel'
import sampleNews from '@/lib/sample-data/news.json'
import sampleReview from '@/lib/sample-data/review.json'
import sampleList from '@/lib/sample-data/list.json'
import sampleSpotlight from '@/lib/sample-data/spotlight.json'

type ArticleType = 'news' | 'review' | 'spotlight' | 'list'

type EditorProps = {
  type: ArticleType
  initialData?: ArticleWithRelations | null
  categories: any[]
  authors: any[]
  movies: any[]
  tags: any[]
}

const TYPE_LABEL: Record<ArticleType, string> = {
  news: 'News',
  review: 'Review',
  spotlight: 'Spotlight',
  list: 'Rankings / List',
}

const VERDICTS = [
  { value: '', label: 'No verdict yet' },
  { value: 'must_watch', label: 'Must Watch' },
  { value: 'recommended', label: 'Recommended' },
  { value: 'mixed', label: 'Mixed' },
  { value: 'skip', label: 'Skip' },
]

const SAMPLE_BY_TYPE: Record<ArticleType, any> = {
  news: sampleNews,
  review: sampleReview,
  list: sampleList,
  spotlight: sampleSpotlight,
}

export default function ArticleEditor({ type, initialData, categories, authors, movies, tags }: EditorProps) {
  const router = useRouter()
  const isEditing = !!initialData
  // Reference sample data on a fresh (non-edit) form so writers can see the
  // expected structure per type instead of a blank page. Not used once editing.
  const sample = !isEditing ? SAMPLE_BY_TYPE[type] : null

  const [formData, setFormData] = useState({
    title: initialData?.title || sample?.title || '',
    slug: initialData?.slug || sample?.slug || '',
    excerpt: initialData?.excerpt || sample?.excerpt || '',
    content: initialData?.content || sample?.content || '',
    cover_image_url: initialData?.cover_image_url || '',
    status: initialData?.status || 'draft',
    category_id: initialData?.category_id || (categories[0]?.id ?? ''),
    author_id: initialData?.author_id || (authors[0]?.id ?? ''),
    movie_id: initialData?.movie_id || '',
    is_featured: initialData?.is_featured || false,
    seo_title: initialData?.seo_title || sample?.seo_title || '',
    seo_description: initialData?.seo_description || sample?.seo_description || '',
    og_image_url: initialData?.og_image_url || '',
    workflow_status: initialData?.workflow_status || 'idea',
    assignee_id: initialData?.assignee_id || '',
    priority: initialData?.priority || 'medium',
    // Review
    rating: initialData?.rating != null ? String(initialData.rating) : (sample?.rating ?? ''),
    imdb_score: initialData?.imdb_score != null ? String(initialData.imdb_score) : (sample?.imdb_score ?? ''),
    rt_score: initialData?.rt_score != null ? String(initialData.rt_score) : (sample?.rt_score ?? ''),
    verdict: initialData?.verdict || sample?.verdict || '',
    // News
    subheadline: initialData?.subheadline || sample?.subheadline || '',
    source_name: initialData?.source_name || sample?.source_name || '',
    source_url: initialData?.source_url || sample?.source_url || '',
    // Spotlight
    subject_name: initialData?.subject_name || sample?.subject_name || '',
    subject_role: initialData?.subject_role || sample?.subject_role || '',
    subject_photo_url: initialData?.subject_photo_url || '',
    pull_quote: initialData?.pull_quote || sample?.pull_quote || '',
  })

  const [listItems, setListItems] = useState<ListItemDraft[]>(() => {
    const rows = initialData?.list_items ?? []
    if (rows.length > 0) {
      return rows
        .slice()
        .sort((a: any, b: any) => a.rank - b.rank)
        .map((r: any) => ({
          movie_id: r.movie_id,
          custom_title: r.custom_title || '',
          blurb: r.blurb || '',
          item_rating: r.item_rating != null ? String(r.item_rating) : '',
        }))
    }
    if (sample?.items?.length) return sample.items.map((i: any) => ({ ...i, custom_title: i.custom_title || '', blurb: i.blurb || '', item_rating: i.item_rating ?? '' }))
    return [emptyListItem()]
  })

  const [spotlightWorks, setSpotlightWorks] = useState<SpotlightWorkDraft[]>(() => {
    const rows = initialData?.spotlight_works ?? []
    if (rows.length > 0) {
      return rows
        .slice()
        .sort((a: any, b: any) => a.rank - b.rank)
        .map((r: any) => ({
          movie_id: r.movie_id,
          custom_title: r.custom_title || '',
          note: r.note || '',
        }))
    }
    if (sample?.works?.length) return sample.works.map((w: any) => ({ ...w, custom_title: w.custom_title || '', note: w.note || '' }))
    return [emptySpotlightWork()]
  })

  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasUnsavedChanges])

  useEffect(() => {
    if (!isEditing || formData.slug === '') {
      const generatedSlug = formData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '')
      setFormData(prev => ({ ...prev, slug: generatedSlug }))
    }
  }, [formData.title, isEditing])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type: inputType } = e.target as HTMLInputElement
    const checked = (e.target as HTMLInputElement).checked

    setFormData(prev => ({
      ...prev,
      [name]: inputType === 'checkbox' ? checked : value
    }))
    setHasUnsavedChanges(true)
    setError('')
  }

  const validate = () => {
    if (!formData.title) return 'Title is required'
    if (!formData.slug) return 'Slug is required'
    if (!formData.category_id) return 'Category is required'
    if (type === 'list' && listItems.every(i => !i.movie_id && !i.custom_title.trim())) {
      return 'Add at least one ranked item'
    }
    if (type === 'spotlight' && !formData.subject_name.trim()) {
      return 'Subject name is required'
    }
    return null
  }

  const handleSave = async (e: React.FormEvent, forceStatus?: string) => {
    e.preventDefault()

    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    setIsSaving(true)
    setError('')

    const payloadToSave: Record<string, any> = {
      title: formData.title,
      slug: formData.slug,
      excerpt: formData.excerpt,
      content: formData.content,
      cover_image_url: formData.cover_image_url,
      status: (forceStatus || formData.status) as 'draft' | 'published' | 'archived',
      type,
      category_id: formData.category_id === '' ? null : formData.category_id,
      author_id: formData.author_id === '' ? null : formData.author_id,
      is_featured: formData.is_featured,
      seo_title: formData.seo_title,
      seo_description: formData.seo_description,
      og_image_url: formData.og_image_url,
      workflow_status: formData.workflow_status,
      assignee_id: formData.assignee_id === '' ? null : formData.assignee_id,
      priority: formData.priority,
      published_at: (forceStatus === 'published' && !initialData?.published_at) ? new Date().toISOString() : initialData?.published_at,
    }

    if (type === 'review') {
      payloadToSave.movie_id = formData.movie_id === '' ? null : formData.movie_id
      payloadToSave.rating = formData.rating === '' ? null : Number(formData.rating)
      payloadToSave.imdb_score = formData.imdb_score === '' ? null : Number(formData.imdb_score)
      payloadToSave.rt_score = formData.rt_score === '' ? null : Number(formData.rt_score)
      payloadToSave.verdict = formData.verdict || null
    }
    if (type === 'news') {
      payloadToSave.subheadline = formData.subheadline || null
      payloadToSave.source_name = formData.source_name || null
      payloadToSave.source_url = formData.source_url || null
    }
    if (type === 'spotlight') {
      payloadToSave.subject_name = formData.subject_name || null
      payloadToSave.subject_role = formData.subject_role || null
      payloadToSave.subject_photo_url = formData.subject_photo_url || null
      payloadToSave.pull_quote = formData.pull_quote || null
    }

    try {
      let articleId = initialData?.id

      if (isEditing && initialData) {
        const { error: updateErr } = await updateArticle(initialData.id, payloadToSave)
        if (updateErr) throw new Error(updateErr)
      } else {
        const { error: createErr, data } = await createArticle(payloadToSave)
        if (createErr) throw new Error(createErr)
        articleId = data?.id
      }

      if (articleId && type === 'list') {
        const cleanItems = listItems
          .filter(i => i.movie_id || i.custom_title.trim())
          .map((i, idx) => ({
            rank: idx + 1,
            movie_id: i.movie_id,
            custom_title: i.movie_id ? null : (i.custom_title.trim() || null),
            blurb: i.blurb.trim() || null,
            item_rating: i.item_rating === '' ? null : Number(i.item_rating),
          }))
        const { error: itemsErr } = await replaceListItems(articleId, cleanItems)
        if (itemsErr) throw new Error(itemsErr)
      }

      if (articleId && type === 'spotlight') {
        const cleanWorks = spotlightWorks
          .filter(w => w.movie_id || w.custom_title.trim())
          .map((w, idx) => ({
            rank: idx + 1,
            movie_id: w.movie_id,
            custom_title: w.movie_id ? null : (w.custom_title.trim() || null),
            note: w.note.trim() || null,
          }))
        const { error: worksErr } = await replaceSpotlightWorks(articleId, cleanWorks)
        if (worksErr) throw new Error(worksErr)
      }

      if (!isEditing && articleId) {
        router.replace(`/dashboard/articles/${articleId}/edit`)
      }

      setHasUnsavedChanges(false)
      const btn = document.getElementById('save-btn')
      if (btn) {
        const old = btn.innerText
        btn.innerText = 'SAVED!'
        setTimeout(() => { btn.innerText = old }, 2000)
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while saving.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!isEditing || !initialData) return
    if (!confirm('Are you absolutely sure you want to delete this article? This cannot be undone.')) return

    setIsSaving(true)
    const { error: delErr } = await deleteArticle(initialData.id)
    if (delErr) {
      setError(delErr)
      setIsSaving(false)
    } else {
      router.push('/dashboard/articles')
    }
  }

  return (
    <form className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8 relative" onSubmit={handleSave}>

      {/* Left Column: Main Editor */}
      <div className="flex-1 flex flex-col gap-8">

        {error && (
          <div className="brutal-card bg-red-500 text-white p-4 font-bold border-[3px] border-foreground">
            {error}
          </div>
        )}

        {sample && (
          <div className="border-[3px] border-foreground bg-secondary text-foreground p-4 text-xs font-black uppercase tracking-widest">
            Reference sample data loaded for the {TYPE_LABEL[type]} template — replace every field with your own before publishing.
          </div>
        )}

        <div className="flex flex-col gap-4">
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="ARTICLE TITLE..."
            className="w-full bg-background border-b-[3px] border-foreground pb-2 font-heading text-4xl font-black uppercase tracking-tighter text-foreground placeholder:text-foreground/30 focus:outline-none"
          />

          <div className="flex items-center gap-2 text-sm font-bold bg-muted p-2 border-[3px] border-foreground">
            <span className="text-foreground/60 uppercase tracking-widest text-xs">SLUG:</span>
            <input
              type="text"
              name="slug"
              value={formData.slug}
              onChange={handleChange}
              className="flex-1 bg-transparent focus:outline-none text-foreground"
            />
          </div>
        </div>

        {/* News-only fields */}
        {type === 'news' && (
          <div className="flex flex-col gap-4 brutal-card bg-muted p-6">
            <h3 className="font-heading text-lg font-black uppercase tracking-widest border-b-[3px] border-foreground pb-2 inline-block">News Details</h3>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black uppercase tracking-widest">Subheadline</label>
              <input type="text" name="subheadline" value={formData.subheadline} onChange={handleChange}
                className="w-full bg-background border-[3px] border-foreground p-3 text-sm focus:outline-none" placeholder="One line under the headline" />
            </div>
            <div className="flex gap-4">
              <div className="flex flex-col gap-2 flex-1">
                <label className="text-[10px] font-black uppercase tracking-widest">Source Name</label>
                <input type="text" name="source_name" value={formData.source_name} onChange={handleChange}
                  className="w-full bg-background border-[3px] border-foreground p-3 text-sm focus:outline-none" placeholder="Variety" />
              </div>
              <div className="flex flex-col gap-2 flex-1">
                <label className="text-[10px] font-black uppercase tracking-widest">Source URL</label>
                <input type="url" name="source_url" value={formData.source_url} onChange={handleChange}
                  className="w-full bg-background border-[3px] border-foreground p-3 text-sm focus:outline-none" placeholder="https://..." />
              </div>
            </div>
          </div>
        )}

        {/* Spotlight-only fields */}
        {type === 'spotlight' && (
          <div className="flex flex-col gap-4 brutal-card bg-muted p-6">
            <h3 className="font-heading text-lg font-black uppercase tracking-widest border-b-[3px] border-foreground pb-2 inline-block">Subject</h3>
            <div className="flex gap-4">
              <div className="flex flex-col gap-2 flex-1">
                <label className="text-[10px] font-black uppercase tracking-widest">Subject Name</label>
                <input type="text" name="subject_name" value={formData.subject_name} onChange={handleChange}
                  className="w-full bg-background border-[3px] border-foreground p-3 text-sm focus:outline-none" placeholder="Denis Villeneuve" />
              </div>
              <div className="flex flex-col gap-2 flex-1">
                <label className="text-[10px] font-black uppercase tracking-widest">Role</label>
                <input type="text" name="subject_role" value={formData.subject_role} onChange={handleChange}
                  className="w-full bg-background border-[3px] border-foreground p-3 text-sm focus:outline-none" placeholder="Director" />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black uppercase tracking-widest">Pull Quote</label>
              <textarea name="pull_quote" value={formData.pull_quote} onChange={handleChange} rows={2}
                className="w-full bg-background border-[3px] border-foreground p-3 text-sm focus:outline-none resize-none" placeholder="A memorable quote from the subject" />
            </div>
            <ImagePicker
              label="Subject Photo"
              value={formData.subject_photo_url}
              onChange={(url) => setFormData(prev => ({ ...prev, subject_photo_url: url }))}
              bucket={STORAGE_BUCKETS.ARTICLES}
            />
          </div>
        )}

        <div className="flex flex-col gap-2">
          <label className="text-xs font-black uppercase tracking-widest text-foreground">Excerpt</label>
          <textarea
            name="excerpt"
            value={formData.excerpt}
            onChange={handleChange}
            rows={3}
            className="w-full bg-background border-[3px] border-foreground p-4 font-medium focus:outline-none focus:ring-0 resize-none"
            placeholder={type === 'news' ? 'Lead paragraph...' : 'Write a short summary...'}
          />
        </div>

        {/* List items */}
        {type === 'list' && (
          <ListItemsEditor movies={movies} items={listItems} onChange={(items) => { setListItems(items); setHasUnsavedChanges(true) }} />
        )}

        {/* Spotlight notable works */}
        {type === 'spotlight' && (
          <SpotlightWorksEditor movies={movies} works={spotlightWorks} onChange={(works) => { setSpotlightWorks(works); setHasUnsavedChanges(true) }} />
        )}

        <div className="flex flex-col gap-2 flex-1 min-h-[500px]">
          <div className="flex justify-between items-center bg-foreground text-background px-4 py-2 border-[3px] border-foreground">
            <label className="text-xs font-black uppercase tracking-widest">
              {type === 'review' ? 'Review Body (Markdown)' : type === 'spotlight' ? 'Bio (Markdown)' : type === 'list' ? 'Intro (Markdown, optional)' : 'Markdown Content'}
            </label>
            <span className="text-[10px] font-bold tracking-widest uppercase">Words: {formData.content.trim().split(/\s+/).filter(Boolean).length}</span>
          </div>
          <textarea
            name="content"
            value={formData.content}
            onChange={handleChange}
            className="w-full h-full min-h-[500px] bg-background border-[3px] border-foreground p-6 font-mono text-sm focus:outline-none focus:ring-0 leading-relaxed"
            placeholder="# Write here using Markdown..."
          />
        </div>

        {/* SEO Block */}
        <div className="brutal-card bg-muted p-6 flex flex-col gap-4 mt-8">
          <h3 className="font-heading text-2xl font-black uppercase tracking-widest border-b-[3px] border-foreground inline-block pb-2">SEO Settings</h3>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-foreground">Meta Title</label>
            <input
              type="text"
              name="seo_title"
              value={formData.seo_title}
              onChange={handleChange}
              className="w-full bg-background border-[3px] border-foreground p-3 text-sm focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-foreground">Meta Description</label>
            <textarea
              name="seo_description"
              value={formData.seo_description}
              onChange={handleChange}
              rows={2}
              className="w-full bg-background border-[3px] border-foreground p-3 text-sm focus:outline-none resize-none"
            />
          </div>
        </div>

        {/* Editorial Checklist */}
        {(() => {
          const wordCount = formData.content.trim().split(/\s+/).filter(Boolean).length
          const metaDescOk = formData.seo_description?.length > 50
          const items = [
            { label: 'Title',            done: !!formData.title,           warn: false, hint: 'Required to publish' },
            { label: 'Slug',             done: !!formData.slug,            warn: false, hint: 'Auto-generated from title' },
            { label: 'Author',           done: !!formData.author_id,       warn: false, hint: 'Assign a writer' },
            { label: 'Category',         done: !!formData.category_id,     warn: false, hint: 'Needed for navigation' },
            { label: 'Cover Image',      done: !!formData.cover_image_url, warn: false, hint: 'Used in listings & social' },
            { label: 'Excerpt',          done: !!formData.excerpt,         warn: false, hint: 'Shown in cards & SEO' },
            { label: 'SEO Title',        done: !!formData.seo_title,       warn: false, hint: 'Defaults to title if blank' },
            { label: 'Meta Description', done: metaDescOk,                  warn: !!formData.seo_description && !metaDescOk, hint: metaDescOk ? '' : 'Needs 50+ chars' },
          ]
          const passed = items.filter(i => i.done).length
          const score = Math.round((passed / items.length) * 100)
          const scoreColor = score === 100 ? 'bg-green-500' : score >= 60 ? 'bg-secondary' : 'bg-red-400'

          return (
            <div className="border-[3px] border-foreground mt-8">
              <div className="bg-foreground text-background px-5 py-3 flex items-center justify-between">
                <span className="font-heading text-sm font-black uppercase tracking-widest">Editorial Checklist</span>
                <span className="font-black text-sm">{passed}/{items.length}</span>
              </div>

              <div className="px-5 pt-4 pb-2">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[9px] font-black uppercase tracking-widest text-foreground/50">Publish Readiness</span>
                  <span className="font-black text-sm text-foreground">{score}%</span>
                </div>
                <div className="w-full h-2 bg-muted border-[2px] border-foreground/20">
                  <div className={`h-full transition-all duration-500 ${scoreColor}`} style={{ width: `${score}%` }} />
                </div>
              </div>

              <div className="divide-y-[2px] divide-foreground/10">
                {items.map(({ label, done, warn, hint }) => (
                  <div key={label} className={`flex items-center gap-3 px-5 py-2.5 ${done ? '' : 'bg-muted/30'}`}>
                    {done
                      ? <CheckCircle2 size={15} className="text-green-600 shrink-0" strokeWidth={2.5} />
                      : warn
                        ? <AlertCircle size={15} className="text-amber-500 shrink-0" strokeWidth={2.5} />
                        : <XCircle size={15} className="text-red-400 shrink-0" strokeWidth={2.5} />
                    }
                    <span className={`text-[11px] font-black uppercase tracking-widest flex-1 ${done ? 'text-foreground' : 'text-foreground/60'}`}>
                      {label}
                    </span>
                    {!done && hint && (
                      <span className="text-[9px] font-bold text-foreground/35 uppercase tracking-wider">{hint}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )
        })()}

      </div>

      {/* Right Column: Sidebar Settings */}
      <div className="w-full lg:w-80 flex flex-col gap-6 shrink-0">

        <div className="brutal-card bg-background p-6 flex flex-col gap-4">
           <button
             type="submit"
             id="save-btn"
             disabled={isSaving}
             className="w-full bg-primary text-foreground border-[3px] border-foreground px-4 py-4 text-sm font-black uppercase tracking-widest hover:-translate-y-1 hover:shadow-[4px_4px_0_0_#E2BFCA] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
           >
             <Save size={18} /> {isSaving ? 'Saving...' : 'Save Draft'}
           </button>

           <button
             type="button"
             onClick={(e) => handleSave(e, 'published')}
             disabled={isSaving || formData.status === 'published'}
             className="w-full bg-foreground text-background border-[3px] border-foreground px-4 py-4 text-sm font-black uppercase tracking-widest hover:-translate-y-1 hover:shadow-[4px_4px_0_0_#173D2A] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:bg-muted disabled:text-foreground"
           >
             <Send size={18} /> {formData.status === 'published' ? 'Published' : 'Publish Now'}
           </button>

           {isEditing && (
             <div className="flex gap-2 mt-4 pt-4 border-t-[3px] border-foreground">
               <Link
                 href={`/${typeToRoute(type)}/${formData.slug}`}
                 target="_blank"
                 className="flex-1 bg-background border-[3px] border-foreground p-3 flex justify-center hover:bg-secondary transition-colors"
                 title="Preview Article"
               >
                 <Eye size={18} />
               </Link>
               <button
                 type="button"
                 onClick={handleDelete}
                 className="flex-1 bg-background border-[3px] border-foreground p-3 flex justify-center hover:bg-red-500 hover:text-white transition-colors text-red-600"
                 title="Delete Article"
               >
                 <Trash2 size={18} />
               </button>
             </div>
           )}
        </div>

        <div className="brutal-card bg-muted p-6 flex flex-col gap-6">

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black uppercase tracking-widest">Article Type</label>
            <div className="w-full bg-foreground text-background border-[3px] border-foreground p-3 text-xs font-black uppercase text-center">
              {TYPE_LABEL[type]}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black uppercase tracking-widest">Visibility Status</label>
            <select name="status" value={formData.status} onChange={handleChange} className="w-full bg-background border-[3px] border-foreground p-3 text-xs font-bold uppercase focus:outline-none">
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black uppercase tracking-widest">Workflow State</label>
            <select name="workflow_status" value={formData.workflow_status} onChange={handleChange} className="w-full bg-primary text-foreground border-[3px] border-foreground p-3 text-xs font-black uppercase focus:outline-none">
              <option value="idea">Idea</option>
              <option value="research">Research</option>
              <option value="draft">Draft</option>
              <option value="review">Review</option>
              <option value="scheduled">Scheduled</option>
              <option value="published">Published</option>
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black uppercase tracking-widest">Assignee</label>
            <select name="assignee_id" value={formData.assignee_id} onChange={handleChange} className="w-full bg-background border-[3px] border-foreground p-3 text-xs font-bold uppercase focus:outline-none">
              <option value="">Unassigned</option>
              {authors.map(author => (
                <option key={author.id} value={author.id}>{author.name}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black uppercase tracking-widest">Priority</label>
            <select name="priority" value={formData.priority} onChange={handleChange} className="w-full bg-background border-[3px] border-foreground p-3 text-xs font-bold uppercase focus:outline-none">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          {type === 'review' && (
            <>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-widest">Movie</label>
                <select name="movie_id" value={formData.movie_id} onChange={handleChange} className="w-full bg-background border-[3px] border-foreground p-3 text-xs font-bold uppercase focus:outline-none">
                  <option value="">No Movie Linked</option>
                  {movies.map(movie => (
                    <option key={movie.id} value={movie.id}>{movie.title}</option>
                  ))}
                </select>
              </div>
              <div className="border-t-[2px] border-foreground/20 pt-4 flex flex-col gap-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-foreground/60">Rating Breakdown</span>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black uppercase tracking-widest">OP Score (0–5)</label>
                  <input type="number" name="rating" value={formData.rating} onChange={handleChange} min="0" max="5" step="0.1" placeholder="e.g. 4.5"
                    className="w-full bg-background border-[3px] border-foreground p-3 text-xs font-bold focus:outline-none" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black uppercase tracking-widest">IMDb Score (0–10)</label>
                  <input type="number" name="imdb_score" value={formData.imdb_score} onChange={handleChange} min="0" max="10" step="0.1" placeholder="e.g. 8.1"
                    className="w-full bg-background border-[3px] border-foreground p-3 text-xs font-bold focus:outline-none" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black uppercase tracking-widest">Rotten Tomatoes (0–100)</label>
                  <input type="number" name="rt_score" value={formData.rt_score} onChange={handleChange} min="0" max="100" step="1" placeholder="e.g. 93"
                    className="w-full bg-background border-[3px] border-foreground p-3 text-xs font-bold focus:outline-none" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black uppercase tracking-widest">Verdict</label>
                  <select name="verdict" value={formData.verdict} onChange={handleChange} className="w-full bg-background border-[3px] border-foreground p-3 text-xs font-bold uppercase focus:outline-none">
                    {VERDICTS.map(v => <option key={v.value} value={v.value}>{v.label}</option>)}
                  </select>
                </div>
              </div>
            </>
          )}

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black uppercase tracking-widest">Category</label>
            <select name="category_id" value={formData.category_id} onChange={handleChange} className="w-full bg-background border-[3px] border-foreground p-3 text-xs font-bold uppercase focus:outline-none">
              <option value="">Select Category</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black uppercase tracking-widest">Author</label>
            <select name="author_id" value={formData.author_id} onChange={handleChange} className="w-full bg-background border-[3px] border-foreground p-3 text-xs font-bold uppercase focus:outline-none">
              <option value="">Select Author</option>
              {authors.map(author => (
                <option key={author.id} value={author.id}>{author.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3 p-3 bg-background border-[3px] border-foreground cursor-pointer">
            <input
              type="checkbox"
              name="is_featured"
              checked={formData.is_featured}
              onChange={handleChange}
              className="w-5 h-5 accent-foreground"
            />
            <label className="text-[10px] font-black uppercase tracking-widest flex-1 cursor-pointer">Featured Article</label>
          </div>

        </div>

        <div className="brutal-card bg-background p-6 flex flex-col gap-4">
          <ImagePicker
            label="Cover Image"
            value={formData.cover_image_url}
            onChange={(url) => setFormData(prev => ({ ...prev, cover_image_url: url }))}
            bucket={STORAGE_BUCKETS.ARTICLES}
          />
        </div>

        <AIAssistantPanel
          content={formData.content}
          onApplyContent={(newContent) => setFormData(prev => ({ ...prev, content: newContent }))}
          onApplySeo={(title, desc) => setFormData(prev => ({ ...prev, seo_title: title, seo_description: desc }))}
        />

      </div>
    </form>
  )
}
