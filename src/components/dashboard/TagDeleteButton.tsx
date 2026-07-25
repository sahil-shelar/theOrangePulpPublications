'use client'

import DeleteButton from './DeleteButton'
import { deleteTag } from '@/lib/actions/tags'
import { useRouter } from 'next/navigation'

export default function TagDeleteButton({ id }: { id: string }) {
  const router = useRouter()

  const handleDelete = async (id: string) => {
    await deleteTag(id)
    router.refresh()
  }

  return <DeleteButton id={id} label="Delete" onDelete={handleDelete} iconOnly />
}
