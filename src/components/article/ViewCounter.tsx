'use client'

import { useEffect } from 'react'
import { incrementViewCount } from '@/lib/actions/articles'

export default function ViewCounter({ articleId }: { articleId: string }) {
  useEffect(() => {
    // Simple sessionStorage check to prevent counting every hard refresh in same session
    const viewedKey = `viewed_${articleId}`
    if (!sessionStorage.getItem(viewedKey)) {
      sessionStorage.setItem(viewedKey, 'true')
      incrementViewCount(articleId).catch(console.error)
    }
  }, [articleId])

  return null
}
