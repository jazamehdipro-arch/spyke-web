"use client"

export default function BlogRelanceImpayePage() {
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

        .template {
          background: var(--gray-900);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 14px;
          padding: 22px 24px;
          margin: 22px 0;
        }
        .template-title {
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 0.95rem;
          color: var(--white);
          margin-bottom: 12px;
        }
        .template pre {
          white-space: pre-wrap;
          word-wrap: break-word;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
          font-size: 0.88rem;
          line-height: 1.65;
          color: var(--gray-300);
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
          <span>Relances</span>
        </div>

        <div className="article-tag-top">📩 Relances</div>

        <h1>Comment relancer un client qui ne paye pas (sans ruiner la relation)</h1>

        <p className="article-hero-desc">
          3 templates d&apos;emails de relance testés et approuvés, du rappel amical à la mise en demeure. Avec le bon
          timing, les mentions à inclure, et les erreurs à éviter.
        </p>

        <div className="article-meta">
          <span>📅 16 février 2026</span>
          <span>⏱ 7 min de lecture</span>
          <span>✍️ Spyke</span>
        </div>
      </header>

      <section className="toc">
        <div className="toc-box">
          <div className="toc-title">📑 Sommaire</div>
          <ol className="toc-list">
            <li><a href="#avant">Avant de relancer : vérifications rapides</a></li>
            <li><a href="#timing">Le bon timing (J+1, J+7, J+15)</a></li>
            <li><a href="#templates">3 templates de relance (copier-coller)</a></li>
            <li><a href="#mise-en-demeure">Quand envoyer une mise en demeure</a></li>
            <li><a href="#prevention">Prévenir les impayés (contrat + acompte)</a></li>
          </ol>
        </div>
      </section>

      <article className="article-content">
        <h2 id="avant">Avant de relancer : les 3 vérifications qui évitent un faux pas</h2>
        <p>
          Avant d&apos;envoyer une relance, assurez-vous que la facture est correcte (montant, coordonnées, numéro, date,
          prestations), qu&apos;elle a bien été reçue (email, portail client) et que le délai de paiement est bien échu.
        </p>

        <div className="checklist">
          <div className="checklist-title">✅ Check express</div>
          <ul>
            <li>La facture a été envoyée au bon contact (compta + décisionnaire)</li>
            <li>Le RIB/IBAN est présent</li>
            <li>Le délai de paiement est clairement indiqué</li>
            <li>Les pénalités de retard et l&apos;indemnité de 40 € sont mentionnées (B2B)</li>
          </ul>
        </div>

        <h2 id="timing">Le bon timing de relance</h2>
        <p>
          Une relance efficace, c&apos;est surtout une relance au bon moment : assez tôt pour rester prioritaire, assez
          mesurée pour ne pas braquer.
        </p>

        <h3>Relance 1 — J+1 à J+3 (rappel amical)</h3>
        <p>Objectif : supposer la bonne foi (oubli, problème de process) et obtenir une date de paiement.</p>

        <h3>Relance 2 — J+7 à J+10 (ferme + date)</h3>
        <p>Objectif : demander une date précise et rappeler les conditions de paiement.</p>

        <h3>Relance 3 — J+15 à J+21 (dernier rappel avant procédure)</h3>
        <p>Objectif : annoncer clairement la prochaine étape (mise en demeure) si rien ne bouge.</p>

        <h2 id="templates">3 templates d&apos;emails de relance (copier-coller)</h2>

        <div className="template">
          <div className="template-title">Template 1 — Rappel amical</div>
          <pre>{`Objet : Facture n°[XXXX] — rappel

Bonjour [Prénom/Nom],

Je me permets de vous relancer au sujet de la facture n°[XXXX] d’un montant de [montant] €, arrivée à échéance le [date].

Pouvez-vous me confirmer qu’elle a bien été reçue et m’indiquer la date de règlement prévue ?

Merci d’avance,
[Signature]`}</pre>
        </div>

        <div className="template">
          <div className="template-title">Template 2 — Relance ferme + date</div>
          <pre>{`Objet : Facture n°[XXXX] — paiement attendu

Bonjour [Prénom/Nom],

Sauf erreur de ma part, la facture n°[XXXX] (échéance : [date]) n’a pas encore été réglée.

Merci de procéder au paiement sous 48h et de me confirmer une date de règlement.

Bien cordialement,
[Signature]`}</pre>
        </div>

        <div className="template">
          <div className="template-title">Template 3 — Dernier rappel avant mise en demeure</div>
          <pre>{`Objet : Dernier rappel — facture n°[XXXX]

Bonjour [Prénom/Nom],

Je reviens vers vous concernant la facture n°[XXXX] (échéance : [date]). Sans règlement ou retour de votre part sous 72h, je serai contraint(e) d’engager la procédure de recouvrement (mise en demeure).

Je préfère évidemment éviter d’en arriver là : pouvez-vous me confirmer une date de paiement aujourd’hui ?

Cordialement,
[Signature]`}</pre>
        </div>

        <div className="warning-box">
          <p>
            <strong>Conseil :</strong> restez factuel et gardez des preuves (emails, accusés, captures). Évitez les menaces
            vagues : annoncez une prochaine étape uniquement si vous êtes prêt à la faire.
          </p>
        </div>

        <h2 id="mise-en-demeure">Quand envoyer une mise en demeure ?</h2>
        <p>
          Si après plusieurs relances vous n&apos;obtenez ni paiement ni date de règlement crédible, la mise en demeure
          (courrier recommandé ou email avec éléments probants selon votre situation) est l&apos;étape logique.
        </p>

        <div className="info-box">
          <p>
            <strong>Astuce :</strong> un devis signé + des preuves de livraison + une facture conforme = un dossier beaucoup
            plus simple en cas de recouvrement.
          </p>
        </div>

        <h2 id="prevention">Prévenir les impayés (avant la mission)</h2>
        <p>
          La meilleure relance, c&apos;est celle que vous n&apos;avez pas à envoyer. Pour réduire les impayés : demandez un
          acompte (souvent 30 %), fixez des jalons de paiement, et utilisez un contrat clair.
        </p>

        <div className="cta-inline">
          <h3>⚡ Devis + contrat + factures + relances</h3>
          <p>Centralisez vos documents et automatisez vos relances avec Spyke.</p>
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
          <a href="/blog/contrat-prestation-freelance-clauses-essentielles" className="related-card">
            <div className="related-card-tag">Contrats</div>
            <h3>Contrat de prestation freelance : les 10 clauses indispensables</h3>
            <p>9 min de lecture</p>
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
            headline: 'Comment relancer un client qui ne paye pas (sans ruiner la relation)',
            description:
              "3 templates d'emails de relance testés et approuvés. Du rappel amical à la mise en demeure, avec le bon timing pour chaque étape.",
            datePublished: '2026-02-16',
            dateModified: '2026-02-16',
            author: { '@type': 'Organization', name: 'Spyke' },
            publisher: { '@type': 'Organization', name: 'Spyke', url: 'https://www.spykeapp.fr' },
            mainEntityOfPage: 'https://www.spykeapp.fr/blog/relancer-client-impaye-freelance',
          }),
        }}
      />
    </>
  )
}
