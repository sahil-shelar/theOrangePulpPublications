import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import AuthorForm from '../../AuthorForm'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'

export default async function EditAuthorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: author, error } = await supabase.from('authors').select('*').eq('id', id).single()

  if (error || !author) {
    notFound()
  }

  return (
    <div className="p-6 md:p-8">
      <div className="mb-8">
        <Link href="/dashboard/authors" className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-foreground hover:text-primary transition-colors mb-4">
          <ArrowLeft size={16} /> Back to Authors
        </Link>
        <h1 className="font-heading text-4xl font-black uppercase text-foreground">Edit Author</h1>
      </div>
      <AuthorForm initialData={author} />
    </div>
  )
}
