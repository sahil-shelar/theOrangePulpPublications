'use client'

import { deleteAuthor } from '@/lib/actions/authors'
import DeleteButton from './DeleteButton'

export default function AuthorDeleteButton({ id }: { id: string }) {
  return (
    <DeleteButton
      id={id}
      label="Delete"
      onDelete={async (authorId) => { await deleteAuthor(authorId) }}
    />
  )
}
