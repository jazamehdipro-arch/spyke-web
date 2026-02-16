"use client"

import { useMemo, useState } from 'react'

type Category = 'Tous' | 'Devis' | 'Factures' | 'Contrats' | 'Relances' | 'Gestion'

type BlogPost = {
  href: string
  category: Exclude<Category, 'Tous'>
  title: string
  excerpt: string
  dateLabel: string
  readTime: string
  icon: string
  thumbClass: string
  featured?: boolean
}

const posts: BlogPost[] = [
  {
    href: '/blog/comment-faire-devis-freelance',
    category: 'Devis',
    title: 'Comment faire un devis freelance professionnel en 2026 (guide complet)',
    excerpt:
      "Toutes les mentions obligatoires, les erreurs à éviter, et comment créer un devis qui inspire confiance à vos clients. Avec exemples concrets et checklist téléchargeable.",
    dateLabel: 'Février 2026',
    readTime: '8 min de lecture',
    icon: '📄',
    thumbClass: 'devis',
    featured: true,
  },
  {
    href: '/blog/mentions-obligatoires-facture-auto-entrepreneur',
    category: 'Factures',
    title: 'Facture auto-entrepreneur : les 7 mentions obligatoires en 2026',
    excerpt:
      "Une facture non conforme peut entraîner une amende de 75 000 €. Voici les mentions à ne jamais oublier et comment les intégrer automatiquement.",
    dateLabel: 'Février 2026',
    readTime: '6 min',
    icon: '🧾',
    thumbClass: 'facture',
  },
  {
    href: '/blog/relancer-client-impaye-freelance',
    category: 'Relances',
    title: 'Comment relancer un client qui ne paye pas (sans ruiner la relation)',
    excerpt:
      "3 templates d'emails de relance testés et approuvés. Du rappel amical à la mise en demeure, avec le bon timing pour chaque étape.",
    dateLabel: 'Février 2026',
    readTime: '7 min',
    icon: '📩',
    thumbClass: 'relance',
  },
  {
    href: '/blog/contrat-prestation-freelance-clauses-essentielles',
    category: 'Contrats',
    title: 'Contrat de prestation freelance : les 10 clauses indispensables',
    excerpt:
      "Un bon contrat vous protège des litiges et des impayés. Découvrez les clauses à inclure absolument et celles qui sont souvent oubliées.",
    dateLabel: 'Février 2026',
    readTime: '9 min',
    icon: '📋',
    thumbClass: 'contrat',
  },
]

