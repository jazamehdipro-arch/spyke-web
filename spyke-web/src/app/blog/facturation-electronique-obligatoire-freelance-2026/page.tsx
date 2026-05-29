import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Facturation électronique obligatoire 2026-2027 : ce que ça change pour les freelances — Spyke',
  description:
    'La facturation électronique devient obligatoire en France dès septembre 2026. Ce que ça change concrètement pour les freelances et auto-entrepreneurs, et comment se préparer.',
  openGraph: {
    title: 'Facturation électronique obligatoire 2026-2027 : ce que ça change pour les freelances',
    description: 'Dates, obligations, formats, plateformes : tout ce que les freelances doivent savoir sur la réforme de la facturation électronique.',
    url: 'https://spykeapp.fr/blog/facturation-electronique-obligatoire-freelance-2026',
  },
}

export default function BlogFacturationElectroniqueFreelancePage() {
  return (
    <>
      <style>{`
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
        .mobile-menu-btn { display: none; background: transparent; border: 1px solid rgba(255,255,255,0.15); color: var(--white); border-radius: 10px; padding: 9px 11px; cursor: pointer; align-items: center; justify-content: center; }
        .mobile-menu-btn svg { width: 20px; height: 20px; stroke: currentColor; fill: none; stroke-width: 2; stroke-linecap: round; }
        @media (max-width: 768px) {
          .mobile-menu-btn { display: inline-flex; }
          .nav-links { display: none; position: fixed; top: 64px; left: 12px; right: 12px; flex-direction: column; gap: 4px; background: rgba(10,10,10,0.98); border: 1px solid rgba(255,255,255,0.1); border-radius: 14px; padding: 12px; z-index: 200; box-shadow: 0 20px 40px rgba(0,0,0,0.5); }
          .nav-links.open { display: flex; }
          .nav-links a { font-size: 0.95rem; padding: 12px 14px; border-radius: 10px; color: var(--gray-300); border: 1px solid rgba(255,255,255,0.06); }
          .nav-links a:hover { color: var(--white); background: rgba(255,255,255,0.04); }
          .nav-cta { background: var(--yellow) !important; color: var(--black) !important; border-color: var(--yellow) !important; display: flex; justify-content: center; }
        }

        .article-hero {
          max-width: 800px;
          margin: 0 auto;
          padding: 64px 24px 40px;
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

        .article-content ul {
          list-style: none;
          margin: 20px 0;
          padding: 0;
        }
        .article-content ul li {
          padding: 6px 0 6px 28px;
          position: relative;
          font-size: 0.98rem;
          color: var(--gray-300);
          line-height: 1.7;
        }
        .article-content ul li::before {
          content: '→';
          position: absolute;
          left: 0;
          color: var(--yellow);
          font-weight: 700;
        }

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
        .warning-box p { margin-bottom: 0; font-size: 0.95rem; color: var(--gray-300); }
        .warning-box strong { color: #ef4444; }

        .timeline {
          margin: 32px 0;
          position: relative;
          padding-left: 28px;
        }
        .timeline::before {
          content: '';
          position: absolute;
          left: 8px;
          top: 8px;
          bottom: 8px;
          width: 2px;
          background: rgba(255,255,255,0.08);
        }
        .timeline-item {
          position: relative;
          margin-bottom: 28px;
        }
        .timeline-item:last-child { margin-bottom: 0; }
        .timeline-dot {
          position: absolute;
          left: -24px;
          top: 6px;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: var(--yellow);
          border: 2px solid var(--black);
        }
        .timeline-date {
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 0.88rem;
          color: var(--yellow);
          margin-bottom: 6px;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .timeline-title {
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 1.05rem;
          color: var(--white);
          margin-bottom: 6px;
        }
        .timeline-desc {
          font-size: 0.92rem;
          color: var(--gray-400);
          line-height: 1.6;
        }

        .card-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin: 28px 0;
        }
        @media (max-width: 600px) { .card-grid { grid-template-columns: 1fr; } }
        .card {
          background: var(--gray-900);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 14px;
          padding: 22px;
        }
        .card-icon { font-size: 1.5rem; margin-bottom: 10px; }
        .card h4 {
          font-family: var(--font-display);
          font-size: 1rem;
          font-weight: 700;
          color: var(--white);
          margin-bottom: 8px;
        }
        .card p {
          font-size: 0.88rem;
          color: var(--gray-400);
          line-height: 1.6;
          margin-bottom: 0;
        }

        .checklist {
          background: var(--gray-900);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 14px;
          padding: 28px;
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
        .checklist ul { list-style: none; margin: 0; padding: 0; }
        .checklist li {
          padding: 7px 0;
          font-size: 0.95rem;
          color: var(--gray-300);
          display: flex;
          align-items: baseline;
          gap: 10px;
          line-height: 1.6;
          border-bottom: 1px solid rgba(255,255,255,0.04);
        }
        .checklist li:last-child { border-bottom: none; }
        .checklist li::before { content: '✓'; color: var(--yellow); font-weight: 700; flex-shrink: 0; }

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
        .footer-links a { font-size: 0.85rem; color: var(--gray-500); text-decoration: none; transition: color 0.2s; }
        .footer-links a:hover { color: var(--gray-300); }
        .footer-copy { font-size: 0.82rem; color: var(--gray-600); }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Nav */}
      <nav>
        <div className="nav-inner">
          <a href="/" className="nav-logo">
            <div className="nav-logo-icon">⚡</div>
            Spyke
          </a>
          <ul className="nav-links">
            <li><a href="/blog">Blog</a></li>
            <li><a href="/fonctionnalites.html">Fonctionnalités</a></li>
            <li><a href="/tarifs.html">Tarifs</a></li>
            <li><a href="/connexion.html" className="nav-cta">Essayer gratuitement</a></li>
          </ul>
          <button className="mobile-menu-btn" aria-label="Menu">
            <svg viewBox="0 0 24 24"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </button>
        </div>
      </nav>

      {/* Hero */}
      <header className="article-hero">
        <div className="breadcrumb">
          <a href="/">Accueil</a>
          <span>›</span>
          <a href="/blog">Blog</a>
          <span>›</span>
          <span>Facturation électronique 2026</span>
        </div>
        <div className="article-tag-top">📄 Facturation</div>
        <h1>Facturation électronique obligatoire 2026-2027 : ce que ça change pour les freelances</h1>
        <p className="article-hero-desc">
          Envoyer un PDF par email ne suffira plus. Dès septembre 2026, la facturation électronique devient obligatoire en France.
          Voici ce que ça change concrètement pour les freelances et auto-entrepreneurs, et comment se préparer sans stress.
        </p>
        <div className="article-meta">
          <span>✍️ Équipe Spyke</span>
          <span>📅 Mis à jour en 2026</span>
          <span>⏱ 6 min de lecture</span>
        </div>
      </header>

      {/* Table des matières */}
      <div className="toc">
        <div className="toc-box">
          <div className="toc-title">📋 Sommaire</div>
          <ol className="toc-list">
            <li><a href="#kesaco">C&apos;est quoi la facturation électronique (vraiment) ?</a></li>
            <li><a href="#dates">Les dates clés à retenir</a></li>
            <li><a href="#concerne">Est-ce que ça concerne les freelances ?</a></li>
            <li><a href="#change">Ce qui change concrètement</a></li>
            <li><a href="#change-pas">Ce qui ne change pas</a></li>
            <li><a href="#preparer">Comment se préparer maintenant</a></li>
          </ol>
        </div>
      </div>

      {/* Contenu */}
      <article className="article-content">

        <h2 id="kesaco">C&apos;est quoi la facturation électronique (vraiment) ?</h2>

        <p>
          Beaucoup de freelances pensent déjà faire de la facturation électronique parce qu&apos;ils envoient leurs factures par email en PDF.
          <strong> Ce n&apos;est pas ce que la loi entend par là.</strong>
        </p>

        <p>
          La facturation électronique au sens de la réforme, c&apos;est une facture dans un <strong>format structuré</strong> — c&apos;est-à-dire un fichier que les logiciels comptables peuvent lire et traiter automatiquement, sans intervention humaine. On parle de formats comme :
        </p>

        <ul>
          <li><strong>Factur-X</strong> : un PDF classique avec un fichier XML intégré dedans — format hybride, lisible par l&apos;humain et par la machine</li>
          <li><strong>UBL</strong> (Universal Business Language) : format XML pur, standard européen</li>
          <li><strong>CII</strong> (Cross Industry Invoice) : autre format XML utilisé dans les échanges B2B</li>
        </ul>

        <p>
          Ces factures doivent en plus transiter par une <strong>plateforme certifiée</strong> — pas être envoyées directement par email. C&apos;est là que ça change vraiment les habitudes.
        </p>

        <div className="info-box">
          <p><strong>À retenir :</strong> un PDF envoyé par Gmail n&apos;est pas une facture électronique au sens légal. Il te faudra passer par un logiciel ou une plateforme compatible.</p>
        </div>

        <h2 id="dates">Les dates clés à retenir</h2>

        <p>
          La réforme a déjà été reportée une fois (initialement prévue pour juillet 2024). Le nouveau calendrier est le suivant :
        </p>

        <div className="timeline">
          <div className="timeline-item">
            <div className="timeline-dot"></div>
            <div className="timeline-date">Septembre 2026</div>
            <div className="timeline-title">Grandes entreprises et ETI</div>
            <div className="timeline-desc">
              Obligation d&apos;émettre ET de recevoir des factures électroniques. Toutes les entreprises, quelle que soit leur taille, doivent être capables de recevoir des e-factures dès cette date.
            </div>
          </div>
          <div className="timeline-item">
            <div className="timeline-dot"></div>
            <div className="timeline-date">Septembre 2027</div>
            <div className="timeline-title">PME, TPE et micro-entrepreneurs</div>
            <div className="timeline-desc">
              Obligation d&apos;émettre des factures électroniques. C&apos;est la date qui concerne la grande majorité des freelances et auto-entrepreneurs.
            </div>
          </div>
        </div>

        <div className="warning-box">
          <p><strong>Attention :</strong> même si tu es dans la deuxième vague (septembre 2027), tu devras être capable de <strong>recevoir</strong> des e-factures dès septembre 2026 si tu travailles avec de grandes entreprises. Ne reporte pas tout à la dernière minute.</p>
        </div>

        <h2 id="concerne">Est-ce que ça concerne les freelances ?</h2>

        <p>
          La réponse courte : <strong>oui, dans la grande majorité des cas</strong>. Mais le niveau d&apos;obligation dépend de ton statut et de tes clients.
        </p>

        <table className="comparison-table">
          <thead>
            <tr>
              <th>Profil</th>
              <th>E-facturation (B2B)</th>
              <th>E-reporting</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Freelance assujetti à la TVA</td>
              <td className="highlight-cell">✓ Obligatoire</td>
              <td className="highlight-cell">✓ Obligatoire</td>
            </tr>
            <tr>
              <td>Auto-entrepreneur en franchise de TVA</td>
              <td className="highlight-cell">✓ Obligatoire (B2B)</td>
              <td className="highlight-cell">✓ Obligatoire (B2C)</td>
            </tr>
            <tr>
              <td>Freelance avec clients hors France / hors UE</td>
              <td>Hors champ</td>
              <td className="highlight-cell">✓ E-reporting uniquement</td>
            </tr>
          </tbody>
        </table>

        <h3>C&apos;est quoi le e-reporting ?</h3>
        <p>
          En plus de la facturation électronique (qui concerne les transactions B2B entre entreprises françaises), la réforme introduit le <strong>e-reporting</strong> : l&apos;obligation de transmettre à l&apos;administration fiscale les données de tes transactions avec des particuliers ou des entreprises étrangères.
        </p>
        <p>
          Autrement dit, même si tu factures des particuliers ou des clients à l&apos;étranger — ce qui échappe à la facturation électronique — tu devras quand même déclarer ces transactions à la DGFiP via une plateforme certifiée.
        </p>

        <h2 id="change">Ce qui change concrètement</h2>

        <div className="card-grid">
          <div className="card">
            <div className="card-icon">🔄</div>
            <h4>Le format de la facture</h4>
            <p>Exit le Word ou le PDF fait à la main. Il faudra générer des factures dans un format structuré (Factur-X, UBL…) via un logiciel compatible.</p>
          </div>
          <div className="card">
            <div className="card-icon">🏛️</div>
            <h4>Le canal d&apos;envoi</h4>
            <p>Les factures ne s&apos;enverront plus directement par email. Elles passeront par une plateforme certifiée : le Portail Public de Facturation (PPF) ou une PDP privée.</p>
          </div>
          <div className="card">
            <div className="card-icon">📊</div>
            <h4>La déclaration fiscale</h4>
            <p>Les données de tes factures seront transmises automatiquement à la DGFiP. À terme, ça devrait simplifier la TVA — le fisc aura déjà les chiffres.</p>
          </div>
          <div className="card">
            <div className="card-icon">🔁</div>
            <h4>La réception aussi</h4>
            <p>Tu devras être capable de recevoir des factures électroniques de tes fournisseurs et prestataires. C&apos;est valable dès septembre 2026.</p>
          </div>
        </div>

        <h3>Les deux types de plateformes</h3>
        <p>
          La réforme prévoit deux types de plateformes par lesquelles les factures devront transiter :
        </p>
        <ul>
          <li><strong>Le PPF (Portail Public de Facturation)</strong> : la solution gratuite de l&apos;État, accessible à tous. Il remplace et étend Chorus Pro (déjà utilisé pour les factures aux administrations publiques).</li>
          <li><strong>Les PDP (Plateformes de Dématérialisation Partenaires)</strong> : des opérateurs privés certifiés par l&apos;administration (éditeurs de logiciels comptables, fintech, etc.). Souvent payants mais mieux intégrés aux outils existants.</li>
        </ul>

        <div className="info-box">
          <p><strong>Bonne nouvelle :</strong> si tu utilises un logiciel de facturation à jour, il gérera lui-même le routage vers la bonne plateforme. Tu n&apos;auras pas à le faire manuellement.</p>
        </div>

        <h2 id="change-pas">Ce qui ne change pas</h2>

        <p>
          Pas de panique : la réforme porte sur le <em>format et la transmission</em> des factures, pas sur leur contenu. Les <strong>mentions obligatoires restent exactement les mêmes</strong> :
        </p>

        <div className="checklist">
          <div className="checklist-title">✅ Mentions toujours requises sur ta facture</div>
          <ul>
            <li>Numéro de facture (séquentiel et unique)</li>
            <li>Date d&apos;émission</li>
            <li>Tes coordonnées complètes (nom, adresse, SIRET)</li>
            <li>Coordonnées du client</li>
            <li>Description des prestations</li>
            <li>Montants HT, TVA (ou mention de franchise), TTC</li>
            <li>Conditions de paiement et pénalités de retard</li>
          </ul>
        </div>

        <p>
          Les règles sur les délais de paiement, les pénalités de retard, la TVA — rien de tout ça ne change. La réforme ne touche qu&apos;à la tuyauterie, pas aux règles de fond.
        </p>

        <h2 id="preparer">Comment se préparer maintenant</h2>

        <p>
          Tu as encore du temps, mais mieux vaut ne pas attendre l&apos;été 2027 pour s&apos;y mettre. Voici les étapes concrètes :
        </p>

        <div className="checklist">
          <div className="checklist-title">📋 Ta checklist pour la transition</div>
          <ul>
            <li><strong>Vérifie ton statut</strong> — assujetti à la TVA ou en franchise ? Ça détermine l&apos;étendue de tes obligations</li>
            <li><strong>Fais l&apos;inventaire de tes outils actuels</strong> — ton logiciel de facturation sera-t-il compatible ? Contacte l&apos;éditeur si besoin</li>
            <li><strong>Identifie si tes clients sont grandes entreprises</strong> — si oui, tu dois pouvoir recevoir leurs e-factures dès septembre 2026</li>
            <li><strong>Choisis une plateforme ou un outil certifié</strong> avant l&apos;échéance 2027</li>
            <li><strong>Ne change rien à tes mentions obligatoires</strong> — elles restent identiques</li>
            <li><strong>Reste informé</strong> — la réforme a déjà été reportée une fois, surveille les mises à jour officielles</li>
          </ul>
        </div>

        <div className="info-box">
          <p><strong>Profite-en pour mettre de l&apos;ordre dans ta facturation.</strong> La réforme est une bonne occasion de passer à un outil sérieux si tu fonctionnes encore avec Word ou Excel. Un logiciel comme Spyke génère des factures correctement formatées, conformes aux mentions obligatoires, et s&apos;adaptera aux nouvelles exigences.</p>
        </div>

        <div className="cta-inline">
          <h3>Génère tes factures en 30 secondes avec Spyke</h3>
          <p>Factures, devis et contrats conformes — sans Word, sans Excel, sans prise de tête.</p>
          <a href="/connexion.html" className="cta-btn">Essayer gratuitement →</a>
        </div>

      </article>

      {/* Articles liés */}
      <section className="related">
        <h2>Articles liés</h2>
        <div className="related-grid">
          <a href="/blog/mentions-obligatoires-facture-auto-entrepreneur" className="related-card">
            <div className="related-card-tag">Facturation</div>
            <h3>Les mentions obligatoires sur une facture auto-entrepreneur</h3>
            <p>Les 7 informations légales indispensables pour une facture conforme.</p>
          </a>
          <a href="/blog/acompte-devis-freelance" className="related-card">
            <div className="related-card-tag">Devis</div>
            <h3>Acompte sur devis : comment ça marche pour un freelance ?</h3>
            <p>Faut-il demander un acompte ? Quel montant ? Quelle forme légale ?</p>
          </a>
          <a href="/blog/contrat-prestation-freelance-clauses-essentielles" className="related-card">
            <div className="related-card-tag">Contrat</div>
            <h3>Contrat de prestation : les clauses essentielles</h3>
            <p>Ce que doit contenir un bon contrat de mission pour se protéger.</p>
          </a>
          <a href="/blog/relancer-client-impaye-freelance" className="related-card">
            <div className="related-card-tag">Recouvrement</div>
            <h3>Relancer un client impayé : le guide complet</h3>
            <p>Comment relancer sans froisser, et quand passer aux étapes suivantes.</p>
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer>
        <div className="footer-inner">
          <div className="footer-links">
            <a href="/">Accueil</a>
            <a href="/blog">Blog</a>
            <a href="/fonctionnalites.html">Fonctionnalités</a>
            <a href="/tarifs.html">Tarifs</a>
            <a href="/mentions-legales.html">Mentions légales</a>
            <a href="/cgu.html">CGU</a>
            <a href="/confidentialite.html">Confidentialité</a>
          </div>
          <p className="footer-copy">© 2026 Spyke — L&apos;assistant IA des freelances français</p>
        </div>
      </footer>
    </>
  )
}
