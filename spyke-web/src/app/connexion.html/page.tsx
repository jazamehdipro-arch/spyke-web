"use client"

import { useEffect, useMemo, useState } from 'react'
import { getSupabase } from '@/lib/supabaseClient'

type Tab = 'connexion' | 'inscription'

export default function ConnexionPage() {
  const [tab, setTab] = useState<Tab>('connexion')
  const [loading, setLoading] = useState(false)

  // Forgot password
  const [forgotOpen, setForgotOpen] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotSent, setForgotSent] = useState(false)
  const [forgotError, setForgotError] = useState('')

  const supabase = useMemo(() => {
    try {
      return getSupabase()
    } catch {
      return null
    }
  }, [])

  useEffect(() => {
    // Expose switchTab() for inline onclicks in the markup (kept for fidelity)
    ;(window as any).switchTab = (next: Tab) => setTab(next)
    return () => {
      delete (window as any).switchTab
    }
  }, [])

  const isConnexion = tab === 'connexion'

  return (
    <>
      <style jsx global>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        :root {
          --black: #0a0a0a;
          --white: #ffffff;
          --gray-50: #fafafa;
          --gray-100: #f4f4f5;
          --gray-200: #e4e4e7;
          --gray-300: #d4d4d8;
          --gray-400: #a1a1aa;
          --gray-500: #71717a;
          --gray-600: #52525b;
          --gray-800: #27272a;
          --gray-900: #18181b;
          --yellow: #facc15;
          --yellow-light: #fef9c3;
          --yellow-dark: #eab308;
          --red: #ef4444;
        }
        body {
          font-family: 'DM Sans', -apple-system, sans-serif;
          background: var(--gray-50);
          color: var(--gray-900);
          line-height: 1.6;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }
        header {
          padding: 24px 48px;
          background: var(--white);
          border-bottom: 1px solid var(--gray-200);
        }
        .header-content {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
        }
        .logo {
          display: flex;
          align-items: center;
          gap: 10px;
          font-family: 'Syne', sans-serif;
          font-size: 26px;
          font-weight: 700;
          color: var(--black);
          text-decoration: none;
        }
        .logo-icon {
          width: 36px;
          height: 36px;
          background: var(--black);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .logo-icon svg {
          width: 20px;
          height: 20px;
          fill: var(--yellow);
        }
        .header-link {
          font-size: 14px;
          color: var(--gray-500);
          text-align: right;
        }
        .header-link a {
          color: var(--yellow-dark);
          text-decoration: none;
          font-weight: 600;
        }
        .header-link a:hover {
          text-decoration: underline;
        }
        main {
          flex: 1;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 48px 24px;
        }
        .auth-card {
          width: 100%;
          max-width: 440px;
          background: var(--white);
          border-radius: 24px;
          padding: 48px;
          border: 1px solid var(--gray-200);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
        }

        /* Modal */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.55);
          display: none;
          align-items: center;
          justify-content: center;
          padding: 18px;
          z-index: 9999;
        }
        .modal-overlay.active {
          display: flex;
        }
        .modal {
          width: 100%;
          max-width: 520px;
          background: var(--white);
          border-radius: 18px;
          border: 1px solid var(--gray-200);
          box-shadow: 0 18px 50px rgba(0, 0, 0, 0.25);
          overflow: hidden;
        }
        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 16px 18px;
          border-bottom: 1px solid var(--gray-200);
          background: var(--gray-50);
        }
        .modal-title {
          font-weight: 800;
          font-size: 16px;
          color: var(--gray-900);
        }
        .modal-close {
          border: none;
          background: transparent;
          font-size: 18px;
          cursor: pointer;
          color: var(--gray-600);
          padding: 6px 10px;
          border-radius: 10px;
        }
        .modal-close:hover {
          background: var(--gray-100);
        }
        .modal-body {
          padding: 18px;
        }
        .modal-actions {
          display: flex;
          gap: 10px;
          justify-content: flex-end;
          padding: 14px 18px 18px;
        }
        .modal-error {
          margin-top: 10px;
          font-size: 13px;
          color: var(--red);
        }
        .modal-success {
          margin-top: 10px;
          font-size: 13px;
          color: #15803d;
        }
        .auth-header {
          text-align: center;
          margin-bottom: 36px;
        }
        .auth-header h1 {
          font-family: 'Syne', sans-serif;
          font-size: 28px;
          font-weight: 700;
          color: var(--black);
          margin-bottom: 8px;
        }
        .auth-header p {
          font-size: 15px;
          color: var(--gray-500);
        }
        .auth-tabs {
          display: flex;
          background: var(--gray-100);
          border-radius: 12px;
          padding: 4px;
          margin-bottom: 32px;
        }
        .auth-tab {
          flex: 1;
          padding: 12px;
          text-align: center;
          font-size: 14px;
          font-weight: 600;
          color: var(--gray-500);
          background: transparent;
          border: none;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .auth-tab.active {
          background: var(--white);
          color: var(--black);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        }
        .auth-form {
          display: none;
        }
        .auth-form.active {
          display: block;
        }
        .form-group {
          margin-bottom: 20px;
        }
        .form-label {
          display: block;
          font-size: 14px;
          font-weight: 600;
          color: var(--gray-700);
          margin-bottom: 8px;
        }
        .form-input {
          width: 100%;
          padding: 14px 18px;
          border: 2px solid var(--gray-200);
          border-radius: 12px;
          font-size: 15px;
          font-family: inherit;
          transition: all 0.2s;
        }
        .form-input:focus {
          outline: none;
          border-color: var(--yellow);
          box-shadow: 0 0 0 4px rgba(250, 204, 21, 0.15);
        }
        .form-input::placeholder {
          color: var(--gray-400);
        }
        .form-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          gap: 16px;
        }
        .form-checkbox {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          color: var(--gray-600);
        }
        .form-checkbox input {
          width: 18px;
          height: 18px;
          accent-color: var(--yellow);
        }
        .form-link {
          font-size: 14px;
          color: var(--yellow-dark);
          text-decoration: none;
          font-weight: 500;
          white-space: nowrap;
        }
        .form-link:hover {
          text-decoration: underline;
        }
        .btn {
          width: 100%;
          padding: 16px;
          border: none;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          font-family: inherit;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-primary {
          background: var(--black);
          color: var(--white);
        }
        .btn-primary:hover {
          background: var(--gray-800);
          transform: translateY(-2px);
        }
        .divider {
          display: flex;
          align-items: center;
          margin: 28px 0;
          color: var(--gray-400);
          font-size: 13px;
        }
        .divider::before,
        .divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: var(--gray-200);
        }
        .divider span {
          padding: 0 16px;
        }
        .btn-google {
          background: var(--white);
          color: var(--gray-700);
          border: 2px solid var(--gray-200);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
        }
        .btn-google:hover {
          background: var(--gray-50);
          border-color: var(--gray-300);
        }
        .btn-google svg {
          width: 20px;
          height: 20px;
        }

        .btn-linkedin {
          background: #0a66c2;
          color: #fff;
          border: 2px solid #0a66c2;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
        }
        .btn-linkedin:hover {
          background: #0959aa;
          border-color: #0959aa;
        }
        .btn-linkedin svg {
          width: 20px;
          height: 20px;
        }
        .terms {
          margin-top: 24px;
          font-size: 13px;
          color: var(--gray-500);
          text-align: center;
        }
        .terms a {
          color: var(--gray-700);
          text-decoration: underline;
        }
        footer {
          padding: 24px 48px;
          background: var(--white);
          border-top: 1px solid var(--gray-200);
        }
        .footer-content {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          justify-content: center;
          gap: 32px;
          flex-wrap: wrap;
        }
        .footer-content a {
          font-size: 14px;
          color: var(--gray-500);
          text-decoration: none;
        }
        .footer-content a:hover {
          color: var(--gray-700);
        }
        @media (max-width: 640px) {
          header {
            padding: 16px 20px;
          }
          main {
            padding: 32px 16px;
          }
          .auth-card {
            padding: 32px 24px;
          }
          footer {
            padding: 20px;
          }
          .footer-content {
            justify-content: center;
            gap: 16px;
          }
        }
      `}</style>

      <header>
        <div className="header-content">
          <a href="/" className="logo">
            <div className="logo-icon">
              <svg viewBox="0 0 24 24">
                <path d="M13 3L4 14h7l-2 7 9-11h-7l2-7z" />
              </svg>
            </div>
            Spyke
          </a>

          <div className="header-link" id="headerLink">
            {isConnexion ? (
              <>
                Pas encore de compte ?{' '}
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    setTab('inscription')
                  }}
                >
                  S&apos;inscrire
                </a>
              </>
            ) : (
              <>
                Déjà un compte ?{' '}
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    setTab('connexion')
                  }}
                >
                  Se connecter
                </a>
              </>
            )}
          </div>
        </div>
      </header>

      <main>
        <div className="auth-card">
          <div className="auth-header">
            <h1 id="authTitle">{isConnexion ? 'Bon retour !' : 'Créez votre compte'}</h1>
            <p id="authSubtitle">
              {isConnexion
                ? 'Connectez-vous à votre compte Spyke'
                : 'Rejoignez les freelances qui gagnent du temps'}
            </p>
          </div>

          <div className="auth-tabs">
            <button
              className={`auth-tab ${isConnexion ? 'active' : ''}`}
              onClick={() => setTab('connexion')}
              type="button"
            >
              Connexion
            </button>
            <button
              className={`auth-tab ${!isConnexion ? 'active' : ''}`}
              onClick={() => setTab('inscription')}
              type="button"
            >
              Inscription
            </button>
          </div>

          {/* Connexion */}
          <form
            className={`auth-form ${isConnexion ? 'active' : ''}`}
            id="formConnexion"
            onSubmit={async (e) => {
              e.preventDefault()
              if (!supabase) {
                alert('Supabase non configuré (env manquantes)')
                return
              }

              try {
                setLoading(true)

                const form = e.currentTarget
                const fd = new FormData(form)
                const email = String(fd.get('email') || '')
                const password = String(fd.get('password') || '')

                const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
                  email,
                  password,
                })
                if (signInError) throw signInError

                const user = signInData.user
                if (!user) throw new Error('Utilisateur introuvable')

                const { data: profile, error: profileError } = await supabase
                  .from('profiles')
                  .select('onboarding_completed')
                  .eq('id', user.id)
                  .maybeSingle()

                if (profileError) throw profileError

                // If profile doesn't exist yet, treat as first login
                const done = Boolean(profile?.onboarding_completed)
                window.location.href = done ? '/app.html' : '/onboarding.html'
              } catch (err: any) {
                alert(err?.message || 'Erreur de connexion')
              } finally {
                setLoading(false)
              }
            }}
          >
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                name="email"
                type="email"
                className="form-input"
                placeholder="vous@exemple.com"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Mot de passe</label>
              <input
                name="password"
                type="password"
                className="form-input"
                placeholder="••••••••"
                required
              />
            </div>
            <div className="form-row">
              <label className="form-checkbox">
                <input type="checkbox" />
                Se souvenir de moi
              </label>
              <a
                href="#"
                className="form-link"
                onClick={(e) => {
                  e.preventDefault()
                  setForgotOpen(true)
                  setForgotSent(false)
                  setForgotError('')
                  // prefill from login form if available
                  try {
                    const form = document.getElementById('formConnexion') as HTMLFormElement | null
                    const v = String((form?.querySelector('[name="email"]') as HTMLInputElement | null)?.value || '')
                    if (v) setForgotEmail(v)
                  } catch {}
                }}
              >
                Mot de passe oublié ?
              </a>
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Connexion…' : 'Se connecter'}
            </button>

            <div className="divider">
              <span>ou</span>
            </div>

            <button type="button" className="btn btn-google"
              onClick={async () => {
                if (!supabase) {
                  alert('Supabase non configuré (env manquantes)')
                  return
                }
                try {
                  setLoading(true)
                  const origin = window.location.origin
                  const { data, error } = await supabase.auth.signInWithOAuth({
                    provider: 'google',
                    options: {
                      redirectTo: `${origin}/auth/callback.html`,
                      queryParams: {
                        // Minimal scopes for sign-in only.
                        // Gmail sending is requested later via the dedicated "Connecter Gmail" flow.
                        scope: ['openid', 'email', 'profile'].join(' '),
                      },
                    },
                  })
                  if (error) throw error
                  if (data?.url) window.location.href = data.url
                } catch (err: any) {
                  alert(err?.message || 'Erreur Google')
                } finally {
                  setLoading(false)
                }
              }}> 
              <svg viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continuer avec Google
            </button>

            <button
              type="button"
              className="btn btn-linkedin"
              style={{ marginTop: 12 }}
              onClick={async () => {
                if (!supabase) {
                  alert('Supabase non configuré (env manquantes)')
                  return
                }
                try {
                  setLoading(true)
                  const origin = window.location.origin
                  const provider = ((process.env.NEXT_PUBLIC_LINKEDIN_PROVIDER as any) || 'linkedin') as any
                  const { data, error } = await supabase.auth.signInWithOAuth({
                    provider,
                    options: {
                      redirectTo: `${origin}/auth/callback.html`,
                    },
                  })
                  if (error) throw error
                  if (data?.url) window.location.href = data.url
                } catch (err: any) {
                  alert(err?.message || 'Erreur LinkedIn')
                } finally {
                  setLoading(false)
                }
              }}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.602 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zM6.814 20.452H3.86V9h2.954v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.727v20.545C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.273V1.727C24 .774 23.2 0 22.222 0z"
                />
              </svg>
              Continuer avec LinkedIn
            </button>
          </form>

          {/* Inscription */}
          <form
            className={`auth-form ${!isConnexion ? 'active' : ''}`}
            id="formInscription"
            onSubmit={async (e) => {
              e.preventDefault()
              if (!supabase) {
                alert('Supabase non configuré (env manquantes)')
                return
              }

              try {
                setLoading(true)

                const form = e.currentTarget
                const fd = new FormData(form)
                const email = String(fd.get('email') || '')
                const password = String(fd.get('password') || '')
                const passwordConfirm = String(fd.get('passwordConfirm') || '')

                if (!password || password.length < 8) throw new Error('Mot de passe trop court (8 caractères minimum)')
                if (password !== passwordConfirm) throw new Error('Les mots de passe ne correspondent pas')

                const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                  email,
                  password,
                })
                if (signUpError) throw signUpError

                // If email confirmations are enabled, session may be null.
                // We still send the user to onboarding; onboarding will ask to login if no session.
                if (signUpData.user && signUpData.session) {
                  // Ensure profile row exists
                  await supabase.from('profiles').upsert({ id: signUpData.user.id }, { onConflict: 'id' })
                }

                window.location.href = '/onboarding.html'
              } catch (err: any) {
                alert(err?.message || 'Erreur inscription')
              } finally {
                setLoading(false)
              }
            }}
          >
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                name="email"
                type="email"
                className="form-input"
                placeholder="vous@exemple.com"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Mot de passe</label>
              <input
                name="password"
                type="password"
                className="form-input"
                placeholder="8 caractères minimum"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Confirmer le mot de passe</label>
              <input
                name="passwordConfirm"
                type="password"
                className="form-input"
                placeholder="Répétez le mot de passe"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-checkbox">
                <input type="checkbox" required />
                J&apos;accepte les <a href="/cgu.html" target="_blank">CGU</a> et la{' '}
                <a href="/confidentialite.html" target="_blank">
                  politique de confidentialité
                </a>
              </label>
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Inscription…' : 'Créer mon compte'}
            </button>

            <div className="divider">
              <span>ou</span>
            </div>

            <button type="button" className="btn btn-google"
              onClick={async () => {
                if (!supabase) {
                  alert('Supabase non configuré (env manquantes)')
                  return
                }
                try {
                  setLoading(true)
                  const origin = window.location.origin
                  const { data, error } = await supabase.auth.signInWithOAuth({
                    provider: 'google',
                    options: {
                      redirectTo: `${origin}/auth/callback.html`,
                      queryParams: {
                        // Minimal scopes for sign-in only.
                        // Gmail sending is requested later via the dedicated "Connecter Gmail" flow.
                        scope: ['openid', 'email', 'profile'].join(' '),
                      },
                    },
                  })
                  if (error) throw error
                  if (data?.url) window.location.href = data.url
                } catch (err: any) {
                  alert(err?.message || 'Erreur Google')
                } finally {
                  setLoading(false)
                }
              }}> 
              <svg viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              S&apos;inscrire avec Google
            </button>

            <button
              type="button"
              className="btn btn-linkedin"
              style={{ marginTop: 12 }}
              onClick={async () => {
                if (!supabase) {
                  alert('Supabase non configuré (env manquantes)')
                  return
                }
                try {
                  setLoading(true)
                  const origin = window.location.origin
                  const provider = ((process.env.NEXT_PUBLIC_LINKEDIN_PROVIDER as any) || 'linkedin') as any
                  const { data, error } = await supabase.auth.signInWithOAuth({
                    provider,
                    options: {
                      redirectTo: `${origin}/auth/callback.html`,
                    },
                  })
                  if (error) throw error
                  if (data?.url) window.location.href = data.url
                } catch (err: any) {
                  alert(err?.message || 'Erreur LinkedIn')
                } finally {
                  setLoading(false)
                }
              }}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.602 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zM6.814 20.452H3.86V9h2.954v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.727v20.545C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.273V1.727C24 .774 23.2 0 22.222 0z"
                />
              </svg>
              S&apos;inscrire avec LinkedIn
            </button>

            <p className="terms">
              En créant un compte, vous acceptez nos <a href="/cgu.html">CGU</a> et notre{' '}
              <a href="/confidentialite.html">politique de confidentialité</a>.
            </p>
          </form>
        </div>
      </main>

      <footer>
        <div className="footer-content">
          <a href="/">Accueil</a>
          <a href="/fonctionnalites.html">Fonctionnalités</a>
          <a href="/mentions-legales.html">Mentions légales</a>
          <a href="/cgu.html">CGU</a>
          <a href="/confidentialite.html">Confidentialité</a>
        </div>
      </footer>

      {/* Forgot password modal */}
      <div
        className={`modal-overlay ${forgotOpen ? 'active' : ''}`}
        onClick={(e) => {
          if (e.target === e.currentTarget) setForgotOpen(false)
        }}
      >
        <div className="modal">
          <div className="modal-header">
            <div className="modal-title">Réinitialiser le mot de passe</div>
            <button className="modal-close" type="button" onClick={() => setForgotOpen(false)}>
              ✕
            </button>
          </div>
          <div className="modal-body">
            <div style={{ fontSize: 13, color: 'var(--gray-600)', lineHeight: 1.6 }}>
              Entre ton email et on t’envoie un lien pour choisir un nouveau mot de passe.
            </div>

            <div className="form-group" style={{ marginTop: 14 }}>
              <label className="form-label">Email</label>
              <input
                className="form-input"
                type="email"
                placeholder="vous@exemple.com"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
              />
            </div>

            {forgotError ? <div className="modal-error">{forgotError}</div> : null}
            {forgotSent ? <div className="modal-success">Email envoyé. Vérifie ta boîte mail.</div> : null}
          </div>
          <div className="modal-actions">
            <button className="btn btn-secondary" type="button" onClick={() => setForgotOpen(false)} disabled={loading}>
              Annuler
            </button>
            <button
              className="btn btn-primary"
              type="button"
              disabled={loading || !forgotEmail.trim()}
              onClick={async () => {
                if (!supabase) {
                  setForgotError('Supabase non configuré (env manquantes)')
                  return
                }
                try {
                  setLoading(true)
                  setForgotError('')
                  const origin = window.location.origin
                  const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail.trim(), {
                    redirectTo: `${origin}/reset.html`,
                  })
                  if (error) throw error
                  setForgotSent(true)
                } catch (e: any) {
                  setForgotError(e?.message || 'Erreur envoi email')
                } finally {
                  setLoading(false)
                }
              }}
            >
              {loading ? 'Envoi…' : 'Envoyer le lien'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
