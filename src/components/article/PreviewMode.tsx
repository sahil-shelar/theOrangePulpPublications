'use client'

import { createContext, useContext } from 'react'

// Lets the real detail views be reused verbatim for previewing an unpublished
// article, while the handful of components with live side effects opt out.
//
// A context rather than a `preview` prop threaded through all four detail views:
// only ViewCounter actually needs to know, and the views stay untouched. Server
// components render fine as `children` of this client provider.

const PreviewContext = createContext(false)

export function PreviewProvider({ children }: { children: React.ReactNode }) {
  return <PreviewContext.Provider value={true}>{children}</PreviewContext.Provider>
}

export function useIsPreview() {
  return useContext(PreviewContext)
}
