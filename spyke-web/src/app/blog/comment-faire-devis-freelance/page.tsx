"use client"

export default function BlogDevisGuidePage() {
  return (
    <>
      <style jsx global>{`
        *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

        :root {
          --black: #0a0a0a;
          --white: #ffffff;
          --yellow: #facc15;
          --yellow-dark: #eab308;
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
          --font-display: 'Syne', sans-serif;
          --font-body: 'DM Sans', sans-serif;
        }

        body {
          font-family: var(--font-body);
          background: var(--black);
          color: var(--gray-300);
          -webkit-font-smoothing: antialiased;
          line-height: 1.75;
        }

        a { color: var(--yellow); text-decoration: none; }
        a:hover { text-decoration: underline; }

        nav {
          position: sticky;
          top: 0;
          z-index: 100;
          background: rgba(10,10,10,0.92);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-bottom: 1px solid rgba(255,255,255,0.06);
          padding: 0 24px;
        }
        .nav-inner {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 64px;
        }
        .nav-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 1.25rem;
          color: var(--white);
          text-decoration: none;
        }
        .nav-logo:hover { text-decoration: none; }
        .nav-logo-icon {
          width: 36px;
          height: 36px;
          background: var(--gray-800);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.1rem;
        }
        .nav-links {
          display: flex;
          align-items: center;
          gap: 28px;
          list-style: none;
        }
        .nav-links a {
          font-size: 0.9rem;
          color: var(--gray-400);
          transition: color 0.2s;
          text-decoration: none;
        }
        .nav-links a:hover { color: var(--white); text-decoration: none; }
        .nav-cta {
          background: var(--yellow);
          color: var(--black);
          padding: 8px 18px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 0.88rem;
          transition: background 0.2s;
        }
        .nav-cta:hover { background: var(--yellow-dark); text-decoration: none; }
        @media (max-width: 768px) { .nav-links { display: none; } }

        .article-hero {
          max-width: 800px;
          margin: 0 auto;
          padding: 64px 24px 40px;
          animation: fadeUp 0.7s ease-out;
        }
        .breadcrumb {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.82rem;
          color: var(--gray-500);
          margin-bottom: 28px;
          flex-wrap: wrap;
        }
        .breadcrumb a { color: var(--gray-400); text-decoration: none; }
        .breadcrumb a:hover { color: var(--yellow); }
        .breadcrumb span { color: var(--gray-600); }

        .article-tag-top {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(250,204,21,0.12);
          color: var(--yellow);
          padding: 5px 14px;
          border-radius: 6px;
          font-size: 0.78rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          margin-bottom: 20px;
        }

        .article-hero h1 {
          font-family: var(--font-display);
          font-size: clamp(2rem, 4.5vw, 2.8rem);
          font-weight: 800;
          line-height: 1.18;
          color: var(--white);
          margin-bottom: 20px;
          letter-spacing: -0.02em;
        }

        .article-hero-desc {
          font-size: 1.12rem;
          color: var(--gray-400);
          line-height: 1.7;
          margin-bottom: 28px;
        }

        .article-meta {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 20px;
          padding-top: 24px;
          border-top: 1px solid rgba(255,255,255,0.06);
          font-size: 0.85rem;
          color: var(--gray-500);
        }
        .article-meta span { display: flex; align-items: center; gap: 6px; }

        .toc {
          max-width: 800px;
          margin: 0 auto 48px;
          padding: 0 24px;
          animation: fadeUp 0.7s ease-out 0.1s both;
        }
        .toc-box {
          background: var(--gray-900);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 16px;
          padding: 28px 32px;
        }
        .toc-title {
          font-family: var(--font-display);
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--white);
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .toc-list { list-style: none; counter-reset: toc; }
        .toc-list li { counter-increment: toc; margin-bottom: 8px; }
        .toc-list li a {
          display: flex;
          align-items: baseline;
          gap: 10px;
          font-size: 0.92rem;
          color: var(--gray-400);
          text-decoration: none;
          transition: color 0.2s, padding-left 0.2s;
          padding: 4px 0;
        }
        .toc-list li a:hover { color: var(--yellow); padding-left: 4px; text-decoration: none; }
        .toc-list li a::before {
          content: counter(toc, decimal-leading-zero);
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 0.78rem;
          color: var(--yellow);
          min-width: 22px;
        }

        .article-content {
          max-width: 800px;
          margin: 0 auto;
          padding: 0 24px 60px;
          animation: fadeUp 0.7s ease-out 0.2s both;
        }

        .article-content h2 {
          font-family: var(--font-display);
          font-size: 1.55rem;
          font-weight: 700;
          color: var(--white);
          margin: 56px 0 20px;
          padding-top: 32px;
          border-top: 1px solid rgba(255,255,255,0.06);
          line-height: 1.3;
          letter-spacing: -0.01em;
        }
        .article-content h2:first-child { margin-top: 0; padding-top: 0; border-top: none; }

        .article-content h3 {
          font-family: var(--font-display);
          font-size: 1.15rem;
          font-weight: 600;
          color: var(--white);
          margin: 36px 0 14px;
          line-height: 1.35;
        }

        .article-content p {
          font-size: 1.02rem;
          line-height: 1.8;
          margin-bottom: 20px;
          color: var(--gray-300);
        }

        .article-content strong { color: var(--white); font-weight: 600; }

        .checklist {
          background: var(--gray-900);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 14px;
          padding: 28px 28px;
          margin: 28px 0;
        }
        .checklist-title {
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 1rem;
          color: var(--white);
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .checklist ul { list-style: none; }
        .checklist li {
          padding: 6px 0;
          font-size: 0.95rem;
          color: var(--gray-300);
          display: flex;
          align-items: baseline;
          gap: 10px;
          line-height: 1.6;
        }
        .checklist li::before { content: '✓'; color: var(--yellow); font-weight: 700; flex-shrink: 0; }

        .info-box {
          background: rgba(250,204,21,0.06);
          border-left: 4px solid var(--yellow);
          border-radius: 0 12px 12px 0;
          padding: 20px 24px;
          margin: 28px 0;
        }
        .info-box p { margin-bottom: 0; font-size: 0.95rem; color: var(--gray-300); }
        .info-box strong { color: var(--yellow); }

        .warning-box {
          background: rgba(239,68,68,0.06);
          border-left: 4px solid #ef4444;
          border-radius: 0 12px 12px 0;
          padding: 20px 24px;
          margin: 28px 0;
        }
        .warning-box p { margin-bottom: 0; font-size: 0.95rem; }
        .warning-box strong { color: #ef4444; }

        .example-block {
          background: var(--gray-900);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 14px;
          padding: 24px 28px;
          margin: 28px 0;
        }
        .example-label {
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 0.82rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--yellow);
          margin-bottom: 12px;
        }
        .example-block p { font-size: 0.94rem; margin-bottom: 8px; }
        .example-block p:last-child { margin-bottom: 0; }

        .article-content ol {
          list-style: none;
          counter-reset: article-list;
          margin: 20px 0;
          padding-left: 0;
        }
        .article-content ol li {
          counter-increment: article-list;
          padding: 8px 0 8px 40px;
          position: relative;
          font-size: 0.98rem;
          line-height: 1.7;
        }
        .article-content ol li::before {
          content: counter(article-list);
          position: absolute;
          left: 0;
          top: 8px;
          width: 28px;
          height: 28px;
          border-radius: 8px;
          background: rgba(250,204,21,0.12);
          color: var(--yellow);
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 0.82rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .cta-inline {
          background: linear-gradient(135deg, var(--gray-900), #1a1520);
          border: 1px solid rgba(250,204,21,0.12);
          border-radius: 16px;
          padding: 36px 32px;
          margin: 40px 0;
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        .cta-inline::before {
          content: '';
          position: absolute;
          width: 250px;
          height: 250px;
          background: radial-gradient(circle, rgba(250,204,21,0.06), transparent 70%);
          top: -80px;
          right: -80px;
        }
        .cta-inline h3 {
          font-family: var(--font-display);
          font-size: 1.3rem;
          color: var(--white);
          margin-bottom: 10px;
          position: relative;
        }
        .cta-inline p {
          color: var(--gray-400);
          font-size: 0.95rem;
          margin-bottom: 22px;
          position: relative;
        }
        .cta-btn {
          display: inline-block;
          background: var(--yellow);
          color: var(--black);
          padding: 13px 28px;
          border-radius: 10px;
          font-weight: 700;
          font-size: 0.95rem;
          font-family: var(--font-display);
          transition: background 0.2s, transform 0.2s;
          position: relative;
          text-decoration: none;
        }
        .cta-btn:hover { background: var(--yellow-dark); transform: translateY(-2px); text-decoration: none; }

        .related {
          max-width: 800px;
          margin: 0 auto;
          padding: 0 24px 64px;
        }
        .related h2 {
          font-family: var(--font-display);
          font-size: 1.3rem;
          font-weight: 700;
          color: var(--white);
          margin-bottom: 24px;
          padding-left: 16px;
          border-left: 4px solid var(--yellow);
        }
        .related-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 18px;
        }
        .related-card {
          background: var(--gray-900);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 14px;
          padding: 24px;
          transition: transform 0.3s, border-color 0.3s;
          text-decoration: none;
          display: block;
        }
        .related-card:hover { transform: translateY(-3px); border-color: rgba(250,204,21,0.15); text-decoration: none; }
        .related-card-tag {
          font-size: 0.72rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--yellow);
          margin-bottom: 8px;
        }
        .related-card h3 {
          font-family: var(--font-display);
          font-size: 1rem;
          font-weight: 600;
          color: var(--white);
          line-height: 1.35;
          margin-bottom: 8px;
          transition: color 0.2s;
        }
        .related-card:hover h3 { color: var(--yellow); }
        .related-card p { font-size: 0.84rem; color: var(--gray-500); line-height: 1.5; }
        @media (max-width: 600px) { .related-grid { grid-template-columns: 1fr; } }

        footer {
          border-top: 1px solid rgba(255,255,255,0.06);
          padding: 40px 24px;
          text-align: center;
        }
        .footer-inner { max-width: 1200px; margin: 0 auto; }
        .footer-links {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 24px;
          margin-bottom: 20px;
        }
        .footer-links a {
          font-size: 0.85rem;
          color: var(--gray-500);
          transition: color 0.2s;
          text-decoration: none;
        }
        .footer-links a:hover { color: var(--white); text-decoration: none; }
        .footer-copy { font-size: 0.8rem; color: var(--gray-600); }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* NAV */}
      <nav>
        <div className="nav-inner">
          <a href="/" className="nav-logo">
            <div className="nav-logo-icon">⚡</div>
            Spyke
          </a>
          <ul className="nav-links">
            <li><a href="/fonctionnalites.html">Fonctionnalités</a></li>
            <li><a href="/blog">Blog</a></li>
            <li><a href="/#pricing">Tarifs</a></li>
            <li><a href="/connexion.html" className="nav-cta">Créer un compte gratuit</a></li>
          </ul>
        </div>
      </nav>

      {/* HERO */}
      <header className="article-hero">
        <div className="breadcrumb">
          <a href="/">Spyke</a>
          <span>›</span>
          <a href="/blog">Blog</a>
          <span>›</span>
          <span>Devis freelance</span>
        </div>

        <div className="article-tag-top">📄 Devis</div>

        <h1>Comment faire un devis freelance professionnel en 2026 (guide complet)</h1>

        <p className="article-hero-desc">
          Toutes les mentions obligatoires, les erreurs à éviter, les bonnes pratiques de présentation et une checklist
          complète pour créer des devis qui inspirent confiance à vos clients.
        </p>

        <div className="article-meta">
          <span>📅 16 février 2026</span>
          <span>⏱ 8 min de lecture</span>
          <span>✍️ Spyke</span>
        </div>
      </header>

      {/* TOC */}
      <section className="toc">
        <div className="toc-box">
          <div className="toc-title">📑 Sommaire</div>
          <ol className="toc-list">
            <li><a href="#pourquoi">Pourquoi un devis est indispensable</a></li>
            <li><a href="#mentions">Les mentions obligatoires en 2026</a></li>
            <li><a href="#tva">Devis HT, TVA, TTC : comment s&apos;y retrouver</a></li>
            <li><a href="#structure">Structurer un devis clair et professionnel</a></li>
            <li><a href="#erreurs">Les 5 erreurs les plus fréquentes</a></li>
            <li><a href="#bonnes-pratiques">Bonnes pratiques pour faire accepter vos devis</a></li>
            <li><a href="#apres-signature">Après la signature : contrat et facture</a></li>
            <li><a href="#checklist">Checklist finale</a></li>
          </ol>
        </div>
      </section>

      {/* CONTENT */}
      <article className="article-content">
        <h2 id="pourquoi">Pourquoi un devis est indispensable quand on est freelance</h2>

        <p>
          Le devis n&apos;est pas juste un document administratif de plus. C&apos;est le <strong>premier contact commercial concret</strong>
          entre vous et votre client. C&apos;est le moment où vous passez de la discussion informelle à l&apos;engagement.
        </p>

        <p>
          Un bon devis remplit trois fonctions essentielles. D&apos;abord, il <strong>protège juridiquement</strong> les deux parties :
          en cas de désaccord sur le périmètre, le prix ou les délais, le devis signé fait foi. Ensuite, il <strong>clarifie les attentes</strong> :
          votre client sait exactement ce qu&apos;il aura, pour quel prix et dans quels délais. Enfin, il <strong>projette votre image professionnelle</strong> :
          un devis bien structuré, propre et complet inspire confiance et vous différencie des freelances qui envoient un montant par email.
        </p>

        <div className="info-box">
          <p>
            <strong>Bon à savoir :</strong> Un devis signé par les deux parties a valeur de contrat. Il engage le prestataire sur les prix et le périmètre indiqués,
            et le client sur l&apos;acceptation de ces conditions.
          </p>
        </div>

        <p>
          Même quand le devis n&apos;est pas légalement obligatoire (il l&apos;est pour certaines activités et au-delà de certains montants),
          il est toujours recommandé. C&apos;est votre filet de sécurité contre les malentendus, les modifications de périmètre non prévues et les impayés.
        </p>

        <h2 id="mentions">Les mentions obligatoires sur un devis freelance en 2026</h2>

        <p>
          Un devis conforme doit contenir un ensemble d&apos;informations précises. Oublier l&apos;une d&apos;entre elles peut rendre votre devis contestable,
          voire vous exposer à des sanctions.
        </p>

        <div className="checklist">
          <div className="checklist-title">✅ Mentions obligatoires</div>
          <ul>
            <li><strong>Date d&apos;émission</strong> du devis</li>
            <li><strong>Numéro unique</strong> — séquentiel et sans trou (ex : D202602-001)</li>
            <li><strong>Identité du prestataire</strong> — nom ou raison sociale, adresse, SIRET</li>
            <li><strong>Identité du client</strong> — nom ou raison sociale, adresse</li>
            <li><strong>Description détaillée</strong> de chaque prestation</li>
            <li><strong>Quantité</strong> et <strong>prix unitaire HT</strong> de chaque ligne</li>
            <li><strong>Taux de TVA</strong> applicable (ou mention de franchise en base)</li>
            <li><strong>Total HT</strong>, <strong>montant TVA</strong> et <strong>total TTC</strong></li>
            <li><strong>Durée de validité</strong> du devis</li>
            <li><strong>Conditions de paiement</strong> — délai, acompte éventuel</li>
          </ul>
        </div>

        <h3>Le numéro de devis</h3>

        <p>
          Le numéro doit être <strong>unique et chronologique</strong>. Il ne doit pas y avoir de &quot;trous&quot; dans la numérotation.
          Un format courant chez les freelances est : <strong>D + année + mois + numéro séquentiel</strong>, par exemple D202602-003
          pour le troisième devis de février 2026.
        </p>

        <h3>L&apos;identité du prestataire</h3>

        <p>
          En tant que freelance, vous devez mentionner votre <strong>nom complet</strong> (ou votre raison sociale si vous êtes en société),
          votre <strong>adresse professionnelle</strong>, votre <strong>numéro SIRET</strong>, et votre <strong>numéro de TVA intracommunautaire</strong>
          si vous y êtes assujetti. Si vous êtes en franchise en base de TVA, vous devez indiquer la mention &quot;TVA non applicable, art. 293 B du CGI&quot;.
        </p>

        <h3>La description des prestations</h3>

        <p>
          C&apos;est la partie la plus importante et celle où beaucoup de freelances bâclent. Chaque prestation doit être décrite de manière <strong>suffisamment précise</strong>
          pour qu&apos;un tiers puisse comprendre ce qui est inclus.
        </p>

        <div className="example-block">
          <div className="example-label">💡 Exemple — Mauvaise vs bonne description</div>
          <p><strong>❌ Vague :</strong> &quot;Création site web — 2 000 €&quot;</p>
          <p>
            <strong>✅ Précis :</strong> &quot;Création d&apos;un site vitrine responsive (5 pages : Accueil, Services, À propos, Blog, Contact).
            Intégration sur WordPress, thème sur mesure, formulaire de contact, optimisation SEO de base, formation de 1h à la prise en main.
            Hébergement et nom de domaine non inclus.&quot;
          </p>
        </div>

        <h2 id="tva">Devis HT, TVA, TTC : comment s&apos;y retrouver</h2>

        <p>La question de la TVA est une source de confusion fréquente chez les freelances, surtout en début d&apos;activité.</p>

        <h3>Si vous êtes en franchise en base de TVA</h3>

        <p>
          Dans ce cas, vos prix sont <strong>HT = TTC</strong> puisque vous ne collectez pas de TVA.
          Vous devez obligatoirement ajouter la mention : <em>&quot;TVA non applicable, art. 293 B du CGI&quot;</em>.
        </p>

        <h3>Si vous êtes assujetti à la TVA</h3>

        <p>
          Vous devez afficher le prix HT, le taux de TVA, le montant de TVA, et le total TTC.
          Si vos prestations ont des taux de TVA différents, vous devez détailler les sous-totaux par taux.
        </p>

        <div className="info-box">
          <p>
            <strong>Astuce Spyke :</strong> Sur notre <a href="/devis-freelance">générateur de devis gratuit</a>, vous pouvez définir un taux de TVA par ligne
            (0 %, 5,5 %, 10 %, 20 %) et les totaux se calculent automatiquement.
          </p>
        </div>

        <h2 id="structure">Structurer un devis clair et professionnel</h2>

        <p>
          Un bon devis ne se contente pas de lister les mentions obligatoires. Il doit être <strong>facile à lire</strong> et <strong>agréable visuellement</strong>.
        </p>

        <h3>L&apos;en-tête</h3>
        <p>Votre nom ou logo, vos coordonnées complètes, et le mot &quot;DEVIS&quot; bien visible avec son numéro et sa date.</p>

        <h3>Le bloc client</h3>
        <p>Nom, adresse, éventuellement SIRET si c&apos;est un professionnel.</p>

        <h3>Le titre du devis</h3>
        <p>Ajoutez un titre qui résume la prestation.</p>

        <h3>Le tableau des prestations</h3>
        <p>Organisez-le en colonnes : description, quantité, prix unitaire HT, TVA, total HT.</p>

        <h3>Les totaux</h3>
        <p>Sous-total HT, montant de la TVA (ou mention de franchise), et <strong>total TTC bien mis en évidence</strong>.</p>

        <h3>Les conditions</h3>
        <p>Durée de validité, conditions de paiement (acompte, échéancier), délai de réalisation.</p>

        <h2 id="erreurs">Les 5 erreurs les plus fréquentes sur les devis freelance</h2>

        <ol>
          <li><strong>Des descriptions trop vagues.</strong> Plus vous êtes précis, moins vous aurez de litiges.</li>
          <li><strong>Oublier la durée de validité.</strong> Indiquez toujours 15, 30 ou 60 jours.</li>
          <li><strong>Ne pas mentionner ce qui est exclu.</strong> Hébergement non inclus, maintenance hors périmètre, etc.</li>
          <li><strong>Un prix global sans détail.</strong> Détaillez les lignes pour justifier votre prix.</li>
          <li><strong>Envoyer un devis en Word ou en email.</strong> Un PDF soigné est plus professionnel.</li>
        </ol>

        <div className="warning-box">
          <p>
            <strong>Attention :</strong> Un devis non conforme peut être contesté par le client et vous exposer à une amende pouvant aller jusqu&apos;à 75 000 €.
          </p>
        </div>

        <h2 id="bonnes-pratiques">Bonnes pratiques pour faire accepter vos devis</h2>

        <p>Un devis techniquement parfait ne suffit pas toujours. Voici quelques techniques pour maximiser votre taux d&apos;acceptation.</p>

        <h3>Soignez la présentation</h3>
        <p>Utilisez une typographie lisible, des espaces entre les sections, et mettez en évidence le total.</p>

        <h3>Envoyez rapidement</h3>
        <p>Un devis envoyé dans les 24h après un échange montre votre réactivité et votre sérieux.</p>

        <h3>Accompagnez le devis d&apos;un message</h3>
        <p>Ajoutez un email qui résume votre compréhension du besoin et propose une prochaine étape.</p>

        <h3>Proposez un acompte raisonnable</h3>
        <p>Un acompte de 30 % est standard dans beaucoup de métiers freelance.</p>

        <h3>Fixez une durée de validité courte</h3>
        <p>15 à 30 jours, c&apos;est la norme.</p>

        <div className="cta-inline">
          <h3>⚡ Créez votre devis en 2 minutes</h3>
          <p>Utilisez notre générateur gratuit pour créer un devis conforme en PDF. Sans inscription.</p>
          <a href="/devis-freelance" className="cta-btn">Générer un devis gratuit →</a>
        </div>

        <h2 id="apres-signature">Après la signature : contrat et facture</h2>

        <p>Le devis signé est le point de départ, pas la fin du processus administratif.</p>

        <h3>Faut-il aussi faire un contrat ?</h3>
        <p>
          Le devis signé a valeur contractuelle, mais il ne couvre pas tout. Pour des missions longues ou complexes, un <strong>contrat de prestation</strong> est recommandé.
        </p>

        <h3>De la facturation</h3>
        <p>Une fois la prestation réalisée, vous émettez une <strong>facture</strong>.</p>

        <h2 id="checklist">Checklist finale avant d&apos;envoyer votre devis</h2>

        <p>Avant de cliquer sur &quot;Envoyer&quot;, passez en revue cette checklist :</p>

        <div className="checklist">
          <div className="checklist-title">📋 Checklist — Avant envoi</div>
          <ul>
            <li>Le numéro de devis est unique et séquentiel</li>
            <li>La date d&apos;émission est correcte</li>
            <li>Vos coordonnées complètes sont présentes (nom, adresse, SIRET)</li>
            <li>Les coordonnées du client sont correctes</li>
            <li>Chaque prestation est décrite avec précision</li>
            <li>Les quantités et prix unitaires sont corrects</li>
            <li>La TVA est bien indiquée (taux ou mention de franchise)</li>
            <li>Les totaux HT, TVA et TTC sont exacts</li>
            <li>La durée de validité est mentionnée</li>
            <li>Les conditions de paiement sont indiquées (acompte, délai)</li>
            <li>Le format est PDF</li>
            <li>Vous avez relu pour les fautes d&apos;orthographe</li>
          </ul>
        </div>

        <div className="info-box">
          <p>
            <strong>Gagnez du temps :</strong> Avec <a href="/connexion.html">Spyke Pro</a>, importez un brief client en PDF et l&apos;IA pré-remplit votre devis automatiquement.
          </p>
        </div>

        <p>
          Un devis bien fait, c&apos;est un investissement de quelques minutes qui vous évite des heures de galère.
          Prenez le temps de le soigner.
        </p>

        <div className="cta-inline">
          <h3>Devis → Contrat → Facture en 1 clic ⚡</h3>
          <p>Créez un compte Spyke gratuit et simplifiez votre administratif freelance.</p>
          <a href="/connexion.html" className="cta-btn">Essayer gratuitement →</a>
        </div>
      </article>

      {/* RELATED */}
      <section className="related">
        <h2>Articles similaires</h2>
        <div className="related-grid">
          <a href="/blog/mentions-obligatoires-facture-auto-entrepreneur" className="related-card">
            <div className="related-card-tag">Factures</div>
            <h3>Facture auto-entrepreneur : les 7 mentions obligatoires en 2026</h3>
            <p>6 min de lecture</p>
          </a>
          <a href="/blog/contrat-prestation-freelance-clauses-essentielles" className="related-card">
            <div className="related-card-tag">Contrats</div>
            <h3>Contrat de prestation freelance : les 10 clauses indispensables</h3>
            <p>9 min de lecture</p>
          </a>
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="footer-inner">
          <div className="footer-links">
            <a href="/">Accueil</a>
            <a href="/fonctionnalites.html">Fonctionnalités</a>
            <a href="/blog">Blog</a>
            <a href="/#pricing">Tarifs</a>
            <a href="/devis-freelance">Devis gratuit</a>
            <a href="/facture-auto-entrepreneur">Facture gratuite</a>
            <a href="/contrat-freelance">Contrat gratuit</a>
            <a href="/mentions-legales.html">Mentions légales</a>
            <a href="/confidentialite.html">Confidentialité</a>
          </div>
          <p className="footer-copy">Spyke © 2026 — L&apos;assistant IA des freelances français</p>
        </div>
      </footer>

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: 'Comment faire un devis freelance professionnel en 2026 (guide complet)',
            description:
              'Guide complet pour créer un devis freelance conforme en 2026. Mentions obligatoires, erreurs à éviter, bonnes pratiques et checklist.',
            datePublished: '2026-02-16',
            dateModified: '2026-02-16',
            author: { '@type': 'Organization', name: 'Spyke' },
            publisher: { '@type': 'Organization', name: 'Spyke', url: 'https://www.spykeapp.fr' },
            mainEntityOfPage: 'https://www.spykeapp.fr/blog/comment-faire-devis-freelance',
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: [
              {
                '@type': 'Question',
                name: 'Quelles sont les mentions obligatoires sur un devis freelance ?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text:
                    "Un devis freelance doit obligatoirement contenir : la date d'émission, un numéro unique, l'identité complète du prestataire (nom, adresse, SIRET), l'identité du client, la description détaillée des prestations, les quantités, les prix unitaires HT, le taux et montant de TVA, le total TTC et la durée de validité.",
                },
              },
              {
                '@type': 'Question',
                name: 'Un devis freelance est-il obligatoire ?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text:
                    "Le devis est obligatoire pour certaines prestations (travaux, déménagement, etc.) et au-delà de certains montants. Même quand il n'est pas obligatoire, il est fortement recommandé car il sert de preuve en cas de litige et protège les deux parties.",
                },
              },
              {
                '@type': 'Question',
                name: 'Combien de temps un devis freelance est-il valable ?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text:
                    "La durée de validité est libre mais doit être indiquée sur le devis. En pratique, 15 à 30 jours est la norme pour les prestations freelance. Au-delà, les tarifs et disponibilités peuvent évoluer.",
                },
              },
            ],
          }),
        }}
      />
    </>
  )
}
