import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Acompte sur devis freelance : comment le demander et quel montant — Spyke',
  description:
    "Pourquoi demander un acompte, quel pourcentage choisir (30 %, 50 %…), comment le formuler sur le devis et quoi faire si le client refuse. Guide complet 2026.",
  openGraph: {
    title: 'Acompte sur devis freelance : comment le demander et quel montant ?',
    description: 'Guide pratique : montant idéal, formulation, mention sur le devis, gestion des refus.',
    url: 'https://spykeapp.fr/blog/acompte-devis-freelance',
  },
}

export default function BlogAcomptePage() {
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

        .percent-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
          margin: 28px 0;
        }
        .percent-card {
          background: var(--gray-900);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 14px;
          padding: 22px 18px;
          text-align: center;
        }
        .percent-card .pct {
          font-family: var(--font-display);
          font-size: 2.2rem;
          font-weight: 900;
          color: var(--yellow);
          letter-spacing: -1px;
          line-height: 1;
          margin-bottom: 8px;
        }
        .percent-card .pct-label {
          font-size: 0.85rem;
          color: var(--white);
          font-weight: 600;
          margin-bottom: 6px;
        }
        .percent-card .pct-desc {
          font-size: 0.78rem;
          color: var(--gray-500);
          line-height: 1.5;
        }
        @media (max-width: 600px) { .percent-grid { grid-template-columns: 1fr; } }

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

        .with-sidebar {
          max-width: 1100px;
          margin: 0 auto;
          padding: 0 24px 60px;
          display: grid;
          grid-template-columns: minmax(0, 1fr) 280px;
          gap: 32px;
          align-items: start;
        }
        .with-sidebar .main-col { min-width: 0; }
        .with-sidebar .toc { max-width: none; margin: 0 0 24px; padding: 0; }
        .with-sidebar .article-content { max-width: none; margin: 0; padding: 0; }

        .toc-sidebar { position: sticky; top: 88px; align-self: start; }
        .toc-sidebar .toc-box { padding: 22px 20px; }
        .toc-sidebar .toc-title { font-size: 0.9rem; }
        .toc-sidebar .toc-list li a { font-size: 0.88rem; }

        .toc-fab {
          position: fixed;
          right: 16px;
          bottom: 16px;
          z-index: 200;
          background: rgba(24,24,27,0.92);
          border: 1px solid rgba(250,204,21,0.25);
          color: var(--white);
          padding: 10px 14px;
          border-radius: 999px;
          font-weight: 700;
          font-size: 0.9rem;
          display: none;
          gap: 8px;
          align-items: center;
        }
        .toc-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.6);
          z-index: 300;
          display: none;
        }
        .toc-drawer {
          position: fixed;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 400;
          background: var(--gray-900);
          border-top: 1px solid rgba(255,255,255,0.08);
          border-radius: 18px 18px 0 0;
          padding: 18px 18px 24px;
          max-height: 72vh;
          overflow: auto;
          transform: translateY(110%);
          transition: transform 0.25s ease;
        }
        .toc-drawer.open { transform: translateY(0); }
        .toc-drawer-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 12px; }
        .toc-drawer-title { font-family: var(--font-display); font-weight: 800; color: var(--white); }
        .toc-drawer-close { background: transparent; border: 1px solid rgba(255,255,255,0.14); color: var(--gray-300); border-radius: 10px; padding: 8px 10px; }

        @media (max-width: 980px) {
          .with-sidebar { grid-template-columns: 1fr; }
          .toc-sidebar { display: none; }
          .toc-fab { display: inline-flex; }
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* NAV */}
      <nav aria-label="Navigation principale">
        <div className="nav-inner">
          <a href="/" className="nav-logo">
            <div className="nav-logo-icon">⚡</div>
            Spyke
          </a>
          <button type="button" className="mobile-menu-btn" aria-label="Ouvrir le menu" aria-expanded="false" data-mobile-nav-toggle>
            <svg viewBox="0 0 24 24"><path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h16"/></svg>
          </button>
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
        <div className="breadcrumb" role="navigation" aria-label="Fil d'ariane">
          <a href="/">Spyke</a>
          <span>›</span>
          <a href="/blog">Blog</a>
          <span>›</span>
          <span>Acompte sur devis</span>
        </div>

        <div className="article-tag-top">📄 Devis</div>

        <h1>Acompte sur devis freelance : comment le demander (et quel montant ?)</h1>

        <p className="article-hero-desc">
          L&apos;acompte, c&apos;est la protection numéro un du freelance. Pourtant, beaucoup hésitent à en demander un — par peur de froisser le client ou de ne pas savoir comment formuler la chose. Ce guide répond à toutes vos questions : combien demander, comment l&apos;écrire sur le devis, et quoi faire si le client refuse.
        </p>

        <div className="article-meta">
          <span>📅 Mai 2026</span>
          <span>⏱ 7 min de lecture</span>
          <span>✍️ Spyke</span>
        </div>
      </header>

      <div className="with-sidebar">
        <div className="main-col">
          {/* TOC */}
          <section className="toc">
            <div className="toc-box">
              <div className="toc-title">📑 Sommaire</div>
              <ol className="toc-list">
                <li><a href="#definition">Qu&apos;est-ce qu&apos;un acompte sur devis ?</a></li>
                <li><a href="#pourquoi">Pourquoi demander un acompte systématiquement</a></li>
                <li><a href="#montant">Quel montant d&apos;acompte demander ?</a></li>
                <li><a href="#formuler">Comment formuler la demande d&apos;acompte</a></li>
                <li><a href="#devis">Comment mentionner l&apos;acompte sur le devis</a></li>
                <li><a href="#tva">Acompte et TVA : ce qu&apos;il faut savoir</a></li>
                <li><a href="#refus">Que faire si le client refuse ?</a></li>
                <li><a href="#checklist">Checklist acompte</a></li>
              </ol>
            </div>
          </section>

          {/* CONTENT */}
          <article className="article-content">

            <h2 id="definition">Qu&apos;est-ce qu&apos;un acompte sur devis ?</h2>

            <p>
              Un acompte est une <strong>somme versée par le client avant le début de la prestation</strong>, en échange d&apos;un engagement ferme des deux parties. Ce n&apos;est pas une avance remboursable : une fois versé, l&apos;acompte engage définitivement le client.
            </p>

            <p>
              Il ne faut pas le confondre avec les arrhes. Les arrhes, elles, permettent au client de se désengager en les perdant — ou au prestataire de rompre le contrat en remboursant le double. <strong>Pour les prestations freelance, c&apos;est presque toujours un acompte (et non des arrhes) qui est utilisé</strong>, car il lie les deux parties de manière plus solide.
            </p>

            <div className="info-box">
              <p>
                <strong>Différence clé :</strong> Arrhes = possibilité de se rétracter (en perdant la somme). Acompte = engagement définitif. Pour sécuriser une mission, préférez toujours l&apos;acompte.
              </p>
            </div>

            <h2 id="pourquoi">Pourquoi demander un acompte systématiquement</h2>

            <p>
              Beaucoup de freelances débutants évitent de demander un acompte, craignant que ça fasse fuir le client. C&apos;est une erreur. Voici pourquoi l&apos;acompte devrait être une règle non négociable.
            </p>

            <h3>Il filtre les mauvais clients</h3>
            <p>
              Un client sérieux qui veut vraiment travailler avec vous n&apos;aura aucun problème à verser un acompte. Celui qui refuse, ou qui pose des conditions étranges, vous donne un signal d&apos;alarme précieux <strong>avant</strong> d&apos;avoir investi du temps.
            </p>

            <h3>Il couvre vos frais initiaux</h3>
            <p>
              Abonnements, licences, temps de préparation, réunions de cadrage… Le démarrage d&apos;une mission a un coût réel. L&apos;acompte vous permet d&apos;absorber ces frais sans attendre la facturation finale.
            </p>

            <h3>Il réduit le risque d&apos;impayé</h3>
            <p>
              Si un client disparaît en cours de mission, vous n&apos;avez pas tout perdu. L&apos;acompte encaissé représente une partie du travail déjà rémunérée. C&apos;est votre filet de sécurité.
            </p>

            <h3>Il améliore votre trésorerie</h3>
            <p>
              Encaisser de l&apos;argent avant de commencer à travailler, c&apos;est le meilleur moyen de ne jamais être en tension de trésorerie en attendant que les factures soient réglées.
            </p>

            <div className="warning-box">
              <p>
                <strong>Attention :</strong> Ne jamais commencer une mission sans acompte encaissé, même si le client vous dit &quot;je te fais confiance&quot;. Les impayés arrivent le plus souvent avec des clients qu&apos;on pensait sérieux.
              </p>
            </div>

            <h2 id="montant">Quel montant d&apos;acompte demander ?</h2>

            <p>
              Il n&apos;existe pas de règle légale qui fixe le montant d&apos;un acompte. C&apos;est librement négocié entre les parties. En pratique, voici les trois niveaux les plus courants chez les freelances :
            </p>

            <div className="percent-grid">
              <div className="percent-card">
                <div className="pct">30%</div>
                <div className="pct-label">Le standard</div>
                <div className="pct-desc">Accepté facilement par la plupart des clients. Idéal pour les missions courtes ou les nouveaux clients.</div>
              </div>
              <div className="percent-card">
                <div className="pct">50%</div>
                <div className="pct-label">La sécurité</div>
                <div className="pct-desc">Recommandé pour les missions longues, les gros montants ou si vous avez des doutes sur la solvabilité du client.</div>
              </div>
              <div className="percent-card">
                <div className="pct">100%</div>
                <div className="pct-label">Le prépayé</div>
                <div className="pct-desc">Pour les petites missions (design, rédaction), les nouveaux clients inconnus ou les clients étrangers.</div>
              </div>
            </div>

            <h3>Adapter selon la situation</h3>

            <p>
              Le bon montant dépend de plusieurs facteurs : la durée de la mission, le montant total, votre relation avec le client et le niveau de risque perçu.
            </p>

            <div className="example-block">
              <div className="example-label">💡 Exemples concrets</div>
              <p><strong>Mission de 500 € (logo) → 100 % prépayé.</strong> Le temps passé est trop court pour justifier un risque d&apos;impayé.</p>
              <p><strong>Mission de 3 000 € (site web) → 30 à 50 %.</strong> Un acompte de 900 à 1 500 € est standard et raisonnable.</p>
              <p><strong>Mission de 10 000 € (refonte complète) → 30 % à la commande, 40 % à mi-parcours, 30 % à la livraison.</strong> Un échéancier en 3 fois sécurise tout le monde.</p>
            </div>

            <div className="cta-inline">
              <h3>⚡ Créez votre devis avec acompte en 2 min</h3>
              <p>Notre générateur gratuit vous permet de mentionner l&apos;acompte directement dans les conditions de paiement. Sans inscription.</p>
              <a href="/devis-freelance" className="cta-btn">Générer un devis gratuit →</a>
            </div>

            <h2 id="formuler">Comment formuler la demande d&apos;acompte</h2>

            <p>
              La façon dont vous présentez l&apos;acompte est aussi importante que le montant. Voici comment l&apos;annoncer naturellement, sans que ça semble une méfiance envers le client.
            </p>

            <h3>Présentez-le comme une pratique standard</h3>
            <p>
              Ne vous excusez pas de demander un acompte. Présentez-le comme une procédure normale de votre activité, au même titre que signer un devis.
            </p>

            <div className="example-block">
              <div className="example-label">✉️ Formulation recommandée (à inclure dans votre email ou devis)</div>
              <p>
                &quot;Comme mentionné dans les conditions de paiement ci-dessous, je demande un acompte de 30 % à la signature du devis, soit <strong>450 € HT</strong>. Le solde de 70 % (1 050 € HT) sera facturé à la livraison finale.&quot;
              </p>
            </div>

            <h3>Liez-le au démarrage de la mission</h3>
            <p>
              Soyez explicite : <strong>la mission ne démarre qu&apos;après encaissement de l&apos;acompte</strong>. Ça évite les situations où vous travaillez pendant que le client tarde à virer.
            </p>

            <div className="example-block">
              <div className="example-label">💡 Clause à ajouter sur le devis</div>
              <p>&quot;Le démarrage de la mission est conditionné à la réception de l&apos;acompte de 30 % sur le compte bancaire du prestataire.&quot;</p>
            </div>

            <h2 id="devis">Comment mentionner l&apos;acompte sur le devis</h2>

            <p>
              L&apos;acompte doit apparaître clairement dans la section <strong>conditions de paiement</strong> de votre devis. Voici les informations à faire figurer :
            </p>

            <div className="checklist">
              <div className="checklist-title">📋 Ce qui doit apparaître sur le devis</div>
              <ul>
                <li>Le <strong>montant de l&apos;acompte</strong> en euros HT (et TTC si vous facturez la TVA)</li>
                <li>Le <strong>pourcentage</strong> correspondant (ex : 30 % du total HT)</li>
                <li>La <strong>date d&apos;exigibilité</strong> (ex : &quot;à la signature du devis&quot;)</li>
                <li>Le <strong>solde restant dû</strong> et sa date (ex : &quot;70 % à la livraison&quot;)</li>
                <li>Les <strong>coordonnées bancaires</strong> (IBAN + BIC) pour le virement</li>
                <li>La <strong>clause de démarrage</strong> conditionnée à l&apos;encaissement</li>
              </ul>
            </div>

            <div className="example-block">
              <div className="example-label">📄 Exemple de section conditions de paiement</div>
              <p><strong>Acompte :</strong> 30 % à la signature, soit 450,00 € HT — à régler par virement bancaire.</p>
              <p><strong>Solde :</strong> 70 % à la livraison, soit 1 050,00 € HT — sous 30 jours à réception de facture.</p>
              <p><strong>Le démarrage de la mission est conditionné à la réception de l&apos;acompte.</strong></p>
            </div>

            <h2 id="tva">Acompte et TVA : ce qu&apos;il faut savoir</h2>

            <p>
              Si vous êtes assujetti à la TVA, l&apos;acompte doit inclure la TVA. Et vous devez émettre une <strong>facture d&apos;acompte</strong> dès réception du paiement — pas seulement à la livraison finale.
            </p>

            <h3>Si vous êtes en franchise en base de TVA</h3>
            <p>
              Pas de TVA à collecter, donc pas de complexité : l&apos;acompte est mentionné HT, et c&apos;est aussi le montant TTC. Mentionnez simplement &quot;TVA non applicable, art. 293 B du CGI&quot; sur votre facture d&apos;acompte.
            </p>

            <h3>Si vous facturez la TVA</h3>
            <p>
              Vous devez émettre une facture d&apos;acompte avec TVA. La facture finale déduira l&apos;acompte déjà encaissé et n&apos;appellera que le solde restant dû.
            </p>

            <div className="info-box">
              <p>
                <strong>Exemple :</strong> Devis de 3 000 € HT avec TVA à 20 %. Acompte de 30 % = 900 € HT + 180 € TVA = <strong>1 080 € TTC</strong>. Vous émettez une facture d&apos;acompte de 1 080 € TTC dès réception du virement.
              </p>
            </div>

            <h2 id="refus">Que faire si le client refuse de payer l&apos;acompte ?</h2>

            <p>
              Un client qui refuse de verser un acompte n&apos;est pas forcément de mauvaise foi. Mais c&apos;est un signal qu&apos;il faut gérer intelligemment.
            </p>

            <h3>Comprendre la raison du refus</h3>
            <p>
              Parfois c&apos;est une question de process interne : certaines entreprises ne peuvent payer que sur facture, après service fait. Dans ce cas, demandez une <strong>lettre de commande signée</strong> et vérifiez la solvabilité de l&apos;entreprise.
            </p>

            <h3>Proposer un compromis</h3>
            <p>
              Si le client est solide mais refuse 30 %, proposez 10 ou 20 %. L&apos;objectif est d&apos;avoir un engagement financier, même symbolique.
            </p>

            <h3>Refuser la mission sans acompte</h3>
            <p>
              Pour les nouveaux clients ou les montants importants, ne pas accepter de travailler sans acompte est une position tout à fait légitime. Un client qui ne veut <em>vraiment</em> pas verser d&apos;acompte alors qu&apos;il a les moyens est un mauvais signal.
            </p>

            <div className="warning-box">
              <p>
                <strong>Règle d&apos;or :</strong> Ne commencez jamais à travailler avant d&apos;avoir l&apos;acompte sur votre compte. Pas le virement en attente — <strong>l&apos;argent reçu</strong>.
              </p>
            </div>

            <h2 id="checklist">Checklist acompte — récapitulatif</h2>

            <div className="checklist">
              <div className="checklist-title">✅ Avant de démarrer la mission</div>
              <ul>
                <li>Le montant de l&apos;acompte est mentionné sur le devis (en €, pas seulement en %)</li>
                <li>La condition de démarrage est écrite noir sur blanc</li>
                <li>Le devis est signé par les deux parties</li>
                <li>L&apos;acompte est effectivement reçu sur votre compte (pas juste promis)</li>
                <li>Une facture d&apos;acompte a été émise (si vous facturez la TVA)</li>
                <li>Le solde et sa date d&apos;exigibilité sont clairs</li>
              </ul>
            </div>

            <div className="cta-inline">
              <h3>Devis → Contrat → Facture en 1 clic ⚡</h3>
              <p>Créez un compte Spyke gratuit et gérez toute votre admin freelance depuis un seul endroit.</p>
              <a href="/connexion.html" className="cta-btn">Essayer gratuitement →</a>
            </div>

          </article>
        </div>

        <aside className="toc-sidebar" aria-label="Sommaire">
          <div className="toc-box">
            <div className="toc-title">📑 Sommaire</div>
            <ol className="toc-list">
              <li><a href="#definition">Qu&apos;est-ce qu&apos;un acompte ?</a></li>
              <li><a href="#pourquoi">Pourquoi demander un acompte</a></li>
              <li><a href="#montant">Quel montant demander ?</a></li>
              <li><a href="#formuler">Comment formuler la demande</a></li>
              <li><a href="#devis">Mention sur le devis</a></li>
              <li><a href="#tva">Acompte et TVA</a></li>
              <li><a href="#refus">Si le client refuse</a></li>
              <li><a href="#checklist">Checklist</a></li>
            </ol>
          </div>
        </aside>
      </div>

      <button type="button" className="toc-fab" data-toc-open>
        📑 Sommaire
      </button>
      <div className="toc-overlay" data-toc-overlay />
      <div className="toc-drawer" data-toc-drawer>
        <div className="toc-drawer-head">
          <div className="toc-drawer-title">Sommaire</div>
          <button type="button" className="toc-drawer-close" aria-label="Fermer le sommaire" data-toc-close>Fermer</button>
        </div>
        <ol className="toc-list">
          <li><a href="#definition">Qu&apos;est-ce qu&apos;un acompte ?</a></li>
          <li><a href="#pourquoi">Pourquoi demander un acompte</a></li>
          <li><a href="#montant">Quel montant demander ?</a></li>
          <li><a href="#formuler">Comment formuler la demande</a></li>
          <li><a href="#devis">Mention sur le devis</a></li>
          <li><a href="#tva">Acompte et TVA</a></li>
          <li><a href="#refus">Si le client refuse</a></li>
          <li><a href="#checklist">Checklist</a></li>
        </ol>
      </div>

      {/* RELATED */}
      <section className="related">
        <h2>Pour aller plus loin</h2>
        <div className="related-grid">
          <a href="/blog/comment-faire-devis-freelance" className="related-card">
            <div className="related-card-tag">Devis</div>
            <h3>Comment faire un devis freelance professionnel</h3>
            <p>Mentions obligatoires, structure, erreurs à éviter et checklist complète.</p>
          </a>
          <a href="/blog/relancer-client-impaye-freelance" className="related-card">
            <div className="related-card-tag">Relances</div>
            <h3>Comment relancer un client qui ne paye pas</h3>
            <p>3 templates d&apos;emails de relance, du rappel amical à la mise en demeure.</p>
          </a>
          <a href="/devis-freelance" className="related-card">
            <div className="related-card-tag">Outil gratuit</div>
            <h3>Générer un devis freelance en PDF</h3>
            <p>Avec acompte, conditions de paiement et IBAN intégrés. Gratuit, sans inscription.</p>
          </a>
          <a href="/blog/contrat-prestation-freelance-clauses-essentielles" className="related-card">
            <div className="related-card-tag">Contrats</div>
            <h3>Les 10 clauses indispensables du contrat freelance</h3>
            <p>Protégez-vous avec un contrat béton avant chaque mission.</p>
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
            <a href="/cgu.html">CGU</a>
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
            '@type': 'BlogPosting',
            headline: 'Acompte sur devis freelance : comment le demander et quel montant ?',
            description: 'Pourquoi demander un acompte, quel pourcentage choisir, comment le formuler sur le devis et quoi faire si le client refuse.',
            datePublished: '2026-05-21',
            dateModified: '2026-05-21',
            author: { '@type': 'Organization', name: 'Spyke' },
            publisher: { '@type': 'Organization', name: 'Spyke', url: 'https://spykeapp.fr' },
            mainEntityOfPage: 'https://spykeapp.fr/blog/acompte-devis-freelance',
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
                name: 'Quel pourcentage d\'acompte demander en freelance ?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Le standard est de 30 % pour la plupart des missions. Pour les missions longues ou les gros montants, 50 % est recommandé. Pour les petites missions ou les clients inconnus, 100 % prépayé est tout à fait possible.',
                },
              },
              {
                '@type': 'Question',
                name: 'L\'acompte est-il obligatoire en freelance ?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Non, l\'acompte n\'est pas légalement obligatoire. Mais il est fortement recommandé car il engage le client, protège contre les impayés et couvre les frais de démarrage de la mission.',
                },
              },
              {
                '@type': 'Question',
                name: 'Quelle est la différence entre acompte et arrhes ?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Les arrhes permettent à l\'une ou l\'autre partie de se désengager (le client perd les arrhes, le prestataire rembourse le double). L\'acompte engage définitivement les deux parties. En freelance, l\'acompte est quasi-systématiquement utilisé car il offre une meilleure protection.',
                },
              },
            ],
          }),
        }}
      />

      <script
        defer
        dangerouslySetInnerHTML={{
          __html: `
            (function(){
              function qs(sel){return document.querySelector(sel)}
              var openBtn = qs('[data-toc-open]');
              var overlay = qs('[data-toc-overlay]');
              var drawer = qs('[data-toc-drawer]');
              var closeBtn = qs('[data-toc-close]');
              if (!openBtn || !overlay || !drawer || !closeBtn) return;
              function open(){ overlay.style.display='block'; drawer.classList.add('open'); document.documentElement.style.overflow='hidden'; }
              function close(){ overlay.style.display='none'; drawer.classList.remove('open'); document.documentElement.style.overflow=''; }
              openBtn.addEventListener('click', open);
              closeBtn.addEventListener('click', close);
              overlay.addEventListener('click', close);
              drawer.addEventListener('click', function(e){ var a = e.target && e.target.closest ? e.target.closest('a[href^="#"]') : null; if (a) close(); });
            })();
          `,
        }}
      />
      <script
        defer
        dangerouslySetInnerHTML={{
          __html: `
            (function(){
              var btn = document.querySelector('[data-mobile-nav-toggle]');
              var links = document.querySelector('.nav-links');
              if (!btn || !links) return;
              btn.addEventListener('click', function(){ var open = links.classList.toggle('open'); btn.setAttribute('aria-expanded', String(open)); });
              document.addEventListener('click', function(e){ if (!btn.contains(e.target) && !links.contains(e.target)){ links.classList.remove('open'); btn.setAttribute('aria-expanded','false'); } });
            })();
          `,
        }}
      />
    </>
  )
}
