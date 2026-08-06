'use client'

import { useEffect } from 'react'
import { incrementViewCount } from '@/lib/actions/articles'
import { useIsPreview } from './PreviewMode'

export default function ViewCounter({ articleId }: { articleId: string }) {
  // An editor previewing their own draft must not inflate its view count.
  const isPreview = useIsPreview()

  useEffect(() => {
    if (isPreview) return
    // Simple sessionStorage check to prevent counting every hard refresh in same session
    const viewedKey = `viewed_${articleId}`
    if (!sessionStorage.getItem(viewedKey)) {
      sessionStorage.setItem(viewedKey, 'true')
      incrementViewCount(articleId).catch(console.error)
    }
  }, [articleId, isPreview])

  return null
}
