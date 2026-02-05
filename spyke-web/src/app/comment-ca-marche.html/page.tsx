"use client"

import { useEffect } from 'react'

export default function CommentCaMarchePage() {
  useEffect(() => {
    // FAQ Toggle
    document.querySelectorAll<HTMLElement>('.faq-question').forEach((question) => {
      const onClick = () => {
        const item = question.parentElement
        if (!item) return
        const isActive = item.classList.contains('active')

        // Close all
        document.querySelectorAll<HTMLElement>('.faq-item').forEach((i) => i.classList.remove('active'))

        // Open clicked if wasn't active
        if (!isActive) item.classList.add('active')
      }

      question.addEventListener('click', onClick)
      // store handler on element for cleanup
      ;(question as any).__spykeOnClick = onClick
    })

    return () => {
      document.querySelectorAll<HTMLElement>('.faq-question').forEach((question) => {
        const handler = (question as any).__spykeOnClick
        if (handler) question.removeEventListener('click', handler)
        delete (question as any).__spykeOnClick
      })
    }
  }, [])

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
          --gray-700: #3f3f46;
          --gray-800: #27272a;
          --gray-900: #18181b;
          --yellow: #facc15;
          --yellow-dark: #eab308;
          --yellow-light: #fef9c3;
          --green: #22c55e;
          --green-light: #dcfce7;
        }

        html {
          scroll-behavior: smooth;
        }

        body {
          font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
          background: var(--white);
          color: var(--gray-900);
          line-height: 1.6;
          -webkit-font-smoothing: antialiased;
        }

        /* ===== NAVIGATION ===== */
        nav {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 1000;
          padding: 16px 48px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(0, 0, 0, 0.05);
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

        .nav-links {
          display: flex;
          align-items: center;
          gap: 40px;
          list-style: none;
        }

        .nav-links a {
          text-decoration: none;
          color: var(--gray-600);
          font-size: 15px;
          font-weight: 500;
          transition: color 0.2s ease;
        }

        .nav-links a:hover,
        .nav-links a.active {
          color: var(--black);
        }

        .nav-cta {
          background: var(--black);
          color: var(--white) !important;
          padding: 12px 28px;
          border-radius: 50px;
          font-weight: 600;
          transition: all 0.3s ease;
        }

        .nav-cta:hover {
          background: var(--gray-800);
          transform: translateY(-2px);
        }

        /* ===== HERO ===== */
        .hero {
          padding: 160px 48px 100px;
          text-align: center;
          background: linear-gradient(180deg, var(--gray-50) 0%, var(--white) 100%);
        }

        .hero-label {
          display: inline-block;
          font-size: 13px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 2px;
          color: var(--yellow-dark);
          margin-bottom: 20px;
        }

        .hero h1 {
          font-family: 'Syne', sans-serif;
          font-size: 56px;
          font-weight: 700;
          line-height: 1.1;
          letter-spacing: -2px;
          color: var(--black);
          margin-bottom: 24px;
          max-width: 800px;
          margin-left: auto;
          margin-right: auto;
        }

        .hero p {
          font-size: 20px;
          color: var(--gray-500);
          max-width: 600px;
          margin: 0 auto;
          line-height: 1.7;
        }

        /* ===== STEPS SECTION ===== */
        .steps-section {
          padding: 100px 48px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .steps-container {
          position: relative;
        }

        .steps-container::before {
          content: '';
          position: absolute;
          left: 60px;
          top: 80px;
          bottom: 80px;
          width: 3px;
          background: linear-gradient(180deg, var(--yellow) 0%, var(--yellow-dark) 100%);
          border-radius: 2px;
        }

        .step {
          display: grid;
          grid-template-columns: 120px 1fr 1fr;
          gap: 60px;
          align-items: center;
          margin-bottom: 100px;
          position: relative;
        }

        .step:last-child {
          margin-bottom: 0;
        }

        .step-number-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
          z-index: 2;
        }

        .step-number {
          width: 120px;
          height: 120px;
          background: var(--black);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Syne', sans-serif;
          font-size: 48px;
          font-weight: 700;
          color: var(--yellow);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
        }

        .step-content {
          padding: 40px;
          background: var(--white);
          border-radius: 24px;
          border: 1px solid var(--gray-200);
          transition: all 0.3s ease;
        }

        .step-content:hover {
          border-color: var(--yellow);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08);
          transform: translateY(-4px);
        }

        .step-icon {
          width: 56px;
          height: 56px;
          background: var(--yellow-light);
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          margin-bottom: 20px;
        }

        .step-content h3 {
          font-family: 'Syne', sans-serif;
          font-size: 28px;
          font-weight: 600;
          color: var(--black);
          margin-bottom: 12px;
        }

        .step-content p {
          font-size: 17px;
          color: var(--gray-500);
          line-height: 1.7;
          margin-bottom: 20px;
        }

        .step-details {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .step-detail {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 15px;
          color: var(--gray-600);
        }

        .step-detail svg {
          width: 18px;
          height: 18px;
          stroke: var(--green);
          flex-shrink: 0;
        }

        .step-visual {
          position: relative;
        }

        .step-image {
          width: 100%;
          border-radius: 20px;
          box-shadow: 0 30px 60px rgba(0, 0, 0, 0.1);
          border: 1px solid var(--gray-200);
        }

        .step-badge {
          position: absolute;
          background: var(--white);
          border-radius: 12px;
          padding: 14px 20px;
          box-shadow: 0 15px 30px rgba(0, 0, 0, 0.1);
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 14px;
          font-weight: 600;
          color: var(--black);
          animation: float 3s ease-in-out infinite;
        }

        .step-badge.badge-1 {
          top: -15px;
          right: 20px;
        }

        .step-badge.badge-2 {
          bottom: 20px;
          left: -20px;
          animation-delay: 1.5s;
        }

        .step-badge-icon {
          width: 32px;
          height: 32px;
          background: var(--green-light);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
        }

        /* ===== TIME COMPARISON ===== */
        .comparison {
          padding: 100px 48px;
          background: var(--black);
        }

        .comparison-container {
          max-width: 1000px;
          margin: 0 auto;
          text-align: center;
        }

        .comparison h2 {
          font-family: 'Syne', sans-serif;
          font-size: 42px;
          font-weight: 700;
          color: var(--white);
          margin-bottom: 16px;
        }

        .comparison > p {
          font-size: 18px;
          color: var(--gray-400);
          margin-bottom: 60px;
        }

        .comparison-grid {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          gap: 40px;
          align-items: center;
        }

        .comparison-card {
          background: var(--gray-900);
          border-radius: 24px;
          padding: 40px;
          border: 1px solid var(--gray-800);
        }

        .comparison-card.before {
          opacity: 0.7;
        }

        .comparison-card.after {
          border-color: var(--yellow);
          box-shadow: 0 0 40px rgba(250, 204, 21, 0.15);
        }

        .comparison-card-label {
          font-size: 13px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 2px;
          color: var(--gray-500);
          margin-bottom: 20px;
        }

        .comparison-card.after .comparison-card-label {
          color: var(--yellow);
        }

        .comparison-card h3 {
          font-family: 'Syne', sans-serif;
          font-size: 56px;
          font-weight: 700;
          color: var(--white);
          margin-bottom: 8px;
        }

        .comparison-card.after h3 {
          background: linear-gradient(135deg, var(--yellow) 0%, var(--yellow-dark) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .comparison-card p {
          font-size: 16px;
          color: var(--gray-400);
        }

        .comparison-arrow {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }

        .comparison-arrow svg {
          width: 48px;
          height: 48px;
          stroke: var(--yellow);
        }

        .comparison-arrow span {
          font-size: 14px;
          font-weight: 600;
          color: var(--yellow);
        }

        .comparison-tasks {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 24px;
          margin-top: 60px;
        }

        .comparison-task {
          background: var(--gray-900);
          border-radius: 16px;
          padding: 24px;
          border: 1px solid var(--gray-800);
          text-align: center;
        }

        .comparison-task-icon {
          font-size: 32px;
          margin-bottom: 12px;
        }

        .comparison-task h4 {
          font-size: 15px;
          font-weight: 600;
          color: var(--white);
          margin-bottom: 8px;
        }

        .comparison-task-times {
          display: flex;
          justify-content: center;
          gap: 16px;
          font-size: 14px;
        }

        .comparison-task-times .before {
          color: var(--gray-500);
          text-decoration: line-through;
        }

        .comparison-task-times .after {
          color: var(--yellow);
          font-weight: 600;
        }

        /* ===== FAQ ===== */
        .faq {
          padding: 100px 48px;
          background: var(--gray-50);
        }

        .faq-container {
          max-width: 800px;
          margin: 0 auto;
        }

        .faq-header {
          text-align: center;
          margin-bottom: 60px;
        }

        .faq-header h2 {
          font-family: 'Syne', sans-serif;
          font-size: 42px;
          font-weight: 700;
          color: var(--black);
          margin-bottom: 16px;
        }

        .faq-header p {
          font-size: 18px;
          color: var(--gray-500);
        }

        .faq-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .faq-item {
          background: var(--white);
          border-radius: 16px;
          border: 1px solid var(--gray-200);
          overflow: hidden;
          transition: all 0.3s ease;
        }

        .faq-item:hover {
          border-color: var(--gray-300);
        }

        .faq-question {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px 28px;
          cursor: pointer;
          font-size: 17px;
          font-weight: 600;
          color: var(--black);
        }

        .faq-question svg {
          width: 24px;
          height: 24px;
          stroke: var(--gray-400);
          transition: transform 0.3s ease;
        }

        .faq-item.active .faq-question svg {
          transform: rotate(180deg);
        }

        .faq-answer {
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.3s ease;
        }

        .faq-item.active .faq-answer {
          max-height: 300px;
        }

        .faq-answer-content {
          padding: 0 28px 24px;
          font-size: 16px;
          color: var(--gray-600);
          line-height: 1.7;
        }

        /* ===== CTA ===== */
        .cta {
          padding: 120px 48px;
          background: var(--white);
          text-align: center;
        }

        .cta-container {
          max-width: 700px;
          margin: 0 auto;
        }

        .cta h2 {
          font-family: 'Syne', sans-serif;
          font-size: 42px;
          font-weight: 700;
          color: var(--black);
          margin-bottom: 20px;
        }

        .cta p {
          font-size: 18px;
          color: var(--gray-500);
          margin-bottom: 40px;
        }

        .cta-form {
          display: flex;
          gap: 12px;
          max-width: 500px;
          margin: 0 auto;
        }

        .cta-form input {
          flex: 1;
          padding: 18px 24px;
          border: 2px solid var(--gray-200);
          border-radius: 14px;
          font-size: 16px;
          font-family: inherit;
          transition: all 0.3s ease;
        }

        .cta-form input:focus {
          outline: none;
          border-color: var(--yellow);
          box-shadow: 0 0 0 4px rgba(250, 204, 21, 0.15);
        }

        .cta-form button {
          padding: 18px 36px;
          background: var(--black);
          color: var(--white);
          border: none;
          border-radius: 14px;
          font-size: 16px;
          font-weight: 600;
          font-family: inherit;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .cta-form button:hover {
          background: var(--gray-800);
          transform: translateY(-2px);
        }

        /* ===== FOOTER ===== */
        footer {
          padding: 60px 48px;
          background: var(--gray-900);
          border-top: 1px solid var(--gray-800);
        }

        .footer-container {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .footer-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          font-family: 'Syne', sans-serif;
          font-size: 22px;
          font-weight: 700;
          color: var(--white);
        }

        .footer-logo .logo-icon {
          width: 32px;
          height: 32px;
        }

        .footer-links {
          display: flex;
          gap: 32px;
        }

        .footer-links a {
          color: var(--gray-400);
          text-decoration: none;
          font-size: 14px;
          transition: color 0.2s ease;
        }

        .footer-links a:hover {
          color: var(--white);
        }

        .footer-copy {
          font-size: 14px;
          color: var(--gray-500);
        }

        /* ===== ANIMATIONS ===== */
        @keyframes float {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        /* ===== RESPONSIVE ===== */
        @media (max-width: 1024px) {
          .step {
            grid-template-columns: 100px 1fr;
            gap: 40px;
          }

          .step-visual {
            display: none;
          }

          .steps-container::before {
            left: 50px;
          }

          .step-number {
            width: 100px;
            height: 100px;
            font-size: 40px;
          }

          .comparison-grid {
            grid-template-columns: 1fr;
            gap: 24px;
          }

          .comparison-arrow {
            transform: rotate(90deg);
          }

          .comparison-tasks {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 768px) {
          nav {
            padding: 16px 24px;
          }

          .nav-links {
            display: none;
          }

          .hero {
            padding: 120px 24px 80px;
          }

          .hero h1 {
            font-size: 36px;
          }

          .steps-section {
            padding: 60px 24px;
          }

          .step {
            grid-template-columns: 1fr;
            gap: 24px;
          }

          .steps-container::before {
            display: none;
          }

          .step-number-container {
            justify-self: start;
          }

          .step-number {
            width: 80px;
            height: 80px;
            font-size: 32px;
          }

          .step-content {
            padding: 28px;
          }

          .step-content h3 {
            font-size: 24px;
          }

          .comparison {
            padding: 60px 24px;
          }

          .comparison h2 {
            font-size: 32px;
          }

          .comparison-card h3 {
            font-size: 40px;
          }

          .comparison-tasks {
            grid-template-columns: 1fr;
          }

          .faq {
            padding: 60px 24px;
          }

          .faq-header h2 {
            font-size: 32px;
          }

          .cta {
            padding: 80px 24px;
          }

          .cta h2 {
            font-size: 32px;
          }

          .cta-form {
            flex-direction: column;
          }

          .footer-container {
            flex-direction: column;
            gap: 24px;
            text-align: center;
          }
        }
      `}</style>

      {/* Navigation */}
      <nav>
        <a href="index.html" className="logo">
          <div className="logo-icon">
            <svg viewBox="0 0 24 24">
              <path d="M13 3L4 14h7l-2 7 9-11h-7l2-7z" />
            </svg>
          </div>
          Spyke
        </a>
        <ul className="nav-links">
          <li>
            <a href="fonctionnalites.html">Fonctionnalités</a>
          </li>
          <li>
            <a href="comment-ca-marche.html" className="active">
              Comment ça marche
            </a>
          </li>
          <li>
            <a href="index.html#pricing">Tarifs</a>
          </li>
          <li>
            <a href="connexion.html" className="nav-cta">
              Commencer
            </a>
          </li>
        </ul>
      </nav>

      {/* Hero */}
      <section className="hero">
        <span className="hero-label">Comment ça marche</span>
        <h1>Opérationnel en 5 minutes, pas en 5 jours</h1>
        <p>
          Spyke est conçu pour être simple. Pas de formation, pas de configuration compliquée. Vous
          créez un compte et c&apos;est parti.
        </p>
      </section>

      {/* Steps */}
      <section className="steps-section">
        <div className="steps-container">
          {/* Step 1 */}
          <div className="step">
            <div className="step-number-container">
              <div className="step-number">1</div>
            </div>
            <div className="step-content">
              <div className="step-icon">📝</div>
              <h3>Créez votre compte</h3>
              <p>
                Inscription gratuite en 30 secondes. Aucune carte bancaire requise. Vous pouvez
                tester toutes les fonctionnalités pendant 14 jours.
              </p>
              <div className="step-details">
                <div className="step-detail">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>Email + mot de passe, c&apos;est tout</span>
                </div>
                <div className="step-detail">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>Pas de carte bancaire demandée</span>
                </div>
                <div className="step-detail">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>14 jours d&apos;essai gratuit</span>
                </div>
              </div>
            </div>
            <div className="step-visual">
              <img
                src="https://placehold.co/450x320/f4f4f5/a1a1aa?text=Inscription"
                alt="Inscription"
                className="step-image"
              />
              <div className="step-badge badge-1">
                <div className="step-badge-icon">⚡</div>
                30 secondes
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="step">
            <div className="step-number-container">
              <div className="step-number">2</div>
            </div>
            <div className="step-content">
              <div className="step-icon">⚙️</div>
              <h3>Personnalisez votre profil</h3>
              <p>
                Renseignez vos informations freelance : nom, SIRET, mentions légales. Spyke les
                utilisera automatiquement dans vos devis et documents.
              </p>
              <div className="step-details">
                <div className="step-detail">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>Vos infos pré-remplies partout</span>
                </div>
                <div className="step-detail">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>Mentions légales conformes</span>
                </div>
                <div className="step-detail">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>Logo et signature personnalisés</span>
                </div>
              </div>
            </div>
            <div className="step-visual">
              <img
                src="https://placehold.co/450x320/f4f4f5/a1a1aa?text=Profil"
                alt="Profil"
                className="step-image"
              />
              <div className="step-badge badge-2">
                <div className="step-badge-icon">✅</div>
                Configuration unique
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="step">
            <div className="step-number-container">
              <div className="step-number">3</div>
            </div>
            <div className="step-content">
              <div className="step-icon">👥</div>
              <h3>Ajoutez vos clients</h3>
              <p>
                Créez votre base clients en quelques clics. Vous pouvez aussi importer vos contacts
                existants. Chaque client aura sa fiche dédiée.
              </p>
              <div className="step-details">
                <div className="step-detail">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>Ajout manuel ou import CSV</span>
                </div>
                <div className="step-detail">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>Historique des échanges</span>
                </div>
                <div className="step-detail">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>Notes et tags personnalisés</span>
                </div>
              </div>
            </div>
            <div className="step-visual">
              <img
                src="https://placehold.co/450x320/f4f4f5/a1a1aa?text=Clients"
                alt="Clients"
                className="step-image"
              />
              <div className="step-badge badge-1">
                <div className="step-badge-icon">👥</div>
                Centralisé
              </div>
            </div>
          </div>

          {/* Step 4 */}
          <div className="step">
            <div className="step-number-container">
              <div className="step-number">4</div>
            </div>
            <div className="step-content">
              <div className="step-icon">🚀</div>
              <h3>Laissez l&apos;IA travailler</h3>
              <p>
                C&apos;est parti ! Générez des devis en 2 minutes, des emails en 30 secondes, analysez
                vos briefs instantanément. Vous venez de gagner des heures.
              </p>
              <div className="step-details">
                <div className="step-detail">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>Devis professionnels en 2 min</span>
                </div>
                <div className="step-detail">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>Emails générés par l&apos;IA</span>
                </div>
                <div className="step-detail">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>Relances automatiques</span>
                </div>
              </div>
            </div>
            <div className="step-visual">
              <img
                src="https://placehold.co/450x320/f4f4f5/a1a1aa?text=Dashboard"
                alt="Dashboard"
                className="step-image"
              />
              <div className="step-badge badge-2">
                <div className="step-badge-icon">⚡</div>
                10h/mois économisées
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Time Comparison */}
      <section className="comparison">
        <div className="comparison-container">
          <h2>Le temps, c&apos;est de l&apos;argent</h2>
          <p>Voici combien de temps vous allez gagner chaque semaine</p>

          <div className="comparison-grid">
            <div className="comparison-card before">
              <div className="comparison-card-label">Sans Spyke</div>
              <h3>5h+</h3>
              <p>par semaine en administratif</p>
            </div>

            <div className="comparison-arrow">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14" />
                <path d="M12 5l7 7-7 7" />
              </svg>
              <span>-80%</span>
            </div>

            <div className="comparison-card after">
              <div className="comparison-card-label">Avec Spyke</div>
              <h3>1h</h3>
              <p>par semaine en administratif</p>
            </div>
          </div>

          <div className="comparison-tasks">
            <div className="comparison-task">
              <div className="comparison-task-icon">📄</div>
              <h4>Créer un devis</h4>
              <div className="comparison-task-times">
                <span className="before">30 min</span>
                <span className="after">2 min</span>
              </div>
            </div>

            <div className="comparison-task">
              <div className="comparison-task-icon">✉️</div>
              <h4>Rédiger un email</h4>
              <div className="comparison-task-times">
                <span className="before">15 min</span>
                <span className="after">30 sec</span>
              </div>
            </div>

            <div className="comparison-task">
              <div className="comparison-task-icon">🔔</div>
              <h4>Relancer un client</h4>
              <div className="comparison-task-times">
                <span className="before">10 min</span>
                <span className="after">1 clic</span>
              </div>
            </div>

            <div className="comparison-task">
              <div className="comparison-task-icon">🔍</div>
              <h4>Analyser un brief</h4>
              <div className="comparison-task-times">
                <span className="before">20 min</span>
                <span className="after">10 sec</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="faq">
        <div className="faq-container">
          <div className="faq-header">
            <h2>Questions fréquentes</h2>
            <p>Tout ce que vous devez savoir pour bien démarrer</p>
          </div>

          <div className="faq-list">
            <div className="faq-item active">
              <div className="faq-question">
                Combien de temps pour prendre en main Spyke ?
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
              <div className="faq-answer">
                <div className="faq-answer-content">
                  5 minutes maximum. L&apos;interface est conçue pour être intuitive. Vous créez votre
                  compte, vous renseignez vos infos, et vous pouvez immédiatement créer votre
                  premier devis ou générer un email.
                </div>
              </div>
            </div>

            <div className="faq-item">
              <div className="faq-question">
                Est-ce que mes données sont sécurisées ?
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
              <div className="faq-answer">
                <div className="faq-answer-content">
                  Oui, toutes vos données sont chiffrées et hébergées en France. Nous sommes
                  conformes au RGPD et ne partageons jamais vos informations avec des tiers.
                </div>
              </div>
            </div>

            <div className="faq-item">
              <div className="faq-question">
                L&apos;IA génère-t-elle des textes de qualité ?
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
              <div className="faq-answer">
                <div className="faq-answer-content">
                  Spyke utilise l&apos;API Claude d&apos;Anthropic, l&apos;un des modèles IA les plus avancés.
                  Les emails et analyses générés sont professionnels, naturels et adaptés au
                  contexte français.
                </div>
              </div>
            </div>

            <div className="faq-item">
              <div className="faq-question">
                Puis-je annuler à tout moment ?
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
              <div className="faq-answer">
                <div className="faq-answer-content">
                  Bien sûr. Pas d&apos;engagement, pas de frais cachés. Vous pouvez annuler votre
                  abonnement en 2 clics depuis les paramètres. Vos données restent exportables.
                </div>
              </div>
            </div>

            <div className="faq-item">
              <div className="faq-question">
                Spyke fonctionne-t-il sur mobile ?
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
              <div className="faq-answer">
                <div className="faq-answer-content">
                  Oui, Spyke est une application web responsive. Vous pouvez créer un devis ou
                  générer un email depuis votre téléphone, où que vous soyez.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta">
        <div className="cta-container">
          <h2>Prêt à gagner du temps ?</h2>
          <p>
            Créez votre compte gratuitement et découvrez comment Spyke peut transformer votre
            quotidien.
          </p>
          <form
            className="cta-form"
            onSubmit={(e) => {
              e.preventDefault()
            }}
          >
            <input type="email" placeholder="Votre email professionnel" />
            <button type="submit">Essai gratuit</button>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer>
        <div className="footer-container">
          <div className="footer-logo">
            <div className="logo-icon">
              <svg viewBox="0 0 24 24">
                <path d="M13 3L4 14h7l-2 7 9-11h-7l2-7z" />
              </svg>
            </div>
            Spyke
          </div>
          <div className="footer-links">
            <a href="fonctionnalites.html">Fonctionnalités</a>
            <a href="comment-ca-marche.html">Comment ça marche</a>
            <a href="index.html#pricing">Tarifs</a>
            <a href="mentions-legales.html">Mentions légales</a>
            <a href="confidentialite.html">Confidentialité</a>
          </div>
          <p className="footer-copy">Spyke © 2025 – Votre assistant freelance intelligent</p>
        </div>
      </footer>
    </>
  )
}
