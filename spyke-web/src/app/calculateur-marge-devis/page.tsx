import type { Metadata } from 'next'
import { SEO_TOOL_CSS } from '@/components/seo/seo-tool-styles'
import { ConversionBanner, OtherTools } from '@/components/seo/SeoBlocks'

export const metadata: Metadata = {
  title: 'Calculateur de Marge sur Devis Freelance — Spyke',
  description:
    'Calculez la marge de votre devis freelance en quelques secondes : marge brute, marge nette, taux de marge en %. Indicateur visuel pour savoir si votre projet est rentable.',
  alternates: {
    canonical: 'https://spykeapp.fr/calculateur-marge-devis',
  },
  openGraph: {
    title: 'Calculateur de Marge sur Devis Freelance — Spyke',
    description:
      'Calculez la marge de votre devis freelance : marge brute, marge nette, taux de marge. Résultat instantané.',
    url: 'https://spykeapp.fr/calculateur-marge-devis',
    siteName: 'Spyke',
    locale: 'fr_FR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Calculateur de Marge sur Devis Freelance',
    description: 'Calculez votre marge sur devis en quelques secondes. Gratuit.',
  },
}

export default function CalculateurMargeDevisPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebApplication',
        name: 'Calculateur de marge sur devis freelance — Spyke',
        url: 'https://spykeapp.fr/calculateur-marge-devis',
        description:
          'Outil gratuit pour calculer la marge brute, la marge nette et le taux de marge sur un devis freelance.',
        applicationCategory: 'FinanceApplication',
        operatingSystem: 'Web',
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
      },
      {
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: "Comment calculer la marge d'un devis freelance ?",
            acceptedAnswer: {
              '@type': 'Answer',
              text: "Marge nette = prix de vente − coûts directs (matières + temps). Le taux de marge = marge nette / prix de vente × 100. Un taux supérieur à 40 % est généralement considéré comme sain pour un freelance.",
            },
          },
          {
            '@type': 'Question',
            name: 'Quelle est une bonne marge pour un freelance ?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: "Un taux de marge nette supérieur à 40 % est généralement sain pour un freelance. En dessous de 20 %, le projet est peu rentable une fois les charges sociales déduites.",
            },
          },
          {
            '@type': 'Question',
            name: "Quelle est la différence entre marge brute et marge nette ?",
            acceptedAnswer: {
              '@type': 'Answer',
              text: "La marge brute = prix de vente − coût des matières/sous-traitance uniquement. La marge nette = prix de vente − tous les coûts directs (matières + valeur du temps passé). La marge nette est le vrai bénéfice du projet.",
            },
          },
          {
            '@type': 'Question',
            name: "Doit-on inclure son temps dans les coûts d'un devis ?",
            acceptedAnswer: {
              '@type': 'Answer',
              text: "Oui, valoriser son temps au coût de revient horaire ou journalier est indispensable pour savoir si un projet est vraiment rentable. Beaucoup de freelances sous-estiment leurs devis en oubliant ce coût.",
            },
          },
        ],
      },
    ],
  }

  const CALC_CSS = `
    .calc-wrap{max-width:640px;margin:-16px auto 0;padding:0 40px;position:relative;z-index:10}
    .calc-card{background:#fff;border-radius:20px;padding:28px;box-shadow:0 4px 40px rgba(0,0,0,.12);border:1px solid rgba(0,0,0,.04)}
    .calc-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}
    @media(max-width:560px){.calc-grid{grid-template-columns:1fr}}
    .calc-toggle-row{display:flex;gap:6px;margin-bottom:22px;background:#f4f4f8;border-radius:10px;padding:4px}
    .calc-toggle-btn{flex:1;padding:9px 16px;border:none;border-radius:8px;cursor:pointer;font-size:13px;font-weight:600;background:transparent;color:#71717a;transition:.15s;font-family:inherit}
    .calc-toggle-btn.active{background:#facc15;color:#0a0a0a;box-shadow:0 2px 8px rgba(250,204,21,.3)}
    .calc-hint{font-size:11px;color:#a1a1aa;margin-top:3px}
    .calc-divider{grid-column:1/-1;border:none;border-top:1px solid #f3f4f6;margin:4px 0}
    .calc-btn{width:100%;padding:15px;margin-top:20px;background:#facc15;color:#0a0a0a;border:none;border-radius:12px;font-size:15px;font-weight:800;cursor:pointer;transition:all .15s;box-shadow:0 4px 14px rgba(250,204,21,.4);font-family:inherit}
    .calc-btn:hover{background:#e6b800;transform:translateY(-1px);box-shadow:0 8px 24px rgba(250,204,21,.5)}

    .calc-result{background:#0a0a0a;border-radius:16px;padding:24px;margin-top:16px;display:none}
    .calc-result.show{display:block}
    .calc-result-main{text-align:center;margin-bottom:20px;padding-bottom:20px;border-bottom:1px solid rgba(255,255,255,.07);position:relative}
    .calc-result-label{font-size:11px;color:rgba(255,255,255,.4);font-weight:700;text-transform:uppercase;letter-spacing:1.2px;margin-bottom:6px}
    .calc-result-value{font-size:52px;font-weight:900;letter-spacing:-2px;line-height:1;transition:color .3s}
    .calc-result-value.green{color:#22c55e}
    .calc-result-value.orange{color:#f59e0b}
    .calc-result-value.red{color:#ef4444}
    .calc-result-badge{display:inline-flex;align-items:center;gap:6px;margin-top:8px;padding:4px 14px;border-radius:999px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.8px}
    .calc-result-badge.green{background:rgba(34,197,94,.12);color:#22c55e;border:1px solid rgba(34,197,94,.2)}
    .calc-result-badge.orange{background:rgba(245,158,11,.12);color:#f59e0b;border:1px solid rgba(245,158,11,.2)}
    .calc-result-badge.red{background:rgba(239,68,68,.12);color:#ef4444;border:1px solid rgba(239,68,68,.2)}
    .calc-result-badge-dot{width:6px;height:6px;border-radius:50%;background:currentColor}

    .calc-result-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
    @media(max-width:500px){.calc-result-grid{grid-template-columns:1fr}}
    .calc-result-item{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.06);border-radius:10px;padding:12px 14px}
    .calc-result-item-label{font-size:10px;color:rgba(255,255,255,.35);font-weight:700;text-transform:uppercase;letter-spacing:.8px;margin-bottom:4px}
    .calc-result-item-value{font-size:18px;font-weight:800;color:#fff}
    .calc-result-advice{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.05);border-radius:10px;padding:12px 14px;margin-top:10px;font-size:12px;color:rgba(255,255,255,.4);line-height:1.6;text-align:center}

    .calc-content{max-width:760px;margin:48px auto 0;padding:0 40px}
    .calc-content-card{background:#fff;border:1px solid #e4e4ec;border-radius:14px;padding:24px;margin-bottom:14px}
    .calc-content h2{font-size:22px;font-weight:900;letter-spacing:-.5px;margin-bottom:14px;color:#0a0a0a}
    .calc-content h3{font-size:16px;font-weight:800;margin-bottom:8px;color:#0a0a0a;margin-top:14px}
    .calc-content p{color:#52525b;line-height:1.75;margin-bottom:12px;font-size:14px}
    .calc-content ul{color:#52525b;padding-left:0;list-style:none;font-size:14px;line-height:1.9}
    .calc-content ul li{padding:3px 0 3px 20px;position:relative}
    .calc-content ul li::before{content:'→';position:absolute;left:0;color:#facc15;font-weight:700}
    .calc-content strong{color:#0a0a0a}
    .margin-scale{display:flex;border-radius:8px;overflow:hidden;margin:12px 0 16px;height:28px;font-size:11px;font-weight:700}
    .margin-scale-bad{flex:2;background:#fef2f2;color:#dc2626;display:flex;align-items:center;justify-content:center;border:1px solid #fecaca}
    .margin-scale-ok{flex:2;background:#fffbeb;color:#b45309;display:flex;align-items:center;justify-content:center;border-top:1px solid #fde68a;border-bottom:1px solid #fde68a}
    .margin-scale-good{flex:3;background:#f0fdf4;color:#15803d;display:flex;align-items:center;justify-content:center;border:1px solid #bbf7d0}
    @media(max-width:640px){.calc-wrap,.calc-content{padding:0 16px}.calc-result-value{font-size:40px}}
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
            <a href="/devis-freelance" className="seo-nav-tool">Devis</a>
            <a href="/facture-auto-entrepreneur" className="seo-nav-tool">Factures</a>
            <a href="/calculateur-tjm" className="seo-nav-tool">TJM</a>
            <a href="/calcul-charges-auto-entrepreneur" className="seo-nav-tool">Charges</a>
          </div>
          <a href="/connexion.html" className="seo-nav-cta">Commencer</a>
        </nav>

        <div className="seo-hero">
          <span className="seo-hero-badge">
            <span className="seo-hero-badge-dot" />
            Calcul marge devis
          </span>
          <h1>
            Calculateur de <span>marge sur devis</span>
          </h1>
          <p className="seo-hero-sub">
            Renseignez votre prix de vente et vos coûts pour savoir instantanément
            si votre devis est <b>rentable</b> — marge brute, marge nette, taux de marge.
          </p>
        </div>

        {/* Calculator */}
        <div className="calc-wrap">
          <div className="calc-card">
            {/* Toggle jours/heures */}
            <div className="calc-toggle-row" id="toggleRow">
              <button className="calc-toggle-btn active" data-mode="jours">Temps en jours</button>
              <button className="calc-toggle-btn" data-mode="heures">Temps en heures</button>
            </div>

            <div className="calc-grid">
              <div className="seo-group" style={{ gridColumn: '1 / -1' }}>
                <label className="seo-label" htmlFor="pv">Prix de vente facturé au client (€)</label>
                <input
                  id="pv"
                  type="number"
                  className="seo-input"
                  min="0"
                  step="50"
                  placeholder="ex : 5 000"
                />
              </div>

              <div className="seo-group">
                <label className="seo-label" htmlFor="matieres">Coût matières / sous-traitance (€)</label>
                <input id="matieres" type="number" className="seo-input" min="0" defaultValue="0" placeholder="0" />
                <span className="calc-hint">Achats revendus, prestataires, licences…</span>
              </div>

              <div className="seo-group">
                <label className="seo-label" htmlFor="temps" id="tempsLabel">Temps passé (jours)</label>
                <input id="temps" type="number" className="seo-input" min="0" step="0.5" placeholder="ex : 5" />
                <span className="calc-hint" id="tempsHint">Nombre de jours travaillés sur ce projet</span>
              </div>

              <div className="seo-group">
                <label className="seo-label" htmlFor="cout" id="coutLabel">Coût de revient journalier (€)</label>
                <input id="cout" type="number" className="seo-input" min="0" placeholder="ex : 300" />
                <span className="calc-hint" id="coutHint">Votre coût horaire ou journalier réel (charges incluses)</span>
              </div>
            </div>

            <button className="calc-btn" id="calcBtn">
              Calculer ma marge →
            </button>

            <div className="calc-result" id="resultBox">
              <div className="calc-result-main">
                <div className="calc-result-label">Taux de marge nette</div>
                <div className="calc-result-value" id="resTaux">—</div>
                <div id="resBadge" />
              </div>
              <div className="calc-result-grid">
                <div className="calc-result-item">
                  <div className="calc-result-item-label">Marge brute</div>
                  <div className="calc-result-item-value" id="resGross">—</div>
                </div>
                <div className="calc-result-item">
                  <div className="calc-result-item-label">Marge nette</div>
                  <div className="calc-result-item-value" id="resNet">—</div>
                </div>
                <div className="calc-result-item">
                  <div className="calc-result-item-label">Coût total du projet</div>
                  <div className="calc-result-item-value" id="resCout">—</div>
                </div>
                <div className="calc-result-item">
                  <div className="calc-result-item-label">Bénéfice réel</div>
                  <div className="calc-result-item-value" id="resBenefit">—</div>
                </div>
              </div>
              <div className="calc-result-advice" id="resAdvice" />
            </div>
          </div>
        </div>

        {/* SEO content */}
        <section className="calc-content">
          <div className="calc-content-card">
            <div style={{ width: 48, height: 3, background: '#facc15', borderRadius: 2, marginBottom: 16 }} />
            <h2>Comment calculer la marge sur un devis freelance ?</h2>
            <p>
              Calculer correctement la marge d&apos;un devis est une étape critique pour tout freelance.
              Beaucoup fixent leur prix de vente au feeling, sans modéliser les coûts réels.
              Résultat : des projets acceptés à perte, ou des négociations inconfortables en cours de mission.
            </p>
            <p>
              La formule est simple :{' '}
              <strong>Marge nette = Prix de vente − (Coût des matières + Temps × Coût de revient)</strong>.
              Le taux de marge nette = Marge nette / Prix de vente × 100.
            </p>

            <div className="margin-scale">
              <div className="margin-scale-bad">{'< 20 % — Faible'}</div>
              <div className="margin-scale-ok">20–40 % — Acceptable</div>
              <div className="margin-scale-good">{'> 40 % — Saine ✓'}</div>
            </div>

            <p>
              Un taux de marge nette supérieur à <strong>40 %</strong> est généralement considéré
              comme sain pour un freelance. En dessous de <strong>20 %</strong>, le projet est peu
              rentable une fois les charges sociales déduites de votre rémunération.
            </p>
          </div>

          <div className="calc-content-card">
            <div style={{ width: 48, height: 3, background: '#facc15', borderRadius: 2, marginBottom: 16 }} />
            <h2>Marge brute vs marge nette : quelle différence ?</h2>
            <p>
              La <strong>marge brute</strong> ne tient compte que des coûts des matières et de la
              sous-traitance : c&apos;est la première couche de rentabilité.
            </p>
            <p>
              La <strong>marge nette</strong> intègre également la valeur de votre temps passé,
              valorisé à votre coût de revient horaire ou journalier. C&apos;est le vrai bénéfice
              du projet après avoir couvert tous vos coûts directs.
            </p>
            <h3>Comment estimer son coût de revient ?</h3>
            <p>
              Votre coût de revient journalier = revenu net souhaité par jour + charges sociales + frais
              de structure. En micro-entreprise BNC, si vous visez 300 €/j nets et payez 25,6 % de
              charges : coût de revient ≈ 300 / (1 − 0,256) = <strong>403 €/j</strong>.
            </p>
          </div>

          <div className="calc-content-card">
            <div style={{ width: 48, height: 3, background: '#facc15', borderRadius: 2, marginBottom: 16 }} />
            <h2>Les erreurs classiques sur la tarification d&apos;un devis</h2>
            <ul>
              <li><strong>Oublier de valoriser son temps</strong> : le temps passé est un coût direct, pas un bénéfice par défaut.</li>
              <li><strong>Sous-estimer la durée</strong> : ajoutez toujours 20–30 % de marge de sécurité sur le temps estimé.</li>
              <li><strong>Ne pas inclure les allers-retours</strong> : corrections, réunions, échanges emails — tout ça prend du temps facturable.</li>
              <li><strong>Oublier les coûts cachés</strong> : licences logicielles, hébergements, frais de déplacement.</li>
              <li><strong>Fixer son prix en comparant aux concurrents</strong> sans calculer si ce prix couvre vos propres coûts.</li>
            </ul>
          </div>

          <div className="calc-content-card">
            <div style={{ width: 48, height: 3, background: '#facc15', borderRadius: 2, marginBottom: 16 }} />
            <h2>Exemple concret — projet de site web</h2>
            <p>
              Un freelance facture un site vitrine <strong>3 500 €</strong>. Il a acheté un thème
              premium à 80 € (matières). Il estime avoir passé <strong>8 jours</strong> sur le projet,
              avec un coût de revient de <strong>350 €/j</strong>.
            </p>
            <ul>
              <li>Marge brute : 3 500 − 80 = <strong>3 420 €</strong></li>
              <li>Coût du temps : 8 × 350 = <strong>2 800 €</strong></li>
              <li>Marge nette : 3 500 − 80 − 2 800 = <strong>620 €</strong></li>
              <li>Taux de marge nette : 620 / 3 500 = <strong>17,7 %</strong> → signal d&apos;alerte</li>
            </ul>
            <p style={{ marginTop: 12 }}>
              Pour atteindre 40 % de marge, ce freelance aurait dû facturer au minimum{' '}
              <strong>4 800 €</strong> ou réduire le temps passé à 6 jours.
            </p>
          </div>

          <p style={{ fontSize: 13, color: '#a1a1aa', textAlign: 'center', marginTop: 8 }}>
            Voir aussi :{' '}
            <a href="/calculateur-tjm" style={{ color: '#6b7280' }}>Calculateur TJM freelance</a>
            {' · '}
            <a href="/calcul-charges-auto-entrepreneur" style={{ color: '#6b7280' }}>Calculateur de charges</a>
            {' · '}
            <a href="/contrat-freelance" style={{ color: '#6b7280' }}>Générateur de contrat</a>
          </p>
        </section>
      </div>

      <ConversionBanner
        title="Créez votre devis avec la bonne marge"
        subtitle="Spyke génère vos devis professionnels en PDF en 30 secondes. Ajoutez vos prestations, vos prix, et envoyez directement au client."
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
        var timeMode = 'jours';

        document.querySelectorAll('.calc-toggle-btn').forEach(function(btn) {
          btn.addEventListener('click', function() {
            timeMode = this.dataset.mode;
            document.querySelectorAll('.calc-toggle-btn').forEach(function(b){ b.classList.remove('active'); });
            this.classList.add('active');
            var isH = timeMode === 'heures';
            document.getElementById('tempsLabel').textContent = isH ? 'Temps passé (heures)' : 'Temps passé (jours)';
            document.getElementById('tempsHint').textContent = isH ? 'Nombre d\\'heures travaillées sur ce projet' : 'Nombre de jours travaillés sur ce projet';
            document.getElementById('coutLabel').textContent = isH ? 'Taux horaire de revient (€/h)' : 'Coût de revient journalier (€/j)';
            document.getElementById('coutHint').textContent = isH ? 'Votre coût horaire réel (charges incluses)' : 'Votre coût journalier réel (charges incluses)';
          });
        });

        document.getElementById('calcBtn').addEventListener('click', function() {
          var pv = parseFloat(document.getElementById('pv').value) || 0;
          var matieres = parseFloat(document.getElementById('matieres').value) || 0;
          var temps = parseFloat(document.getElementById('temps').value) || 0;
          var cout = parseFloat(document.getElementById('cout').value) || 0;

          if (pv <= 0) { alert('Veuillez saisir un prix de vente.'); return; }

          var coutTemps = temps * cout;
          var coutTotal = matieres + coutTemps;
          var margeGross = pv - matieres;
          var margeNet = pv - coutTotal;
          var tauxMarge = pv > 0 ? (margeNet / pv) * 100 : 0;

          var fmt = function(n) {
            return n.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' €';
          };

          var color = tauxMarge >= 40 ? 'green' : tauxMarge >= 20 ? 'orange' : 'red';
          var badgeText = tauxMarge >= 40 ? 'Marge saine' : tauxMarge >= 20 ? 'Marge acceptable' : 'Marge trop faible';
          var adviceText = tauxMarge >= 40
            ? 'Excellent — votre devis est bien dimensionné. Vous couvrez vos coûts et dégagez un bénéfice solide.'
            : tauxMarge >= 20
            ? 'Acceptable, mais restez vigilant. Tout dépassement de temps ou coût imprévu rognerait rapidement la rentabilité.'
            : 'Attention : la marge est insuffisante. Envisagez d\\'augmenter le prix de vente ou de réduire la durée estimée du projet.';

          document.getElementById('resTaux').textContent = tauxMarge.toFixed(1).replace('.', ',') + ' %';
          document.getElementById('resTaux').className = 'calc-result-value ' + color;

          var badge = document.getElementById('resBadge');
          badge.innerHTML = '<span class="calc-result-badge ' + color + '"><span class="calc-result-badge-dot"></span>' + badgeText + '</span>';

          document.getElementById('resGross').textContent = fmt(margeGross) + ' (' + ((pv > 0 ? margeGross/pv*100 : 0).toFixed(1).replace('.', ',')) + ' %)';
          document.getElementById('resNet').textContent = fmt(margeNet);
          document.getElementById('resCout').textContent = fmt(coutTotal);
          document.getElementById('resBenefit').textContent = fmt(margeNet);
          document.getElementById('resAdvice').textContent = adviceText;

          var box = document.getElementById('resultBox');
          box.classList.add('show');
          box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        });

        document.getElementById('pv').addEventListener('keydown', function(e) {
          if (e.key === 'Enter') document.getElementById('calcBtn').click();
        });
      `}} />
    </>
  )
}
