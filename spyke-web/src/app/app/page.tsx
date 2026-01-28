'use client'

import { useEffect, useState } from 'react'
import { getSupabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

export default function AppPage() {
  const router = useRouter()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let unsub: any = null

    async function run() {
      const supabase = getSupabase()
      const { data } = await supabase.auth.getSession()
      const requireAuth = process.env.NEXT_PUBLIC_REQUIRE_AUTH === '1'
      if (requireAuth && !data.session) {
        router.replace('/login')
        return
      }
      unsub = supabase.auth.onAuthStateChange((_event, session) => {
        if (requireAuth && !session) router.replace('/login')
      })
      setReady(true)
    }

    run()

    return () => {
      unsub?.data?.subscription?.unsubscribe?.()
    }
  }, [router])

  if (!ready) return null

  return (
    <main className="min-h-screen">
      <iframe
        src="/spyke-v3_1.html"
        className="w-full h-screen border-0"
        // allow clipboard etc if needed
        allow="clipboard-read; clipboard-write"
      />
    </main>
  )
}
