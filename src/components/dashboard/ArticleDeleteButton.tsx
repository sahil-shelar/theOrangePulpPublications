'use client'

import { deleteArticle } from '@/lib/actions/articles'
import DeleteButton from './DeleteButton'

export default function ArticleDeleteButton({ id }: { id: string }) {
  return (
    <DeleteButton
      id={id}
      iconOnly
      onDelete={async (articleId) => { await deleteArticle(articleId) }}
    />
  )
}
