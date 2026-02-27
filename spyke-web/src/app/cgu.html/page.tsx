"use client"

export default function CguPage() {
  const updatedAt = '27/02/2026'

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
          --gray-400: #a1a1aa;
          --gray-500: #71717a;
          --gray-600: #52525b;
          --gray-700: #3f3f46;
          --gray-800: #27272a;
          --gray-900: #18181b;
          --yellow: #facc15;
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
          gap: 28px;
          list-style: none;
        }

        .nav-links a {
          text-decoration: none;
          color: var(--gray-600);
          font-size: 15px;
          font-weight: 600;
        }

        .container {
          max-width: 900px;
          margin: 0 auto;
          padding: 130px 18px 80px;
        }

        h1 {
          font-family: 'Syne', sans-serif;
          font-size: 44px;
          letter-spacing: -1px;
          line-height: 1.1;
          margin-bottom: 10px;
        }

        .meta {
          color: var(--gray-500);
          font-size: 14px;
          margin-bottom: 28px;
        }

        .card {
          border: 1px solid var(--gray-200);
          border-radius: 16px;
          padding: 22px;
          background: var(--white);
        }

        h2 {
          font-size: 18px;
          margin-top: 22px;
          margin-bottom: 10px;
        }

        p {
          color: var(--gray-800);
          margin-bottom: 10px;
        }

        ul {
          padding-left: 18px;
          color: var(--gray-800);
          margin: 10px 0 14px;
        }

        a {
          color: inherit;
        }

        footer {
          border-top: 1px solid var(--gray-200);
          padding: 26px 18px;
          color: var(--gray-500);
          font-size: 13px;
          text-align: center;
        }

        @media (max-width: 768px) {
          nav {
            padding: 16px 18px;
          }
          h1 {
            font-size: 34px;
          }
          .nav-links {
            display: none;
          }
        }
      `}</style>

      <nav>
        <a href="/" className="logo">
          <div className="logo-icon">
            <svg viewBox="0 0 24 24">
              <path d="M13 3L4 14h7l-2 7 9-11h-7l2-7z" />
            </svg>
          </div>
          Spyke
        </a>
        <ul className="nav-links">
          <li>
            <a href="/mentions-legales.html">Mentions légales</a>
          </li>
          <li>
            <a href="/confidentialite.html">Confidentialité</a>
          </li>
        </ul>
      </nav>

      <main className="container">
        <h1>Conditions Générales d’Utilisation (CGU)</h1>
        <div className="meta">Dernière mise à jour : {updatedAt}</div>

        <div className="card">
          <p>
            Les présentes Conditions Générales d’Utilisation (les « CGU ») encadrent l’accès et l’utilisation de la
            plateforme Spyke (le « Service »).
          </p>
          <p>
            En utilisant Spyke, vous acceptez ces CGU. Si vous n’acceptez pas, n’utilisez pas le Service.
          </p>

          <h2>1. Objet du Service</h2>
          <p>
            Spyke propose des fonctionnalités d’aide à la rédaction et à la génération de contenus destinés aux freelances
            (ex. emails, devis, factures, contrats), ainsi que des fonctionnalités optionnelles (ex. question juriste).
          </p>

          <h2>2. Création de compte</h2>
          <p>
            Certaines fonctionnalités nécessitent la création d’un compte. Vous vous engagez à fournir des informations
            exactes et à maintenir la confidentialité de vos identifiants.
          </p>

          <h2>3. Utilisation acceptable</h2>
          <ul>
            <li>Vous vous engagez à ne pas utiliser le Service à des fins illégales, frauduleuses ou malveillantes.</li>
            <li>Vous ne devez pas tenter de contourner les limites, protections ou mesures de sécurité du Service.</li>
            <li>Vous restez responsable des contenus que vous saisissez et de ceux que vous envoyez à des tiers.</li>
          </ul>

          <h2>4. Contenus générés & responsabilité</h2>
          <p>
            Le Service peut générer des textes automatiquement. Ces contenus sont fournis à titre d’assistance et doivent
            être relus et validés par vous avant utilisation (envoi à un client, signature, émission de documents, etc.).
          </p>
          <p>
            Spyke ne garantit pas l’exactitude, l’exhaustivité ni l’adéquation juridique/fiscale des contenus générés.
          </p>

          <h2>5. Fonction « Question juriste »</h2>
          <p>
            Lorsque cette fonctionnalité est utilisée, votre question est transmise à un juriste. La réponse est fournie
            selon le délai indiqué dans l’interface (objectif « moins de 24h »).
          </p>
          <p>
            Si vous renseignez un numéro de téléphone, vous acceptez qu’un juriste puisse vous contacter si nécessaire.
          </p>

          <h2>6. Facturation</h2>
          <p>
            Certaines fonctionnalités peuvent être payantes (ex. abonnement Pro, paiement à l’acte). Les prix applicables
            sont ceux affichés au moment de l’achat.
          </p>

          <h2>7. Disponibilité</h2>
          <p>
            Le Service est fourni « en l’état » et peut être interrompu pour maintenance, mises à jour ou incidents.
          </p>

          <h2>8. Données personnelles</h2>
          <p>
            Le traitement des données personnelles est décrit dans la{' '}
            <a href="/confidentialite.html">Politique de confidentialité</a>.
          </p>

          <h2>9. Propriété intellectuelle</h2>
          <p>
            Spyke, ses marques, logos, éléments graphiques et logiciels sont protégés. Toute reproduction non autorisée est
            interdite.
          </p>

          <h2>10. Modification des CGU</h2>
          <p>
            Nous pouvons faire évoluer les CGU. La version applicable est celle publiée sur cette page à la date de votre
            utilisation.
          </p>

          <h2>11. Contact</h2>
          <p>
            Pour toute question, vous pouvez nous contacter via les informations disponibles dans les{' '}
            <a href="/mentions-legales.html">Mentions légales</a>.
          </p>
        </div>
      </main>

      <footer>Spyke — CGU</footer>
    </>
  )
}
