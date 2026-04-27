export default function BlogContratClausesPage() {
  return (
    <>
      <style>{`
        *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
        :root {
          --black: #0a0a0a; --white: #ffffff; --yellow: #facc15; --yellow-dark: #eab308;
          --gray-300: #d4d4d8; --gray-400: #a1a1aa; --gray-500: #71717a; --gray-600: #52525b;
          --gray-700: #3f3f46; --gray-800: #27272a; --gray-900: #18181b;
          --font-display: 'Syne', sans-serif; --font-body: 'DM Sans', sans-serif;
        }
        body { font-family: var(--font-body); background: var(--black); color: var(--gray-300); -webkit-font-smoothing: antialiased; line-height: 1.75; }
        a { color: var(--yellow); text-decoration: none; }
        a:hover { text-decoration: underline; }

        nav { position: sticky; top: 0; z-index: 100; background: rgba(10,10,10,0.92); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border-bottom: 1px solid rgba(255,255,255,0.06); padding: 0 24px; }
        .nav-inner { max-width: 1200px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; height: 64px; }
        .nav-logo { display: flex; align-items: center; gap: 10px; font-family: var(--font-display); font-weight: 700; font-size: 1.25rem; color: var(--white); text-decoration: none; }
        .nav-logo:hover { text-decoration: none; }
        .nav-logo-icon { width: 36px; height: 36px; background: var(--gray-800); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; }
        .nav-links { display: flex; align-items: center; gap: 28px; list-style: none; }
        .nav-links a { font-size: 0.9rem; color: var(--gray-400); transition: color 0.2s; text-decoration: none; }
        .nav-links a:hover { color: var(--white); text-decoration: none; }
        .nav-cta { background: var(--yellow); color: var(--black); padding: 8px 18px; border-radius: 8px; font-weight: 600; font-size: 0.88rem; transition: background 0.2s; }
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

        .article-hero { max-width: 800px; margin: 0 auto; padding: 64px 24px 40px; animation: fadeUp 0.7s ease-out; }
        .breadcrumb { display: flex; align-items: center; gap: 8px; font-size: 0.82rem; color: var(--gray-500); margin-bottom: 28px; flex-wrap: wrap; }
        .breadcrumb a { color: var(--gray-400); text-decoration: none; }
        .breadcrumb a:hover { color: var(--yellow); }
        .breadcrumb span { color: var(--gray-600); }
        .article-tag-top { display: inline-flex; align-items: center; gap: 6px; background: rgba(250,204,21,0.12); color: var(--yellow); padding: 5px 14px; border-radius: 6px; font-size: 0.78rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 20px; }
        .article-hero h1 { font-family: var(--font-display); font-size: clamp(2rem, 4.5vw, 2.8rem); font-weight: 800; line-height: 1.18; color: var(--white); margin-bottom: 20px; letter-spacing: -0.02em; }
        .article-hero-desc { font-size: 1.12rem; color: var(--gray-400); line-height: 1.7; margin-bottom: 28px; }
        .article-meta { display: flex; flex-wrap: wrap; align-items: center; gap: 20px; padding-top: 24px; border-top: 1px solid rgba(255,255,255,0.06); font-size: 0.85rem; color: var(--gray-500); }
        .article-meta span { display: flex; align-items: center; gap: 6px; }

        .toc { max-width: 800px; margin: 0 auto 48px; padding: 0 24px; animation: fadeUp 0.7s ease-out 0.1s both; }
        .toc-box { background: var(--gray-900); border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; padding: 28px 32px; }
        .toc-title { font-family: var(--font-display); font-size: 0.95rem; font-weight: 700; color: var(--white); margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
        .toc-list { list-style: none; counter-reset: toc; }
        .toc-list li { counter-increment: toc; margin-bottom: 8px; }
        .toc-list li a { display: flex; align-items: baseline; gap: 10px; font-size: 0.92rem; color: var(--gray-400); text-decoration: none; transition: color 0.2s, padding-left 0.2s; padding: 4px 0; }
        .toc-list li a:hover { color: var(--yellow); padding-left: 4px; text-decoration: none; }
        .toc-list li a::before { content: counter(toc, decimal-leading-zero); font-family: var(--font-display); font-weight: 700; font-size: 0.78rem; color: var(--yellow); min-width: 22px; }

        .article-content { max-width: 800px; margin: 0 auto; padding: 0 24px 60px; animation: fadeUp 0.7s ease-out 0.2s both; }
        .article-content h2 { font-family: var(--font-display); font-size: 1.55rem; font-weight: 700; color: var(--white); margin: 56px 0 20px; padding-top: 32px; border-top: 1px solid rgba(255,255,255,0.06); line-height: 1.3; letter-spacing: -0.01em; }
        .article-content h2:first-child { margin-top: 0; padding-top: 0; border-top: none; }
        .article-content h3 { font-family: var(--font-display); font-size: 1.15rem; font-weight: 600; color: var(--white); margin: 36px 0 14px; line-height: 1.35; }
        .article-content p { font-size: 1.02rem; line-height: 1.8; margin-bottom: 20px; color: var(--gray-300); }
        .article-content strong { color: var(--white); font-weight: 600; }

        .clause-card { background: var(--gray-900); border: 1px solid rgba(255,255,255,0.06); border-radius: 14px; padding: 28px; margin: 28px 0; position: relative; overflow: hidden; }
        .clause-card::before { content: ''; position: absolute; top: 0; left: 0; width: 4px; height: 100%; border-radius: 4px 0 0 4px; }
        .clause-card.essential::before { background: var(--yellow); }
        .clause-card.protection::before { background: #22c55e; }
        .clause-card.financial::before { background: #3b82f6; }
        .clause-card.exit::before { background: #f97316; }

        .clause-number { font-family: var(--font-display); font-weight: 800; font-size: 2.2rem; line-height: 1; position: absolute; top: 16px; right: 24px; }
        .clause-card.essential .clause-number { color: rgba(250,204,21,0.12); }
        .clause-card.protection .clause-number { color: rgba(34,197,94,0.12); }
        .clause-card.financial .clause-number { color: rgba(59,130,246,0.12); }
        .clause-card.exit .clause-number { color: rgba(249,115,22,0.12); }

        .clause-badge { display: inline-block; font-size: 0.68rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; padding: 3px 10px; border-radius: 4px; margin-bottom: 10px; }
        .clause-card.essential .clause-badge { background: rgba(250,204,21,0.12); color: var(--yellow); }
        .clause-card.protection .clause-badge { background: rgba(34,197,94,0.12); color: #22c55e; }
        .clause-card.financial .clause-badge { background: rgba(59,130,246,0.12); color: #3b82f6; }
        .clause-card.exit .clause-badge { background: rgba(249,115,22,0.12); color: #f97316; }

        .clause-card h3 { font-family: var(--font-display); font-size: 1.1rem; font-weight: 700; color: var(--white); margin: 0 0 10px; }
        .clause-card p { font-size: 0.95rem; margin-bottom: 0; color: var(--gray-400); line-height: 1.7; }
        .clause-card p + p { margin-top: 12px; }
        .clause-example { margin-top: 14px; padding: 14px 18px; background: rgba(255,255,255,0.03); border-radius: 8px; font-size: 0.88rem; color: var(--gray-400); border-left: 3px solid rgba(255,255,255,0.08); line-height: 1.7; }
        .clause-example strong { color: var(--gray-300); }

        .info-box { background: rgba(250,204,21,0.06); border-left: 4px solid var(--yellow); border-radius: 0 12px 12px 0; padding: 20px 24px; margin: 28px 0; }
        .info-box p { margin-bottom: 0; font-size: 0.95rem; color: var(--gray-300); }
        .info-box strong { color: var(--yellow); }
        .warning-box { background: rgba(239,68,68,0.06); border-left: 4px solid #ef4444; border-radius: 0 12px 12px 0; padding: 20px 24px; margin: 28px 0; }
        .warning-box p { margin-bottom: 0; font-size: 0.95rem; }
        .warning-box strong { color: #ef4444; }

        .checklist { background: var(--gray-900); border: 1px solid rgba(255,255,255,0.06); border-radius: 14px; padding: 28px; margin: 28px 0; }
        .checklist-title { font-family: var(--font-display); font-weight: 700; font-size: 1rem; color: var(--white); margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
        .checklist ul { list-style: none; }
        .checklist li { padding: 6px 0; font-size: 0.95rem; color: var(--gray-300); display: flex; align-items: baseline; gap: 10px; line-height: 1.6; }
        .checklist li::before { content: '✓'; color: var(--yellow); font-weight: 700; flex-shrink: 0; }

        .cta-inline { background: linear-gradient(135deg, var(--gray-900), #1a1520); border: 1px solid rgba(250,204,21,0.12); border-radius: 16px; padding: 36px 32px; margin: 40px 0; text-align: center; position: relative; overflow: hidden; }
        .cta-inline::before { content: ''; position: absolute; width: 250px; height: 250px; background: radial-gradient(circle, rgba(250,204,21,0.06), transparent 70%); top: -80px; right: -80px; }
        .cta-inline h3 { font-family: var(--font-display); font-size: 1.3rem; color: var(--white); margin-bottom: 10px; position: relative; }
        .cta-inline p { color: var(--gray-400); font-size: 0.95rem; margin-bottom: 22px; position: relative; }
        .cta-btn { display: inline-block; background: var(--yellow); color: var(--black); padding: 13px 28px; border-radius: 10px; font-weight: 700; font-size: 0.95rem; font-family: var(--font-display); transition: background 0.2s, transform 0.2s; position: relative; text-decoration: none; }
        .cta-btn:hover { background: var(--yellow-dark); transform: translateY(-2px); text-decoration: none; }

        .related { max-width: 800px; margin: 0 auto; padding: 0 24px 64px; }
        .related h2 { font-family: var(--font-display); font-size: 1.3rem; font-weight: 700; color: var(--white); margin-bottom: 24px; padding-left: 16px; border-left: 4px solid var(--yellow); }
        .related-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
        .related-card { background: var(--gray-900); border: 1px solid rgba(255,255,255,0.06); border-radius: 14px; padding: 24px; transition: transform 0.3s, border-color 0.3s; text-decoration: none; display: block; }
        .related-card:hover { transform: translateY(-3px); border-color: rgba(250,204,21,0.15); text-decoration: none; }
        .related-card-tag { font-size: 0.72rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--yellow); margin-bottom: 8px; }
        .related-card h3 { font-family: var(--font-display); font-size: 1rem; font-weight: 600; color: var(--white); line-height: 1.35; margin-bottom: 8px; transition: color 0.2s; }
        .related-card:hover h3 { color: var(--yellow); }
        .related-card p { font-size: 0.84rem; color: var(--gray-500); line-height: 1.5; }
        @media (max-width: 600px) { .related-grid { grid-template-columns: 1fr; } }

        footer { border-top: 1px solid rgba(255,255,255,0.06); padding: 40px 24px; text-align: center; }
        .footer-inner { max-width: 1200px; margin: 0 auto; }
        .footer-links { display: flex; flex-wrap: wrap; justify-content: center; gap: 24px; margin-bottom: 20px; }
        .footer-links a { font-size: 0.85rem; color: var(--gray-500); transition: color 0.2s; text-decoration: none; }
        .footer-links a:hover { color: var(--white); text-decoration: none; }
        .footer-copy { font-size: 0.8rem; color: var(--gray-600); }

        /* Sticky TOC layout */
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

        /* Mobile drawer */
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

        @keyframes fadeUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
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
          <a href="/">Spyke</a><span>›</span><a href="/blog">Blog</a><span>›</span><span>Contrat prestation freelance</span>
        </div>
        <div className="article-tag-top">📋 Contrats</div>
        <h1>Contrat de prestation freelance : les 10 clauses indispensables</h1>
        <p className="article-hero-desc">
          Un bon contrat vous protège des litiges, des impayés et des malentendus. Voici les 10 clauses que chaque
          freelance devrait inclure dans ses contrats de prestation, avec des exemples concrets et les pièges à éviter.
        </p>
        <div className="article-meta">
          <span>📅 16 février 2026</span>
          <span>⏱ 9 min de lecture</span>
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
                <li><a href="#pourquoi">Pourquoi un contrat est indispensable</a></li>
                <li><a href="#devis-contrat">Devis signé vs contrat : quelle différence ?</a></li>
                <li><a href="#clauses">Les 10 clauses indispensables</a></li>
                <li><a href="#pieges">Les pièges à repérer dans un contrat client</a></li>
                <li><a href="#conseils">Conseils de rédaction</a></li>
                <li><a href="#checklist">Checklist avant signature</a></li>
              </ol>
            </div>
          </section>

          {/* CONTENT */}
          <article className="article-content">
        <h2 id="pourquoi">Pourquoi un contrat est indispensable quand on est freelance</h2>

        <p>
          Le contrat de prestation, c&apos;est votre assurance. Tant que tout se passe bien avec un client, personne
          n&apos;y pense. Mais le jour où un désaccord survient — et ça arrive tôt ou tard — c&apos;est le contrat qui
          tranche.
        </p>

        <p>
          Sans contrat, vous n&apos;avez <strong>aucune protection</strong> sur des sujets critiques : qui possède le
          travail que vous avez produit ? Que se passe-t-il si le client change d&apos;avis à mi-parcours ? Quelles
          sont les conséquences s&apos;il ne paye pas ? Pouvez-vous réutiliser le travail dans votre portfolio ? Toutes
          ces questions méritent une réponse écrite <strong>avant</strong> le début de la mission.
        </p>

        <p>
          Un contrat bien rédigé fait trois choses : il <strong>clarifie les attentes</strong> des deux côtés, il{' '}
          <strong>prévient les litiges</strong> en anticipant les situations problématiques, et il{' '}
          <strong>fournit un cadre de résolution</strong> quand un problème survient malgré tout.
        </p>

        <div className="info-box">
          <p>
            <strong>Bon à savoir :</strong> Vous n&apos;avez pas besoin d&apos;un avocat pour rédiger un contrat de prestation
            freelance. Un modèle bien structuré avec les bonnes clauses suffit pour la grande majorité des missions.
            C&apos;est quand les montants deviennent importants (&gt; 10 000 €) qu&apos;une relecture juridique est recommandée.
          </p>
        </div>

        <h2 id="devis-contrat">Devis signé vs contrat de prestation : quelle différence ?</h2>

        <p>Beaucoup de freelances se demandent s&apos;ils ont besoin d&apos;un contrat en plus du devis signé. La réponse courte : ça dépend de la mission.</p>

        <p>
          Le <strong>devis signé</strong> a valeur contractuelle. Il engage les deux parties sur le périmètre, le prix et
          les délais. Pour une mission courte et simple (créer un logo, rédiger un article, une intervention d&apos;une
          journée), un devis signé suffit généralement.
        </p>

        <p>
          Le <strong>contrat de prestation</strong> va plus loin. Il ajoute des clauses juridiques que le devis ne couvre
          pas : propriété intellectuelle, confidentialité, limitation de responsabilité, conditions de résiliation,
          etc. Pour les missions longues, les projets complexes ou les montants importants, le contrat est
          indispensable.
        </p>

        <p>
          En pratique, le workflow idéal est : <strong>devis signé</strong> (qui détaille les prestations et le prix) +{' '}
          <strong>contrat signé</strong> (qui encadre juridiquement la relation). Le devis peut être annexé au contrat,
          les deux se complètent.
        </p>

        <h2 id="clauses">Les 10 clauses indispensables</h2>

        <p>Voici les 10 clauses que chaque contrat de prestation freelance devrait contenir, organisées par catégorie.</p>

        <div className="clause-card essential">
          <div className="clause-number">01</div>
          <div className="clause-badge">Essentiel</div>
          <h3>Identification des parties</h3>
          <p>
            Le contrat commence par identifier clairement les deux parties : vous (le prestataire) et votre client (le
            commanditaire). Pour chacun : nom complet ou raison sociale, adresse, SIRET, et le représentant légal si
            c&apos;est une société. C&apos;est la base juridique de tout contrat.
          </p>
          <div className="clause-example">
            <strong>Exemple :</strong> &quot;Entre M. [Votre nom], exerçant sous le statut de micro-entrepreneur, SIRET [numéro],
            domicilié au [adresse], ci-après dénommé &apos;le Prestataire&apos;, et la société [Nom client], SIRET [numéro],
            représentée par M./Mme [nom], ci-après dénommée &apos;le Client&apos;.&quot;
          </div>
        </div>

        <div className="clause-card essential">
          <div className="clause-number">02</div>
          <div className="clause-badge">Essentiel</div>
          <h3>Objet et périmètre de la mission</h3>
          <p>
            La clause la plus importante. Elle décrit <strong>précisément</strong> ce que vous allez faire, les livrables
            attendus, et surtout ce qui est <strong>exclu</strong> du périmètre. Plus vous êtes précis ici, moins vous
            aurez de malentendus.
          </p>
          <p>
            Détaillez les livrables (quoi), les étapes (comment), les délais (quand), et les limites (ce qui n&apos;est
            pas inclus). Si un cahier des charges existe, annexez-le au contrat.
          </p>
          <div className="clause-example">
            <strong>Exemple :</strong> &quot;Le Prestataire s&apos;engage à réaliser la création d&apos;un site vitrine composé de 5
            pages (Accueil, Services, À propos, Blog, Contact) sous WordPress. Les livrables incluent : maquettes,
            intégration, mise en ligne, formation de 1h. Sont exclus : rédaction de contenu, hébergement, maintenance
            post-livraison.&quot;
          </div>
        </div>

        <div className="clause-card financial">
          <div className="clause-number">03</div>
          <div className="clause-badge">Financier</div>
          <h3>Prix et modalités de paiement</h3>
          <p>
            Le montant total de la prestation (HT et TTC), le calendrier de paiement (acompte, jalons, solde), le
            délai de paiement, les moyens de paiement acceptés, et la mention de TVA. Si le tarif est au forfait,
            précisez-le. S&apos;il est au temps passé, indiquez le TJM ou le taux horaire et une estimation.
          </p>
          <div className="clause-example">
            <strong>Exemple :</strong> &quot;Le montant total de la prestation est fixé à 3 000 € HT. Paiement en 3 échéances :
            30 % à la signature (900 €), 40 % à la validation des maquettes (1 200 €), 30 % à la livraison (900 €).
            Paiement par virement bancaire sous 30 jours.&quot;
          </div>
        </div>

        <div className="clause-card financial">
          <div className="clause-number">04</div>
          <div className="clause-badge">Financier</div>
          <h3>Pénalités de retard</h3>
          <p>
            Indiquez le taux de pénalités de retard applicable en cas de non-paiement à l&apos;échéance, ainsi que
            l&apos;indemnité forfaitaire de recouvrement de 40 €. Cette clause est non seulement recommandée, elle est{' '}
            <strong>obligatoire</strong> entre professionnels.
          </p>
          <div className="clause-example">
            <strong>Exemple :</strong> &quot;Tout retard de paiement entraînera l&apos;application de pénalités calculées au taux
            de 3 fois le taux d&apos;intérêt légal, exigibles sans qu&apos;un rappel soit nécessaire. Une indemnité forfaitaire
            de 40 € pour frais de recouvrement sera également due de plein droit.&quot;
          </div>
        </div>

        <div className="clause-card essential">
          <div className="clause-number">05</div>
          <div className="clause-badge">Essentiel</div>
          <h3>Durée et calendrier</h3>
          <p>
            La date de début de la mission, la date de livraison prévue, et les éventuels jalons intermédiaires. Si la
            mission est récurrente (TJM, mission au long cours), précisez la durée du contrat et les conditions de
            reconduction.
          </p>
          <p>
            Pensez aussi à mentionner ce qui se passe si le <strong>client cause un retard</strong> (validation tardive,
            absence de retour, changement de brief) : dans ce cas, les délais sont décalés d&apos;autant.
          </p>
        </div>

        <div className="clause-card protection">
          <div className="clause-number">06</div>
          <div className="clause-badge">Protection</div>
          <h3>Propriété intellectuelle</h3>
          <p>
            C&apos;est la clause que les freelances oublient le plus souvent, et c&apos;est pourtant l&apos;une des plus
            critiques. Elle détermine <strong>qui possède le travail</strong> une fois la mission terminée.
          </p>
          <p>
            Deux options principales : la <strong>cession totale</strong> (le client devient propriétaire de tout) ou la{' '}
            <strong>licence d&apos;utilisation</strong> (vous restez propriétaire mais accordez un droit d&apos;usage). La
            cession totale est la plus courante pour les missions freelance, mais elle doit être explicitement
            formulée et peut justifier un tarif plus élevé.
          </p>
          <div className="clause-example">
            <strong>Exemple :</strong> &quot;Le Prestataire cède au Client, à compter du paiement intégral, l&apos;ensemble des
            droits de propriété intellectuelle sur les livrables, pour tous supports et pour le monde entier. Le
            Prestataire conserve le droit de mentionner la réalisation dans son portfolio à titre de référence.&quot;
          </div>
        </div>

        <div className="clause-card protection">
          <div className="clause-number">07</div>
          <div className="clause-badge">Protection</div>
          <h3>Confidentialité</h3>
          <p>
            Si votre client vous donne accès à des informations sensibles (données clients, stratégie commerciale,
            code source), une clause de confidentialité est nécessaire. Elle engage les deux parties à ne pas divulguer
            les informations échangées dans le cadre de la mission.
          </p>
          <p>
            Précisez la durée de l&apos;obligation de confidentialité (généralement 2 à 5 ans après la fin de la mission)
            et les exceptions (informations déjà publiques, obligation légale).
          </p>
        </div>

        <div className="clause-card protection">
          <div className="clause-number">08</div>
          <div className="clause-badge">Protection</div>
          <h3>Limitation de responsabilité</h3>
          <p>
            Cette clause limite votre responsabilité financière en cas de problème. Sans elle, vous pourriez
            théoriquement être tenu responsable de dommages bien supérieurs au montant de votre prestation.
          </p>
          <p>
            La formulation classique limite votre responsabilité au <strong>montant total de la prestation facturée</strong>.
            Vous pouvez aussi exclure les dommages indirects (manque à gagner, perte de données, etc.).
          </p>
          <div className="clause-example">
            <strong>Exemple :</strong> &quot;La responsabilité du Prestataire est limitée au montant total HT perçu au titre
            du contrat. Le Prestataire ne pourra en aucun cas être tenu responsable des dommages indirects, incluant
            le manque à gagner, la perte de données ou l&apos;atteinte à l&apos;image.&quot;
          </div>
        </div>

        <div className="clause-card exit">
          <div className="clause-number">09</div>
          <div className="clause-badge">Sortie</div>
          <h3>Résiliation et annulation</h3>
          <p>
            Que se passe-t-il si le client veut arrêter en plein milieu ? Ou si vous ne pouvez plus assurer la mission
            ? Cette clause définit les conditions de sortie pour les deux parties.
          </p>
          <p>
            Précisez le préavis nécessaire (généralement 15 à 30 jours), les conséquences financières (le travail déjà
            réalisé est dû), et les cas de résiliation immédiate (faute grave, non-paiement). C&apos;est cette clause qui
            vous protège si le client annule après que vous ayez commencé à travailler.
          </p>
          <div className="clause-example">
            <strong>Exemple :</strong> &quot;Chaque partie peut résilier le contrat avec un préavis de 15 jours par écrit.
            En cas de résiliation, le Client règle l&apos;intégralité des prestations réalisées et des acomptes prévus.
            En cas de non-paiement d&apos;une échéance, le Prestataire peut suspendre la mission et résilier le contrat de
            plein droit.&quot;
          </div>
        </div>

        <div className="clause-card exit">
          <div className="clause-number">10</div>
          <div className="clause-badge">Sortie</div>
          <h3>Règlement des litiges</h3>
          <p>
            En cas de désaccord, comment le litige est-il résolu ? Cette clause indique la juridiction compétente (le
            tribunal de votre domicile, idéalement) et peut prévoir une étape de médiation avant toute action
            judiciaire.
          </p>
          <p>
            La médiation est souvent préférable au tribunal : c&apos;est plus rapide, moins cher et ça préserve mieux la
            relation commerciale. Mentionnez cette option dans le contrat.
          </p>
        </div>

        <div className="cta-inline">
          <h3>⚡ Générez votre contrat en 1 clic</h3>
          <p>Créez un devis sur Spyke, puis transformez-le en contrat avec toutes les clauses pré-remplies. Gratuit.</p>
          <a href="/contrat-freelance" className="cta-btn">Générer un contrat gratuit →</a>
        </div>

        <h2 id="pieges">Les pièges à repérer dans un contrat proposé par un client</h2>

        <p>
          Quand c&apos;est le client qui propose le contrat (fréquent avec les grandes entreprises), lisez chaque clause
          attentivement. Voici les red flags les plus courants.
        </p>

        <h3>La cession de droits &quot;gratuite et totale&quot;</h3>
        <p>
          Certains contrats incluent une cession de propriété intellectuelle très large sans contrepartie spécifique.
          Si le client veut tous les droits, y compris la revente et l&apos;adaptation, ça a une valeur qui devrait se
          refléter dans le prix. N&apos;hésitez pas à négocier.
        </p>

        <h3>La clause d&apos;exclusivité</h3>
        <p>
          Certains contrats vous interdisent de travailler pour des concurrents, voire pour d&apos;autres clients tout
          court. En tant que freelance, l&apos;exclusivité est un frein majeur à votre activité. Si elle est justifiée,
          elle doit être limitée dans le temps et compensée financièrement.
        </p>

        <h3>Les modifications illimitées</h3>
        <p>
          Un contrat qui ne limite pas le nombre de modifications est un piège classique. Le client peut demander des
          changements indéfiniment sans coût supplémentaire. Précisez toujours un nombre de tours de modification
          inclus (par exemple 2 ou 3 tours), au-delà desquels des frais supplémentaires s&apos;appliquent.
        </p>

        <h3>Le délai de paiement excessif</h3>
        <p>
          Certaines grandes entreprises imposent des délais de 60 jours, voire plus. La loi plafonne le délai à 60
          jours date de facture. Si le contrat prévoit un délai supérieur, il est illégal. N&apos;hésitez pas à le
          signaler.
        </p>

        <div className="warning-box">
          <p>
            <strong>Règle d&apos;or :</strong> Ne signez jamais un contrat que vous n&apos;avez pas lu intégralement. Demandez
            du temps si nécessaire. Un client qui refuse que vous lisiez le contrat avant de signer n&apos;est pas un
            client avec qui vous voulez travailler.
          </p>
        </div>

        <h2 id="conseils">Conseils pratiques pour la rédaction</h2>

        <h3>Rédigez en langage clair</h3>
        <p>
          Un contrat n&apos;a pas besoin d&apos;être écrit en jargon juridique pour être valide. Un langage simple et précis
          est même préférable : en cas de litige, un juge interprète le contrat selon le sens commun des mots. Évitez
          les formulations ambiguës qui pourraient être interprétées différemment par chaque partie.
        </p>

        <h3>Utilisez un modèle que vous adaptez</h3>
        <p>
          Partez d&apos;un modèle de base que vous personnalisez pour chaque mission. Les clauses 1 (identité), 6
          (propriété intellectuelle) et 9 (résiliation) changent le plus souvent d&apos;un projet à l&apos;autre. Les autres
          clauses restent généralement stables.
        </p>

        <h3>Faites signer les deux parties</h3>
        <p>
          Un contrat non signé n&apos;a pas de valeur. Assurez-vous que les deux parties signent, avec la mention &quot;Lu et
          approuvé&quot; et la date. La signature électronique est parfaitement valide en France.
        </p>

        <h3>Annexez le devis</h3>
        <p>
          Le contrat définit le cadre juridique, le devis détaille les prestations et les prix. Les deux se
          complètent. Annexez le devis signé au contrat pour que l&apos;ensemble soit cohérent et complet.
        </p>

        <h2 id="checklist">Checklist avant signature</h2>

        <div className="checklist">
          <div className="checklist-title">📋 Votre contrat contient-il...</div>
          <ul>
            <li>L&apos;identification complète des deux parties (nom, adresse, SIRET)</li>
            <li>La description précise de la mission et des livrables</li>
            <li>Les exclusions (ce qui n&apos;est pas inclus)</li>
            <li>Le prix, le calendrier de paiement et les moyens de paiement</li>
            <li>Les pénalités de retard et l&apos;indemnité de 40 €</li>
            <li>Les dates de début et de fin de mission</li>
            <li>La clause de propriété intellectuelle</li>
            <li>La clause de confidentialité (si nécessaire)</li>
            <li>La limitation de responsabilité</li>
            <li>Les conditions de résiliation et le préavis</li>
            <li>La clause de règlement des litiges</li>
            <li>Les signatures des deux parties avec date</li>
            <li>Le devis signé en annexe</li>
          </ul>
        </div>

        <p>
          Un contrat bien rédigé, c&apos;est quelques heures d&apos;investissement qui peuvent vous éviter des mois de galère.
          Prenez le temps de le soigner pour chaque mission importante — votre tranquillité d&apos;esprit en dépend.
        </p>

        <div className="cta-inline">
          <h3>Devis → Contrat → Facture en 1 clic ⚡</h3>
          <p>Spyke génère votre contrat à partir de votre devis, avec toutes les clauses pré-remplies.</p>
          <a href="/connexion.html" className="cta-btn">Essayer gratuitement →</a>
        </div>
      </article>
        </div>

        <aside className="toc-sidebar" aria-label="Sommaire">
          <div className="toc-box">
            <div className="toc-title">📑 Sommaire</div>
            <ol className="toc-list">
              <li><a href="#pourquoi">Pourquoi un contrat est indispensable</a></li>
              <li><a href="#devis-contrat">Devis signé vs contrat : quelle différence ?</a></li>
              <li><a href="#clauses">Les 10 clauses indispensables</a></li>
              <li><a href="#pieges">Les pièges à repérer dans un contrat client</a></li>
              <li><a href="#conseils">Conseils de rédaction</a></li>
              <li><a href="#checklist">Checklist avant signature</a></li>
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
          <button type="button" className="toc-drawer-close" aria-label="Fermer le sommaire" data-toc-close>
            Fermer
          </button>
        </div>
        <ol className="toc-list">
          <li><a href="#pourquoi">Pourquoi un contrat est indispensable</a></li>
          <li><a href="#devis-contrat">Devis signé vs contrat : quelle différence ?</a></li>
          <li><a href="#clauses">Les 10 clauses indispensables</a></li>
          <li><a href="#pieges">Les pièges à repérer dans un contrat client</a></li>
          <li><a href="#conseils">Conseils de rédaction</a></li>
          <li><a href="#checklist">Checklist avant signature</a></li>
        </ol>
      </div>

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

              function open(){
                overlay.style.display = 'block';
                drawer.classList.add('open');
                document.documentElement.style.overflow = 'hidden';
              }
              function close(){
                overlay.style.display = 'none';
                drawer.classList.remove('open');
                document.documentElement.style.overflow = '';
              }

              openBtn.addEventListener('click', open);
              closeBtn.addEventListener('click', close);
              overlay.addEventListener('click', close);
              drawer.addEventListener('click', function(e){
                var a = e.target && e.target.closest ? e.target.closest('a[href^="#"]') : null;
                if (a) close();
              });
            })();
          `,
        }}
      />

      {/* RELATED */}
      <section className="related">
        <h2>Pour aller plus loin</h2>
        <div className="related-grid">
          <a href="/devis-freelance" className="related-card">
            <div className="related-card-tag">Devis</div>
            <h3>Générer un devis freelance (gratuit)</h3>
            <p>Mentions obligatoires + PDF pro en 2 minutes.</p>
          </a>
          <a href="/facture-auto-entrepreneur" className="related-card">
            <div className="related-card-tag">Factures</div>
            <h3>Générer une facture conforme (gratuit)</h3>
            <p>Facture auto-entrepreneur en PDF, mentions obligatoires incluses.</p>
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
            headline: 'Contrat de Prestation Freelance : les 10 Clauses Indispensables',
            description: "Les 10 clauses essentielles d'un contrat de prestation freelance en 2026.",
            datePublished: '2026-02-16',
            dateModified: '2026-02-16',
            author: { '@type': 'Organization', name: 'Spyke' },
            publisher: { '@type': 'Organization', name: 'Spyke', url: 'https://www.spykeapp.fr' },
            mainEntityOfPage: 'https://www.spykeapp.fr/blog/contrat-prestation-freelance-clauses-essentielles',
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
                name: 'Un freelance a-t-il besoin d\'un contrat de prestation ?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text:
                    "Le contrat n'est pas toujours obligatoire légalement, mais il est fortement recommandé. Un devis signé a valeur contractuelle, mais il ne couvre pas les clauses de confidentialité, propriété intellectuelle ou résiliation. Pour les missions longues ou à fort enjeu, un contrat est indispensable.",
                },
              },
              {
                '@type': 'Question',
                name: 'Quelle est la différence entre un devis signé et un contrat de prestation ?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text:
                    "Le devis signé fixe le périmètre, le prix et les délais. Le contrat de prestation va plus loin en ajoutant des clauses juridiques : propriété intellectuelle, confidentialité, responsabilité, conditions de résiliation, pénalités de retard, etc. Le contrat offre une protection plus complète.",
                },
              },
              {
                '@type': 'Question',
                name: 'Qui rédige le contrat de prestation : le freelance ou le client ?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text:
                    "Les deux sont possibles. En pratique, c'est souvent le freelance qui propose un modèle, surtout pour les petites missions. Pour les grandes entreprises, c'est souvent le client qui impose son contrat. Dans tous les cas, lisez chaque clause avant de signer et n'hésitez pas à négocier.",
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
              var btn = document.querySelector('[data-mobile-nav-toggle]');
              var links = document.querySelector('.nav-links');
              if (!btn || !links) return;
              btn.addEventListener('click', function(){
                var open = links.classList.toggle('open');
                btn.setAttribute('aria-expanded', String(open));
              });
              document.addEventListener('click', function(e){
                if (!btn.contains(e.target) && !links.contains(e.target)) {
                  links.classList.remove('open');
                  btn.setAttribute('aria-expanded', 'false');
                }
              });
            })();
          `,
        }}
      />
    </>
  )
}
