'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabase } from '@/lib/supabaseClient'

type Mode = 'login' | 'register'

export default function LoginPage() {
  const router = useRouter()

  const [mode, setMode] = useState<Mode>('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  const [registerName, setRegisterName] = useState('')
  const [registerEmail, setRegisterEmail] = useState('')
  const [registerPassword, setRegisterPassword] = useState('')
  const [registerPasswordConfirm, setRegisterPasswordConfirm] = useState('')

  const [forgotOpen, setForgotOpen] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotSent, setForgotSent] = useState(false)

  const submitLabel = useMemo(() => {
    if (loading) return '...'
    return mode === 'login' ? 'Se connecter' : 'Créer mon compte'
  }, [loading, mode])

  async function onLoginSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const supabase = getSupabase()
      const { error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      })
      if (error) throw error
      router.push('/app')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  async function onRegisterSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (registerPassword !== registerPasswordConfirm) {
      setError('Les mots de passe ne correspondent pas')
      return
    }

    setLoading(true)
    try {
      const supabase = getSupabase()
      const { error } = await supabase.auth.signUp({
        email: registerEmail,
        password: registerPassword,
        options: {
          // v1 test: no email confirmation.
          emailRedirectTo: `${window.location.origin}/app`,
          data: {
            full_name: registerName || undefined,
          },
        },
      })
      if (error) throw error
      router.push('/app')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  function openForgotPassword(e?: React.MouseEvent) {
    e?.preventDefault()
    setForgotOpen(true)
    setForgotSent(false)
  }

  function closeForgotPassword() {
    setForgotOpen(false)
  }

  async function sendResetEmail(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const supabase = getSupabase()
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
        redirectTo: `${window.location.origin}/login`,
      })
      if (error) throw error
      setForgotSent(true)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <header>
        <Link href="/" className="logo">
          <span aria-hidden className="bolt">
            ⚡
          </span>
          Spyke
        </Link>
      </header>

      <main>
        <div className="auth-container">
          <div className="auth-card">
            <div className="auth-header">
              <h1>Bienvenue</h1>
              <p>Connectez-vous ou créez un compte</p>
            </div>

            <div className="auth-tabs">
              <button
                className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
                onClick={() => setMode('login')}
                type="button"
              >
                Connexion
              </button>
              <button
                className={`auth-tab ${mode === 'register' ? 'active' : ''}`}
                onClick={() => setMode('register')}
                type="button"
              >
                Inscription
              </button>
            </div>

            {error && <p className="error">{error}</p>}

            {/* Login */}
            <form className={`auth-form ${mode === 'login' ? 'active' : ''}`} onSubmit={onLoginSubmit}>
              <div className="form-group">
                <label htmlFor="loginEmail">Email</label>
                <input
                  type="email"
                  id="loginEmail"
                  placeholder="vous@exemple.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="loginPassword">Mot de passe</label>
                <input
                  type="password"
                  id="loginPassword"
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                />
              </div>
              <div className="forgot-password">
                <a href="#" onClick={openForgotPassword}>
                  Mot de passe oublié ?
                </a>
              </div>
              <button type="submit" className="btn-submit" disabled={loading}>
                {submitLabel}
              </button>
            </form>

            {/* Register */}
            <form
              className={`auth-form ${mode === 'register' ? 'active' : ''}`}
              onSubmit={onRegisterSubmit}
            >
              <div className="form-group">
                <label htmlFor="registerName">Nom complet</label>
                <input
                  type="text"
                  id="registerName"
                  placeholder="Jean Dupont"
                  value={registerName}
                  onChange={(e) => setRegisterName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="registerEmail">Email</label>
                <input
                  type="email"
                  id="registerEmail"
                  placeholder="vous@exemple.com"
                  value={registerEmail}
                  onChange={(e) => setRegisterEmail(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="registerPassword">Mot de passe</label>
                <input
                  type="password"
                  id="registerPassword"
                  placeholder="8 caractères minimum"
                  value={registerPassword}
                  onChange={(e) => setRegisterPassword(e.target.value)}
                  required
                  minLength={8}
                />
              </div>
              <div className="form-group">
                <label htmlFor="registerPasswordConfirm">Confirmer le mot de passe</label>
                <input
                  type="password"
                  id="registerPasswordConfirm"
                  placeholder="••••••••"
                  value={registerPasswordConfirm}
                  onChange={(e) => setRegisterPasswordConfirm(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn-submit" disabled={loading}>
                {submitLabel}
              </button>
            </form>

            <div className="divider">
              <span>ou continuer avec</span>
            </div>

            <div className="social-buttons">
              <button className="btn-social" type="button" disabled>
                <svg viewBox="0 0 24 24" aria-hidden="true">
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
                Google (bientôt)
              </button>
            </div>
          </div>

          <div className="back-link">
            <Link href="/">
              <svg
                width="16"
                height="16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              Retour à l&apos;accueil
            </Link>
          </div>
        </div>
      </main>

      {/* Modal Mot de passe oublié */}
      <div
        className={`modal-overlay ${forgotOpen ? 'active' : ''}`}
        id="forgotModal"
        onClick={(e) => {
          if (e.target === e.currentTarget) closeForgotPassword()
        }}
      >
        <div className="modal">
          {!forgotSent ? (
            <div id="forgotForm">
              <div className="modal-header">
                <h2>Mot de passe oublié</h2>
                <p>Entrez votre email, nous vous enverrons un lien de réinitialisation.</p>
              </div>
              <form onSubmit={sendResetEmail}>
                <div className="form-group">
                  <label htmlFor="forgotEmail">Email</label>
                  <input
                    type="email"
                    id="forgotEmail"
                    placeholder="vous@exemple.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="btn-submit" disabled={loading}>
                  {loading ? '...' : 'Envoyer le lien'}
                </button>
              </form>
              <button className="modal-close" onClick={closeForgotPassword} type="button">
                Annuler
              </button>
            </div>
          ) : (
            <div className="success-message active" id="forgotSuccess">
              <div className="success-icon">✓</div>
              <h2 style={{ fontSize: 20, marginBottom: 8 }}>Email envoyé !</h2>
              <p style={{ fontSize: 14, color: 'var(--gray-500)', marginBottom: 24 }}>
                Vérifiez votre boîte de réception et suivez les instructions.
              </p>
              <button className="btn-submit" onClick={closeForgotPassword} type="button">
                Retour à la connexion
              </button>
            </div>
          )}
        </div>
      </div>

      <footer>
        <p>Spyke © 2025 – Votre assistant freelance intelligent</p>
      </footer>

      <style jsx global>{`
        :root {
          --black: #000000;
          --white: #ffffff;
          --gray-50: #fafafa;
          --gray-100: #f5f5f5;
          --gray-200: #e5e5e5;
          --gray-300: #d4d4d4;
          --gray-400: #a3a3a3;
          --gray-500: #737373;
          --gray-600: #525252;
          --gray-700: #404040;
          --gray-900: #171717;
        }

        body {
          font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
            Helvetica, Arial, 'Apple Color Emoji', 'Segoe UI Emoji';
          background: var(--gray-50);
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          -webkit-font-smoothing: antialiased;
        }

        header {
          padding: 20px 24px;
          text-align: center;
        }

        .logo {
          font-size: 28px;
          font-weight: 600;
          letter-spacing: -0.5px;
          color: var(--gray-900);
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }

        .bolt {
          font-size: 22px;
          line-height: 1;
        }

        main {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
        }

        .auth-container {
          width: 100%;
          max-width: 400px;
        }

        .auth-card {
          background: var(--white);
          border-radius: 20px;
          padding: 40px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
          border: 1px solid var(--gray-200);
        }

        .auth-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .auth-header h1 {
          font-size: 28px;
          font-weight: 600;
          letter-spacing: -0.5px;
          margin-bottom: 8px;
          color: var(--gray-900);
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
          margin-bottom: 18px;
        }

        .auth-tab {
          flex: 1;
          padding: 12px 16px;
          border: none;
          background: transparent;
          font-family: inherit;
          font-size: 14px;
          font-weight: 500;
          color: var(--gray-500);
          cursor: pointer;
          border-radius: 10px;
          transition: all 0.2s;
        }

        .auth-tab.active {
          background: var(--white);
          color: var(--gray-900);
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .auth-tab:hover:not(.active) {
          color: var(--gray-700);
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

        .form-group label {
          display: block;
          font-size: 14px;
          font-weight: 500;
          color: var(--gray-700);
          margin-bottom: 8px;
        }

        .form-group input {
          width: 100%;
          padding: 14px 16px;
          border: 1px solid var(--gray-300);
          border-radius: 12px;
          font-family: inherit;
          font-size: 16px;
          color: var(--gray-900);
          background: var(--white);
          transition: all 0.2s;
        }

        .form-group input:focus {
          outline: none;
          border-color: var(--gray-900);
          box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.05);
        }

        .form-group input::placeholder {
          color: var(--gray-400);
        }

        .forgot-password {
          text-align: right;
          margin-top: -12px;
          margin-bottom: 20px;
        }

        .forgot-password a {
          font-size: 13px;
          color: var(--gray-500);
          text-decoration: none;
          transition: color 0.2s;
        }

        .forgot-password a:hover {
          color: var(--gray-900);
        }

        .btn-submit {
          width: 100%;
          padding: 16px;
          background: var(--gray-900);
          color: var(--white);
          border: none;
          border-radius: 12px;
          font-family: inherit;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          margin-top: 8px;
        }

        .btn-submit:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none !important;
        }

        .btn-submit:hover {
          opacity: 0.9;
          transform: translateY(-1px);
        }

        .btn-submit:active {
          transform: translateY(0);
        }

        .divider {
          display: flex;
          align-items: center;
          margin: 28px 0;
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
          font-size: 13px;
          color: var(--gray-400);
        }

        .social-buttons {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .btn-social {
          width: 100%;
          padding: 14px 16px;
          background: var(--white);
          border: 1px solid var(--gray-300);
          border-radius: 12px;
          font-family: inherit;
          font-size: 15px;
          font-weight: 500;
          color: var(--gray-900);
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
        }

        .btn-social:hover {
          background: var(--gray-50);
          border-color: var(--gray-400);
        }

        .btn-social svg {
          width: 20px;
          height: 20px;
        }

        .back-link {
          text-align: center;
          margin-top: 24px;
        }

        .back-link a {
          font-size: 14px;
          color: var(--gray-500);
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: color 0.2s;
        }

        .back-link a:hover {
          color: var(--gray-900);
        }

        footer {
          padding: 24px;
          text-align: center;
        }

        footer p {
          font-size: 13px;
          color: var(--gray-400);
        }

        .error {
          margin: 0 0 14px;
          font-size: 13px;
          color: #b91c1c;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 12px;
          padding: 10px 12px;
        }

        /* Modal */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.5);
          display: none;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 24px;
        }

        .modal-overlay.active {
          display: flex;
        }

        .modal {
          background: var(--white);
          border-radius: 20px;
          padding: 32px;
          width: 100%;
          max-width: 400px;
          border: 1px solid var(--gray-200);
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
        }

        .modal-header {
          text-align: center;
          margin-bottom: 24px;
        }

        .modal-header h2 {
          font-size: 22px;
          font-weight: 600;
          margin-bottom: 8px;
          color: var(--gray-900);
        }

        .modal-header p {
          font-size: 14px;
          color: var(--gray-500);
        }

        .modal-close {
          width: 100%;
          padding: 14px;
          background: transparent;
          border: 1px solid var(--gray-300);
          border-radius: 12px;
          font-family: inherit;
          font-size: 15px;
          font-weight: 500;
          color: var(--gray-600);
          cursor: pointer;
          margin-top: 12px;
          transition: all 0.2s;
        }

        .modal-close:hover {
          background: var(--gray-50);
        }

        .success-message {
          display: none;
          text-align: center;
          padding: 20px;
        }

        .success-message.active {
          display: block;
        }

        .success-icon {
          width: 48px;
          height: 48px;
          background: #dcfce7;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px;
          color: #16a34a;
          font-size: 24px;
        }
      `}</style>
    </>
  )
}
