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
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-xl border border-white/10 bg-black/30 p-6">
        <h1 className="text-xl font-semibold">Spyke</h1>
        <p className="mt-2 text-sm text-white/70">
          Ouvre l’outil dans la page dédiée (plus fiable que l’iframe sur certains navigateurs).
        </p>
        <a
          className="mt-4 inline-block rounded-md bg-white/10 hover:bg-white/15 border border-white/20 px-4 py-2 text-sm"
          href="/spyke-v3_1.html"
        >
          Ouvrir Spyke
        </a>
      </div>
    </main>
  )
}