export default function BlogPage() {
  const [active, setActive] = useState<Category>('Tous')

  const featured = useMemo(() => posts.find((p) => p.featured), [])

  const others = useMemo(() => {
    const list = posts.filter((p) => !p.featured)
    if (active === 'Tous') return list
    return list.filter((p) => p.category === active)
  }, [active])

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
          color: var(--white);
          -webkit-font-smoothing: antialiased;
          line-height: 1.6;
        }

        a { text-decoration: none; color: inherit; }

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
        }
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
        }
        .nav-links a:hover { color: var(--white); }
        .nav-links .active { color: var(--white); font-weight: 500; }
        .nav-cta {
          background: var(--yellow);
          color: var(--black);
          padding: 8px 18px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 0.88rem;
          transition: background 0.2s;
        }
        .nav-cta:hover { background: var(--yellow-dark); }

        @media (max-width: 768px) {
          .nav-links { display: none; }
        }

        .hero {
          max-width: 1200px;
          margin: 0 auto;
          padding: 80px 24px 60px;
          text-align: center;
        }
        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(250,204,21,0.1);
          border: 1px solid rgba(250,204,21,0.25);
          padding: 6px 16px;
          border-radius: 50px;
          font-size: 0.82rem;
          font-weight: 500;
          color: var(--yellow);
          margin-bottom: 28px;
          font-family: var(--font-body);
        }
        .hero h1 {
          font-family: var(--font-display);
          font-size: clamp(2.2rem, 5vw, 3.5rem);
          font-weight: 800;
          line-height: 1.15;
          margin-bottom: 18px;
          letter-spacing: -0.02em;
        }
        .hero h1 span {
          background: linear-gradient(135deg, var(--yellow), #fde68a);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .hero p {
          font-size: 1.12rem;
          color: var(--gray-400);
          max-width: 600px;
          margin: 0 auto 40px;
          line-height: 1.7;
        }

        .categories {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 24px 48px;
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          justify-content: center;
        }
        .cat-btn {
          padding: 8px 20px;
          border-radius: 50px;
          font-size: 0.88rem;
          font-weight: 500;
          font-family: var(--font-body);
          border: 1px solid var(--gray-700);
          background: transparent;
          color: var(--gray-400);
          cursor: pointer;
          transition: all 0.25s;
        }
        .cat-btn:hover, .cat-btn.active {
          background: var(--yellow);
          color: var(--black);
          border-color: var(--yellow);
        }

        .featured {
          max-width: 1200px;
          margin: 0 auto 64px;
          padding: 0 24px;
        }
        .featured-card {
          display: grid;
          grid-template-columns: 1.1fr 1fr;
          gap: 0;
          border-radius: 20px;
          overflow: hidden;
          background: var(--gray-900);
          border: 1px solid rgba(255,255,255,0.06);
          transition: transform 0.3s, box-shadow 0.3s;
        }
        .featured-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 60px rgba(250,204,21,0.06);
        }
        .featured-img {
          background: linear-gradient(135deg, #1a1a2e, #16213e);
          min-height: 340px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px;
          position: relative;
          overflow: hidden;
        }
        .featured-img::before {
          content: '';
          position: absolute;
          width: 200px;
          height: 200px;
          background: radial-gradient(circle, rgba(250,204,21,0.15), transparent 70%);
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
        }
        .featured-img-icon { font-size: 5rem; position: relative; z-index: 1; }
        .featured-content {
          padding: 48px 40px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        .featured-tag {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(250,204,21,0.12);
          color: var(--yellow);
          padding: 4px 12px;
          border-radius: 6px;
          font-size: 0.78rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          margin-bottom: 16px;
          width: fit-content;
        }
        .featured-content h2 {
          font-family: var(--font-display);
          font-size: 1.7rem;
          font-weight: 700;
          line-height: 1.25;
          margin-bottom: 14px;
          letter-spacing: -0.01em;
        }
        .featured-content p {
          color: var(--gray-400);
          font-size: 0.98rem;
          line-height: 1.65;
          margin-bottom: 24px;
        }
        .featured-meta {
          display: flex;
          align-items: center;
          gap: 16px;
          font-size: 0.82rem;
          color: var(--gray-500);
          flex-wrap: wrap;
        }
        .featured-meta span {
          display: flex;
          align-items: center;
          gap: 5px;
        }
        .read-more {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: var(--yellow);
          font-weight: 600;
          font-size: 0.92rem;
          margin-top: 20px;
          transition: gap 0.2s;
        }
        .read-more:hover { gap: 10px; }

        @media (max-width: 768px) {
          .featured-card { grid-template-columns: 1fr; }
          .featured-img { min-height: 200px; }
          .featured-content { padding: 28px 24px; }
          .featured-content h2 { font-size: 1.4rem; }
        }

        .articles-section {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 24px 80px;
        }
        .articles-section h2 {
          font-family: var(--font-display);
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 32px;
          padding-left: 16px;
          border-left: 4px solid var(--yellow);
        }
        .articles-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
          gap: 24px;
        }
        .article-card {
          background: var(--gray-900);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 16px;
          overflow: hidden;
          transition: transform 0.3s, box-shadow 0.3s, border-color 0.3s;
          display: flex;
          flex-direction: column;
        }
        .article-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 16px 48px rgba(0,0,0,0.4);
          border-color: rgba(250,204,21,0.15);
        }
        .article-thumb {
          height: 180px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 3.2rem;
          position: relative;
          overflow: hidden;
        }
        .article-thumb.devis { background: linear-gradient(135deg, #1a1a2e, #0f172a); }
        .article-thumb.facture { background: linear-gradient(135deg, #1a2e1a, #0a2a1a); }
        .article-thumb.contrat { background: linear-gradient(135deg, #2e1a1a, #2a0f17); }
        .article-thumb.relance { background: linear-gradient(135deg, #1a1a2e, #1e1b4b); }
        .article-thumb.gestion { background: linear-gradient(135deg, #2e2a1a, #1c1917); }

        .article-thumb::after {
          content: '';
          position: absolute;
          width: 120px;
          height: 120px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(250,204,21,0.08), transparent 70%);
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
        }
        .article-thumb span { position: relative; z-index: 1; }

        .article-body {
          padding: 24px;
          flex: 1;
          display: flex;
          flex-direction: column;
        }
        .article-tag {
          font-size: 0.72rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--yellow);
          margin-bottom: 10px;
        }
        .article-body h3 {
          font-family: var(--font-display);
          font-size: 1.18rem;
          font-weight: 700;
          line-height: 1.3;
          margin-bottom: 10px;
          transition: color 0.2s;
        }
        .article-card:hover h3 { color: var(--yellow); }
        .article-body p {
          font-size: 0.9rem;
          color: var(--gray-400);
          line-height: 1.6;
          flex: 1;
          margin-bottom: 18px;
        }
        .article-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 16px;
          border-top: 1px solid rgba(255,255,255,0.06);
          font-size: 0.8rem;
          color: var(--gray-500);
        }
        .article-read {
          color: var(--yellow);
          font-weight: 600;
          font-size: 0.82rem;
          display: flex;
          align-items: center;
          gap: 4px;
          transition: gap 0.2s;
        }
        .article-card:hover .article-read { gap: 8px; }

        @media (max-width: 768px) {
          .articles-grid { grid-template-columns: 1fr; }
        }

        .newsletter {
          max-width: 700px;
          margin: 0 auto 80px;
          padding: 0 24px;
          text-align: center;
        }
        .newsletter-box {
          background: var(--gray-900);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 20px;
          padding: 48px 40px;
          position: relative;
          overflow: hidden;
        }
        .newsletter-box::before {
          content: '';
          position: absolute;
          width: 300px;
          height: 300px;
          background: radial-gradient(circle, rgba(250,204,21,0.06), transparent 70%);
          top: -100px;
          right: -100px;
        }
        .newsletter-box h2 {
          font-family: var(--font-display);
          font-size: 1.6rem;
          font-weight: 700;
          margin-bottom: 10px;
          position: relative;
        }
        .newsletter-box p {
          color: var(--gray-400);
          font-size: 0.95rem;
          margin-bottom: 28px;
          position: relative;
        }
        .newsletter-form {
          display: flex;
          gap: 10px;
          max-width: 440px;
          margin: 0 auto;
          position: relative;
        }
        .newsletter-form input {
          flex: 1;
          padding: 12px 18px;
          border-radius: 10px;
          border: 1px solid var(--gray-700);
          background: var(--gray-800);
          color: var(--white);
          font-family: var(--font-body);
          font-size: 0.92rem;
          outline: none;
          transition: border-color 0.2s;
        }
        .newsletter-form input:focus { border-color: var(--yellow); }
        .newsletter-form input::placeholder { color: var(--gray-500); }
        .newsletter-form button {
          padding: 12px 24px;
          border-radius: 10px;
          background: var(--yellow);
          color: var(--black);
          font-family: var(--font-body);
          font-weight: 700;
          font-size: 0.9rem;
          border: none;
          cursor: pointer;
          transition: background 0.2s;
          white-space: nowrap;
        }
        .newsletter-form button:hover { background: var(--yellow-dark); }

        @media (max-width: 500px) {
          .newsletter-form { flex-direction: column; }
          .newsletter-box { padding: 32px 24px; }
        }

        .cta-banner {
          max-width: 1200px;
          margin: 0 auto 80px;
          padding: 0 24px;
        }
        .cta-inner {
          background: linear-gradient(135deg, var(--gray-900), #1a1520);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 20px;
          padding: 56px 48px;
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        .cta-inner::before {
          content: '';
          position: absolute;
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, rgba(250,204,21,0.08), transparent 70%);
          bottom: -200px;
          left: 50%;
          transform: translateX(-50%);
        }
        .cta-inner h2 {
          font-family: var(--font-display);
          font-size: clamp(1.5rem, 3vw, 2rem);
          font-weight: 700;
          margin-bottom: 14px;
          position: relative;
        }
        .cta-inner p {
          color: var(--gray-400);
          font-size: 1rem;
          margin-bottom: 28px;
          position: relative;
        }
        .cta-btn {
          display: inline-block;
          background: var(--yellow);
          color: var(--black);
          padding: 14px 32px;
          border-radius: 10px;
          font-weight: 700;
          font-size: 1rem;
          font-family: var(--font-display);
          transition: background 0.2s, transform 0.2s;
          position: relative;
        }
        .cta-btn:hover { background: var(--yellow-dark); transform: translateY(-2px); }

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
          gap: 18px;
          margin-bottom: 20px;
        }
        .footer-links a {
          font-size: 0.85rem;
          color: var(--gray-500);
          transition: color 0.2s;
          padding: 6px 10px;
          border-radius: 10px;
          border: 1px solid transparent;
        }
        .footer-links a:hover { color: var(--white); border-color: rgba(255,255,255,0.08); }
        .footer-copy { font-size: 0.8rem; color: var(--gray-600); }
      `}</style>

      {/* NAV */}
      <nav>
        <div className="nav-inner">
          <a href="/" className="nav-logo">
            <div className="nav-logo-icon">⚡</div>
            Spyke
          </a>
          <ul className="nav-links">
            <li>
              <a href="/fonctionnalites.html">Fonctionnalités</a>
            </li>
            <li>
              <a href="/blog" className="active">
                Blog
              </a>
            </li>
            <li>
              <a href="/#pricing">Tarifs</a>
            </li>
            <li>
              <a href="/connexion.html" className="nav-cta">
                Créer un compte gratuit
              </a>
            </li>
          </ul>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="hero-badge">📝 Blog Spyke</div>
        <h1>
          Conseils & guides pour <span>freelances</span>
        </h1>
        <p>
          Tout ce qu&apos;il faut savoir pour gérer votre administratif freelance : devis, factures,
          contrats, relances et bonnes pratiques.
        </p>
      </section>

      {/* CATEGORIES */}
      <div className="categories">
        {(['Tous', 'Devis', 'Factures', 'Contrats', 'Relances', 'Gestion'] as Category[]).map((c) => (
          <button
            key={c}
            type="button"
            className={`cat-btn ${active === c ? 'active' : ''}`}
            onClick={() => setActive(c)}
          >
            {c}
          </button>
        ))}
      </div>

      {/* FEATURED */}
      {featured ? (
        <section className="featured">
          <a href={featured.href} className="featured-card">
            <div className="featured-img">
              <div className="featured-img-icon">{featured.icon}</div>
            </div>
            <div className="featured-content">
              <div className="featured-tag">⭐ Article vedette</div>
              <h2>{featured.title}</h2>
              <p>{featured.excerpt}</p>
              <div className="featured-meta">
                <span>📅 {featured.dateLabel}</span>
                <span>⏱ {featured.readTime}</span>
                <span>🏷 {featured.category}</span>
              </div>
              <div className="read-more">Lire l&apos;article →</div>
            </div>
          </a>
        </section>
      ) : null}

      {/* GRID */}
      <section className="articles-section">
        <h2>Derniers articles</h2>
        <div className="articles-grid">
          {others.map((p) => (
            <a key={p.href} href={p.href} className="article-card">
              <div className={`article-thumb ${p.thumbClass}`}>
                <span>{p.icon}</span>
              </div>
              <div className="article-body">
                <div className="article-tag">{p.category}</div>
                <h3>{p.title}</h3>
                <p>{p.excerpt}</p>
                <div className="article-footer">
                  <span>
                    📅 {p.dateLabel} · {p.readTime}
                  </span>
                  <span className="article-read">Lire →</span>
                </div>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* NEWSLETTER */}
      <section className="newsletter">
        <div className="newsletter-box">
          <h2>Restez informé</h2>
          <p>Un email par semaine avec les meilleurs conseils pour les freelances. Pas de spam, promis.</p>
          <form
            className="newsletter-form"
            onSubmit={(e) => {
              e.preventDefault()
              alert('Newsletter: à connecter')
            }}
          >
            <input type="email" placeholder="votre@email.com" aria-label="Adresse email" required />
            <button type="submit">S&apos;abonner</button>
          </form>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-banner">
        <div className="cta-inner">
          <h2>Devis → Contrat → Facture → Relance en 1 clic</h2>
          <p>Arrêtez de perdre du temps sur l&apos;administratif. Spyke génère vos documents avec l&apos;IA.</p>
          <a href="/connexion.html" className="cta-btn">
            Essayer gratuitement →
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
            '@type': 'Blog',
            name: 'Blog Spyke',
            description:
              'Guides pratiques et conseils pour les freelances français : devis, factures, contrats, relances et gestion administrative.',
            url: 'https://www.spykeapp.fr/blog',
            publisher: {
              '@type': 'Organization',
              name: 'Spyke',
              url: 'https://www.spykeapp.fr',
            },
          }),
        }}
      />
    </>
  )
}
