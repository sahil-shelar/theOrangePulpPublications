'use client'

import DeleteButton from './DeleteButton'
import { deleteCategory } from '@/lib/actions/categories'
import { useRouter } from 'next/navigation'

export default function CategoryDeleteButton({ id }: { id: string }) {
  const router = useRouter()

  const handleDelete = async (id: string) => {
    await deleteCategory(id)
    router.refresh()
  }

  return <DeleteButton id={id} label="Delete" onDelete={handleDelete} iconOnly />
}
