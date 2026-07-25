// @ts-nocheck
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createArticle, updateArticle, deleteArticle } from '@/lib/actions/articles'
import { ArticleWithRelations } from '@/types/models'
import Link from 'next/link'
import { Eye, Save, Trash2, Send, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
import ImagePicker from '@/components/dashboard/ImagePicker'
import { typeToRoute } from '@/lib/utils'
import { STORAGE_BUCKETS } from '@/lib/api/storage'
import AIAssistantPanel from './AIAssistantPanel'

type EditorProps = {
  initialData?: ArticleWithRelations | null
  categories: any[]
  authors: any[]
  movies: any[]
  tags: any[]
}

export default function ArticleEditor({ initialData, categories, authors, movies, tags }: EditorProps) {
  const router = useRouter()
  const isEditing = !!initialData

  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    slug: initialData?.slug || '',
    excerpt: initialData?.excerpt || '',
    content: initialData?.content || '',
    cover_image_url: initialData?.cover_image_url || '',
    status: initialData?.status || 'draft',
    type: initialData?.type || 'news',
    category_id: initialData?.category_id || (categories[0]?.id ?? ''),
    author_id: initialData?.author_id || (authors[0]?.id ?? ''),
    movie_id: initialData?.movie_id || '',
    is_featured: initialData?.is_featured || false,
    seo_title: initialData?.seo_title || '',
    seo_description: initialData?.seo_description || '',
    og_image_url: initialData?.og_image_url || '',
    workflow_status: initialData?.workflow_status || 'idea',
    assignee_id: initialData?.assignee_id || '',
    priority: initialData?.priority || 'medium',
  })

  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // Warn before leaving if unsaved changes exist
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

  // Auto-generate slug from title if not editing (or if slug is empty)
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
    const { name, value, type } = e.target as HTMLInputElement
    const checked = (e.target as HTMLInputElement).checked
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    setHasUnsavedChanges(true)
    setError('')
  }

  const validate = () => {
    if (!formData.title) return 'Title is required'
    if (!formData.slug) return 'Slug is required'
    if (!formData.category_id) return 'Category is required'
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

    const payloadToSave = {
      ...formData,
      status: (forceStatus || formData.status) as 'draft' | 'published' | 'archived',
      movie_id: formData.movie_id === '' ? null : formData.movie_id,
      category_id: formData.category_id === '' ? null : formData.category_id,
      author_id: formData.author_id === '' ? null : formData.author_id,
      assignee_id: formData.assignee_id === '' ? null : formData.assignee_id,
      published_at: (forceStatus === 'published' && !initialData?.published_at) ? new Date().toISOString() : initialData?.published_at
    }

    try {
      if (isEditing && initialData) {
        const { error: updateErr } = await updateArticle(initialData.id, payloadToSave)
        if (updateErr) throw new Error(updateErr)
      } else {
        const { error: createErr, data } = await createArticle(payloadToSave)
        if (createErr) throw new Error(createErr)
        if (data) {
          router.replace(`/dashboard/articles/${data.id}/edit`)
        }
      }
      setHasUnsavedChanges(false)
      // Show success briefly
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
        
        {/* Error Banner */}
        {error && (
          <div className="brutal-card bg-red-500 text-white p-4 font-bold border-[3px] border-foreground">
            {error}
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

        <div className="flex flex-col gap-2">
          <label className="text-xs font-black uppercase tracking-widest text-foreground">Excerpt</label>
          <textarea 
            name="excerpt" 
            value={formData.excerpt} 
            onChange={handleChange}
            rows={3}
            className="w-full bg-background border-[3px] border-foreground p-4 font-medium focus:outline-none focus:ring-0 resize-none"
            placeholder="Write a short summary..."
          />
        </div>

        <div className="flex flex-col gap-2 flex-1 min-h-[500px]">
          <div className="flex justify-between items-center bg-foreground text-background px-4 py-2 border-[3px] border-foreground">
            <label className="text-xs font-black uppercase tracking-widest">Markdown Content</label>
            <span className="text-[10px] font-bold tracking-widest uppercase">Words: {formData.content.trim().split(/\s+/).filter(Boolean).length}</span>
          </div>
          <textarea 
            name="content" 
            value={formData.content} 
            onChange={handleChange}
            className="w-full h-full min-h-[500px] bg-background border-[3px] border-foreground p-6 font-mono text-sm focus:outline-none focus:ring-0 leading-relaxed"
            placeholder="# Write your article here using Markdown..."
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
            { label: `Word Count (${wordCount})`, done: wordCount >= 300,   warn: wordCount > 0 && wordCount < 300, hint: wordCount < 300 ? `${300 - wordCount} words to go` : '' },
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

              {/* Score bar */}
              <div className="px-5 pt-4 pb-2">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[9px] font-black uppercase tracking-widest text-foreground/50">Publish Readiness</span>
                  <span className="font-black text-sm text-foreground">{score}%</span>
                </div>
                <div className="w-full h-2 bg-muted border-[2px] border-foreground/20">
                  <div className={`h-full transition-all duration-500 ${scoreColor}`} style={{ width: `${score}%` }} />
                </div>
              </div>

              {/* Items */}
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
        
        {/* Actions Card */}
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
                 href={`/${typeToRoute(formData.type)}/${formData.slug}`}
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

        {/* Settings Card */}
        <div className="brutal-card bg-muted p-6 flex flex-col gap-6">
          
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

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black uppercase tracking-widest">Article Type</label>
            <select name="type" value={formData.type} onChange={handleChange} className="w-full bg-background border-[3px] border-foreground p-3 text-xs font-bold uppercase focus:outline-none">
              <option value="news">News</option>
              <option value="review">Review</option>
              <option value="spotlight">Spotlight</option>
              <option value="list">List</option>
            </select>
          </div>

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

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black uppercase tracking-widest">Movie (Optional)</label>
            <select name="movie_id" value={formData.movie_id} onChange={handleChange} className="w-full bg-background border-[3px] border-foreground p-3 text-xs font-bold uppercase focus:outline-none">
              <option value="">No Movie Linked</option>
              {movies.map(movie => (
                <option key={movie.id} value={movie.id}>{movie.title}</option>
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

        {/* Media Block */}
        <div className="brutal-card bg-background p-6 flex flex-col gap-4">
          <ImagePicker 
            label="Cover Image" 
            value={formData.cover_image_url} 
            onChange={(url) => setFormData(prev => ({ ...prev, cover_image_url: url }))}
            bucket={STORAGE_BUCKETS.ARTICLES}
          />
        </div>
        
        {/* AI Assistant */}
        <AIAssistantPanel 
          content={formData.content} 
          onApplyContent={(newContent) => setFormData(prev => ({ ...prev, content: newContent }))} 
          onApplySeo={(title, desc) => setFormData(prev => ({ ...prev, seo_title: title, seo_description: desc }))}
        />

      </div>
    </form>
  )
}
