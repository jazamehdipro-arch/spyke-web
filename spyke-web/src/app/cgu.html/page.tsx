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
            <a href="mailto:contact@spykeapp.fr">Contact</a>
          </li>
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
            En utilisant Spyke, vous reconnaissez avoir pris connaissance des CGU et les accepter. Si vous n’acceptez pas
            ces CGU, n’utilisez pas le Service.
          </p>

          <h2>1. Éditeur du Service</h2>
          <p>
            Le Service est édité par <b>JAZA Mehdi</b> (Auto-entrepreneur) – SIRET : <b>929 238 566 00020</b>.
            <br />
            Contact : <a href="mailto:contact@spykeapp.fr">contact@spykeapp.fr</a>.
            <br />
            Pour plus d’informations, voir les <a href="/mentions-legales.html">Mentions légales</a>.
          </p>

          <h2>2. Définitions (extraits)</h2>
          <ul>
            <li>
              <b>Utilisateur</b> : toute personne créant un compte ou utilisant le Service.
            </li>
            <li>
              <b>Compte</b> : espace personnel permettant d’accéder aux fonctionnalités (clients, devis, factures, contrats,
              emails, etc.).
            </li>
            <li>
              <b>Contenu Utilisateur</b> : informations et contenus saisis/importés par l’Utilisateur (données clients,
              lignes, PDF importés, etc.).
            </li>
            <li>
              <b>Documents</b> : devis, factures, contrats et tout PDF généré via le Service.
            </li>
            <li>
              <b>Abonnement</b> : accès payant (ex. Pro) décrit sur la page <a href="/tarifs.html">Tarifs</a>.
            </li>
          </ul>

          <h2>3. À qui s’adresse Spyke (éligibilité)</h2>
          <p>
            Spyke est destiné aux <b>freelances</b> et <b>entreprises</b> (usage professionnel). En utilisant le Service, vous
            déclarez agir dans un cadre professionnel et disposer de la capacité nécessaire.
          </p>

          <h2>4. Création de compte et sécurité</h2>
          <p>
            Certaines fonctionnalités nécessitent la création d’un Compte. Vous vous engagez à fournir des informations
            exactes, à les maintenir à jour, et à conserver la confidentialité de vos identifiants.
          </p>
          <p>
            Vous êtes responsable de toute activité réalisée depuis votre Compte, sauf preuve d’un usage frauduleux non
            imputable à votre fait.
          </p>

          <h2>5. Fonctionnement du Service (résumé)</h2>
          <p>
            Spyke propose notamment :
          </p>
          <ul>
            <li>génération et gestion de Documents (devis, factures, contrats) ;</li>
            <li>aide à la rédaction (ex. emails) ;</li>
            <li>fonctionnalités optionnelles (ex. « Question juriste ») ;</li>
            <li>intégrations (ex. connexion Gmail) lorsqu’elles sont disponibles.</li>
          </ul>

          <h2>6. Abonnements, paiement et essai</h2>
          <p>
            Spyke propose un plan gratuit et un plan payant (ex. Pro). Les fonctionnalités, limites et prix applicables sont
            ceux décrits sur la page <a href="/tarifs.html">Tarifs</a> au moment de la souscription.
          </p>
          <p>
            Les paiements et la gestion de l’Abonnement peuvent être opérés via un prestataire de paiement (ex. Stripe).
            Vous pouvez résilier à tout moment selon les modalités indiquées dans l’interface (portail client).
          </p>
          <p>
            Lorsque le plan Pro inclut une période d’essai, les conditions (durée, passage à l’offre payante, résiliation
            avant échéance) sont celles affichées sur la page Tarifs / au moment du checkout.
          </p>

          <h2>7. Utilisation acceptable</h2>
          <ul>
            <li>ne pas utiliser le Service à des fins illégales, frauduleuses ou malveillantes ;</li>
            <li>ne pas tenter de contourner les limites, protections ou mesures de sécurité ;</li>
            <li>ne pas perturber le Service (ex. scraping, attaques, surcharge) ;</li>
            <li>ne pas exploiter Spyke pour fournir un service concurrent ou détourner ses fonctionnalités.</li>
          </ul>

          <h2>8. IA, contenus générés et vérifications</h2>
          <p>
            Le Service peut générer des contenus automatiquement (IA). Ces contenus sont fournis à titre d’assistance et
            doivent être <b>relus, vérifiés et validés</b> par vous avant toute utilisation (envoi à un client, émission
            d’un Document, signature, dépôt administratif, etc.).
          </p>
          <p>
            Spyke ne garantit pas l’exactitude, l’exhaustivité, ni l’adéquation juridique/fiscale des contenus générés.
            Vous restez seul responsable de leur utilisation et des décisions prises sur leur base.
          </p>

          <h2>9. Documents (devis, factures, contrats)</h2>
          <p>
            Spyke fournit des outils de génération de Documents. Il vous appartient notamment de vérifier les mentions
            obligatoires, les montants, les taux de TVA, les délais et, plus généralement, la conformité de vos Documents à
            votre situation (régime, activité, obligations légales et contractuelles).
          </p>

          <h2>10. Fonction « Question juriste »</h2>
          <p>
            Lorsque cette fonctionnalité est utilisée, votre question est transmise à un juriste. La réponse est fournie
            selon le délai indiqué dans l’interface (objectif « moins de 24h »).
          </p>
          <p>
            Cette fonctionnalité peut être facturée <b>à la question</b> (ex. 5€). Le prix affiché au moment de l’achat
            fait foi.
          </p>
          <p>
            Si vous renseignez un numéro de téléphone, vous acceptez qu’un juriste puisse vous contacter si nécessaire.
          </p>

          <h2>11. Données personnelles</h2>
          <p>
            Les modalités de traitement de vos données sont décrites dans la{' '}
            <a href="/confidentialite.html">Politique de confidentialité</a>.
          </p>

          <h2>12. Propriété intellectuelle</h2>
          <p>
            Spyke (logiciel, interface, marque, logos, éléments graphiques) est protégé. Sauf mention contraire, aucun
            droit de propriété intellectuelle ne vous est cédé.
          </p>
          <p>
            Vous conservez vos droits sur votre Contenu Utilisateur. Vous accordez à Spyke une licence limitée, non
            exclusive, strictement nécessaire au fonctionnement du Service (hébergement, traitement, génération de
            Documents, support).
          </p>

          <h2>13. Disponibilité – maintenance</h2>
          <p>
            Le Service est fourni « en l’état » et peut être interrompu (maintenance, mises à jour, incidents, contraintes
            d’hébergement). Spyke s’efforce d’assurer un niveau de disponibilité raisonnable, sans garantie absolue.
          </p>

          <h2>14. Suspension / résiliation</h2>
          <p>
            Vous pouvez cesser d’utiliser le Service à tout moment. Spyke peut suspendre ou résilier l’accès en cas de
            violation des CGU, d’abus, ou de risque de sécurité.
          </p>

          <h2>15. Responsabilité</h2>
          <p>
            Dans les limites autorisées par la loi, Spyke ne pourra être tenu responsable des dommages indirects (perte de
            chance, perte d’exploitation, perte de données, etc.) et ne garantit pas que le Service réponde à l’ensemble de
            vos besoins spécifiques.
          </p>

          <h2>16. Modification des CGU</h2>
          <p>
            Les CGU peuvent évoluer. La version applicable est celle publiée sur cette page à la date d’utilisation.
          </p>

          <h2>17. Droit applicable</h2>
          <p>
            Les présentes CGU sont régies par le droit français.
          </p>

          <h2>18. Contact</h2>
          <p>
            Pour toute question : <a href="mailto:contact@spykeapp.fr">contact@spykeapp.fr</a>.
          </p>
        </div>
      </main>

      <footer>Spyke — CGU</footer>
    </>
  )
}
