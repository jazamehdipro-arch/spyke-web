"use client"

export default function MentionsLegalesPage() {
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
          --gray-200: #e4e4e7;
          --gray-400: #a1a1aa;
          --gray-500: #71717a;
          --gray-600: #52525b;
          --gray-900: #18181b;
          --yellow: #facc15;
          --yellow-dark: #eab308;
        }

        body {
          font-family: 'DM Sans', -apple-system, sans-serif;
          background: var(--white);
          color: var(--gray-900);
          line-height: 1.7;
        }

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
        }

        .nav-links a:hover {
          color: var(--black);
        }

        .nav-cta {
          background: var(--black);
          color: var(--white) !important;
          padding: 12px 28px;
          border-radius: 50px;
          font-weight: 600;
        }

        .content {
          max-width: 700px;
          margin: 0 auto;
          padding: 140px 24px 80px;
        }

        .content h1 {
          font-family: 'Syne', sans-serif;
          font-size: 42px;
          font-weight: 700;
          color: var(--black);
          margin-bottom: 40px;
        }

        .content h2 {
          font-family: 'Syne', sans-serif;
          font-size: 20px;
          font-weight: 600;
          color: var(--black);
          margin-top: 32px;
          margin-bottom: 12px;
        }

        .content p {
          font-size: 16px;
          color: var(--gray-600);
          margin-bottom: 12px;
        }

        .content a {
          color: var(--yellow-dark);
          text-decoration: none;
        }

        .content a:hover {
          text-decoration: underline;
        }

        footer {
          padding: 60px 48px;
          background: var(--gray-900);
        }

        .footer-container {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 24px;
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
          flex-wrap: wrap;
          justify-content: center;
        }

        .footer-links a {
          color: var(--gray-400);
          text-decoration: none;
          font-size: 14px;
        }

        .footer-links a:hover {
          color: var(--white);
        }

        .footer-copy {
          font-size: 14px;
          color: var(--gray-500);
        }

        @media (max-width: 768px) {
          nav {
            padding: 16px 24px;
          }

          .nav-links {
            display: none;
          }

          .content {
            padding: 120px 20px 60px;
          }

          .content h1 {
            font-size: 32px;
          }

          .footer-container {
            flex-direction: column;
            gap: 24px;
            text-align: center;
          }
        }
      `}</style>

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
            <a href="comment-ca-marche.html">Comment ça marche</a>
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

      <main className="content">
        <h1>Mentions légales</h1>

        <h2>Éditeur</h2>
        <p>
          JAZA Mehdi – Auto-entrepreneur
          <br />
          SIRET : 929 238 566 00020
          <br />
          Contact : <a href="mailto:contact@spykeapp.fr">contact@spykeapp.fr</a>
        </p>

        <h2>Hébergement</h2>
        <p>
          Application : Vercel Inc. (USA)
          <br />
          Base de données : Supabase Inc. (Europe)
        </p>

        <h2>Propriété intellectuelle</h2>
        <p>
          Tout le contenu de ce site appartient à JAZA Mehdi. Reproduction interdite sans
          autorisation.
        </p>

        <h2>Données personnelles</h2>
        <p>
          Voir notre <a href="confidentialite.html">Politique de confidentialité</a>.
        </p>
      </main>

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

          <p className="footer-copy">Spyke © 2025</p>
        </div>
      </footer>
    </>
  )
}
