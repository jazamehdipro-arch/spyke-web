"use client"

import Link from 'next/link'

export default function Home() {
  return (
    <>
      <style jsx global>{`
        :root {
          --bg-primary: #0a0a0f;
          --bg-secondary: #12121a;
          --bg-card: #1a1a25;
          --bg-input: #0f0f18;
          --violet-primary: #8b5cf6;
          --violet-glow: #a78bfa;
          --cyan-accent: #22d3ee;
          --cyan-glow: #67e8f9;
          --text-primary: #f1f5f9;
          --text-secondary: #94a3b8;
          --text-muted: #64748b;
          --border-color: #2a2a3a;
          --success: #10b981;
          --warning: #f59e0b;
          --error: #ef4444;
        }

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        html {
          scroll-behavior: smooth;
        }

        body {
          font-family:
            ui-sans-serif,
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            'Segoe UI',
            Roboto,
            'Helvetica Neue',
            Arial,
            'Noto Sans',
            'Apple Color Emoji',
            'Segoe UI Emoji',
            'Segoe UI Symbol';
          background: var(--bg-primary);
          min-height: 100vh;
          color: var(--text-primary);
          overflow-x: hidden;
        }

        a {
          color: inherit;
        }

        .bg-grid {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-image:
            linear-gradient(rgba(139, 92, 246, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(139, 92, 246, 0.03) 1px, transparent 1px);
          background-size: 50px 50px;
          pointer-events: none;
          z-index: 0;
        }

        .glow-orb {
          position: fixed;
          border-radius: 50%;
          filter: blur(120px);
          pointer-events: none;
          z-index: 0;
        }

        .glow-orb-1 {
          width: 520px;
          height: 520px;
          top: -220px;
          right: -120px;
          background: var(--violet-primary);
          opacity: 0.12;
        }

        .glow-orb-2 {
          width: 420px;
          height: 420px;
          bottom: -220px;
          left: -120px;
          background: var(--cyan-accent);
          opacity: 0.08;
        }

        /* ===== Layout ===== */
        .container {
          width: 100%;
          max-width: 1120px;
          margin: 0 auto;
          padding: 0 20px;
        }

        /* ===== Header ===== */
        .header {
          position: sticky;
          top: 0;
          z-index: 50;
          border-bottom: 1px solid var(--border-color);
          background: rgba(10, 10, 15, 0.8);
          backdrop-filter: blur(20px);
        }

        .header-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 0;
        }

        .logo {
          display: flex;
          align-items: center;
          gap: 12px;
          text-decoration: none;
        }

        .logo-icon {
          width: 40px;
          height: 40px;
          background: linear-gradient(135deg, var(--violet-primary), var(--cyan-accent));
          border-radius: 12px;
        }

        .logo-text {
          font-size: 22px;
          font-weight: 800;
          letter-spacing: -0.4px;
          background: linear-gradient(135deg, var(--violet-glow), var(--cyan-accent));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .nav {
          display: flex;
          align-items: center;
          gap: 18px;
        }

        .nav a {
          text-decoration: none;
          color: var(--text-secondary);
          font-size: 14px;
          font-weight: 600;
          padding: 10px 12px;
          border-radius: 10px;
          transition: all 0.2s ease;
        }

        .nav a:hover {
          color: var(--text-primary);
          background: rgba(139, 92, 246, 0.08);
        }

        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 12px 16px;
          border-radius: 12px;
          font-weight: 700;
          font-size: 14px;
          text-decoration: none;
          border: 1px solid var(--border-color);
          background: var(--bg-card);
          color: var(--text-primary);
          transition: all 0.2s ease;
        }

        .btn:hover {
          transform: translateY(-1px);
          border-color: rgba(139, 92, 246, 0.6);
          box-shadow: 0 12px 40px rgba(139, 92, 246, 0.12);
        }

        .btn-accent {
          border: none;
          background: linear-gradient(135deg, var(--violet-primary), var(--cyan-accent));
          color: white;
        }

        .btn-accent:hover {
          box-shadow: 0 14px 50px rgba(139, 92, 246, 0.25);
        }

        /* ===== Hero ===== */
        .hero {
          position: relative;
          z-index: 10;
          padding: 72px 0 36px;
        }

        .hero-grid {
          display: grid;
          grid-template-columns: 1.05fr 0.95fr;
          gap: 42px;
          align-items: center;
        }

        .badge {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 8px 12px;
          border-radius: 999px;
          border: 1px solid var(--border-color);
          background: rgba(18, 18, 26, 0.6);
          color: var(--text-secondary);
          font-size: 13px;
          font-weight: 600;
        }

        .badge strong {
          color: var(--violet-glow);
        }

        .hero h1 {
          margin-top: 18px;
          font-size: 54px;
          line-height: 1.08;
          letter-spacing: -1.5px;
          font-weight: 900;
        }

        .gradient {
          background: linear-gradient(135deg, var(--violet-glow), var(--cyan-accent));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .hero p {
          margin-top: 18px;
          font-size: 18px;
          line-height: 1.75;
          color: var(--text-secondary);
          max-width: 52ch;
        }

        .hero-cta {
          margin-top: 26px;
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .social-proof {
          margin-top: 18px;
          font-size: 12px;
          color: var(--text-muted);
        }

        .panel {
          border: 1px solid var(--border-color);
          background: rgba(26, 26, 37, 0.6);
          border-radius: 18px;
          padding: 18px;
          box-shadow: 0 30px 80px rgba(0, 0, 0, 0.35);
        }

        .panel-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 14px;
          color: var(--text-secondary);
          font-size: 13px;
          font-weight: 600;
        }

        .panel-top .dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: var(--success);
          box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.12);
        }

        .panel-item {
          padding: 14px;
          border-radius: 14px;
          border: 1px solid rgba(255, 255, 255, 0.06);
          background: rgba(15, 15, 24, 0.6);
          margin-bottom: 10px;
        }

        .panel-item:last-child {
          margin-bottom: 0;
        }

        .panel-item h4 {
          font-size: 13px;
          color: var(--text-secondary);
          margin-bottom: 6px;
          font-weight: 700;
        }

        .panel-item p {
          font-size: 13px;
          line-height: 1.6;
          color: var(--text-primary);
        }

        .kbd {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: 12px;
          padding: 2px 8px;
          border-radius: 8px;
          background: rgba(139, 92, 246, 0.16);
          border: 1px solid rgba(139, 92, 246, 0.35);
          color: var(--violet-glow);
        }

        /* ===== Section shared ===== */
        .section {
          position: relative;
          z-index: 10;
          padding: 66px 0;
        }

        .section-header {
          margin-bottom: 26px;
        }

        .section-header h2 {
          font-size: 34px;
          letter-spacing: -0.7px;
          font-weight: 900;
        }

        .section-header p {
          margin-top: 10px;
          color: var(--text-secondary);
          font-size: 15px;
          line-height: 1.7;
          max-width: 70ch;
        }

        .grid-3 {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
        }

        .card {
          border: 1px solid var(--border-color);
          background: rgba(26, 26, 37, 0.55);
          border-radius: 18px;
          padding: 18px;
        }

        .card h3 {
          font-size: 16px;
          margin-top: 10px;
          font-weight: 900;
        }

        .card p {
          margin-top: 10px;
          font-size: 14px;
          color: var(--text-secondary);
          line-height: 1.7;
        }

        .icon {
          width: 44px;
          height: 44px;
          border-radius: 14px;
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(34, 211, 238, 0.2));
          border: 1px solid rgba(167, 139, 250, 0.35);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 900;
          color: var(--text-primary);
        }

        /* ===== Pricing ===== */
        .pricing-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 14px;
          margin-top: 18px;
        }

        .price {
          font-size: 42px;
          font-weight: 950;
          letter-spacing: -1px;
          margin-top: 10px;
        }

        .price span {
          font-size: 14px;
          color: var(--text-muted);
          font-weight: 700;
          margin-left: 8px;
        }

        .ul {
          margin-top: 14px;
          list-style: none;
          display: grid;
          gap: 10px;
        }

        .ul li {
          display: flex;
          gap: 10px;
          align-items: flex-start;
          color: var(--text-secondary);
          font-size: 14px;
          line-height: 1.55;
        }

        .check {
          width: 18px;
          height: 18px;
          border-radius: 6px;
          background: rgba(16, 185, 129, 0.12);
          border: 1px solid rgba(16, 185, 129, 0.35);
          flex: 0 0 18px;
          margin-top: 2px;
        }

        /* ===== Footer ===== */
        .footer {
          border-top: 1px solid var(--border-color);
          padding: 26px 0;
          position: relative;
          z-index: 10;
          color: var(--text-muted);
          font-size: 12px;
        }

        .footer-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
        }

        .footer a {
          color: var(--text-secondary);
          text-decoration: none;
        }

        .footer a:hover {
          color: var(--text-primary);
        }

        /* ===== Responsive ===== */
        @media (max-width: 960px) {
          .hero-grid {
            grid-template-columns: 1fr;
          }

          .hero h1 {
            font-size: 44px;
          }

          .grid-3 {
            grid-template-columns: 1fr;
          }

          .pricing-grid {
            grid-template-columns: 1fr;
          }

          .nav .hide-sm {
            display: none;
          }
        }

        @media (max-width: 520px) {
          .hero {
            padding-top: 54px;
          }
          .hero h1 {
            font-size: 38px;
          }
          .btn {
            width: 100%;
          }
          .hero-cta {
            flex-direction: column;
          }
        }
      `}</style>

      <div className="bg-grid" />
      <div className="glow-orb glow-orb-1" />
      <div className="glow-orb glow-orb-2" />

      <header className="header">
        <div className="container">
          <div className="header-inner">
            <Link href="/" className="logo" aria-label="Spyke">
              <div className="logo-icon" aria-hidden />
              <div className="logo-text">Spyke</div>
            </Link>

            <nav className="nav" aria-label="Navigation">
              <a className="hide-sm" href="#features">
                Fonctionnalités
              </a>
              <a className="hide-sm" href="#pricing">
                Tarifs
              </a>
              <Link href="/login" className="btn">
                Se connecter
              </Link>
              <Link href="/login" className="btn btn-accent">
                Commencer
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="container">
            <div className="hero-grid">
              <div>
                <div className="badge">
                  <strong>Beta</strong>
                  <span>Assistant IA pour freelances</span>
                </div>

                <h1>
                  Moins d&apos;admin.
                  <br />
                  <span className="gradient">Plus de missions.</span>
                </h1>

                <p>
                  Spyke génère des emails pro, des devis clairs et analyse vos briefs en quelques
                  secondes — tout en gardant votre ton.
                </p>

                <div className="hero-cta">
                  <Link href="/login" className="btn btn-accent">
                    Commencer gratuitement
                  </Link>
                  <a href="#pricing" className="btn">
                    Voir les tarifs
                  </a>
                  <Link href="/app" className="btn">
                    Ouvrir l&apos;outil
                  </Link>
                </div>

                <div className="social-proof">
                  Astuce : décrivez la situation, ajoutez un contexte (ex: <span className="kbd">urgent</span>
                  ) et laissez Spyke proposer une réponse.
                </div>
              </div>

              <aside className="panel" aria-label="Aperçu">
                <div className="panel-top">
                  <span>Exemples de résultats</span>
                  <span className="dot" aria-hidden />
                </div>

                <div className="panel-item">
                  <h4>Email de relance</h4>
                  <p>
                    « Bonjour, je reviens vers vous concernant le devis envoyé lundi. Souhaitez-vous
                    que l’on cale un créneau de 10 minutes pour valider le périmètre ? »
                  </p>
                </div>

                <div className="panel-item">
                  <h4>Devis</h4>
                  <p>
                    Prestations + jours + TJM → total HT/TVA/TTC + acompte. Export PDF prêt à
                    envoyer.
                  </p>
                </div>

                <div className="panel-item">
                  <h4>Analyse de brief</h4>
                  <p>
                    Score de clarté, risques, questions à poser, recommandation (accepter / négocier
                    / refuser).
                  </p>
                </div>
              </aside>
            </div>
          </div>
        </section>

        <section className="section" id="features">
          <div className="container">
            <div className="section-header">
              <h2>Tout ce qu’il faut pour livrer plus vite</h2>
              <p>
                Des briques simples, pensées freelance. Pas une usine à gaz : vous gagnez du temps,
                vous gardez le contrôle.
              </p>
            </div>

            <div className="grid-3">
              <div className="card">
                <div className="icon" aria-hidden>
                  ✉
                </div>
                <h3>Emails IA personnalisés</h3>
                <p>
                  Réponse, relance, négociation, suivi : Spyke écrit avec votre ton et s’adapte au
                  contexte.
                </p>
              </div>

              <div className="card">
                <div className="icon" aria-hidden>
                  📄
                </div>
                <h3>Devis professionnels</h3>
                <p>
                  Prestations, jours, TJM, TVA, acompte, validité : un devis clair et exportable.
                </p>
              </div>

              <div className="card">
                <div className="icon" aria-hidden>
                  🔎
                </div>
                <h3>Analyse de briefs</h3>
                <p>
                  Identifiez les flous, les risques, et obtenez une liste de questions à poser avant
                  de signer.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="section" id="pricing">
          <div className="container">
            <div className="section-header">
              <h2>Tarifs</h2>
              <p>Simple, sans surprise. Le paiement peut être activé plus tard (v1).</p>
            </div>

            <div className="pricing-grid">
              <div className="card">
                <h3>Gratuit</h3>
                <p>Pour découvrir Spyke.</p>
                <div className="price">
                  0€<span>/mois</span>
                </div>
                <ul className="ul">
                  <li>
                    <span className="check" aria-hidden /> 10 générations IA / mois
                  </li>
                  <li>
                    <span className="check" aria-hidden /> 3 clients max
                  </li>
                  <li>
                    <span className="check" aria-hidden /> Devis basiques
                  </li>
                </ul>
                <div style={{ marginTop: 16 }}>
                  <Link href="/login" className="btn" style={{ width: '100%' }}>
                    Commencer
                  </Link>
                </div>
              </div>

              <div className="card" style={{ borderColor: 'rgba(139, 92, 246, 0.55)' }}>
                <h3>Pro</h3>
                <p>Pour les freelances sérieux.</p>
                <div className="price">
                  19€<span>/mois</span>
                </div>
                <ul className="ul">
                  <li>
                    <span className="check" aria-hidden /> Générations illimitées
                  </li>
                  <li>
                    <span className="check" aria-hidden /> Clients illimités
                  </li>
                  <li>
                    <span className="check" aria-hidden /> Devis personnalisés
                  </li>
                  <li>
                    <span className="check" aria-hidden /> Relances suggérées
                  </li>
                </ul>
                <div style={{ marginTop: 16 }}>
                  <Link href="/login" className="btn btn-accent" style={{ width: '100%' }}>
                    Essai gratuit 14 jours
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="container">
            <div className="card" style={{ textAlign: 'center' }}>
              <h3 style={{ fontSize: 22, letterSpacing: '-0.4px' }}>Prêt à gagner du temps ?</h3>
              <p style={{ marginTop: 10 }}>
                Connectez-vous et testez Spyke sur un vrai email client dès maintenant.
              </p>
              <div
                style={{
                  marginTop: 16,
                  display: 'flex',
                  gap: 12,
                  justifyContent: 'center',
                  flexWrap: 'wrap',
                }}
              >
                <Link href="/login" className="btn btn-accent">
                  Commencer
                </Link>
                <Link href="/app" className="btn">
                  Ouvrir l&apos;outil
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="container">
          <div className="footer-inner">
            <div>Spyke © 2025 – Votre assistant freelance intelligent</div>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              <a href="#features">Fonctionnalités</a>
              <a href="#pricing">Tarifs</a>
              <Link href="/login">Login</Link>
            </div>
          </div>
        </div>
      </footer>
    </>
  )
}
