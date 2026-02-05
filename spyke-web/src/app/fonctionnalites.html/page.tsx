"use client"

export default function FonctionnalitesPage() {
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
          --gradient: linear-gradient(135deg, #facc15 0%, #f59e0b 100%);
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

        /* ===== FEATURE SECTIONS ===== */
        .feature-section {
          padding: 120px 48px;
          max-width: 1400px;
          margin: 0 auto;
        }

        .feature-section:nth-child(even) {
          background: var(--gray-50);
        }

        .feature-section:nth-child(even) .feature-grid {
          direction: rtl;
        }

        .feature-section:nth-child(even) .feature-grid > * {
          direction: ltr;
        }

        .feature-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 80px;
          align-items: center;
        }

        .feature-content {
          max-width: 520px;
        }

        .feature-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: var(--yellow-light);
          padding: 8px 16px;
          border-radius: 50px;
          font-size: 13px;
          font-weight: 600;
          color: var(--yellow-dark);
          margin-bottom: 24px;
        }

        .feature-badge svg {
          width: 16px;
          height: 16px;
        }

        .feature-content h2 {
          font-family: 'Syne', sans-serif;
          font-size: 42px;
          font-weight: 700;
          letter-spacing: -1px;
          color: var(--black);
          margin-bottom: 20px;
          line-height: 1.2;
        }

        .feature-content p {
          font-size: 18px;
          color: var(--gray-500);
          line-height: 1.8;
          margin-bottom: 32px;
        }

        .feature-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .feature-list-item {
          display: flex;
          align-items: flex-start;
          gap: 14px;
        }

        .feature-list-icon {
          width: 28px;
          height: 28px;
          background: var(--black);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          margin-top: 2px;
        }

        .feature-list-icon svg {
          width: 14px;
          height: 14px;
          stroke: var(--yellow);
          fill: none;
          stroke-width: 3;
        }

        .feature-list-item span {
          font-size: 16px;
          color: var(--gray-700);
          line-height: 1.6;
        }

        .feature-visual {
          position: relative;
        }

        .feature-image {
          width: 100%;
          border-radius: 24px;
          box-shadow: 0 40px 80px rgba(0, 0, 0, 0.1);
          border: 1px solid var(--gray-200);
        }

        .feature-floating-card {
          position: absolute;
          background: var(--white);
          border-radius: 16px;
          padding: 20px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.12);
          animation: float 3s ease-in-out infinite;
        }

        .feature-floating-card.card-1 {
          top: -20px;
          right: -20px;
        }

        .feature-floating-card.card-2 {
          bottom: 40px;
          left: -30px;
          animation-delay: 1.5s;
        }

        .floating-stat {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .floating-stat-icon {
          width: 44px;
          height: 44px;
          background: var(--yellow-light);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
        }

        .floating-stat-text h4 {
          font-family: 'Syne', sans-serif;
          font-size: 20px;
          font-weight: 700;
          color: var(--black);
        }

        .floating-stat-text p {
          font-size: 13px;
          color: var(--gray-500);
          margin: 0;
        }

        /* ===== ALL FEATURES GRID ===== */
        .all-features {
          padding: 120px 48px;
          background: var(--black);
        }

        .all-features-container {
          max-width: 1200px;
          margin: 0 auto;
        }

        .all-features .section-header {
          text-align: center;
          margin-bottom: 60px;
        }

        .all-features .section-header h2 {
          font-family: 'Syne', sans-serif;
          font-size: 42px;
          font-weight: 700;
          color: var(--white);
          margin-bottom: 16px;
        }

        .all-features .section-header p {
          font-size: 18px;
          color: var(--gray-400);
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
        }

        .feature-card {
          background: var(--gray-900);
          border-radius: 20px;
          padding: 32px;
          border: 1px solid var(--gray-800);
          transition: all 0.3s ease;
        }

        .feature-card:hover {
          border-color: var(--yellow);
          transform: translateY(-8px);
        }

        .feature-card-icon {
          width: 56px;
          height: 56px;
          background: var(--gray-800);
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 20px;
          font-size: 24px;
        }

        .feature-card h3 {
          font-family: 'Syne', sans-serif;
          font-size: 20px;
          font-weight: 600;
          color: var(--white);
          margin-bottom: 12px;
        }

        .feature-card p {
          font-size: 15px;
          color: var(--gray-400);
          line-height: 1.7;
        }

        /* ===== CTA ===== */
        .cta {
          padding: 120px 48px;
          background: var(--gray-50);
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

        .cta-buttons {
          display: flex;
          gap: 16px;
          justify-content: center;
        }

        .btn {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 18px 36px;
          border-radius: 14px;
          font-size: 16px;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.3s ease;
          border: none;
          cursor: pointer;
        }

        .btn-primary {
          background: var(--black);
          color: var(--white);
        }

        .btn-primary:hover {
          background: var(--gray-800);
          transform: translateY(-2px);
        }

        .btn-secondary {
          background: var(--white);
          color: var(--black);
          border: 2px solid var(--gray-200);
        }

        .btn-secondary:hover {
          border-color: var(--gray-300);
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
            transform: translateY(-15px);
          }
        }

        /* ===== RESPONSIVE ===== */
        @media (max-width: 1024px) {
          .feature-grid {
            grid-template-columns: 1fr;
            gap: 60px;
          }

          .feature-section:nth-child(even) .feature-grid {
            direction: ltr;
          }

          .feature-content {
            max-width: 100%;
          }

          .features-grid {
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

          .feature-section {
            padding: 80px 24px;
          }

          .feature-content h2 {
            font-size: 32px;
          }

          .features-grid {
            grid-template-columns: 1fr;
          }

          .all-features .section-header h2 {
            font-size: 32px;
          }

          .cta h2 {
            font-size: 32px;
          }

          .cta-buttons {
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
            <a href="fonctionnalites.html" className="active">
              Fonctionnalités
            </a>
          </li>
          <li>
            <a href="index.html#how">Comment ça marche</a>
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
        <span className="hero-label">Fonctionnalités</span>
        <h1>Tout ce qu&apos;il vous faut pour automatiser votre quotidien</h1>
        <p>
          Découvrez les outils qui vont transformer votre façon de gérer vos missions freelance.
        </p>
      </section>

      {/* Feature 1: Assistant IA */}
      <section className="feature-section">
        <div className="feature-grid">
          <div className="feature-content">
            <div className="feature-badge">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              </svg>
              Assistant IA
            </div>
            <h2>Des emails parfaits en quelques secondes</h2>
            <p>
              Fini les heures passées à rédiger des emails. L&apos;IA génère des messages professionnels
              adaptés à chaque situation et à chaque client.
            </p>
            <div className="feature-list">
              <div className="feature-list-item">
                <div className="feature-list-icon">
                  <svg viewBox="0 0 24 24">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <span>10 types d&apos;emails : réponse, relance, devis, facture, négociation...</span>
              </div>

              <div className="feature-list-item">
                <div className="feature-list-icon">
                  <svg viewBox="0 0 24 24">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <span>Choix du ton : professionnel, chaleureux, formel ou décontracté</span>
              </div>

              <div className="feature-list-item">
                <div className="feature-list-icon">
                  <svg viewBox="0 0 24 24">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <span>Personnalisation automatique selon le contexte client</span>
              </div>
            </div>
          </div>

          <div className="feature-visual">
            <img
              src="https://placehold.co/600x450/f4f4f5/a1a1aa?text=Assistant+IA"
              alt="Assistant IA"
              className="feature-image"
            />
            <div className="feature-floating-card card-1">
              <div className="floating-stat">
                <div className="floating-stat-icon">⚡</div>
                <div className="floating-stat-text">
                  <h4>30 sec</h4>
                  <p>pour un email parfait</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature 2: Devis */}
      <section className="feature-section">
        <div className="feature-grid">
          <div className="feature-content">
            <div className="feature-badge">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <path d="M14 2v6h6" />
              </svg>
              Générateur de devis
            </div>
            <h2>Des devis professionnels en 2 minutes</h2>
            <p>
              Créez des devis conformes aux normes françaises avec calculs automatiques. Plus besoin
              d&apos;Excel ou de templates Word.
            </p>
            <div className="feature-list">
              <div className="feature-list-item">
                <div className="feature-list-icon">
                  <svg viewBox="0 0 24 24">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <span>Calculs automatiques : HT, TVA, TTC, acompte</span>
              </div>

              <div className="feature-list-item">
                <div className="feature-list-icon">
                  <svg viewBox="0 0 24 24">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <span>Export PDF professionnel avec vos mentions légales</span>
              </div>

              <div className="feature-list-item">
                <div className="feature-list-icon">
                  <svg viewBox="0 0 24 24">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <span>Numérotation automatique et suivi des statuts</span>
              </div>
            </div>
          </div>

          <div className="feature-visual">
            <img
              src="https://placehold.co/600x450/f4f4f5/a1a1aa?text=G%C3%A9n%C3%A9rateur+Devis"
              alt="Générateur de devis"
              className="feature-image"
            />
            <div className="feature-floating-card card-2">
              <div className="floating-stat">
                <div className="floating-stat-icon">📄</div>
                <div className="floating-stat-text">
                  <h4>PDF prêt</h4>
                  <p>en 1 clic</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature 3: Analyseur */}
      <section className="feature-section">
        <div className="feature-grid">
          <div className="feature-content">
            <div className="feature-badge">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              Analyseur de projet
            </div>
            <h2>Évaluez vos projets avant de vous engager</h2>
            <p>
              Collez le brief d&apos;un client et laissez l&apos;IA analyser la faisabilité, les points
              d&apos;attention et vous donner une recommandation claire.
            </p>
            <div className="feature-list">
              <div className="feature-list-item">
                <div className="feature-list-icon">
                  <svg viewBox="0 0 24 24">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <span>Score de clarté du brief client</span>
              </div>

              <div className="feature-list-item">
                <div className="feature-list-icon">
                  <svg viewBox="0 0 24 24">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <span>Détection des points d&apos;attention et red flags</span>
              </div>

              <div className="feature-list-item">
                <div className="feature-list-icon">
                  <svg viewBox="0 0 24 24">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <span>Recommandation : accepter, négocier ou refuser</span>
              </div>
            </div>
          </div>

          <div className="feature-visual">
            <img
              src="https://placehold.co/600x450/f4f4f5/a1a1aa?text=Analyseur+Projet"
              alt="Analyseur de projet"
              className="feature-image"
            />
            <div className="feature-floating-card card-1">
              <div className="floating-stat">
                <div className="floating-stat-icon">✅</div>
                <div className="floating-stat-text">
                  <h4>Go / No Go</h4>
                  <p>en 10 secondes</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature 4: Gestion clients */}
      <section className="feature-section">
        <div className="feature-grid">
          <div className="feature-content">
            <div className="feature-badge">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                <circle cx="9" cy="7" r="4" />
              </svg>
              Gestion clients
            </div>
            <h2>Tous vos clients au même endroit</h2>
            <p>
              Centralisez les informations de vos clients, leur historique et leurs documents. Plus
              jamais de "c&apos;était dans quel email déjà ?"
            </p>
            <div className="feature-list">
              <div className="feature-list-item">
                <div className="feature-list-icon">
                  <svg viewBox="0 0 24 24">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <span>Fiche client complète : contact, notes, historique</span>
              </div>

              <div className="feature-list-item">
                <div className="feature-list-icon">
                  <svg viewBox="0 0 24 24">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <span>Suivi du CA généré par client</span>
              </div>

              <div className="feature-list-item">
                <div className="feature-list-icon">
                  <svg viewBox="0 0 24 24">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <span>Accès rapide aux devis et documents associés</span>
              </div>
            </div>
          </div>

          <div className="feature-visual">
            <img
              src="https://placehold.co/600x450/f4f4f5/a1a1aa?text=Gestion+Clients"
              alt="Gestion clients"
              className="feature-image"
            />
            <div className="feature-floating-card card-2">
              <div className="floating-stat">
                <div className="floating-stat-icon">👥</div>
                <div className="floating-stat-text">
                  <h4>Tout en 1</h4>
                  <p>fini les fichiers Excel</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* All Features Grid */}
      <section className="all-features">
        <div className="all-features-container">
          <div className="section-header">
            <h2>Et bien plus encore...</h2>
            <p>Des fonctionnalités pensées pour vous faire gagner du temps</p>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-card-icon">🔔</div>
              <h3>Relances automatiques</h3>
              <p>
                Recevez des suggestions de relance quand un devis reste sans réponse trop longtemps.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-card-icon">📊</div>
              <h3>Dashboard intelligent</h3>
              <p>Visualisez votre CA, vos devis en attente et votre activité en un coup d&apos;œil.</p>
            </div>

            <div className="feature-card">
              <div className="feature-card-icon">🎨</div>
              <h3>Templates personnalisés</h3>
              <p>
                Créez vos propres modèles de devis et d&apos;emails pour aller encore plus vite.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-card-icon">🔒</div>
              <h3>Données sécurisées</h3>
              <p>Vos données sont chiffrées et hébergées en France. RGPD compliant.</p>
            </div>

            <div className="feature-card">
              <div className="feature-card-icon">📱</div>
              <h3>Accès mobile</h3>
              <p>Créez un devis depuis votre téléphone, n&apos;importe où, n&apos;importe quand.</p>
            </div>

            <div className="feature-card">
              <div className="feature-card-icon">🇫🇷</div>
              <h3>100% français</h3>
              <p>Interface en français, mentions légales françaises, support en français.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta">
        <div className="cta-container">
          <h2>Prêt à automatiser votre quotidien ?</h2>
          <p>Rejoignez les freelances qui gagnent des heures chaque semaine grâce à Spyke.</p>
          <div className="cta-buttons">
            <a href="connexion.html" className="btn btn-primary">
              Essai gratuit 14 jours
            </a>
            <a href="index.html#pricing" className="btn btn-secondary">
              Voir les tarifs
            </a>
          </div>
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
