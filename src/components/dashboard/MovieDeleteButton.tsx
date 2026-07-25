'use client'

import { deleteMovie } from '@/lib/actions/movies'
import DeleteButton from './DeleteButton'

export default function MovieDeleteButton({ id }: { id: string }) {
  return (
    <DeleteButton
      id={id}
      label="Delete"
      onDelete={async (movieId) => { await deleteMovie(movieId) }}
    />
  )
}
