"use client"

export default function BlogFactureMentionsPage() {
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

        .mention-card {
          background: var(--gray-900);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 14px;
          padding: 28px;
          margin: 28px 0;
          position: relative;
          overflow: hidden;
        }
        .mention-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 4px;
          height: 100%;
          background: var(--yellow);
          border-radius: 4px 0 0 4px;
        }
        .mention-number {
          font-family: var(--font-display);
          font-weight: 800;
          font-size: 2.2rem;
          color: rgba(250,204,21,0.15);
          position: absolute;
          top: 16px;
          right: 24px;
          line-height: 1;
        }
        .mention-card h3 {
          font-family: var(--font-display);
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--white);
          margin: 0 0 10px;
        }
        .mention-card p {
          font-size: 0.95rem;
          margin-bottom: 0;
          color: var(--gray-400);
          line-height: 1.7;
        }
        .mention-card p + p { margin-top: 12px; }

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

        .comparison-table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
          margin: 28px 0;
          border-radius: 14px;
          overflow: hidden;
          border: 1px solid rgba(255,255,255,0.06);
        }
        .comparison-table thead th {
          background: var(--gray-800);
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 0.85rem;
          color: var(--white);
          padding: 14px 18px;
          text-align: left;
          border-bottom: 1px solid rgba(255,255,255,0.08);
        }
        .comparison-table tbody td {
          background: var(--gray-900);
          padding: 12px 18px;
          font-size: 0.9rem;
          color: var(--gray-300);
          border-bottom: 1px solid rgba(255,255,255,0.04);
        }
        .comparison-table tbody tr:last-child td { border-bottom: none; }
        .comparison-table .highlight-cell { color: var(--yellow); font-weight: 600; }

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

        @keyframes fadeUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

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

      <header className="article-hero">
        <div className="breadcrumb">
          <a href="/">Spyke</a>
          <span>›</span>
          <a href="/blog">Blog</a>
          <span>›</span>
          <span>Facture auto-entrepreneur</span>
        </div>

        <div className="article-tag-top">🧾 Factures</div>

        <h1>Facture auto-entrepreneur : les 7 mentions obligatoires en 2026</h1>

        <p className="article-hero-desc">
          Une seule mention manquante sur votre facture peut vous coûter jusqu&apos;à 75 000 € d&apos;amende. Voici les 7 informations que chaque facture
          auto-entrepreneur doit contenir, avec des exemples concrets et les erreurs à éviter.
        </p>

        <div className="article-meta">
          <span>📅 16 février 2026</span>
          <span>⏱ 6 min de lecture</span>
          <span>✍️ Spyke</span>
        </div>
      </header>

      <section className="toc">
        <div className="toc-box">
          <div className="toc-title">📑 Sommaire</div>
          <ol className="toc-list">
            <li><a href="#obligations">Quand la facture est-elle obligatoire ?</a></li>
            <li><a href="#mentions">Les 7 mentions obligatoires</a></li>
            <li><a href="#tva">Le cas particulier de la TVA</a></li>
            <li><a href="#numerotation">Numérotation : les règles à respecter</a></li>
            <li><a href="#erreurs">Les erreurs qui coûtent cher</a></li>
            <li><a href="#devis-facture">De la différence entre devis et facture</a></li>
            <li><a href="#conseils">Conseils pour des factures impeccables</a></li>
            <li><a href="#checklist">Checklist avant envoi</a></li>
          </ol>
        </div>
      </section>

      <article className="article-content">
        <h2 id="obligations">Quand la facture est-elle obligatoire ?</h2>

        <p>
          Beaucoup d&apos;auto-entrepreneurs pensent qu&apos;ils peuvent se contenter d&apos;un simple relevé ou d&apos;un email pour demander un paiement.
          En tant qu&apos;auto-entrepreneur, vous êtes tenu d&apos;émettre une <strong>facture conforme</strong> dans plusieurs cas.
        </p>

        <p>
          La facture est <strong>systématiquement obligatoire</strong> pour toute prestation ou vente réalisée auprès d&apos;un professionnel (B2B), quel que soit le montant.
          Pour les particuliers (B2C), elle est obligatoire au-delà de 25 € ou si le client en fait la demande.
        </p>

        <div className="warning-box">
          <p>
            <strong>Risque réel :</strong> Une facture non conforme (mentions manquantes ou incorrectes) peut entraîner une amende de 15 € par mention manquante et par facture,
            plafonné à 25 % du montant. Pour les infractions graves ou répétées, l&apos;amende peut aller jusqu&apos;à 75 000 €.
          </p>
        </div>

        <h2 id="mentions">Les 7 mentions obligatoires sur une facture auto-entrepreneur</h2>

        <p>Chaque facture que vous émettez doit contenir ces 7 catégories d&apos;informations.</p>

        <div className="mention-card">
          <div className="mention-number">01</div>
          <h3>Votre identité complète</h3>
          <p>
            Votre nom et prénom (ou raison sociale), votre adresse professionnelle complète, et votre <strong>numéro SIRET</strong> (14 chiffres).
          </p>
        </div>

        <div className="mention-card">
          <div className="mention-number">02</div>
          <h3>L&apos;identité de votre client</h3>
          <p>Le nom/raison sociale, l&apos;adresse, et le SIRET si c&apos;est un professionnel.</p>
        </div>

        <div className="mention-card">
          <div className="mention-number">03</div>
          <h3>Le numéro de facture</h3>
          <p>Un numéro <strong>unique, chronologique et sans trou</strong> (ex : F202602-001).</p>
        </div>

        <div className="mention-card">
          <div className="mention-number">04</div>
          <h3>La date d&apos;émission</h3>
          <p>La date à laquelle la facture est établie (date réelle d&apos;émission).</p>
        </div>

        <div className="mention-card">
          <div className="mention-number">05</div>
          <h3>La description détaillée des prestations</h3>
          <p>Nature, quantité, prix unitaire HT. Détaillez sur des lignes séparées si besoin.</p>
          <p>Un seul montant global pour &quot;Prestation de service&quot; ne suffit pas.</p>
        </div>

        <div className="mention-card">
          <div className="mention-number">06</div>
          <h3>Les montants : HT, TVA et TTC</h3>
          <p>Sous-total HT, montant TVA (par taux), total TTC. En franchise, pas de TVA mais mention légale obligatoire.</p>
        </div>

        <div className="mention-card">
          <div className="mention-number">07</div>
          <h3>Les conditions de paiement</h3>
          <p>
            Date d&apos;échéance (ou délai), modalités de paiement, pénalités de retard et indemnité forfaitaire de recouvrement de <strong>40 €</strong> (B2B).
          </p>
        </div>

        <div className="info-box">
          <p>
            <strong>Astuce Spyke :</strong> Sur notre <a href="/facture-auto-entrepreneur">générateur de facture gratuit</a>, toutes ces mentions sont intégrées automatiquement.
          </p>
        </div>

        <h2 id="tva">Le cas particulier de la TVA en auto-entreprise</h2>

        <p>La TVA est la source de confusion numéro 1 chez les auto-entrepreneurs.</p>

        <h3>Cas 1 : Franchise en base de TVA</h3>
        <p>
          Vous ne facturez pas de TVA. Prix HT = TTC. Vous devez obligatoirement inscrire :
        </p>

        <div className="example-block">
          <div className="example-label">📝 Mention obligatoire — Franchise TVA</div>
          <p><strong>&quot;TVA non applicable, art. 293 B du CGI&quot;</strong></p>
        </div>

        <h3>Cas 2 : Dépassement des seuils</h3>
        <p>Vous devez facturer la TVA et afficher votre numéro de TVA intracommunautaire.</p>

        <h3>Cas 3 : Option volontaire</h3>
        <p>Possible même sous les seuils (parfois avantageux selon vos dépenses et clients).</p>

        <table className="comparison-table">
          <thead>
            <tr>
              <th>Situation</th>
              <th>TVA facturée</th>
              <th>Mention sur la facture</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Franchise en base</td>
              <td>Non</td>
              <td className="highlight-cell">&quot;TVA non applicable, art. 293 B du CGI&quot;</td>
            </tr>
            <tr>
              <td>Assujetti (seuils dépassés)</td>
              <td>Oui</td>
              <td className="highlight-cell">N° TVA + taux + montant</td>
            </tr>
            <tr>
              <td>Option volontaire</td>
              <td>Oui</td>
              <td className="highlight-cell">N° TVA + taux + montant</td>
            </tr>
          </tbody>
        </table>

        <h2 id="numerotation">Numérotation des factures : les règles à respecter</h2>

        <p>
          Chaque facture a un <strong>numéro unique</strong>, les numéros se suivent dans un <strong>ordre chronologique continu</strong>, et il ne doit y avoir <strong>aucun trou</strong>.
          Si vous annulez une facture, vous devez émettre un avoir.
        </p>

        <div className="example-block">
          <div className="example-label">💡 Formats de numérotation courants</div>
          <p><strong>Simple :</strong> F-001, F-002, F-003…</p>
          <p><strong>Avec année :</strong> F2026-001, F2026-002…</p>
          <p><strong>Avec année et mois :</strong> F202602-001, F202602-002… (recommandé)</p>
        </div>

        <h2 id="erreurs">Les erreurs qui coûtent cher</h2>

        <p>Certaines erreurs sur les factures sont particulièrement fréquentes.</p>

        <ol>
          <li><strong>Oublier la mention de franchise de TVA.</strong></li>
          <li><strong>Des trous dans la numérotation.</strong></li>
          <li><strong>Facturer sans SIRET.</strong></li>
          <li><strong>Une description trop vague.</strong></li>
          <li><strong>Ne pas indiquer les pénalités de retard.</strong></li>
        </ol>

        <div className="cta-inline">
          <h3>⚡ Générez une facture conforme en 2 minutes</h3>
          <p>Notre générateur gratuit inclut automatiquement toutes les mentions obligatoires. Sans inscription.</p>
          <a href="/facture-auto-entrepreneur" className="cta-btn">Créer ma facture gratuite →</a>
        </div>

        <h2 id="devis-facture">Quelle différence entre un devis et une facture ?</h2>

        <p>
          Le <strong>devis</strong> est un document <strong>avant</strong> la prestation. La <strong>facture</strong> est un document <strong>après</strong> (ou selon l&apos;échéancier) qui demande le paiement.
        </p>

        <h2 id="conseils">Conseils pratiques pour des factures impeccables</h2>

        <h3>Utilisez un outil dédié</h3>
        <p>Un outil dédié garantit la conformité, la numérotation automatique et un PDF professionnel.</p>

        <h3>Facturez immédiatement</h3>
        <p>Plus vous attendez, plus le paiement est décalé et plus vous risquez d&apos;oublier des détails.</p>

        <h3>Conservez tout pendant 10 ans</h3>
        <p>La loi impose de conserver vos factures pendant <strong>10 ans</strong>.</p>

        <h3>Préparez vos relances</h3>
        <p>Process simple : rappel à J+7, second rappel à J+15, mise en demeure à J+30.</p>

        <h2 id="checklist">Checklist : votre facture est-elle conforme ?</h2>

        <div className="checklist">
          <div className="checklist-title">📋 Vérification avant envoi</div>
          <ul>
            <li>Votre nom, adresse et SIRET sont présents</li>
            <li>Le nom et l&apos;adresse du client sont corrects</li>
            <li>Le numéro de facture est unique et séquentiel</li>
            <li>La date d&apos;émission correspond à la date réelle</li>
            <li>Chaque prestation est détaillée</li>
            <li>Les montants HT/TTC sont corrects</li>
            <li>La mention TVA est présente (ou franchise art. 293 B)</li>
            <li>La date d&apos;échéance est indiquée</li>
            <li>Pénalités de retard + indemnité 40 € (B2B)</li>
            <li>Format PDF</li>
          </ul>
        </div>

        <p>
          Avec cette checklist et un outil adapté, vos factures seront toujours conformes et professionnelles.
        </p>

        <div className="cta-inline">
          <h3>Devis → Contrat → Facture en 1 clic ⚡</h3>
          <p>Spyke génère vos documents avec toutes les mentions obligatoires. Créez un compte gratuit.</p>
          <a href="/connexion.html" className="cta-btn">Essayer gratuitement →</a>
        </div>
      </article>

      <section className="related">
        <h2>Articles similaires</h2>
        <div className="related-grid">
          <a href="/blog/comment-faire-devis-freelance" className="related-card">
            <div className="related-card-tag">Devis</div>
            <h3>Comment faire un devis freelance professionnel en 2026</h3>
            <p>8 min de lecture</p>
          </a>
          <a href="/blog/relancer-client-impaye-freelance" className="related-card">
            <div className="related-card-tag">Relances</div>
            <h3>Comment relancer un client qui ne paye pas (sans ruiner la relation)</h3>
            <p>7 min de lecture</p>
          </a>
        </div>
      </section>

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

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: 'Facture Auto-Entrepreneur : les 7 Mentions Obligatoires en 2026',
            description:
              'Les 7 mentions obligatoires sur une facture auto-entrepreneur en 2026. Guide complet avec exemples et générateur gratuit.',
            datePublished: '2026-02-16',
            dateModified: '2026-02-16',
            author: { '@type': 'Organization', name: 'Spyke' },
            publisher: { '@type': 'Organization', name: 'Spyke', url: 'https://www.spykeapp.fr' },
            mainEntityOfPage: 'https://www.spykeapp.fr/blog/mentions-obligatoires-facture-auto-entrepreneur',
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
                name: "Est-ce qu'un auto-entrepreneur doit faire des factures ?",
                acceptedAnswer: {
                  '@type': 'Answer',
                  text:
                    "Oui, la facture est obligatoire pour toute prestation de service ou vente réalisée auprès d'un professionnel. Pour les particuliers, elle est obligatoire au-delà de 25 € ou si le client en fait la demande.",
                },
              },
              {
                '@type': 'Question',
                name: "Quelle est l'amende pour une facture non conforme ?",
                acceptedAnswer: {
                  '@type': 'Answer',
                  text:
                    "Une facture avec des mentions manquantes ou incorrectes expose l'auto-entrepreneur à une amende pouvant aller jusqu'à 75 000 € pour une personne physique. Chaque mention manquante constitue une infraction distincte.",
                },
              },
              {
                '@type': 'Question',
                name: "Faut-il mettre la TVA sur une facture auto-entrepreneur ?",
                acceptedAnswer: {
                  '@type': 'Answer',
                  text:
                    "Si vous êtes en franchise en base de TVA (sous les seuils), vous ne facturez pas de TVA. Vous devez obligatoirement inscrire la mention 'TVA non applicable, art. 293 B du CGI' sur chaque facture. Si vous avez dépassé les seuils, vous devez facturer la TVA.",
                },
              },
            ],
          }),
        }}
      />
    </>
  )
}
