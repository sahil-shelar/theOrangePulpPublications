import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import TagForm from '../TagForm'

export default function NewTagPage() {
  return (
    <div className="p-6 md:p-8">
      <div className="mb-8">
        <Link href="/dashboard/tags" className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-foreground hover:text-primary transition-colors mb-4">
          <ArrowLeft size={16} /> Back to Tags
        </Link>
        <h1 className="font-heading text-4xl font-black uppercase text-foreground">New Tag</h1>
      </div>
      <TagForm />
    </div>
  )
}
