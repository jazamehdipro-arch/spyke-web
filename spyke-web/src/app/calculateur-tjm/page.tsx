import type { Metadata } from 'next'
import { SEO_TOOL_CSS } from '@/components/seo/seo-tool-styles'
import { ConversionBanner, OtherTools } from '@/components/seo/SeoBlocks'

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
          text: "Pour calculer son TJM, il faut partir du revenu net souhaité, y ajouter les charges sociales et les frais professionnels pour obtenir le CA annuel nécessaire, puis diviser par le nombre de jours facturables.",
        },
      },
      {
        '@type': 'Question',
        name: "Quel est le TJM moyen d'un freelance en France ?",
        acceptedAnswer: {
          '@type': 'Answer',
          text: "En France, le TJM moyen varie entre 300 € et 800 € selon le domaine. Les développeurs senior et consultants atteignent souvent 600 € à 1 000 €/jour.",
        },
      },
      {
        '@type': 'Question',
        name: 'Combien de jours facturables par an pour un freelance ?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: "Un freelance peut facturer entre 180 et 220 jours par an. Les 252 jours ouvrés diminuent après congés, jours fériés et temps non facturable.",
        },
      },
      {
        '@type': 'Question',
        name: 'Faut-il inclure les charges dans son TJM ?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: "Oui, absolument. Votre TJM doit couvrir vos cotisations sociales (22 % à 25,6 % selon le statut), vos frais professionnels et votre revenu net souhaité.",
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

  const CALC_CSS = `
    .calc-wrap{max-width:640px;margin:-16px auto 0;padding:0 40px;position:relative;z-index:10}
    .calc-card{background:#fff;border-radius:20px;padding:28px;box-shadow:0 4px 40px rgba(0,0,0,.12);border:1px solid rgba(0,0,0,.04)}
    .calc-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}
    @media(max-width:560px){.calc-grid{grid-template-columns:1fr}}
    .calc-field{display:flex;flex-direction:column;gap:5px}
    .calc-hint{font-size:11px;color:#a1a1aa;margin-top:2px}
    .calc-btn{width:100%;padding:15px;margin-top:20px;background:#facc15;color:#0a0a0a;border:none;border-radius:12px;font-size:15px;font-weight:800;cursor:pointer;transition:all .15s;box-shadow:0 4px 14px rgba(250,204,21,.4);font-family:inherit}
    .calc-btn:hover{background:#e6b800;transform:translateY(-1px);box-shadow:0 8px 24px rgba(250,204,21,.5)}
    .calc-result{background:#0a0a0a;border-radius:16px;padding:24px;margin-top:16px;display:none}
    .calc-result.show{display:block}
    .calc-result-main{text-align:center;margin-bottom:20px;padding-bottom:20px;border-bottom:1px solid rgba(255,255,255,.07)}
    .calc-result-label{font-size:11px;color:rgba(255,255,255,.4);font-weight:700;text-transform:uppercase;letter-spacing:1.2px;margin-bottom:6px}
    .calc-result-value{font-size:56px;font-weight:900;color:#facc15;letter-spacing:-3px;line-height:1}
    .calc-result-sub{font-size:13px;color:rgba(255,255,255,.3);margin-top:6px}
    .calc-result-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
    @media(max-width:500px){.calc-result-grid{grid-template-columns:1fr}}
    .calc-result-item{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.06);border-radius:10px;padding:12px 14px}
    .calc-result-item-label{font-size:10px;color:rgba(255,255,255,.35);font-weight:700;text-transform:uppercase;letter-spacing:.8px;margin-bottom:4px}
    .calc-result-item-value{font-size:18px;font-weight:800;color:#fff}
    .calc-content{max-width:760px;margin:48px auto 0;padding:0 40px}
    .calc-content-card{background:#fff;border:1px solid #e4e4ec;border-radius:14px;padding:24px;margin-bottom:14px}
    .calc-content h2{font-size:22px;font-weight:900;letter-spacing:-.5px;margin-bottom:14px;color:#0a0a0a}
    .calc-content p{color:#52525b;line-height:1.75;margin-bottom:12px;font-size:14px}
    .calc-content ul{color:#52525b;padding-left:0;list-style:none;font-size:14px;line-height:1.9}
    .calc-content ul li{padding:3px 0 3px 20px;position:relative}
    .calc-content ul li::before{content:'→';position:absolute;left:0;color:#facc15;font-weight:700}
    .calc-content strong{color:#0a0a0a}
    @media(max-width:640px){.calc-wrap,.calc-content{padding:0 16px}.calc-result-value{font-size:40px}}
  `

  return (
    <>
      <style>{SEO_TOOL_CSS}</style>
      <style>{CALC_CSS}</style>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(appJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      <div className="seo-tool">
        <nav className="seo-navbar">
          <a href="/" className="seo-nav-logo">
            <div className="seo-nav-logo-icon">
              <svg viewBox="0 0 24 24" width="15" height="15" fill="#facc15">
                <path d="M13 3L4 14h7l-2 7 9-11h-7l2-7z" />
              </svg>
            </div>
            <span className="seo-nav-logo-text">Spyke</span>
          </a>
          <div className="seo-nav-tools">
            <a href="/facture-auto-entrepreneur" className="seo-nav-tool">Factures</a>
            <a href="/devis-freelance" className="seo-nav-tool">Devis</a>
            <a href="/calcul-charges-auto-entrepreneur" className="seo-nav-tool">Charges</a>
            <a href="/blog" className="seo-nav-tool">Blog</a>
          </div>
          <a href="/connexion.html" className="seo-nav-cta">Commencer</a>
        </nav>

        <div className="seo-hero">
          <span className="seo-hero-badge">
            <span className="seo-hero-badge-dot" />
            Outil gratuit 2026
          </span>
          <h1>
            Calculateur de <span>TJM freelance</span>
          </h1>
          <p className="seo-hero-sub">
            Entrez votre revenu net souhaité et obtenez instantanément votre{' '}
            <b>taux journalier moyen recommandé</b> avec le CA annuel à atteindre.
          </p>
        </div>

        {/* Calculator */}
        <div className="calc-wrap">
          <div className="calc-card">
            <div className="calc-grid">
              <div className="calc-field seo-group">
                <label className="seo-label" htmlFor="net">Revenu net mensuel souhaité (€)</label>
                <input id="net" type="number" className="seo-input" min="0" placeholder="3 500" />
                <span className="calc-hint">Ce que vous voulez toucher chaque mois</span>
              </div>
              <div className="calc-field seo-group">
                <label className="seo-label" htmlFor="charges">Charges sociales (%)</label>
                <input id="charges" type="number" className="seo-input" min="0" max="100" step="0.1" defaultValue="22" placeholder="22" />
                <span className="calc-hint">22 % auto-entrepreneur services</span>
              </div>
              <div className="calc-field seo-group">
                <label className="seo-label" htmlFor="frais">Frais professionnels mensuels (€)</label>
                <input id="frais" type="number" className="seo-input" min="0" defaultValue="0" placeholder="300" />
                <span className="calc-hint">Logiciels, matériel, déplacements…</span>
              </div>
              <div className="calc-field seo-group">
                <label className="seo-label" htmlFor="jours">Jours facturables par an</label>
                <input id="jours" type="number" className="seo-input" min="1" max="365" defaultValue="218" placeholder="218" />
                <span className="calc-hint">Jours ouvrés hors congés et fériés</span>
              </div>
              <div className="calc-field seo-group">
                <label className="seo-label" htmlFor="conges">Semaines de congés par an</label>
                <input id="conges" type="number" className="seo-input" min="0" max="52" defaultValue="5" placeholder="5" />
                <span className="calc-hint">Semaines non travaillées / non facturées</span>
              </div>
            </div>

            <button className="calc-btn" id="calcBtn">Calculer mon TJM →</button>

            <div className="calc-result" id="resultBox">
              <div className="calc-result-main">
                <div className="calc-result-label">Votre TJM recommandé</div>
                <div className="calc-result-value" id="resTjm">—</div>
                <div className="calc-result-sub">€ / jour facturé</div>
              </div>
              <div className="calc-result-grid">
                <div className="calc-result-item">
                  <div className="calc-result-item-label">CA annuel nécessaire</div>
                  <div className="calc-result-item-value" id="resCaAnnuel">—</div>
                </div>
                <div className="calc-result-item">
                  <div className="calc-result-item-label">CA mensuel moyen</div>
                  <div className="calc-result-item-value" id="resCaMensuel">—</div>
                </div>
                <div className="calc-result-item">
                  <div className="calc-result-item-label">Jours facturables effectifs</div>
                  <div className="calc-result-item-value" id="resJours">—</div>
                </div>
                <div className="calc-result-item">
                  <div className="calc-result-item-label">Charges annuelles</div>
                  <div className="calc-result-item-value" id="resCharges">—</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content SEO */}
        <section className="calc-content">
          <div className="calc-content-card">
            <div style={{ width: 48, height: 3, background: '#facc15', borderRadius: 2, marginBottom: 16 }} />
            <h2>Comment calculer son TJM freelance ?</h2>
            <p>
              Le TJM (taux journalier moyen) est le tarif facturé pour une journée de travail.
              La formule correcte part de votre <strong>revenu net souhaité</strong> et remonte jusqu&apos;au
              CA nécessaire :
            </p>
            <p>
              <strong>CA annuel = (revenu net mensuel + frais) / (1 − taux charges) × 12</strong><br />
              Puis <strong>TJM = CA annuel / jours facturables</strong>.
            </p>
            <p>
              Ce calculateur fait ce calcul automatiquement en tenant compte de vos congés et de vos
              charges réelles.
            </p>
          </div>

          <div className="calc-content-card">
            <div style={{ width: 48, height: 3, background: '#facc15', borderRadius: 2, marginBottom: 16 }} />
            <h2>Quelles charges prévoir selon votre statut ?</h2>
            <ul>
              <li><strong>Auto-entrepreneur BNC (services libéraux) :</strong> 25,6 % en 2026</li>
              <li><strong>Auto-entrepreneur BIC (services commerciaux) :</strong> 21,2 %</li>
              <li><strong>Auto-entrepreneur Commerce :</strong> 12,3 %</li>
              <li><strong>EURL / SASU :</strong> entre 40 % et 55 % selon la rémunération</li>
              <li><strong>Portage salarial :</strong> environ 50 % du CA brut</li>
            </ul>
            <p style={{ marginTop: 12 }}>
              À ces cotisations, ajoutez vos frais réels : abonnements logiciels, matériel,
              comptable, déplacements. Ils doivent être couverts avant de calculer votre net.
            </p>
          </div>

          <div className="calc-content-card">
            <div style={{ width: 48, height: 3, background: '#facc15', borderRadius: 2, marginBottom: 16 }} />
            <h2>Pourquoi 218 jours par défaut ?</h2>
            <p>
              Une année compte environ 252 jours ouvrés. En retirant les jours fériés (~7 ouvrés)
              et 5 semaines de congés (25 jours), on arrive à <strong>218 jours disponibles</strong>.
              En réalité, la plupart des freelances facturent entre 180 et 210 jours par an — le
              reste est consacré à la prospection, la formation et l&apos;administratif.
            </p>
          </div>

          <p style={{ fontSize: 13, color: '#a1a1aa', textAlign: 'center', marginTop: 8 }}>
            Voir aussi :{' '}
            <a href="/calcul-charges-auto-entrepreneur" style={{ color: '#6b7280' }}>Calculateur de charges auto-entrepreneur</a>
            {' · '}
            <a href="/devis-freelance" style={{ color: '#6b7280' }}>Générateur de devis gratuit</a>
            {' · '}
            <a href="/facture-auto-entrepreneur" style={{ color: '#6b7280' }}>Générateur de facture</a>
          </p>
        </section>
      </div>

      <ConversionBanner
        title="Votre TJM calculé — créez votre premier devis"
        subtitle="Spyke génère un devis professionnel en 30 secondes avec vos tarifs et vos mentions légales. PDF prêt à envoyer."
        cta="Créer mon devis gratuitement"
        href="/devis-freelance"
      />

      <OtherTools />

      <div style={{ maxWidth: 760, margin: '48px auto 0', padding: '24px 40px', borderTop: '1px solid #e4e4e7', color: '#a1a1aa', fontSize: 13, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <span>© 2026 Spyke — Tous droits réservés</span>
        <span style={{ display: 'flex', gap: 16 }}>
          <a href="/mentions-legales.html" style={{ color: '#a1a1aa', textDecoration: 'none' }}>Mentions légales</a>
          <a href="/confidentialite.html" style={{ color: '#a1a1aa', textDecoration: 'none' }}>Confidentialité</a>
        </span>
      </div>

      <script dangerouslySetInnerHTML={{ __html: `
        function fmt(n) {
          return n.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' €';
        }
        document.getElementById('calcBtn').addEventListener('click', function() {
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
          document.getElementById('resJours').textContent = joursEffectifs + ' j';
          document.getElementById('resCharges').textContent = fmt(Math.ceil(chargesAnnuelles));
          var box = document.getElementById('resultBox');
          box.classList.add('show');
          box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        });
        document.getElementById('net').addEventListener('keydown', function(e) {
          if (e.key === 'Enter') document.getElementById('calcBtn').click();
        });
      `}} />
    </>
  )
}
