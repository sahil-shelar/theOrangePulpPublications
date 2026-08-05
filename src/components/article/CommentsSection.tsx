// @ts-nocheck
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MessageSquare, ThumbsUp, ThumbsDown, Flag } from 'lucide-react'

function getOrCreateVisitorName(): string {
  const key = 'op_visitor_name'
  const stored = localStorage.getItem(key)
  if (stored) return stored
  const name = `visitor${Math.floor(1000 + Math.random() * 9000)}`
  localStorage.setItem(key, name)
  return name
}

export default function CommentsSection({ articleId }: { articleId: string }) {
  const [user, setUser] = useState(null)
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [visitorName, setVisitorName] = useState('')

  useEffect(() => {
    setVisitorName(getOrCreateVisitorName())
    const supabase = createClient()
    Promise.all([
      supabase.auth.getUser(),
      supabase.from('comments').select('*').eq('article_id', articleId).order('created_at', { ascending: false }),
    ]).then(([{ data: { user } }, { data: comments }]) => {
      setUser(user)
      setComments(comments ?? [])
      setLoading(false)
    })
  }, [articleId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return
    setIsSubmitting(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from('comments')
      .insert({
        article_id: articleId,
        user_id: user?.id ?? null,
        guest_name: user ? null : visitorName,
        content: newComment,
        status: 'approved',
      })
      .select()
      .single()
    if (!error && data) {
      setComments([{ ...data, guest_name: data.guest_name ?? visitorName }, ...comments])
      setNewComment('')
    }
    setIsSubmitting(false)
  }

  const displayName = (comment: any) => comment.guest_name ?? 'Member'

  return (
    <div className="mt-16 pt-8 border-t-[6px] border-foreground">
      <h3 className="font-heading text-3xl font-black uppercase text-foreground mb-8 flex items-center gap-3">
        <MessageSquare size={32} /> Comments ({comments.length})
      </h3>

      {loading ? (
        <div className="h-10 bg-muted/40 border-[2px] border-foreground/10 mb-12" />
      ) : (
        <form onSubmit={handleSubmit} className="mb-12">
          {!user && visitorName && (
            <div className="mb-3 text-xs font-black uppercase tracking-widest text-muted-foreground">
              Commenting as <span className="text-primary">{visitorName}</span>
            </div>
          )}
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="LEAVE A BRUTAL REVIEW..."
            rows={4}
            className="w-full bg-background border-[4px] border-foreground p-4 font-bold text-foreground focus:ring-0 resize-none shadow-[8px_8px_0_0_#173D2A] mb-4 uppercase"
            required
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-primary text-foreground border-[3px] border-foreground font-black uppercase tracking-widest px-8 py-3 hover:-translate-y-1 hover:shadow-[4px_4px_0_0_#000000] transition-all disabled:opacity-50"
          >
            {isSubmitting ? 'Posting...' : 'Post Comment'}
          </button>
        </form>
      )}

      <div className="space-y-6">
        {comments.map((comment: any) => (
          <div key={comment.id} className="bg-background border-[3px] border-foreground p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="font-black uppercase tracking-widest text-sm text-primary">{displayName(comment)}</div>
              <div className="text-label font-bold text-muted-foreground">{new Date(comment.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })}</div>
            </div>
            <p className="font-medium text-foreground mb-6 leading-relaxed">{comment.content}</p>
            <div className="flex items-center gap-4 border-t-[2px] border-foreground/10 pt-4">
              <button className="flex items-center gap-1 text-xs font-black uppercase text-muted-foreground hover:text-primary transition-colors">
                <ThumbsUp size={14} /> {comment.upvotes || 0}
              </button>
              <button className="flex items-center gap-1 text-xs font-black uppercase text-muted-foreground hover:text-red-500 transition-colors">
                <ThumbsDown size={14} /> {comment.downvotes || 0}
              </button>
              <button className="flex items-center gap-1 text-xs font-black uppercase text-muted-foreground hover:text-foreground transition-colors ml-auto">
                <Flag size={14} /> Report
              </button>
            </div>
          </div>
        ))}
        {!loading && comments.length === 0 && (
          <div className="text-center font-bold text-muted-foreground py-12 border-[3px] border-dashed border-foreground/20">
            NO COMMENTS YET. BE THE FIRST.
          </div>
        )}
      </div>
    </div>
  )
}
