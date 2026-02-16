"use client"

import { useEffect, useMemo, useState } from 'react'
import { getSupabase } from '@/lib/supabaseClient'

export default function AuthCallbackPage() {
  const supabase = useMemo(() => {
    try {
      return getSupabase()
    } catch {
      return null
    }
  }, [])

  const [message, setMessage] = useState('Connexion en cours…')

  useEffect(() => {
    let cancelled = false

    async function run() {
      if (!supabase) {
        setMessage('Supabase non configuré (env manquantes)')
        return
      }

      try {
        // When returning from OAuth, Supabase should have stored the session.
        const { data, error } = await supabase.auth.getSession()
        if (error) throw error

        const session = data.session
        const user = session?.user

        if (!user) {
          setMessage('Session introuvable. Réessaie depuis la page de connexion.')
          return
        }

        // Ensure profile exists, then check onboarding.
        await supabase.from('profiles').upsert({ id: user.id }, { onConflict: 'id' })

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('onboarding_completed')
          .eq('id', user.id)
          .maybeSingle()

        if (profileError) throw profileError

        const done = Boolean(profile?.onboarding_completed)

        if (!cancelled) {
          window.location.href = done ? '/app.html' : '/onboarding.html'
        }
      } catch (err: any) {
        console.error(err)
        setMessage(err?.message || 'Erreur de connexion')
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [supabase])

  return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ fontFamily: 'DM Sans, -apple-system, sans-serif', color: '#111', textAlign: 'center' }}>
        <div style={{ fontSize: 16, fontWeight: 600 }}>{message}</div>
        <div style={{ marginTop: 8, fontSize: 13, color: '#666' }}>Tu vas être redirigé automatiquement.</div>
      </div>
    </main>
  )
}
