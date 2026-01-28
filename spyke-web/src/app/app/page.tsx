'use client'

import { useEffect, useMemo, useState } from 'react'
import { getSupabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

export default function AppPage() {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const supabase = useMemo(() => {
    try {
      return getSupabase()
    } catch {
      return null
    }
  }, [])

  useEffect(() => {
    let unsub: any = null

    async function run() {
      try {
        if (!supabase) throw new Error('Supabase non configuré')

        const { data } = await supabase.auth.getSession()
        const requireAuth = process.env.NEXT_PUBLIC_REQUIRE_AUTH === '1'

        if (requireAuth && !data.session) {
          router.replace('/login')
          return
        }

        unsub = supabase.auth.onAuthStateChange((_event, session) => {
          if (requireAuth && !session) router.replace('/login')
        })

        // Secure load of the HTML through our API, using the user's access token.
        const accessToken = data.session?.access_token
        if (!accessToken) {
          if (requireAuth) throw new Error('Session manquante')
          setReady(true)
          return
        }

        const res = await fetch('/api/spyke-html', {
          headers: { Authorization: `Bearer ${accessToken}` },
          cache: 'no-store',
        })
        if (!res.ok) throw new Error(`Erreur chargement Spyke (${res.status})`)

        const html = await res.text()
        const url = URL.createObjectURL(new Blob([html], { type: 'text/html' }))
        setBlobUrl(url)
        setReady(true)
      } catch (e: any) {
        setError(e?.message || 'Erreur')
        setReady(true)
      }
    }

    run()

    return () => {
      unsub?.data?.subscription?.unsubscribe?.()
      if (blobUrl) URL.revokeObjectURL(blobUrl)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, supabase])

  if (!ready) return null

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-xl border border-white/10 bg-black/30 p-6">
          <h1 className="text-xl font-semibold">Spyke</h1>
          <p className="mt-2 text-sm text-red-300">{error}</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen">
      {blobUrl ? (
        <iframe
          src={blobUrl}
          className="w-full h-screen border-0"
          allow="clipboard-read; clipboard-write"
        />
      ) : (
        <div className="min-h-screen flex items-center justify-center p-6 text-white/70">
          Chargement…
        </div>
      )}
    </main>
  )
}
