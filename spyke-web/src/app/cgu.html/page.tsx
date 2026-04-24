"use client"

export default function CguPage() {
  const updatedAt = '27/02/2026'

  return (
    <>
      <style>{`
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

        .toc {
          margin: 18px 0 10px;
          padding: 14px 14px;
          border-radius: 14px;
          background: var(--gray-50);
          border: 1px solid var(--gray-200);
        }

        .toc-title {
          font-weight: 800;
          font-size: 13px;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          color: var(--gray-700);
          margin-bottom: 10px;
        }

        .toc a {
          color: var(--gray-800);
          text-decoration: none;
        }

        .toc a:hover {
          text-decoration: underline;
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
          h1 {
            font-size: 34px;
          }
          .nav-links {
            display: none;
          }
          footer {
            padding: 50px 24px;
          }
          .footer-container {
            flex-direction: column;
            gap: 24px;
            text-align: center;
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
            <a href="/fonctionnalites.html">Fonctionnalités</a>
          </li>
          <li>
            <a href="/comment-ca-marche.html">Comment ça marche</a>
          </li>
          <li>
            <a href="/tarifs.html">Tarifs</a>
          </li>
          <li>
            <a href="/connexion.html" className="nav-cta">
              Commencer
            </a>
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

          <div className="toc">
            <div className="toc-title">Sommaire</div>
            <ul>
              <li><a href="#editeur">1. Éditeur du Service</a></li>
              <li><a href="#definitions">2. Définitions</a></li>
              <li><a href="#eligibilite">3. Éligibilité</a></li>
              <li><a href="#compte">4. Compte & sécurité</a></li>
              <li><a href="#fonctionnement">5. Fonctionnement du Service</a></li>
              <li><a href="#abonnements">6. Abonnements & paiement</a></li>
              <li><a href="#usage">7. Utilisation acceptable</a></li>
              <li><a href="#ia">8. IA & contenus générés</a></li>
              <li><a href="#documents">9. Documents</a></li>
              <li><a href="#juriste">10. Question juriste</a></li>
              <li><a href="#donnees">11. Données personnelles</a></li>
              <li><a href="#ip">12. Propriété intellectuelle</a></li>
              <li><a href="#dispo">13. Disponibilité</a></li>
              <li><a href="#resiliation">14. Suspension / résiliation</a></li>
              <li><a href="#responsabilite">15. Responsabilité</a></li>
              <li><a href="#modifs">16. Modification des CGU</a></li>
              <li><a href="#droit">17. Droit applicable</a></li>
              <li><a href="#contact">18. Contact</a></li>
            </ul>
          </div>

          <h2 id="editeur">1. Éditeur du Service</h2>
          <p>
            Le Service est édité par <b>JAZA Mehdi</b> (Auto-entrepreneur) – SIRET : <b>929 238 566 00020</b>.
            <br />
            Contact : <a href="mailto:contact@spykeapp.fr">contact@spykeapp.fr</a>.
            <br />
            Pour plus d’informations, voir les <a href="/mentions-legales.html">Mentions légales</a>.
          </p>

          <h2 id="definitions">2. Définitions (extraits)</h2>
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

          <h2 id="eligibilite">3. À qui s’adresse Spyke (éligibilité)</h2>
          <p>
            Spyke est destiné aux <b>freelances</b> et <b>entreprises</b> (usage professionnel). En utilisant le Service, vous
            déclarez agir dans un cadre professionnel et disposer de la capacité nécessaire.
          </p>

          <h2 id="compte">4. Création de compte et sécurité</h2>
          <p>
            Certaines fonctionnalités nécessitent la création d’un Compte. Vous vous engagez à fournir des informations
            exactes, à les maintenir à jour, et à conserver la confidentialité de vos identifiants.
          </p>
          <p>
            Vous êtes responsable de toute activité réalisée depuis votre Compte, sauf preuve d’un usage frauduleux non
            imputable à votre fait.
          </p>

          <h2 id="fonctionnement">5. Fonctionnement du Service (résumé)</h2>
          <p>
            Spyke propose notamment :
          </p>
          <ul>
            <li>génération et gestion de Documents (devis, factures, contrats) ;</li>
            <li>aide à la rédaction (ex. emails) ;</li>
            <li>fonctionnalités optionnelles (ex. « Question juriste ») ;</li>
            <li>intégrations (ex. connexion Gmail) lorsqu’elles sont disponibles.</li>
          </ul>

          <h2 id="abonnements">6. Abonnements, paiement et essai</h2>
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

          <h2 id="usage">7. Utilisation acceptable</h2>
          <ul>
            <li>ne pas utiliser le Service à des fins illégales, frauduleuses ou malveillantes ;</li>
            <li>ne pas tenter de contourner les limites, protections ou mesures de sécurité ;</li>
            <li>ne pas perturber le Service (ex. scraping, attaques, surcharge) ;</li>
            <li>ne pas exploiter Spyke pour fournir un service concurrent ou détourner ses fonctionnalités.</li>
          </ul>

          <h2 id="ia">8. IA, contenus générés et vérifications</h2>
          <p>
            Le Service peut générer des contenus automatiquement (IA). Ces contenus sont fournis à titre d’assistance et
            doivent être <b>relus, vérifiés et validés</b> par vous avant toute utilisation (envoi à un client, émission
            d’un Document, signature, dépôt administratif, etc.).
          </p>
          <p>
            Spyke ne garantit pas l’exactitude, l’exhaustivité, ni l’adéquation juridique/fiscale des contenus générés.
            Vous restez seul responsable de leur utilisation et des décisions prises sur leur base.
          </p>

          <h2 id="documents">9. Documents (devis, factures, contrats)</h2>
          <p>
            Spyke fournit des outils de génération de Documents. Il vous appartient notamment de vérifier les mentions
            obligatoires, les montants, les taux de TVA, les délais et, plus généralement, la conformité de vos Documents à
            votre situation (régime, activité, obligations légales et contractuelles).
          </p>

          <h2 id="juriste">10. Fonction « Question juriste »</h2>
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

          <h2 id="donnees">11. Données personnelles</h2>
          <p>
            Les modalités de traitement de vos données sont décrites dans la{' '}
            <a href="/confidentialite.html">Politique de confidentialité</a>.
          </p>

          <h2 id="ip">12. Propriété intellectuelle</h2>
          <p>
            Spyke (logiciel, interface, marque, logos, éléments graphiques) est protégé. Sauf mention contraire, aucun
            droit de propriété intellectuelle ne vous est cédé.
          </p>
          <p>
            Vous conservez vos droits sur votre Contenu Utilisateur. Vous accordez à Spyke une licence limitée, non
            exclusive, strictement nécessaire au fonctionnement du Service (hébergement, traitement, génération de
            Documents, support).
          </p>

          <h2 id="dispo">13. Disponibilité – maintenance</h2>
          <p>
            Le Service est fourni « en l’état » et peut être interrompu (maintenance, mises à jour, incidents, contraintes
            d’hébergement). Spyke s’efforce d’assurer un niveau de disponibilité raisonnable, sans garantie absolue.
          </p>

          <h2 id="resiliation">14. Suspension / résiliation</h2>
          <p>
            Vous pouvez cesser d’utiliser le Service à tout moment. Spyke peut suspendre ou résilier l’accès en cas de
            violation des CGU, d’abus, ou de risque de sécurité.
          </p>

          <h2 id="responsabilite">15. Responsabilité</h2>
          <p>
            Dans les limites autorisées par la loi, Spyke ne pourra être tenu responsable des dommages indirects (perte de
            chance, perte d’exploitation, perte de données, etc.) et ne garantit pas que le Service réponde à l’ensemble de
            vos besoins spécifiques.
          </p>

          <h2 id="modifs">16. Modification des CGU</h2>
          <p>
            Les CGU peuvent évoluer. La version applicable est celle publiée sur cette page à la date d’utilisation.
          </p>

          <h2 id="droit">17. Droit applicable</h2>
          <p>
            Les présentes CGU sont régies par le droit français.
          </p>

          <h2 id="contact">18. Contact</h2>
          <p>
            Pour toute question : <a href="mailto:contact@spykeapp.fr">contact@spykeapp.fr</a>.
          </p>
        </div>
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
            <a href="/fonctionnalites.html">Fonctionnalités</a>
            <a href="/comment-ca-marche.html">Comment ça marche</a>
            <a href="/tarifs.html">Tarifs</a>
            <a href="/mentions-legales.html">Mentions légales</a>
            <a href="/cgu.html">CGU</a>
            <a href="/confidentialite.html">Confidentialité</a>
          </div>

          <p className="footer-copy">Spyke © 2026</p>
        </div>
      </footer>
    </>
  )
}
