import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import TagForm from '../../TagForm'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'

export default async function EditTagPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: tag, error } = await supabase.from('tags').select('*').eq('id', id).single()

  if (error || !tag) {
    notFound()
  }

  return (
    <div className="p-6 md:p-8">
      <div className="mb-8">
        <Link href="/dashboard/tags" className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-foreground hover:text-primary transition-colors mb-4">
          <ArrowLeft size={16} /> Back to Tags
        </Link>
        <h1 className="font-heading text-4xl font-black uppercase text-foreground">Edit Tag</h1>
      </div>
      <TagForm initialData={tag} />
    </div>
  )
}
