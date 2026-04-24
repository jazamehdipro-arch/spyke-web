'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { track } from '@/lib/analytics'

export default function PageViewTracker() {
  const pathname = usePathname()

  useEffect(() => {
    if (typeof window === 'undefined') return

    const search = window.location.search || ''
    const sp = new URLSearchParams(search)

    const utm: Record<string, string> = {}
    for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content']) {
      const v = sp.get(key)
      if (v) utm[key] = v
    }

    // Keep path clean: do NOT include query string in the stored path.
    track('page_view', {
      path: pathname,
      referrer: document.referrer || null,
      ...utm,
    })
  }, [pathname])

  return null
}
