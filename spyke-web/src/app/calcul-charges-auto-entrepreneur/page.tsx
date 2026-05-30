import type { Metadata } from 'next'
import { SEO_TOOL_CSS } from '@/components/seo/seo-tool-styles'
import { ConversionBanner, OtherTools } from '@/components/seo/SeoBlocks'

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
    description: 'Calculez vos cotisations URSSAF auto-entrepreneur en 2026 en quelques secondes.',
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
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
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
              text: "En 2026, les cotisations sociales s'élèvent à 12,3 % du CA pour les activités de vente de marchandises, 21,2 % pour les prestations de services BIC et 25,6 % pour les prestations de services BNC.",
            },
          },
          {
            '@type': 'Question',
            name: 'Le versement libératoire est-il intéressant ?',
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
              text: "Revenu net = CA − cotisations sociales − impôt (si VFL). Par exemple, un auto-entrepreneur BNC avec 3 000 €/mois paie 768 € de cotisations, soit un revenu net d'environ 2 232 €.",
            },
          },
          {
            '@type': 'Question',
            name: "Quels plafonds de CA pour l'auto-entrepreneur en 2026 ?",
            acceptedAnswer: {
              '@type': 'Answer',
              text: "En 2026, le plafond est de 188 700 € pour les activités de vente (BIC marchandises) et 77 700 € pour les prestations de services (BIC ou BNC).",
            },
          },
          {
            '@type': 'Question',
            name: "Peut-on déduire des frais en auto-entrepreneur ?",
            acceptedAnswer: {
              '@type': 'Answer',
              text: "Non, le régime micro ne permet pas de déduire les frais réels. Un abattement forfaitaire est appliqué pour l'IR (71 % commerce, 50 % BIC, 34 % BNC) si vous n'êtes pas au versement libératoire.",
            },
          },
        ],
      },
    ],
  }

  const CALC_CSS = `
    .calc-wrap{max-width:640px;margin:-16px auto 0;padding:0 40px;position:relative;z-index:10}
    .calc-card{background:#fff;border-radius:20px;padding:28px;box-shadow:0 4px 40px rgba(0,0,0,.12);border:1px solid rgba(0,0,0,.04)}
    .calc-toggle-row{display:flex;gap:6px;margin-bottom:22px;background:#f4f4f8;border-radius:10px;padding:4px}
    .calc-toggle-btn{flex:1;padding:9px 16px;border:none;border-radius:8px;cursor:pointer;font-size:13px;font-weight:600;background:transparent;color:#71717a;transition:.15s;font-family:inherit}
    .calc-toggle-btn.active{background:#facc15;color:#0a0a0a;box-shadow:0 2px 8px rgba(250,204,21,.3)}
    .calc-field-group{margin-top:16px}
    .calc-switch-row{display:flex;align-items:center;justify-content:space-between;padding:16px 0;border-top:1px solid #f3f4f6;margin-top:16px}
    .calc-switch-label{font-size:14px;color:#374151;font-weight:500}
    .calc-switch{position:relative;display:inline-block;width:44px;height:24px;flex-shrink:0}
    .calc-switch input{opacity:0;width:0;height:0}
    .calc-slider{position:absolute;inset:0;background:#e5e7eb;border-radius:999px;cursor:pointer;transition:.2s}
    .calc-slider:before{content:'';position:absolute;height:18px;width:18px;left:3px;bottom:3px;background:#fff;border-radius:50%;transition:.2s;box-shadow:0 1px 3px rgba(0,0,0,.2)}
    input:checked+.calc-slider{background:#facc15}
    input:checked+.calc-slider:before{transform:translateX(20px)}
    .calc-btn{width:100%;padding:15px;margin-top:20px;background:#facc15;color:#0a0a0a;border:none;border-radius:12px;font-size:15px;font-weight:800;cursor:pointer;transition:all .15s;box-shadow:0 4px 14px rgba(250,204,21,.4);font-family:inherit}
    .calc-btn:hover{background:#e6b800;transform:translateY(-1px);box-shadow:0 8px 24px rgba(250,204,21,.5)}
    .calc-result{background:#0a0a0a;border-radius:16px;padding:24px;margin-top:16px;display:none}
    .calc-result.show{display:block}
    .calc-result-main{text-align:center;margin-bottom:20px;padding-bottom:20px;border-bottom:1px solid rgba(255,255,255,.07)}
    .calc-result-label{font-size:11px;color:rgba(255,255,255,.4);font-weight:700;text-transform:uppercase;letter-spacing:1.2px;margin-bottom:6px}
    .calc-result-value{font-size:48px;font-weight:900;color:#facc15;letter-spacing:-2px;line-height:1}
    .calc-result-sub{font-size:13px;color:rgba(255,255,255,.3);margin-top:6px}
    .calc-result-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
    .calc-result-item{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.06);border-radius:10px;padding:12px 14px}
    .calc-result-item-label{font-size:10px;color:rgba(255,255,255,.35);font-weight:700;text-transform:uppercase;letter-spacing:.8px;margin-bottom:4px}
    .calc-result-item-value{font-size:18px;font-weight:800;color:#fff}
    .calc-result-note{font-size:11px;color:rgba(255,255,255,.22);margin-top:14px;text-align:center;line-height:1.6}
    .calc-content{max-width:760px;margin:48px auto 0;padding:0 40px}
    .calc-content-card{background:#fff;border:1px solid #e4e4ec;border-radius:14px;padding:24px;margin-bottom:14px}
    .calc-content h2{font-size:22px;font-weight:900;letter-spacing:-.5px;margin-bottom:14px;color:#0a0a0a}
    .calc-content h3{font-size:16px;font-weight:800;margin-bottom:8px;color:#0a0a0a;margin-top:16px}
    .calc-content p{color:#52525b;line-height:1.75;margin-bottom:12px;font-size:14px}
    .calc-content ul{color:#52525b;padding-left:20px;line-height:1.9;font-size:14px}
    .rate-table{width:100%;border-collapse:collapse;margin:12px 0 16px;font-size:13px}
    .rate-table th{text-align:left;padding:8px 12px;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.5px;border-bottom:1.5px solid #e4e4ec}
    .rate-table td{padding:10px 12px;border-bottom:1px solid #f3f4f6;color:#374151}
    .rate-table tr:last-child td{border-bottom:none}
    .rate-table tr:hover td{background:#fafafa}
    .badge-yellow{display:inline-block;background:rgba(250,204,21,.15);color:#78350f;border-radius:6px;font-size:12px;font-weight:700;padding:2px 8px;border:1px solid rgba(250,204,21,.3)}
    @media(max-width:640px){.calc-wrap,.calc-content{padding:0 16px}.calc-result-grid{grid-template-columns:1fr}.calc-result-value{font-size:36px}}
  `

  return (
    <>
      <style>{SEO_TOOL_CSS}</style>
      <style>{CALC_CSS}</style>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

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
            <a href="/calculateur-tjm" className="seo-nav-tool">TJM</a>
            <a href="/blog" className="seo-nav-tool">Blog</a>
          </div>
          <a href="/connexion.html" className="seo-nav-cta">Commencer</a>
        </nav>

        <div className="seo-hero">
          <span className="seo-hero-badge">
            <span className="seo-hero-badge-dot" />
            Taux URSSAF 2026
          </span>
          <h1>
            Calculateur de charges<br />
            <span>auto-entrepreneur</span>
          </h1>
          <p className="seo-hero-sub">
            Cotisations sociales, versement libératoire, revenu net estimé —{' '}
            <b>résultat instantané</b> selon votre activité et votre CA.
          </p>
        </div>

        {/* Calculator card */}
        <div className="calc-wrap">
          <div className="calc-card">

            <div className="calc-toggle-row" id="toggleRow">
              <button className="calc-toggle-btn active" data-mode="mensuel">CA mensuel</button>
              <button className="calc-toggle-btn" data-mode="annuel">CA annuel</button>
            </div>

            <div className="seo-group">
              <label className="seo-label" id="caLabel">Chiffre d&apos;affaires mensuel (€)</label>
              <input
                type="number"
                id="ca"
                className="seo-input"
                placeholder="3 000"
                min="0"
                step="100"
              />
            </div>

            <div className="seo-group calc-field-group">
              <label className="seo-label">Type d&apos;activité</label>
              <select id="activite" className="seo-select" defaultValue="bnc">
                <option value="commerce">Vente de marchandises (Commerce)</option>
                <option value="bic">Prestations de services (BIC)</option>
                <option value="bnc">Prestations de services (BNC)</option>
              </select>
            </div>

            <div className="calc-switch-row">
              <span className="calc-switch-label">Versement libératoire de l&apos;impôt</span>
              <label className="calc-switch">
                <input type="checkbox" id="vfl" />
                <span className="calc-slider" />
              </label>
            </div>

            <button className="calc-btn" id="calcBtn">
              Calculer mes charges →
            </button>

            <div className="calc-result" id="resultBox">
              <div className="calc-result-main">
                <div className="calc-result-label">Revenu net estimé</div>
                <div className="calc-result-value" id="resNet">—</div>
                <div className="calc-result-sub" id="resNetPeriod">/ mois</div>
              </div>
              <div className="calc-result-grid">
                <div className="calc-result-item">
                  <div className="calc-result-item-label">Cotisations URSSAF</div>
                  <div className="calc-result-item-value" id="resCotis">—</div>
                </div>
                <div className="calc-result-item">
                  <div className="calc-result-item-label">Impôt (VFL)</div>
                  <div className="calc-result-item-value" id="resImpot">—</div>
                </div>
                <div className="calc-result-item">
                  <div className="calc-result-item-label">Taux charges global</div>
                  <div className="calc-result-item-value" id="resTaux">—</div>
                </div>
                <div className="calc-result-item">
                  <div className="calc-result-item-label">CA annuel</div>
                  <div className="calc-result-item-value" id="resCaAnnuel">—</div>
                </div>
              </div>
              <div className="calc-result-note" id="resNote" />
            </div>
          </div>
        </div>

        {/* Content SEO */}
        <section className="calc-content">
          <div className="calc-content-card">
            <div style={{ width: 48, height: 3, background: '#facc15', borderRadius: 2, marginBottom: 16 }} />
            <h2>Les taux de charges auto-entrepreneur en 2026</h2>
            <p>
              Les cotisations sociales sont calculées en appliquant un taux fixe directement sur le
              chiffre d&apos;affaires encaissé. Pas de bénéfice, pas de charge — et inversement, pas de
              déduction de frais.
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
                  <td><span className="badge-yellow">12,3 %</span></td>
                  <td>+1,0 %</td>
                  <td>13,3 %</td>
                </tr>
                <tr>
                  <td>Prestations de services BIC</td>
                  <td><span className="badge-yellow">21,2 %</span></td>
                  <td>+1,7 %</td>
                  <td>22,9 %</td>
                </tr>
                <tr>
                  <td>Prestations de services BNC</td>
                  <td><span className="badge-yellow">25,6 %</span></td>
                  <td>+2,2 %</td>
                  <td>27,8 %</td>
                </tr>
              </tbody>
            </table>
            <p>
              Le taux BNC est passé de 24,6 % (2025) à 25,6 % en 2026 dans le cadre de la convergence
              progressive vers les taux des travailleurs indépendants classiques.
            </p>
          </div>

          <div className="calc-content-card">
            <div style={{ width: 48, height: 3, background: '#facc15', borderRadius: 2, marginBottom: 16 }} />
            <h2>Comment fonctionne le versement libératoire ?</h2>
            <p>
              Le versement libératoire (VFL) permet de payer l&apos;impôt sur le revenu en même temps que vos
              cotisations URSSAF, avec un taux fixe sur votre CA. C&apos;est avantageux si votre taux
              marginal d&apos;imposition est de 11 % ou plus.
            </p>
            <h3>Conditions d&apos;éligibilité</h3>
            <p>
              Le revenu fiscal de référence (RFR) de votre foyer fiscal de l&apos;avant-dernière année
              ne doit pas dépasser 27 794 € par part fiscale. L&apos;option se prend au 31 décembre pour
              l&apos;année suivante (ou dans les 3 mois de création).
            </p>
          </div>

          <div className="calc-content-card">
            <div style={{ width: 48, height: 3, background: '#facc15', borderRadius: 2, marginBottom: 16 }} />
            <h2>Exemple concret — développeur freelance BNC</h2>
            <p>
              Vous êtes développeur (BNC) avec 4 000 € de CA mensuel, sans versement libératoire :
            </p>
            <ul>
              <li>Cotisations URSSAF : 4 000 × 25,6 % = <strong>1 024 €</strong></li>
              <li>Revenu net avant impôt : 4 000 − 1 024 = <strong>2 976 €</strong></li>
              <li>Impôt calculé sur 4 000 × 66 % = 2 640 € (abattement 34 %)</li>
            </ul>
            <p style={{ marginTop: 12 }}>
              Avec le <strong>versement libératoire</strong> (+2,2 %) : 4 000 × 2,2 % = 88 € d&apos;impôt
              supplémentaire par mois. Revenu net : 4 000 − 1 024 − 88 = <strong>2 888 €</strong>.
            </p>
          </div>

          <div className="calc-content-card">
            <div style={{ width: 48, height: 3, background: '#facc15', borderRadius: 2, marginBottom: 16 }} />
            <h2>Plafonds de CA auto-entrepreneur 2026</h2>
            <table className="rate-table">
              <thead>
                <tr>
                  <th>Activité</th>
                  <th>Plafond CA 2026</th>
                  <th>Franchise TVA</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Vente de marchandises</td>
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
          </div>

          <p style={{ fontSize: 13, color: '#a1a1aa', textAlign: 'center', marginTop: 8 }}>
            Voir aussi :{' '}
            <a href="/calculateur-tjm" style={{ color: '#6b7280' }}>Calculateur TJM freelance</a>
            {' · '}
            <a href="/devis-freelance" style={{ color: '#6b7280' }}>Générateur de devis gratuit</a>
            {' · '}
            <a href="/blog/facturation-electronique-obligatoire-freelance-2026" style={{ color: '#6b7280' }}>
              Facturation électronique 2026
            </a>
          </p>
        </section>
      </div>

      <ConversionBanner
        title="Gérez vos factures en quelques secondes"
        subtitle="Spyke génère vos factures auto-entrepreneur en PDF avec les bonnes mentions légales. Numérotation automatique, sans effort."
        cta="Créer ma première facture"
        href="/facture-auto-entrepreneur"
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
        var caMode = 'mensuel';

        document.querySelectorAll('.calc-toggle-btn').forEach(function(btn) {
          btn.addEventListener('click', function() {
            caMode = this.dataset.mode;
            document.querySelectorAll('.calc-toggle-btn').forEach(function(b){ b.classList.remove('active'); });
            this.classList.add('active');
            var lbl = document.getElementById('caLabel');
            if (lbl) lbl.textContent = caMode === 'mensuel' ? "Chiffre d'affaires mensuel (€)" : "Chiffre d'affaires annuel (€)";
          });
        });

        document.getElementById('calcBtn').addEventListener('click', function() {
          var caInput = parseFloat(document.getElementById('ca').value) || 0;
          var activite = document.getElementById('activite').value;
          var vfl = document.getElementById('vfl').checked;

          var tauxCotis = activite === 'commerce' ? 12.3 : activite === 'bic' ? 21.2 : 25.6;
          var tauxVfl = activite === 'commerce' ? 1.0 : activite === 'bic' ? 1.7 : 2.2;

          var caMensuel = caMode === 'annuel' ? caInput / 12 : caInput;
          var caAnnuel = caMode === 'annuel' ? caInput : caInput * 12;

          if (caMensuel <= 0) { alert("Veuillez saisir un chiffre d'affaires."); return; }

          var cotisMensuel = caMensuel * tauxCotis / 100;
          var impotMensuel = vfl ? caMensuel * tauxVfl / 100 : 0;
          var netMensuel = caMensuel - cotisMensuel - impotMensuel;
          var tauxTotal = tauxCotis + (vfl ? tauxVfl : 0);

          var fmt = function(n) {
            return n.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' €';
          };

          document.getElementById('resNet').textContent = fmt(netMensuel);
          document.getElementById('resNetPeriod').textContent = '/ mois';
          document.getElementById('resCotis').textContent = fmt(cotisMensuel) + '/mois';
          document.getElementById('resImpot').textContent = vfl ? fmt(impotMensuel) + '/mois' : 'Non activé';
          document.getElementById('resTaux').textContent = tauxTotal.toFixed(1).replace('.', ',') + ' %';
          document.getElementById('resCaAnnuel').textContent = fmt(caAnnuel);

          var activiteLabel = activite === 'commerce' ? 'Commerce' : activite === 'bic' ? 'Services BIC' : 'Services BNC';
          document.getElementById('resNote').textContent =
            activiteLabel + ' · Cotisations : ' + tauxCotis.toFixed(1).replace('.', ',') + ' %' +
            (vfl ? ' · VFL : +' + tauxVfl.toFixed(1).replace('.', ',') + ' %' : ' · VFL non activé') +
            ' · Taux URSSAF 2026';

          var box = document.getElementById('resultBox');
          box.classList.add('show');
          box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        });

        document.getElementById('ca').addEventListener('keydown', function(e) {
          if (e.key === 'Enter') document.getElementById('calcBtn').click();
        });
      `}} />
    </>
  )
}
