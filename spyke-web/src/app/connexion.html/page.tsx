"use client"

import { useEffect, useState } from 'react'

type Tab = 'connexion' | 'inscription'

export default function ConnexionPage() {
  const [tab, setTab] = useState<Tab>('connexion')

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
          <a href="index.html" className="logo">
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
            onSubmit={(e) => {
              e.preventDefault()
              // TODO: brancher auth réelle (Supabase). Pour l’instant: démo via localStorage.
              const onboardingDone = localStorage.getItem('spyke_onboarding_done') === 'true'
              window.location.href = onboardingDone ? 'app.html' : 'onboarding.html'
            }}
          >
            <div className="form-group">
              <label className="form-label">Email</label>
              <input type="email" className="form-input" placeholder="vous@exemple.com" />
            </div>
            <div className="form-group">
              <label className="form-label">Mot de passe</label>
              <input type="password" className="form-input" placeholder="••••••••" />
            </div>
            <div className="form-row">
              <label className="form-checkbox">
                <input type="checkbox" />
                Se souvenir de moi
              </label>
              <a href="#" className="form-link">
                Mot de passe oublié ?
              </a>
            </div>
            <button type="submit" className="btn btn-primary">
              Se connecter
            </button>

            <div className="divider">
              <span>ou</span>
            </div>

            <button type="button" className="btn btn-google">
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
          </form>

          {/* Inscription */}
          <form
            className={`auth-form ${!isConnexion ? 'active' : ''}`}
            id="formInscription"
            onSubmit={(e) => {
              e.preventDefault()
              // TODO: brancher auth réelle (Supabase). Pour l’instant: on envoie vers l’onboarding.
              window.location.href = 'onboarding.html'
            }}
          >
            <div className="form-group">
              <label className="form-label">Email</label>
              <input type="email" className="form-input" placeholder="vous@exemple.com" />
            </div>
            <div className="form-group">
              <label className="form-label">Mot de passe</label>
              <input type="password" className="form-input" placeholder="8 caractères minimum" />
            </div>
            <div className="form-group">
              <label className="form-checkbox">
                <input type="checkbox" required />
                J&apos;accepte les <a href="mentions-legales.html" target="_blank">CGU</a> et la{' '}
                <a href="confidentialite.html" target="_blank">
                  politique de confidentialité
                </a>
              </label>
            </div>
            <button type="submit" className="btn btn-primary">
              Créer mon compte
            </button>

            <div className="divider">
              <span>ou</span>
            </div>

            <button type="button" className="btn btn-google">
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

            <p className="terms">
              En créant un compte, vous acceptez nos <a href="mentions-legales.html">CGU</a> et notre{' '}
              <a href="confidentialite.html">politique de confidentialité</a>.
            </p>
          </form>
        </div>
      </main>

      <footer>
        <div className="footer-content">
          <a href="index.html">Accueil</a>
          <a href="fonctionnalites.html">Fonctionnalités</a>
          <a href="mentions-legales.html">Mentions légales</a>
          <a href="confidentialite.html">Confidentialité</a>
        </div>
      </footer>
    </>
  )
}
