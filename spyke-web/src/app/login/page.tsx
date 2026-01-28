'use client'

import { useState } from 'react'
import { getSupabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<'login' | 'signup'>('signup')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      if (mode === 'signup') {
        const supabase = getSupabase()
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
      } else {
        const supabase = getSupabase()
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      }
      router.push('/app')
    } catch (e: any) {
      setError(e?.message || 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-xl border border-white/10 bg-black/30 p-6">
        <h1 className="text-2xl font-semibold">Spyke</h1>
        <p className="mt-1 text-sm text-white/70">
          {mode === 'signup' ? 'Créer un compte' : 'Se connecter'}
        </p>

        <div className="mt-4 flex gap-2">
          <button
            className={`px-3 py-2 rounded-md text-sm border ${mode === 'signup' ? 'bg-white/10 border-white/20' : 'border-white/10 text-white/70'}`}
            onClick={() => setMode('signup')}
            type="button"
          >
            Inscription
          </button>
          <button
            className={`px-3 py-2 rounded-md text-sm border ${mode === 'login' ? 'bg-white/10 border-white/20' : 'border-white/10 text-white/70'}`}
            onClick={() => setMode('login')}
            type="button"
          >
            Connexion
          </button>
        </div>

        <form onSubmit={submit} className="mt-6 space-y-3">
          <label className="block text-sm">
            <span className="text-white/70">Email</span>
            <input
              className="mt-1 w-full rounded-md bg-black/30 border border-white/10 px-3 py-2"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
            />
          </label>

          <label className="block text-sm">
            <span className="text-white/70">Mot de passe</span>
            <input
              className="mt-1 w-full rounded-md bg-black/30 border border-white/10 px-3 py-2"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              required
            />
          </label>

          {error && <p className="text-sm text-red-300">{error}</p>}

          <button
            disabled={loading}
            className="w-full rounded-md bg-white/10 hover:bg-white/15 border border-white/20 px-3 py-2 text-sm"
          >
            {loading ? '...' : mode === 'signup' ? 'Créer mon compte' : 'Se connecter'}
          </button>
        </form>

        <p className="mt-4 text-xs text-white/50">
          V1: auth côté client (simple). On renforcera la protection serveur ensuite.
        </p>
      </div>
    </main>
  )
}
