"use client"

import { useEffect, useMemo, useState } from 'react'
import { getSupabase } from '@/lib/supabaseClient'

export default function ResetPasswordPage() {
  const supabase = useMemo(() => {
    try {
      return getSupabase()
    } catch {
      return null
    }
  }, [])

  const [ready, setReady] = useState(false)
  const [hasSession, setHasSession] = useState(false)
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    ;(async () => {
      if (!supabase) {
        setError('Supabase non configuré')
        setReady(true)
        return
      }

      // In recovery flow, Supabase sets a session from URL hash.
      // We just need to detect it.
      try {
        const { data } = await supabase.auth.getSession()
        setHasSession(Boolean(data.session))
      } catch {
        setHasSession(false)
      } finally {
        setReady(true)
      }
    })()
  }, [supabase])

  return (
    <main style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 24, background: '#fafafa' }}>
      <div style={{ width: 'min(520px, 100%)', background: 'white', borderRadius: 18, border: '1px solid rgba(0,0,0,0.08)', padding: 22, boxShadow: '0 18px 50px rgba(0,0,0,0.08)' }}>
        <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Nouveau mot de passe</div>
        <div style={{ color: 'rgba(0,0,0,0.65)', fontSize: 13, lineHeight: 1.6, marginBottom: 14 }}>
          Choisis un nouveau mot de passe pour ton compte Spyke.
        </div>

        {!ready ? <div style={{ fontSize: 13, color: 'rgba(0,0,0,0.6)' }}>Chargement…</div> : null}

        {ready && !hasSession ? (
          <div style={{ fontSize: 13, color: '#b91c1c', lineHeight: 1.6 }}>
            Lien invalide ou expiré. Recommence depuis “Mot de passe oublié”.
          </div>
        ) : null}

        {done ? (
          <div style={{ fontSize: 13, color: '#15803d', lineHeight: 1.6 }}>
            Mot de passe mis à jour. Tu peux te reconnecter.
            <div style={{ marginTop: 10 }}>
              <a href="/connexion.html" style={{ color: '#0a0a0a', fontWeight: 800 }}>Aller à la connexion</a>
            </div>
          </div>
        ) : null}

        {ready && hasSession && !done ? (
          <>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginTop: 10 }}>
              Nouveau mot de passe
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ width: '100%', marginTop: 6, padding: '12px 14px', borderRadius: 12, border: '2px solid rgba(0,0,0,0.10)' }}
                placeholder="8 caractères minimum"
              />
            </label>

            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginTop: 12 }}>
              Confirmer
              <input
                type="password"
                value={password2}
                onChange={(e) => setPassword2(e.target.value)}
                style={{ width: '100%', marginTop: 6, padding: '12px 14px', borderRadius: 12, border: '2px solid rgba(0,0,0,0.10)' }}
                placeholder="Répète le mot de passe"
              />
            </label>

            {error ? <div style={{ marginTop: 10, fontSize: 13, color: '#b91c1c' }}>{error}</div> : null}

            <button
              type="button"
              onClick={async () => {
                if (!supabase) return
                setError('')
                if (password.length < 8) {
                  setError('Mot de passe trop court (8 caractères minimum)')
                  return
                }
                if (password !== password2) {
                  setError('Les mots de passe ne correspondent pas')
                  return
                }

                try {
                  setLoading(true)
                  const { error } = await supabase.auth.updateUser({ password })
                  if (error) throw error
                  setDone(true)
                } catch (e: any) {
                  setError(e?.message || 'Erreur mise à jour mot de passe')
                } finally {
                  setLoading(false)
                }
              }}
              disabled={loading}
              style={{
                width: '100%',
                marginTop: 16,
                padding: '14px 16px',
                borderRadius: 14,
                border: 'none',
                background: '#0a0a0a',
                color: 'white',
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              {loading ? 'Enregistrement…' : 'Mettre à jour'}
            </button>
          </>
        ) : null}
      </div>
    </main>
  )
}
