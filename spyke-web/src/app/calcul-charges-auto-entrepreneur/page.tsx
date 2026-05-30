import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Calculateur de Charges Auto-Entrepreneur 2026 | URSSAF & Impôt',
  description:
    'Calculez vos cotisations URSSAF et charges auto-entrepreneur en 2026. Commerce, Services BIC/BNC, versement libératoire. Résultat instantané, gratuit.',
  alternates: {
    canonical: 'https://spykeapp.fr/calcul-charges-auto-entrepreneur',
  },
  openGraph: {
    title: 'Calculateur de Charges Auto-Entrepreneur 2026 | URSSAF & Impôt',
    description:
      'Calculez vos cotisations URSSAF et charges auto-entrepreneur en 2026. Commerce, Services BIC/BNC, versement libératoire.',
    url: 'https://spykeapp.fr/calcul-charges-auto-entrepreneur',
    siteName: 'Spyke',
    locale: 'fr_FR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Calculateur de Charges Auto-Entrepreneur 2026',
    description:
      'Calculez vos cotisations URSSAF auto-entrepreneur en 2026 en quelques secondes.',
  },
}

export default function CalculChargesPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebApplication',
        name: 'Calculateur de charges auto-entrepreneur 2026',
        url: 'https://spykeapp.fr/calcul-charges-auto-entrepreneur',
        description:
          "Outil gratuit pour calculer les cotisations sociales URSSAF et l'impôt sur le revenu (versement libératoire) d'un auto-entrepreneur en 2026.",
        applicationCategory: 'FinanceApplication',
        operatingSystem: 'Web',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'EUR',
        },
        featureList: [
          'Calcul cotisations URSSAF 2026',
          "Versement libératoire de l'impôt",
          'Commerce, Services BIC et Services BNC',
          'Saisie mensuelle ou annuelle',
        ],
      },
      {
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: "Quelles sont les charges d'un auto-entrepreneur en 2026 ?",
            acceptedAnswer: {
              '@type': 'Answer',
              text: "En 2026, les cotisations sociales s'élèvent à 12,3 % du CA pour les activités de vente de marchandises, 21,2 % pour les prestations de services BIC et 25,6 % pour les prestations de services BNC (professions libérales non réglementées).",
            },
          },
          {
            '@type': 'Question',
            name: "Le versement libératoire est-il intéressant ?",
            acceptedAnswer: {
              '@type': 'Answer',
              text: "Le versement libératoire (VFL) permet de payer l'impôt sur le revenu en même temps que les cotisations sociales : +1 % pour le commerce, +1,7 % pour les services BIC, +2,2 % pour les BNC. C'est généralement avantageux si vous êtes imposé à 11 % ou plus.",
            },
          },
          {
            '@type': 'Question',
            name: "Comment calculer le revenu net d'un auto-entrepreneur ?",
            acceptedAnswer: {
              '@type': 'Answer',
              text: "Revenu net = CA − cotisations sociales − impôt (si VFL). Par exemple, un auto-entrepreneur BNC avec 3 000 €/mois de CA paie 768 € de cotisations. Avec le VFL (+2,2 %), il paie 66 € d'impôt supplémentaires, soit un revenu net d'environ 2 166 €.",
            },
          },
          {
            '@type': 'Question',
            name: "Quels plafonds de CA pour l'auto-entrepreneur en 2026 ?",
            acceptedAnswer: {
              '@type': 'Answer',
              text: "En 2026, le plafond est de 188 700 € pour les activités de vente (BIC marchandises) et 77 700 € pour les prestations de services (BIC ou BNC). Au-delà, vous basculez au régime réel.",
            },
          },
          {
            '@type': 'Question',
            name: "Peut-on déduire des frais en auto-entrepreneur ?",
            acceptedAnswer: {
              '@type': 'Answer',
              text: "Non, le régime de la micro-entreprise ne permet pas de déduire les frais réels. Les cotisations sont calculées sur le CA brut. En contrepartie, un abattement forfaitaire est appliqué pour le calcul de l'impôt sur le revenu (71 % commerce, 50 % BIC, 34 % BNC) si vous n'êtes pas au VFL.",
            },
          },
        ],
      },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <style>{`
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'Inter',system-ui,sans-serif;background:#0f0f13;color:#e8e8f0;line-height:1.6}
        a{color:#a78bfa;text-decoration:none}
        a:hover{text-decoration:underline}

        .nav{display:flex;align-items:center;justify-content:space-between;padding:16px 24px;border-bottom:1px solid #1e1e2e;position:sticky;top:0;background:#0f0f13;z-index:50}
        .nav-logo{font-size:1.4rem;font-weight:800;color:#a78bfa;letter-spacing:-0.5px}
        .nav-links{display:flex;gap:24px;font-size:.9rem}
        .nav-links a{color:#9ca3af}
        .nav-cta{background:#7c3aed;color:#fff!important;padding:8px 18px;border-radius:8px;font-weight:600;font-size:.85rem}
        .nav-burger{display:none;flex-direction:column;gap:5px;cursor:pointer;background:none;border:none;padding:4px}
        .nav-burger span{display:block;width:22px;height:2px;background:#e8e8f0;border-radius:2px}
        .nav-mobile{display:none;flex-direction:column;gap:12px;padding:16px 24px;background:#0f0f13;border-bottom:1px solid #1e1e2e}
        .nav-mobile a{color:#9ca3af;font-size:.9rem}
        .nav-mobile.open{display:flex}
        @media(max-width:700px){.nav-links{display:none}.nav-burger{display:flex}}

        .hero{text-align:center;padding:64px 24px 40px;max-width:720px;margin:0 auto}
        .hero-badge{display:inline-block;background:#1e1030;color:#a78bfa;border:1px solid #3b1d6e;border-radius:999px;font-size:.75rem;font-weight:600;padding:4px 14px;letter-spacing:.5px;margin-bottom:16px;text-transform:uppercase}
        h1{font-size:clamp(1.8rem,4vw,2.8rem);font-weight:900;line-height:1.15;letter-spacing:-1px;margin-bottom:16px}
        h1 span{background:linear-gradient(135deg,#a78bfa,#7c3aed);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
        .hero-sub{color:#9ca3af;font-size:1.05rem;max-width:560px;margin:0 auto 32px}

        .calc-card{background:#161622;border:1px solid #1e1e2e;border-radius:16px;padding:32px;max-width:640px;margin:0 auto 40px}

        .toggle-row{display:flex;gap:8px;margin-bottom:24px;background:#0f0f13;border-radius:10px;padding:4px}
        .toggle-btn{flex:1;padding:9px;border:none;border-radius:8px;cursor:pointer;font-size:.9rem;font-weight:600;background:transparent;color:#9ca3af;transition:.2s}
        .toggle-btn.active{background:#7c3aed;color:#fff}

        .form-group{margin-bottom:20px}
        label{display:block;font-size:.85rem;font-weight:600;color:#9ca3af;margin-bottom:6px;text-transform:uppercase;letter-spacing:.4px}
        input[type=number],select{width:100%;background:#0f0f13;border:1.5px solid #1e1e2e;border-radius:10px;padding:12px 16px;color:#e8e8f0;font-size:1rem;outline:none;transition:.2s;appearance:none}
        input[type=number]:focus,select:focus{border-color:#7c3aed;box-shadow:0 0 0 3px rgba(124,58,237,.15)}
        select option{background:#161622}

        .switch-row{display:flex;align-items:center;justify-content:space-between;padding:12px 0}
        .switch-label{font-size:.9rem;color:#d1d5db;font-weight:500}
        .switch{position:relative;display:inline-block;width:46px;height:26px}
        .switch input{opacity:0;width:0;height:0}
        .slider{position:absolute;inset:0;background:#1e1e2e;border-radius:999px;cursor:pointer;transition:.2s}
        .slider:before{content:'';position:absolute;height:20px;width:20px;left:3px;bottom:3px;background:#6b7280;border-radius:50%;transition:.2s}
        input:checked + .slider{background:#7c3aed}
        input:checked + .slider:before{transform:translateX(20px);background:#fff}

        .calc-btn{width:100%;background:linear-gradient(135deg,#7c3aed,#5b21b6);color:#fff;border:none;border-radius:12px;padding:16px;font-size:1rem;font-weight:700;cursor:pointer;letter-spacing:.3px;transition:.2s;margin-top:8px}
        .calc-btn:hover{opacity:.9;transform:translateY(-1px)}

        .result-box{background:linear-gradient(135deg,#1a0e3d,#16213e);border:1px solid #3b2d8e;border-radius:14px;padding:28px;margin-top:24px;display:none}
        .result-box.show{display:block}
        .result-main{text-align:center;margin-bottom:20px;padding-bottom:20px;border-bottom:1px solid #2a1f5e}
        .result-main-label{font-size:.85rem;color:#a78bfa;font-weight:600;text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px}
        .result-main-value{font-size:2.4rem;font-weight:900;color:#fff;letter-spacing:-1px}
        .result-main-sub{font-size:.9rem;color:#9ca3af;margin-top:4px}
        .result-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}
        @media(max-width:500px){.result-grid{grid-template-columns:1fr}}
        .result-item{background:#0f0f1a;border-radius:10px;padding:14px 16px}
        .result-item-label{font-size:.78rem;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:.4px;margin-bottom:4px}
        .result-item-value{font-size:1.25rem;font-weight:800;color:#e8e8f0}
        .result-note{font-size:.8rem;color:#6b7280;margin-top:16px;text-align:center;line-height:1.5}

        .section{max-width:720px;margin:0 auto;padding:0 24px 64px}
        h2{font-size:1.5rem;font-weight:800;margin-bottom:16px;letter-spacing:-.5px}
        h3{font-size:1.1rem;font-weight:700;margin-bottom:8px}
        p{color:#9ca3af;margin-bottom:16px}
        .content-card{background:#161622;border:1px solid #1e1e2e;border-radius:12px;padding:24px;margin-bottom:16px}

        .rate-table{width:100%;border-collapse:collapse;margin:16px 0 24px;font-size:.9rem}
        .rate-table th{text-align:left;padding:10px 14px;font-size:.78rem;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:.5px;border-bottom:1px solid #1e1e2e}
        .rate-table td{padding:12px 14px;border-bottom:1px solid #0f0f1a;color:#d1d5db}
        .rate-table tr:last-child td{border-bottom:none}
        .rate-table tr:hover td{background:#0f0f1a}
        .badge-purple{display:inline-block;background:#2d1060;color:#a78bfa;border-radius:6px;font-size:.75rem;font-weight:700;padding:2px 8px}

        .faq-item{border-bottom:1px solid #1e1e2e;padding:20px 0}
        .faq-item:last-child{border-bottom:none}
        .faq-q{font-weight:700;color:#e8e8f0;cursor:pointer;display:flex;justify-content:space-between;align-items:center;gap:16px;font-size:.95rem}
        .faq-q::after{content:'+';font-size:1.4rem;color:#7c3aed;flex-shrink:0;transition:.2s}
        .faq-item.open .faq-q::after{content:'−'}
        .faq-a{color:#9ca3af;font-size:.9rem;margin-top:10px;display:none;line-height:1.7}
        .faq-item.open .faq-a{display:block}

        .cta-block{background:linear-gradient(135deg,#1a0e3d,#0f172a);border:1px solid #3b2d8e;border-radius:16px;padding:40px 32px;text-align:center;margin-bottom:48px}
        .cta-block h2{color:#e8e8f0;margin-bottom:8px}
        .cta-block p{margin-bottom:24px;max-width:480px;margin-left:auto;margin-right:auto}
        .cta-btn{display:inline-block;background:linear-gradient(135deg,#7c3aed,#5b21b6);color:#fff!important;padding:14px 32px;border-radius:12px;font-weight:700;font-size:1rem;letter-spacing:.3px}
        .cta-btn:hover{opacity:.9;text-decoration:none!important}

        footer{text-align:center;padding:32px 24px;border-top:1px solid #1e1e2e;color:#4b5563;font-size:.85rem}
      `}</style>

      <nav className="nav">
        <a href="/" className="nav-logo">Spyke</a>
        <div className="nav-links">
          <a href="/facture-auto-entrepreneur">Factures</a>
          <a href="/devis-freelance">Devis</a>
          <a href="/calculateur-tjm">TJM</a>
          <a href="/blog">Blog</a>
          <a href="/facture-auto-entrepreneur" className="nav-cta">Commencer</a>
        </div>
        <button className="nav-burger" id="burger" aria-label="Menu">
          <span></span><span></span><span></span>
        </button>
      </nav>
      <div className="nav-mobile" id="navMobile">
        <a href="/facture-auto-entrepreneur">Factures</a>
        <a href="/devis-freelance">Devis</a>
        <a href="/calculateur-tjm">Calculateur TJM</a>
        <a href="/blog">Blog</a>
        <a href="/facture-auto-entrepreneur" className="nav-cta">Commencer gratuitement</a>
      </div>

      <main>
        <div className="hero">
          <span className="hero-badge">Taux URSSAF 2026</span>
          <h1>Calculateur de charges<br /><span>auto-entrepreneur</span></h1>
          <p className="hero-sub">
            Cotisations sociales, versement libératoire, revenu net estimé —
            résultat instantané selon votre activité et votre CA.
          </p>
        </div>

        <div className="calc-card">
          <div className="toggle-row" id="toggleRow">
            <button className="toggle-btn active" data-mode="mensuel">
              CA mensuel
            </button>
            <button className="toggle-btn" data-mode="annuel">
              CA annuel
            </button>
          </div>

          <div className="form-group">
            <label htmlFor="ca" id="caLabel">Chiffre d&apos;affaires mensuel (€)</label>
            <input
              type="number"
              id="ca"
              placeholder="3000"
              min="0"
              step="100"
            />
          </div>

          <div className="form-group">
            <label htmlFor="activite">Type d&apos;activité</label>
            <select id="activite">
              <option value="commerce">Vente de marchandises (Commerce)</option>
              <option value="bic">Prestations de services (BIC)</option>
              <option value="bnc" selected>Prestations de services (BNC)</option>
            </select>
          </div>

          <div className="switch-row">
            <span className="switch-label">Versement libératoire de l&apos;impôt</span>
            <label className="switch">
              <input type="checkbox" id="vfl" />
              <span className="slider"></span>
            </label>
          </div>

          <button className="calc-btn" id="calcBtn">
            Calculer mes charges
          </button>

          <div className="result-box" id="resultBox">
            <div className="result-main">
              <div className="result-main-label">Revenu net estimé</div>
              <div className="result-main-value" id="resNet">—</div>
              <div className="result-main-sub" id="resNetPeriod">/ mois</div>
            </div>
            <div className="result-grid">
              <div className="result-item">
                <div className="result-item-label">Cotisations URSSAF</div>
                <div className="result-item-value" id="resCotis">—</div>
              </div>
              <div className="result-item">
                <div className="result-item-label">Impôt (VFL)</div>
                <div className="result-item-value" id="resImpot">—</div>
              </div>
              <div className="result-item">
                <div className="result-item-label">Taux charges global</div>
                <div className="result-item-value" id="resTaux">—</div>
              </div>
              <div className="result-item">
                <div className="result-item-label">CA annuel</div>
                <div className="result-item-value" id="resCaAnnuel">—</div>
              </div>
            </div>
            <div className="result-note" id="resNote"></div>
          </div>
        </div>

        <section className="section">
          <div className="content-card">
            <h2>Les taux de charges auto-entrepreneur en 2026</h2>
            <p>
              Les cotisations sociales de l&apos;auto-entrepreneur sont calculées en appliquant un taux fixe
              directement sur le chiffre d&apos;affaires encaissé. Pas de bénéfice, pas de charge —
              et inversement, pas de possibilité de déduire les frais.
            </p>
            <table className="rate-table">
              <thead>
                <tr>
                  <th>Activité</th>
                  <th>Cotisations sociales</th>
                  <th>+ VFL impôt</th>
                  <th>Total avec VFL</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Vente de marchandises (Commerce)</td>
                  <td><span className="badge-purple">12,3 %</span></td>
                  <td>+1 %</td>
                  <td>13,3 %</td>
                </tr>
                <tr>
                  <td>Prestations de services BIC</td>
                  <td><span className="badge-purple">21,2 %</span></td>
                  <td>+1,7 %</td>
                  <td>22,9 %</td>
                </tr>
                <tr>
                  <td>Prestations de services BNC</td>
                  <td><span className="badge-purple">25,6 %</span></td>
                  <td>+2,2 %</td>
                  <td>27,8 %</td>
                </tr>
              </tbody>
            </table>
            <p>
              Ces taux sont en vigueur au 1er janvier 2026. Le taux BNC est passé de 24,6 % (2025)
              à 25,6 % dans le cadre de la convergence progressive vers les taux des travailleurs indépendants classiques.
            </p>
          </div>

          <div className="content-card">
            <h2>Comment fonctionne le versement libératoire ?</h2>
            <p>
              Le versement libératoire (VFL) permet de payer l&apos;impôt sur le revenu en même temps
              que vos cotisations sociales URSSAF, avec un taux fixe sur votre CA.
              C&apos;est une option à choisir lors de votre déclaration — elle est intéressante si
              votre taux marginal d&apos;imposition est de 11 % ou plus.
            </p>
            <h3>Conditions d&apos;éligibilité</h3>
            <p>
              Pour opter pour le VFL, le revenu fiscal de référence (RFR) de votre foyer fiscal de
              l&apos;avant-dernière année ne doit pas dépasser certains seuils. En 2026, le plafond
              est de 27 794 € par part fiscale. Cette option se prend au 31 décembre pour l&apos;année
              suivante (ou dans les 3 mois de création de l&apos;entreprise).
            </p>
          </div>

          <div className="content-card">
            <h2>Plafonds de CA auto-entrepreneur 2026</h2>
            <p>
              Le régime de la micro-entreprise est accessible tant que votre CA annuel ne dépasse pas :
            </p>
            <table className="rate-table">
              <thead>
                <tr>
                  <th>Activité</th>
                  <th>Plafond CA 2026</th>
                  <th>Plafond TVA franchise</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Vente de marchandises (Commerce, hébergement)</td>
                  <td><strong>188 700 €</strong></td>
                  <td>91 900 €</td>
                </tr>
                <tr>
                  <td>Prestations de services BIC</td>
                  <td><strong>77 700 €</strong></td>
                  <td>36 800 €</td>
                </tr>
                <tr>
                  <td>Professions libérales BNC</td>
                  <td><strong>77 700 €</strong></td>
                  <td>36 800 €</td>
                </tr>
              </tbody>
            </table>
            <p>
              Au-delà de ces seuils, vous basculez automatiquement au régime réel d&apos;imposition.
              Pour la TVA, une tolérance de 2 ans est accordée si vous dépassez ponctuellement le seuil.
            </p>
          </div>

          <div className="content-card">
            <h2>Calculer son revenu net : exemple concret</h2>
            <p>
              Vous êtes <strong>développeur freelance</strong> (BNC) avec 4 000 € de CA mensuel, sans versement libératoire :
            </p>
            <ul style={{ color: '#9ca3af', paddingLeft: '20px', marginBottom: '16px', lineHeight: '2' }}>
              <li>Cotisations URSSAF : 4 000 × 25,6 % = <strong>1 024 €</strong></li>
              <li>Revenu net avant impôt : 4 000 − 1 024 = <strong>2 976 €</strong></li>
              <li>Impôt sur le revenu : calculé sur 4 000 × 66 % = 2 640 € (abattement 34 %)</li>
            </ul>
            <p>
              Avec le <strong>versement libératoire</strong> (+2,2 %) : 4 000 × 2,2 % = 88 € d&apos;impôt supplémentaire.
              Revenu net : 4 000 − 1 024 − 88 = <strong>2 888 €</strong>.
            </p>
            <p>
              Le VFL est avantageux si votre taux d&apos;imposition moyen (après abattement de 34 %) dépasse 2,2 %.
              Pour un célibataire, ça correspond à un revenu annuel supérieur à environ 20 000 €.
            </p>
          </div>

          <div className="content-card">
            <h2>Déclarer et payer ses cotisations</h2>
            <p>
              Les cotisations se déclarent sur <strong>autoentrepreneur.urssaf.fr</strong>,
              mensuellement ou trimestriellement selon votre choix.
              Si vous optez pour la mensualisation, vous déclarez et payez chaque mois.
              En cas de CA nul, vous déclarez quand même <strong>0</strong> — ne pas déclarer entraîne une pénalité.
            </p>
            <p>
              Le paiement des cotisations donne droit aux prestations sociales : assurance maladie,
              retraite de base, retraite complémentaire, et indemnités journalières (sous conditions).
              Plus vous cotisez, plus vous validez des trimestres de retraite.
            </p>
          </div>

          <div className="content-card">
            <h2>Questions fréquentes</h2>
            <div className="faq-item">
              <div className="faq-q">Quelles sont les charges d&apos;un auto-entrepreneur en 2026 ?</div>
              <div className="faq-a">
                En 2026, les cotisations sociales s&apos;élèvent à 12,3 % du CA pour les activités de vente de
                marchandises, 21,2 % pour les prestations de services BIC et 25,6 % pour les prestations de
                services BNC (professions libérales non réglementées). Ces taux incluent l&apos;assurance maladie,
                les allocations familiales, la CSG/CRDS et la retraite.
              </div>
            </div>
            <div className="faq-item">
              <div className="faq-q">Le versement libératoire est-il intéressant ?</div>
              <div className="faq-a">
                Le versement libératoire (VFL) permet de payer l&apos;impôt sur le revenu en même temps que les
                cotisations sociales : +1 % pour le commerce, +1,7 % pour les services BIC, +2,2 % pour les BNC.
                C&apos;est généralement avantageux si vous êtes imposé à 11 % ou plus sur votre revenu imposable.
              </div>
            </div>
            <div className="faq-item">
              <div className="faq-q">Comment calculer le revenu net d&apos;un auto-entrepreneur ?</div>
              <div className="faq-a">
                Revenu net = CA − cotisations sociales − impôt (si VFL). Par exemple, un auto-entrepreneur BNC
                avec 3 000 €/mois de CA paie 768 € de cotisations. Avec le VFL (+2,2 %), il paie 66 € d&apos;impôt
                supplémentaires, soit un revenu net d&apos;environ 2 166 €.
              </div>
            </div>
            <div className="faq-item">
              <div className="faq-q">Quels plafonds de CA pour l&apos;auto-entrepreneur en 2026 ?</div>
              <div className="faq-a">
                En 2026, le plafond est de 188 700 € pour les activités de vente (BIC marchandises) et 77 700 €
                pour les prestations de services (BIC ou BNC). Au-delà, vous basculez au régime réel.
              </div>
            </div>
            <div className="faq-item">
              <div className="faq-q">Peut-on déduire des frais en auto-entrepreneur ?</div>
              <div className="faq-a">
                Non, le régime de la micro-entreprise ne permet pas de déduire les frais réels. Les cotisations
                sont calculées sur le CA brut. Un abattement forfaitaire est appliqué pour l&apos;impôt sur le revenu
                (71 % commerce, 50 % BIC, 34 % BNC) si vous n&apos;êtes pas au versement libératoire.
              </div>
            </div>
          </div>

          <div className="cta-block">
            <h2>Vous êtes auto-entrepreneur ?</h2>
            <p>
              Créez vos factures et devis conformes en moins de 30 secondes avec Spyke.
              Numérotation automatique, PDF professionnel, mentions légales incluses.
            </p>
            <a href="/facture-auto-entrepreneur" className="cta-btn">
              Créer ma première facture →
            </a>
          </div>

          <p style={{ color: '#4b5563', fontSize: '.85rem', textAlign: 'center' }}>
            Voir aussi :{' '}
            <a href="/calculateur-tjm">Calculateur TJM freelance</a>
            {' · '}
            <a href="/devis-freelance">Générateur de devis gratuit</a>
            {' · '}
            <a href="/blog/facturation-electronique-obligatoire-freelance-2026">
              Facturation électronique 2026
            </a>
          </p>
        </section>
      </main>

      <footer>
        <p>© 2026 Spyke · <a href="/mentions-legales">Mentions légales</a> · <a href="/blog">Blog</a></p>
        <p style={{ marginTop: '8px' }}>
          Calculs basés sur les taux URSSAF en vigueur au 1er janvier 2026. Non contractuel.
        </p>
      </footer>

      <script dangerouslySetInnerHTML={{ __html: `
        // Toggle mensuel/annuel
        var caMode = 'mensuel';
        document.querySelectorAll('.toggle-btn').forEach(function(btn) {
          btn.addEventListener('click', function() {
            caMode = this.dataset.mode;
            document.querySelectorAll('.toggle-btn').forEach(function(b){ b.classList.remove('active'); });
            this.classList.add('active');
            var lbl = document.getElementById('caLabel');
            lbl.textContent = caMode === 'mensuel' ? "Chiffre d'affaires mensuel (€)" : "Chiffre d'affaires annuel (€)";
          });
        });

        // Calcul principal
        document.getElementById('calcBtn').addEventListener('click', function() {
          var caInput = parseFloat(document.getElementById('ca').value) || 0;
          var activite = document.getElementById('activite').value;
          var vfl = document.getElementById('vfl').checked;

          var tauxCotis = activite === 'commerce' ? 12.3 : activite === 'bic' ? 21.2 : 25.6;
          var tauxVfl = activite === 'commerce' ? 1.0 : activite === 'bic' ? 1.7 : 2.2;

          // Normaliser en mensuel pour l'affichage
          var caMensuel = caMode === 'annuel' ? caInput / 12 : caInput;
          var caAnnuel = caMode === 'annuel' ? caInput : caInput * 12;

          if (caMensuel <= 0) {
            alert('Veuillez saisir un chiffre d\\'affaires.');
            return;
          }

          var cotisMensuel = caMensuel * tauxCotis / 100;
          var impotMensuel = vfl ? caMensuel * tauxVfl / 100 : 0;
          var netMensuel = caMensuel - cotisMensuel - impotMensuel;
          var tauxTotal = tauxCotis + (vfl ? tauxVfl : 0);

          var fmt = function(n) {
            return n.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' €';
          };

          document.getElementById('resNet').textContent = fmt(netMensuel);
          document.getElementById('resNetPeriod').textContent = caMode === 'annuel' ? '/ mois (estimation)' : '/ mois';
          document.getElementById('resCotis').textContent = fmt(cotisMensuel) + ' / mois';
          document.getElementById('resImpot').textContent = vfl ? fmt(impotMensuel) + ' / mois' : 'Non activé';
          document.getElementById('resTaux').textContent = tauxTotal.toFixed(1).replace('.', ',') + ' %';
          document.getElementById('resCaAnnuel').textContent = fmt(caAnnuel);

          var activiteLabel = activite === 'commerce' ? 'Commerce (BIC marchandises)' : activite === 'bic' ? 'Services BIC' : 'Services BNC';
          document.getElementById('resNote').innerHTML =
            'Activité : ' + activiteLabel + ' · Taux cotisations : ' + tauxCotis.toFixed(1).replace('.', ',') + ' %' +
            (vfl ? ' · VFL : +' + tauxVfl.toFixed(1).replace('.', ',') + ' %' : '') +
            '<br>Calcul sur la base de taux URSSAF 2026. Le revenu net est avant impôt sur le revenu (sauf si VFL activé).';

          document.getElementById('resultBox').classList.add('show');
          document.getElementById('resultBox').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        });

        // FAQ accordion
        document.querySelectorAll('.faq-q').forEach(function(q) {
          q.addEventListener('click', function() {
            var item = this.closest('.faq-item');
            item.classList.toggle('open');
          });
        });

        // Mobile nav
        document.getElementById('burger').addEventListener('click', function() {
          document.getElementById('navMobile').classList.toggle('open');
        });

        // Allow Enter key on inputs
        document.getElementById('ca').addEventListener('keydown', function(e) {
          if (e.key === 'Enter') document.getElementById('calcBtn').click();
        });
      `}} />
    </>
  )
}
