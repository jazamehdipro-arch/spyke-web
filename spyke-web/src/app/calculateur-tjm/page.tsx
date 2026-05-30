import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Calculateur TJM Freelance Gratuit 2026 — Spyke',
  description:
    'Calculez votre TJM (taux journalier moyen) freelance en 30 secondes. Entrez votre revenu net souhaité, vos charges et vos jours facturables — obtenez votre TJM recommandé instantanément.',
  alternates: { canonical: 'https://spykeapp.fr/calculateur-tjm' },
  openGraph: {
    title: 'Calculateur TJM Freelance Gratuit 2026 — Spyke',
    description: 'Calculez votre TJM freelance en 30 secondes. Revenu net, charges, jours facturables → TJM recommandé.',
    url: 'https://spykeapp.fr/calculateur-tjm',
    type: 'website',
    siteName: 'Spyke',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Calculateur TJM Freelance Gratuit 2026',
    description: 'Calculez votre TJM freelance en 30 secondes gratuitement.',
  },
}

export default function CalculateurTjmPage() {
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Comment calculer son TJM freelance ?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Pour calculer son TJM, il faut partir du revenu net souhaité, y ajouter les charges sociales et les frais professionnels pour obtenir le CA annuel nécessaire, puis diviser par le nombre de jours facturables. TJM = CA annuel / jours facturables.',
        },
      },
      {
        '@type': 'Question',
        name: 'Quel est le TJM moyen d\'un freelance en France ?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'En France, le TJM moyen d\'un freelance varie entre 300€ et 800€ selon le domaine. Les développeurs senior et consultants en stratégie atteignent souvent 600€ à 1 000€/jour. Les métiers créatifs se situent plutôt entre 300€ et 500€/jour.',
        },
      },
      {
        '@type': 'Question',
        name: 'Combien de jours facturables par an pour un freelance ?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'En général, un freelance peut facturer entre 180 et 220 jours par an. Le nombre de jours ouvrés (hors week-ends et jours fériés) est d\'environ 252. Après 5 semaines de congés et 10% de jours non facturés (formation, prospection), on arrive à environ 200-210 jours facturables.',
        },
      },
      {
        '@type': 'Question',
        name: 'Faut-il inclure les charges dans son TJM ?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Oui, absolument. Votre TJM doit couvrir vos cotisations sociales (22% à 25,6% selon le statut), vos frais professionnels (matériel, logiciels, déplacements) et votre revenu net. Beaucoup de freelances sous-estiment leur TJM en oubliant ces éléments.',
        },
      },
    ],
  }

  const appJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Calculateur TJM Freelance — Spyke',
    description: 'Calculez votre taux journalier moyen freelance gratuitement en ligne.',
    url: 'https://spykeapp.fr/calculateur-tjm',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
  }

  return (
    <>
      <style>{`
        *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
        :root {
          --black: #0a0a0a;
          --yellow: #F5C100;
          --yellow-dark: #d4a800;
          --white: #ffffff;
          --gray-900: #18181b;
          --gray-800: #27272a;
          --gray-700: #3f3f46;
          --gray-600: #52525b;
          --gray-500: #71717a;
          --gray-400: #a1a1aa;
          --gray-300: #d4d4d8;
          --gray-100: #f4f4f5;
          --font-display: 'Syne', sans-serif;
          --font-body: 'DM Sans', -apple-system, sans-serif;
        }
        html { scroll-behavior: smooth; }
        body { font-family: var(--font-body); background: var(--black); color: var(--gray-300); -webkit-font-smoothing: antialiased; line-height: 1.6; }
        a { color: var(--yellow); text-decoration: none; }
        a:hover { text-decoration: underline; }

        /* NAV */
        nav { position: sticky; top: 0; z-index: 100; background: rgba(10,10,10,0.94); backdrop-filter: blur(14px); border-bottom: 1px solid rgba(255,255,255,0.06); padding: 0 24px; }
        .nav-inner { max-width: 1100px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; height: 62px; }
        .nav-logo { display: flex; align-items: center; gap: 9px; font-family: var(--font-display); font-weight: 700; font-size: 1.2rem; color: var(--white); text-decoration: none; }
        .nav-logo-icon { width: 34px; height: 34px; background: var(--gray-800); border-radius: 9px; display: flex; align-items: center; justify-content: center; font-size: 1rem; }
        .nav-logo:hover { text-decoration: none; }
        .nav-cta { background: var(--yellow); color: var(--black); padding: 8px 18px; border-radius: 8px; font-weight: 700; font-size: 0.88rem; transition: background .2s; }
        .nav-cta:hover { background: var(--yellow-dark); text-decoration: none; }

        /* HERO */
        .hero { max-width: 700px; margin: 0 auto; padding: 56px 24px 32px; text-align: center; }
        .hero-tag { display: inline-flex; align-items: center; gap: 6px; background: rgba(245,193,0,.12); color: var(--yellow); padding: 5px 14px; border-radius: 6px; font-size: .78rem; font-weight: 600; text-transform: uppercase; letter-spacing: .04em; margin-bottom: 20px; }
        .hero h1 { font-family: var(--font-display); font-size: clamp(1.9rem, 4.5vw, 2.7rem); font-weight: 800; color: var(--white); line-height: 1.16; letter-spacing: -.02em; margin-bottom: 16px; }
        .hero h1 span { color: var(--yellow); }
        .hero p { font-size: 1.05rem; color: var(--gray-400); max-width: 520px; margin: 0 auto; }

        /* CALCULATOR */
        .calc-wrap { max-width: 700px; margin: 0 auto; padding: 0 24px 24px; }
        .calc-card { background: var(--gray-900); border: 1px solid rgba(255,255,255,0.07); border-radius: 18px; padding: 36px; }
        .field-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        @media (max-width: 560px) { .field-grid { grid-template-columns: 1fr; } }
        .field { display: flex; flex-direction: column; gap: 7px; }
        .field label { font-size: .85rem; font-weight: 600; color: var(--gray-300); }
        .field .hint { font-size: .78rem; color: var(--gray-500); }
        .field input { background: var(--gray-800); border: 1.5px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 12px 14px; font-size: 1rem; color: var(--white); font-family: var(--font-body); transition: border-color .2s; outline: none; }
        .field input:focus { border-color: var(--yellow); }
        .field input::placeholder { color: var(--gray-600); }

        /* RESULT */
        .result-box { margin-top: 28px; background: linear-gradient(135deg, rgba(245,193,0,.08), rgba(245,193,0,.03)); border: 1.5px solid rgba(245,193,0,.2); border-radius: 14px; padding: 28px; display: none; }
        .result-box.visible { display: block; }
        .result-tjm { text-align: center; margin-bottom: 22px; }
        .result-tjm .label { font-size: .85rem; color: var(--gray-400); text-transform: uppercase; letter-spacing: .06em; font-weight: 600; margin-bottom: 8px; }
        .result-tjm .value { font-family: var(--font-display); font-size: 3.2rem; font-weight: 800; color: var(--yellow); line-height: 1; }
        .result-tjm .per-day { font-size: 1rem; color: var(--gray-400); margin-top: 4px; }
        .result-details { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        @media (max-width: 480px) { .result-details { grid-template-columns: 1fr; } }
        .detail-item { background: rgba(255,255,255,.04); border-radius: 10px; padding: 14px 16px; }
        .detail-item .d-label { font-size: .78rem; color: var(--gray-500); margin-bottom: 4px; }
        .detail-item .d-value { font-size: 1.05rem; font-weight: 700; color: var(--white); }

        .calc-btn { width: 100%; margin-top: 24px; background: var(--yellow); color: var(--black); border: none; border-radius: 11px; padding: 16px; font-size: 1rem; font-weight: 700; font-family: var(--font-body); cursor: pointer; transition: background .2s, transform .15s; }
        .calc-btn:hover { background: var(--yellow-dark); transform: translateY(-1px); }

        /* CTA */
        .cta-block { max-width: 700px; margin: 28px auto 0; padding: 0 24px; }
        .cta-inner { background: linear-gradient(135deg, var(--gray-900), #191520); border: 1px solid rgba(245,193,0,.12); border-radius: 16px; padding: 32px 28px; text-align: center; }
        .cta-inner h3 { font-family: var(--font-display); font-size: 1.25rem; color: var(--white); margin-bottom: 8px; }
        .cta-inner p { font-size: .93rem; color: var(--gray-400); margin-bottom: 20px; }
        .cta-inner a { display: inline-block; background: var(--yellow); color: var(--black); padding: 13px 28px; border-radius: 10px; font-weight: 700; font-size: .95rem; font-family: var(--font-display); transition: background .2s, transform .15s; text-decoration: none; }
        .cta-inner a:hover { background: var(--yellow-dark); transform: translateY(-2px); text-decoration: none; }

        /* CONTENT */
        .content { max-width: 700px; margin: 48px auto 0; padding: 0 24px; }
        .content h2 { font-family: var(--font-display); font-size: 1.45rem; font-weight: 700; color: var(--white); margin-bottom: 14px; padding-top: 32px; border-top: 1px solid rgba(255,255,255,.06); }
        .content h2:first-child { border-top: none; padding-top: 0; }
        .content p { font-size: .99rem; line-height: 1.8; color: var(--gray-300); margin-bottom: 16px; }
        .content strong { color: var(--white); }
        .content ul { list-style: none; margin: 12px 0 20px; padding: 0; }
        .content ul li { padding: 5px 0 5px 22px; position: relative; font-size: .95rem; color: var(--gray-300); }
        .content ul li::before { content: '→'; position: absolute; left: 0; color: var(--yellow); font-weight: 700; }

        /* FAQ */
        .faq { max-width: 700px; margin: 40px auto 0; padding: 0 24px; }
        .faq h2 { font-family: var(--font-display); font-size: 1.45rem; font-weight: 700; color: var(--white); margin-bottom: 20px; }
        .faq-item { border-bottom: 1px solid rgba(255,255,255,.06); }
        .faq-q { width: 100%; background: none; border: none; color: var(--gray-300); text-align: left; padding: 16px 0; font-size: .97rem; font-weight: 600; font-family: var(--font-body); cursor: pointer; display: flex; justify-content: space-between; align-items: center; gap: 12px; }
        .faq-q .icon { font-size: 1.1rem; color: var(--yellow); flex-shrink: 0; transition: transform .25s; }
        .faq-q.open .icon { transform: rotate(45deg); }
        .faq-a { font-size: .92rem; color: var(--gray-400); line-height: 1.7; padding-bottom: 16px; display: none; }
        .faq-a.open { display: block; }

        /* INTERNAL LINKS */
        .internal-links { max-width: 700px; margin: 40px auto 0; padding: 0 24px; display: flex; gap: 12px; flex-wrap: wrap; }
        .link-chip { background: var(--gray-900); border: 1px solid rgba(255,255,255,.06); border-radius: 8px; padding: 8px 16px; font-size: .85rem; color: var(--gray-400); text-decoration: none; transition: border-color .2s, color .2s; }
        .link-chip:hover { border-color: rgba(245,193,0,.2); color: var(--yellow); text-decoration: none; }

        /* FOOTER */
        footer { border-top: 1px solid rgba(255,255,255,.06); margin-top: 64px; padding: 36px 24px; text-align: center; }
        .footer-links { display: flex; flex-wrap: wrap; justify-content: center; gap: 20px; margin-bottom: 16px; }
        .footer-links a { font-size: .83rem; color: var(--gray-500); text-decoration: none; }
        .footer-links a:hover { color: var(--gray-300); }
        .footer-copy { font-size: .8rem; color: var(--gray-600); }
      `}</style>

      <nav>
        <div className="nav-inner">
          <a href="/" className="nav-logo">
            <div className="nav-logo-icon">⚡</div>
            Spyke
          </a>
          <a href="/connexion.html" className="nav-cta">Essayer gratuitement</a>
        </div>
      </nav>

      <header className="hero">
        <div className="hero-tag">🧮 Outil gratuit</div>
        <h1>Calculateur de <span>TJM freelance</span> 2026</h1>
        <p>Entrez votre revenu net souhaité et obtenez instantanément votre taux journalier moyen recommandé, avec le détail du CA annuel à atteindre.</p>
      </header>

      <div className="calc-wrap">
        <div className="calc-card">
          <div className="field-grid">
            <div className="field">
              <label htmlFor="net">Revenu net mensuel souhaité</label>
              <input id="net" type="number" min="0" placeholder="ex : 3 500" defaultValue="" />
              <span className="hint">Ce que vous voulez toucher chaque mois</span>
            </div>
            <div className="field">
              <label htmlFor="charges">Charges sociales (%)</label>
              <input id="charges" type="number" min="0" max="100" step="0.1" placeholder="22" defaultValue="22" />
              <span className="hint">22% auto-entrepreneur services</span>
            </div>
            <div className="field">
              <label htmlFor="frais">Frais professionnels mensuels</label>
              <input id="frais" type="number" min="0" placeholder="ex : 300" defaultValue="0" />
              <span className="hint">Matériel, logiciels, déplacements…</span>
            </div>
            <div className="field">
              <label htmlFor="jours">Jours facturables par an</label>
              <input id="jours" type="number" min="1" max="365" placeholder="218" defaultValue="218" />
              <span className="hint">Jours ouvrés hors congés et fériés</span>
            </div>
            <div className="field">
              <label htmlFor="conges">Semaines de congés par an</label>
              <input id="conges" type="number" min="0" max="52" placeholder="5" defaultValue="5" />
              <span className="hint">Semaines non travaillées / non facturées</span>
            </div>
          </div>

          <button className="calc-btn" id="calcBtn">Calculer mon TJM →</button>

          <div className="result-box" id="resultBox">
            <div className="result-tjm">
              <div className="label">Votre TJM recommandé</div>
              <div className="value" id="resTjm">—</div>
              <div className="per-day">€ / jour facturé</div>
            </div>
            <div className="result-details">
              <div className="detail-item">
                <div className="d-label">CA annuel nécessaire</div>
                <div className="d-value" id="resCaAnnuel">—</div>
              </div>
              <div className="detail-item">
                <div className="d-label">CA mensuel moyen</div>
                <div className="d-value" id="resCaMensuel">—</div>
              </div>
              <div className="detail-item">
                <div className="d-label">Jours facturables effectifs</div>
                <div className="d-value" id="resJours">—</div>
              </div>
              <div className="detail-item">
                <div className="d-label">Charges annuelles estimées</div>
                <div className="d-value" id="resCharges">—</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="cta-block" id="ctaResult" style={{ display: 'none' }}>
        <div className="cta-inner">
          <h3>Votre TJM est calculé — maintenant créez votre premier devis</h3>
          <p>Générez un devis professionnel en 30 secondes avec Spyke. Vos tarifs, vos mentions légales, en PDF prêt à envoyer.</p>
          <a href="/devis-freelance">Créer mon devis gratuitement →</a>
        </div>
      </div>

      <article className="content">
        <h2>Comment calculer son TJM freelance ?</h2>
        <p>
          Le TJM (taux journalier moyen) est le tarif qu'un freelance facture pour une journée de travail. Bien le calculer est crucial : trop bas, vous travaillez à perte ; trop haut, vous perdez des missions. La méthode correcte part de votre <strong>revenu net souhaité</strong> et remonte jusqu'au CA nécessaire.
        </p>
        <p>
          La formule est simple : <strong>CA annuel = (revenu net mensuel + frais mensuels) / (1 - taux de charges) × 12</strong>. Puis on divise par le nombre de jours réellement facturables. Ce calculateur fait ce calcul automatiquement.
        </p>

        <h2>Pourquoi 218 jours par défaut ?</h2>
        <p>
          Une année compte environ 252 jours ouvrés. En retirant les jours fériés (environ 7 ouvrés) et 5 semaines de congés (25 jours), on arrive à environ <strong>218 jours disponibles</strong>. Mais attention : tous ces jours ne sont pas forcément facturés. Il faut prévoir du temps pour la prospection, la formation, l'administratif — en réalité, la plupart des freelances facturent entre 180 et 210 jours par an.
        </p>

        <h2>Quelles charges prévoir ?</h2>
        <p>Le taux de charges dépend de votre statut :</p>
        <ul>
          <li><strong>Auto-entrepreneur services (BNC) :</strong> ~25,6% en 2026</li>
          <li><strong>Auto-entrepreneur services commerciaux (BIC) :</strong> ~21,2%</li>
          <li><strong>EURL / SASU :</strong> entre 40% et 55% selon rémunération</li>
          <li><strong>Portage salarial :</strong> environ 50% du CA brut</li>
        </ul>
        <p>
          À ces cotisations sociales, ajoutez vos frais réels : abonnements logiciels, matériel, espace de travail, déplacements, expert-comptable. Ces frais doivent être couverts par votre CA avant de calculer votre net.
        </p>

        <h2>TJM vs tarif horaire : quelle différence ?</h2>
        <p>
          Le TJM est généralement basé sur une journée de 7 à 8 heures. Pour convertir : <strong>TJM ÷ 7 = taux horaire</strong>. En pratique, la plupart des missions freelance se négocient au jour, surtout en ESN, conseil ou développement. Les métiers créatifs (graphistes, rédacteurs) utilisent parfois le tarif au projet ou à la journée selon le contexte.
        </p>
      </article>

      <section className="faq">
        <h2>Questions fréquentes sur le TJM freelance</h2>
        <div className="faq-item">
          <button className="faq-q" data-faq>Comment calculer son TJM freelance ? <span className="icon">+</span></button>
          <div className="faq-a">Pour calculer son TJM, il faut partir du revenu net souhaité, y ajouter les charges sociales et les frais professionnels pour obtenir le CA annuel nécessaire, puis diviser par le nombre de jours facturables. TJM = CA annuel / jours facturables.</div>
        </div>
        <div className="faq-item">
          <button className="faq-q" data-faq>Quel est le TJM moyen d&apos;un freelance en France ? <span className="icon">+</span></button>
          <div className="faq-a">En France, le TJM moyen d&apos;un freelance varie entre 300€ et 800€ selon le domaine. Les développeurs senior et consultants atteignent souvent 600€ à 1 000€/jour. Les métiers créatifs se situent plutôt entre 300€ et 500€/jour.</div>
        </div>
        <div className="faq-item">
          <button className="faq-q" data-faq>Combien de jours facturables par an pour un freelance ? <span className="icon">+</span></button>
          <div className="faq-a">En général, un freelance peut facturer entre 180 et 220 jours par an sur 252 jours ouvrés. Après congés, jours fériés et temps non facturable (prospection, admin), on arrive à environ 200 jours effectifs.</div>
        </div>
        <div className="faq-item">
          <button className="faq-q" data-faq>Faut-il inclure les charges dans son TJM ? <span className="icon">+</span></button>
          <div className="faq-a">Oui, absolument. Votre TJM doit couvrir vos cotisations sociales, vos frais professionnels et votre revenu net. Beaucoup de freelances sous-estiment leur TJM en oubliant ces éléments essentiels.</div>
        </div>
      </section>

      <div className="internal-links">
        <a href="/calcul-charges-auto-entrepreneur" className="link-chip">🧾 Calculateur de charges auto-entrepreneur</a>
        <a href="/devis-freelance" className="link-chip">📄 Générateur de devis gratuit</a>
        <a href="/facture-auto-entrepreneur" className="link-chip">🧾 Générateur de facture gratuit</a>
        <a href="/blog/calculer-tjm-freelance" className="link-chip">📖 Article : calculer son TJM</a>
        <a href="/blog" className="link-chip">📚 Blog freelance</a>
      </div>

      <footer>
        <div className="footer-links">
          <a href="/">Accueil</a>
          <a href="/blog">Blog</a>
          <a href="/fonctionnalites.html">Fonctionnalités</a>
          <a href="/tarifs.html">Tarifs</a>
          <a href="/mentions-legales.html">Mentions légales</a>
          <a href="/confidentialite.html">Confidentialité</a>
        </div>
        <p className="footer-copy">Spyke © 2026 — L&apos;assistant IA des freelances français</p>
      </footer>

      {/* Schema WebApplication */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(appJsonLd) }} />
      {/* Schema FAQ */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      {/* Calculator logic */}
      <script dangerouslySetInnerHTML={{ __html: `
        function fmt(n) {
          return n.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' €';
        }
        function calcTjm() {
          var net = parseFloat(document.getElementById('net').value) || 0;
          var charges = parseFloat(document.getElementById('charges').value) || 0;
          var frais = parseFloat(document.getElementById('frais').value) || 0;
          var jours = parseFloat(document.getElementById('jours').value) || 218;
          var conges = parseFloat(document.getElementById('conges').value) || 0;
          if (net <= 0) { alert('Entrez un revenu net mensuel souhaité.'); return; }
          var joursEffectifs = Math.max(1, jours - (conges * 5));
          var caMensuel = (net + frais) / (1 - charges / 100);
          var caAnnuel = caMensuel * 12;
          var tjm = caAnnuel / joursEffectifs;
          var chargesAnnuelles = caAnnuel * (charges / 100);
          document.getElementById('resTjm').textContent = Math.ceil(tjm).toLocaleString('fr-FR');
          document.getElementById('resCaAnnuel').textContent = fmt(Math.ceil(caAnnuel));
          document.getElementById('resCaMensuel').textContent = fmt(Math.ceil(caMensuel));
          document.getElementById('resJours').textContent = joursEffectifs + ' jours';
          document.getElementById('resCharges').textContent = fmt(Math.ceil(chargesAnnuelles));
          document.getElementById('resultBox').classList.add('visible');
          document.getElementById('ctaResult').style.display = 'block';
          document.getElementById('resultBox').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
        document.getElementById('calcBtn').addEventListener('click', calcTjm);
        // FAQ accordion
        document.querySelectorAll('[data-faq]').forEach(function(btn) {
          btn.addEventListener('click', function() {
            var a = btn.nextElementSibling;
            var open = a.classList.contains('open');
            btn.classList.toggle('open', !open);
            a.classList.toggle('open', !open);
          });
        });
      ` }} />
    </>
  )
}
