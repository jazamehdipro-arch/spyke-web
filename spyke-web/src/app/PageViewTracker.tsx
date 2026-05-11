'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { track } from '@/lib/analytics'
import { getSupabase } from '@/lib/supabaseClient'

const ADMIN_EMAIL = 'Jazamehdi.pro@gmail.com'

export default function PageViewTracker() {
  const pathname = usePathname()

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (pathname.startsWith('/admin')) return

    ;(async () => {
      const supabase = getSupabase()
      const { data } = await supabase.auth.getUser()
      if (data.user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()) return

      const search = window.location.search || ''
      const sp = new URLSearchParams(search)

      const utm: Record<string, string> = {}
      for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content']) {
        const v = sp.get(key)
        if (v) utm[key] = v
      }

      track('page_view', {
        path: pathname,
        referrer: document.referrer || null,
        ...utm,
      })
    })()
  }, [pathname])

  return null
}
