import type { Metadata } from 'next'
import { SEO_TOOL_CSS } from '@/components/seo/seo-tool-styles'
import { ConversionBanner, OtherTools } from '@/components/seo/SeoBlocks'

export const metadata: Metadata = {
  title: 'Checklist Clauses Contrat Freelance 2026 — Spyke',
  description:
    'Générez la liste personnalisée des clauses à inclure dans votre contrat freelance. Propriété intellectuelle, confidentialité, acompte, résiliation… Outil gratuit.',
  alternates: {
    canonical: 'https://spykeapp.fr/checklist-clauses-contrat',
  },
  openGraph: {
    title: 'Checklist Clauses Contrat Freelance 2026 — Spyke',
    description:
      "Obtenez la liste des clauses essentielles pour votre contrat freelance selon votre situation. Outil gratuit et personnalisé.",
    url: 'https://spykeapp.fr/checklist-clauses-contrat',
    siteName: 'Spyke',
    locale: 'fr_FR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Checklist Clauses Contrat Freelance 2026',
    description: 'Générez la liste personnalisée des clauses pour votre contrat freelance. Gratuit.',
  },
}

export default function ChecklistClausesContratPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebApplication',
        name: 'Checklist clauses contrat freelance — Spyke',
        url: 'https://spykeapp.fr/checklist-clauses-contrat',
        description:
          "Outil gratuit pour générer la liste personnalisée des clauses à inclure dans un contrat freelance selon sa situation.",
        applicationCategory: 'LegalService',
        operatingSystem: 'Web',
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
      },
      {
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: "Quelles sont les clauses obligatoires d'un contrat freelance ?",
            acceptedAnswer: {
              '@type': 'Answer',
              text: "Un contrat freelance doit contenir : l'identité des parties, la description détaillée de la mission, le prix et les modalités de paiement, les délais, la propriété des livrables et les conditions de résiliation. Ces clauses protègent les deux parties en cas de litige.",
            },
          },
          {
            '@type': 'Question',
            name: "Faut-il une clause de propriété intellectuelle dans un contrat freelance ?",
            acceptedAnswer: {
              '@type': 'Answer',
              text: "Oui, si vous créez des œuvres originales (code, design, textes, vidéos…). Par défaut en droit français, l'auteur conserve les droits. La clause de cession doit être explicite, avec le périmètre (territoire, durée, supports) et la contrepartie financière.",
            },
          },
          {
            '@type': 'Question',
            name: "Qu'est-ce qu'une clause de confidentialité (NDA) ?",
            acceptedAnswer: {
              '@type': 'Answer',
              text: "Une clause de confidentialité (NDA - Non-Disclosure Agreement) interdit de divulguer des informations sensibles du client. Elle est indispensable si vous avez accès à des données stratégiques, financières ou techniques de l'entreprise.",
            },
          },
          {
            '@type': 'Question',
            name: "Comment prévoir la résiliation dans un contrat freelance ?",
            acceptedAnswer: {
              '@type': 'Answer',
              text: "La clause de résiliation doit préciser : le préavis requis, les conditions d'indemnisation (travaux réalisés, acomptes), et les cas de rupture pour faute. Elle protège le freelance si le client annule en cours de mission.",
            },
          },
        ],
      },
    ],
  }

  const CHECK_CSS = `
    .check-wrap{max-width:760px;margin:-16px auto 0;padding:0 40px;position:relative;z-index:10}

    /* Situation form */
    .check-card{background:#fff;border-radius:20px;padding:28px;box-shadow:0 4px 40px rgba(0,0,0,.12);border:1px solid rgba(0,0,0,.04)}
    .check-section{margin-bottom:24px}
    .check-section:last-of-type{margin-bottom:0}
    .check-section-title{font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:#a1a1aa;margin-bottom:12px;display:flex;align-items:center;gap:8px}
    .check-section-title::after{content:'';flex:1;height:1px;background:#f3f4f6}
    .check-items{display:grid;grid-template-columns:1fr 1fr;gap:8px}
    @media(max-width:560px){.check-items{grid-template-columns:1fr}}
    .check-item{display:flex;align-items:flex-start;gap:10px;padding:12px 14px;border:1.5px solid #e4e4ec;border-radius:10px;cursor:pointer;transition:.15s;user-select:none}
    .check-item:hover{border-color:#facc15;background:#fffbeb}
    .check-item input[type=checkbox]{width:16px;height:16px;accent-color:#facc15;flex-shrink:0;margin-top:1px;cursor:pointer}
    .check-item-text{font-size:13px;color:#374151;font-weight:500;line-height:1.4}
    .check-item input:checked ~ .check-item-text{color:#0a0a0a;font-weight:600}
    .check-item:has(input:checked){border-color:#facc15;background:#fffef0}

    /* Generate button */
    .check-btn{width:100%;padding:15px;margin-top:24px;background:#facc15;color:#0a0a0a;border:none;border-radius:12px;font-size:15px;font-weight:800;cursor:pointer;transition:all .15s;box-shadow:0 4px 14px rgba(250,204,21,.4);font-family:inherit}
    .check-btn:hover{background:#e6b800;transform:translateY(-1px);box-shadow:0 8px 24px rgba(250,204,21,.5)}

    /* Result */
    .check-result{margin-top:24px;display:none}
    .check-result.show{display:block}
    .check-result-header{background:#0a0a0a;border-radius:16px 16px 0 0;padding:20px 24px;display:flex;align-items:center;justify-content:space-between}
    .check-result-header-title{font-size:14px;font-weight:800;color:#fff}
    .check-result-count{background:rgba(250,204,21,.15);color:#facc15;border:1px solid rgba(250,204,21,.25);border-radius:999px;font-size:12px;font-weight:700;padding:3px 12px}
    .check-result-body{background:#fff;border:1px solid #e4e4ec;border-top:none;border-radius:0 0 16px 16px;padding:4px 0}
    .clause-item{padding:16px 24px;border-bottom:1px solid #f3f4f6;display:flex;gap:14px;align-items:flex-start}
    .clause-item:last-child{border-bottom:none}
    .clause-icon{width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:16px;background:#fffbeb;border:1px solid rgba(250,204,21,.2)}
    .clause-required .clause-icon{background:#fef2f2;border-color:rgba(239,68,68,.15)}
    .clause-name{font-size:14px;font-weight:800;color:#0a0a0a;margin-bottom:4px}
    .clause-desc{font-size:12px;color:#6b7280;line-height:1.6}
    .clause-badge{display:inline-block;font-size:10px;font-weight:700;padding:1px 7px;border-radius:4px;margin-left:6px;vertical-align:middle;text-transform:uppercase}
    .clause-badge.required{background:#fef2f2;color:#dc2626;border:1px solid #fecaca}
    .clause-badge.recommended{background:#fffbeb;color:#b45309;border:1px solid #fde68a}
    .check-empty{padding:24px;text-align:center;color:#a1a1aa;font-size:13px}

    /* Content */
    .check-content{max-width:760px;margin:48px auto 0;padding:0 40px}
    .check-content-card{background:#fff;border:1px solid #e4e4ec;border-radius:14px;padding:24px;margin-bottom:14px}
    .check-content h2{font-size:22px;font-weight:900;letter-spacing:-.5px;margin-bottom:14px;color:#0a0a0a}
    .check-content p{color:#52525b;line-height:1.75;margin-bottom:12px;font-size:14px}
    .check-content ul{color:#52525b;padding-left:0;list-style:none;font-size:14px;line-height:1.9}
    .check-content ul li{padding:3px 0 3px 20px;position:relative}
    .check-content ul li::before{content:'✓';position:absolute;left:0;color:#22c55e;font-weight:700}
    .check-content strong{color:#0a0a0a}
    @media(max-width:640px){.check-wrap,.check-content{padding:0 16px}}
  `

  return (
    <>
      <style>{SEO_TOOL_CSS}</style>
      <style>{CHECK_CSS}</style>
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
            <a href="/contrat-freelance" className="seo-nav-tool">Contrats</a>
            <a href="/devis-freelance" className="seo-nav-tool">Devis</a>
            <a href="/calculateur-tjm" className="seo-nav-tool">TJM</a>
            <a href="/blog" className="seo-nav-tool">Blog</a>
          </div>
          <a href="/connexion.html" className="seo-nav-cta">Commencer</a>
        </nav>

        <div className="seo-hero">
          <span className="seo-hero-badge">
            <span className="seo-hero-badge-dot" />
            Clauses contrat freelance
          </span>
          <h1>
            <span>Checklist</span> des clauses<br />de votre contrat freelance
          </h1>
          <p className="seo-hero-sub">
            Cochez votre situation et obtenez la <b>liste personnalisée</b> des clauses
            à inclure dans votre contrat, avec une explication pour chacune.
          </p>
        </div>

        {/* Checklist tool */}
        <div className="check-wrap">
          <div className="check-card">

            <div className="check-section">
              <div className="check-section-title">Type de prestation</div>
              <div className="check-items">
                <label className="check-item">
                  <input type="checkbox" data-clause="pi" />
                  <span className="check-item-text">Création d&apos;œuvres (site, design, code, vidéo, textes…)</span>
                </label>
                <label className="check-item">
                  <input type="checkbox" data-clause="conseil" />
                  <span className="check-item-text">Conseil, formation ou audit</span>
                </label>
                <label className="check-item">
                  <input type="checkbox" data-clause="longue" />
                  <span className="check-item-text">Mission longue durée (&gt; 1 mois)</span>
                </label>
                <label className="check-item">
                  <input type="checkbox" data-clause="soustt" />
                  <span className="check-item-text">Intervention de sous-traitants</span>
                </label>
              </div>
            </div>

            <div className="check-section">
              <div className="check-section-title">Propriété intellectuelle</div>
              <div className="check-items">
                <label className="check-item">
                  <input type="checkbox" data-clause="cession" />
                  <span className="check-item-text">Le client veut posséder les droits (cession complète)</span>
                </label>
                <label className="check-item">
                  <input type="checkbox" data-clause="licence" />
                  <span className="check-item-text">Utilisation limitée des livrables (licence d&apos;usage)</span>
                </label>
                <label className="check-item">
                  <input type="checkbox" data-clause="portfolio" />
                  <span className="check-item-text">Je veux conserver un droit de portfolio</span>
                </label>
                <label className="check-item">
                  <input type="checkbox" data-clause="source" />
                  <span className="check-item-text">Livraison du code source / fichiers sources</span>
                </label>
              </div>
            </div>

            <div className="check-section">
              <div className="check-section-title">Conditions financières</div>
              <div className="check-items">
                <label className="check-item">
                  <input type="checkbox" data-clause="acompte" />
                  <span className="check-item-text">Acompte à la signature</span>
                </label>
                <label className="check-item">
                  <input type="checkbox" data-clause="jalons" />
                  <span className="check-item-text">Paiements en plusieurs fois / jalons</span>
                </label>
                <label className="check-item">
                  <input type="checkbox" data-clause="penalites" />
                  <span className="check-item-text">Pénalités de retard de paiement</span>
                </label>
                <label className="check-item">
                  <input type="checkbox" data-clause="depassement" />
                  <span className="check-item-text">Surcoût en cas de dépassement de périmètre</span>
                </label>
              </div>
            </div>

            <div className="check-section">
              <div className="check-section-title">Confidentialité &amp; non-concurrence</div>
              <div className="check-items">
                <label className="check-item">
                  <input type="checkbox" data-clause="confidentialite" />
                  <span className="check-item-text">Accès à des données ou informations sensibles</span>
                </label>
                <label className="check-item">
                  <input type="checkbox" data-clause="nda" />
                  <span className="check-item-text">NDA demandé par le client</span>
                </label>
                <label className="check-item">
                  <input type="checkbox" data-clause="concurrence" />
                  <span className="check-item-text">Clause de non-concurrence possible</span>
                </label>
                <label className="check-item">
                  <input type="checkbox" data-clause="exclusivite" />
                  <span className="check-item-text">Exclusivité sectorielle demandée</span>
                </label>
              </div>
            </div>

            <div className="check-section">
              <div className="check-section-title">Résiliation &amp; litiges</div>
              <div className="check-items">
                <label className="check-item">
                  <input type="checkbox" data-clause="resiliation" />
                  <span className="check-item-text">Possibilité d&apos;annulation en cours de mission</span>
                </label>
                <label className="check-item">
                  <input type="checkbox" data-clause="force" />
                  <span className="check-item-text">Risque d&apos;événement imprévisible (force majeure)</span>
                </label>
                <label className="check-item">
                  <input type="checkbox" data-clause="responsabilite" />
                  <span className="check-item-text">Limiter ma responsabilité en cas d&apos;erreur</span>
                </label>
                <label className="check-item">
                  <input type="checkbox" data-clause="litige" />
                  <span className="check-item-text">Client situé dans un autre pays / juridiction</span>
                </label>
              </div>
            </div>

            <button className="check-btn" id="generateBtn">
              Générer ma checklist personnalisée →
            </button>

            <div className="check-result" id="resultBox">
              <div className="check-result-header">
                <span className="check-result-header-title">Clauses recommandées pour votre contrat</span>
                <span className="check-result-count" id="clauseCount">0 clauses</span>
              </div>
              <div className="check-result-body" id="clauseList" />
            </div>
          </div>
        </div>

        {/* SEO content */}
        <section className="check-content">
          <div className="check-content-card">
            <div style={{ width: 48, height: 3, background: '#facc15', borderRadius: 2, marginBottom: 16 }} />
            <h2>Pourquoi rédiger un contrat avant chaque mission freelance ?</h2>
            <p>
              Un contrat freelance n&apos;est pas un luxe réservé aux grandes missions : c&apos;est la seule
              protection juridique en cas de litige, de non-paiement ou d&apos;annulation sans
              préavis. En France, un email avec un devis accepté peut suffire à prouver un accord,
              mais il ne couvre pas la propriété intellectuelle, la confidentialité ou les conditions
              de résiliation.
            </p>
            <p>
              Un contrat bien rédigé évite la majorité des litiges avant même qu&apos;ils ne surviennent,
              car il oblige les deux parties à clarifier leurs attentes dès le départ.
            </p>
          </div>

          <div className="check-content-card">
            <div style={{ width: 48, height: 3, background: '#facc15', borderRadius: 2, marginBottom: 16 }} />
            <h2>Les clauses les plus importantes pour un freelance</h2>
            <ul>
              <li><strong>Description de la mission</strong> : définit précisément le périmètre, les livrables et ce qui est exclu.</li>
              <li><strong>Prix et modalités de paiement</strong> : montant, échéances, conditions de l&apos;acompte.</li>
              <li><strong>Propriété intellectuelle</strong> : qui possède quoi une fois la mission terminée.</li>
              <li><strong>Pénalités de retard</strong> : protège contre les mauvais payeurs (taux légal BdF + 10 points min.).</li>
              <li><strong>Confidentialité</strong> : obligation de discrétion sur les informations du client.</li>
              <li><strong>Résiliation</strong> : préavis, indemnisation, sort des acomptes.</li>
              <li><strong>Limitation de responsabilité</strong> : plafonne votre exposition en cas d&apos;erreur.</li>
            </ul>
          </div>

          <div className="check-content-card">
            <div style={{ width: 48, height: 3, background: '#facc15', borderRadius: 2, marginBottom: 16 }} />
            <h2>Propriété intellectuelle : attention aux malentendus</h2>
            <p>
              En droit français, <strong>l&apos;auteur d&apos;une œuvre en conserve les droits par défaut</strong>.
              Si votre client veut posséder le code, le design ou le texte que vous créez,
              cela doit être stipulé explicitement via une <strong>clause de cession de droits d&apos;auteur</strong>
              avec : périmètre d&apos;utilisation, territoire, durée et contrepartie financière.
              Sans cette clause, vous restez propriétaire même si le client a payé.
            </p>
          </div>

          <p style={{ fontSize: 13, color: '#a1a1aa', textAlign: 'center', marginTop: 8 }}>
            Voir aussi :{' '}
            <a href="/contrat-freelance" style={{ color: '#6b7280' }}>Générateur de contrat freelance</a>
            {' · '}
            <a href="/devis-freelance" style={{ color: '#6b7280' }}>Générateur de devis</a>
            {' · '}
            <a href="/calculateur-marge-devis" style={{ color: '#6b7280' }}>Calculateur de marge</a>
          </p>
        </section>
      </div>

      <ConversionBanner
        title="Générez votre contrat complet en 2 minutes"
        subtitle="Spyke crée des contrats freelance personnalisés avec toutes les clauses essentielles, validés juridiquement. Prêt à signer."
        cta="Créer mon contrat gratuitement"
        href="/contrat-freelance"
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
        var CLAUSES = {
          // Toujours affichées
          always: [
            { icon: '📋', name: 'Description détaillée de la mission', badge: 'required', desc: 'Périmètre exact, livrables attendus, ce qui est exclu. Indispensable pour éviter tout malentendu sur ce qui est inclus dans le prix.' },
            { icon: '💶', name: 'Prix et modalités de paiement', badge: 'required', desc: 'Montant HT/TTC, date d\\'échéance, moyen de paiement accepté. Mentionnez explicitement les conditions générales de vente.' },
            { icon: '📅', name: 'Délais et calendrier', badge: 'required', desc: 'Date de livraison estimée et conditions de modification. Précisez ce qui se passe en cas de retard côté client (validation, fourniture de contenus…).' },
          ],
          pi: { icon: '🎨', name: 'Propriété intellectuelle — création d\\'œuvres', badge: 'required', desc: 'Par défaut, vous conservez les droits sur votre création. Si le client veut les droits, une clause de cession explicite est obligatoire (périmètre, durée, territoire, contrepartie).' },
          conseil: { icon: '📊', name: 'Responsabilité sur les recommandations', badge: 'recommended', desc: 'En consulting, limitez votre responsabilité aux seules recommandations formulées par écrit. Toute décision de mise en œuvre reste sous la responsabilité du client.' },
          longue: { icon: '🔄', name: 'Conditions de renouvellement', badge: 'recommended', desc: 'Pour les missions longues, précisez la durée, les conditions de renouvellement tacite et le préavis de fin de mission.' },
          soustt: { icon: '👥', name: 'Clause de sous-traitance', badge: 'recommended', desc: 'Si vous faites appel à des sous-traitants, clarifiez que vous restez le seul interlocuteur du client et assumez la responsabilité des livrables.' },
          cession: { icon: '©️', name: 'Cession complète des droits d\\'auteur', badge: 'required', desc: 'Précisez : quelles œuvres sont cédées, pour quels usages, sur quel territoire et pour quelle durée. La cession doit être rémunérée séparément ou incluse explicitement dans le prix.' },
          licence: { icon: '🔑', name: 'Licence d\\'usage limitée', badge: 'recommended', desc: 'Alternative à la cession complète : vous conservez les droits mais accordez au client une licence d\\'exploitation définie (usage, territoire, durée, supports).' },
          portfolio: { icon: '🖼️', name: 'Droit de portfolio et référence', badge: 'recommended', desc: 'Réservez-vous le droit de mentionner le projet dans votre portfolio et sur vos réseaux, sauf accord contraire. Précisez les conditions (anonymisation possible).' },
          source: { icon: '💾', name: 'Livraison et propriété des fichiers sources', badge: 'recommended', desc: 'Précisez si les fichiers sources (code, PSD, Figma…) sont livrés et dans quel format. Sans clause, vous n\\'êtes pas obligé de les fournir.' },
          acompte: { icon: '💰', name: 'Acompte à la commande', badge: 'required', desc: 'Définissez le montant (généralement 30–50 % du prix total), la date de versement et sa non-remboursabilité en cas de désistement du client après validation.' },
          jalons: { icon: '📍', name: 'Jalons de paiement', badge: 'recommended', desc: 'Liez chaque paiement à une étape de livraison clairement définie. Cela protège à la fois le freelance (ne pas livrer sans paiement) et le client (payer à la livraison).' },
          penalites: { icon: '⚠️', name: 'Pénalités de retard de paiement', badge: 'required', desc: 'Obligatoires légalement entre professionnels. Taux minimum : taux directeur BCE + 10 points, soit environ 14 % en 2026. Ajoutez une indemnité forfaitaire de 40 € pour frais de recouvrement.' },
          depassement: { icon: '📈', name: 'Clause de dépassement de périmètre', badge: 'recommended', desc: 'Définissez ce qui constitue un dépassement (nouvelles fonctionnalités, modifications substantielles après validation) et comment il est facturé (TJM ou taux horaire).' },
          confidentialite: { icon: '🔒', name: 'Obligation de confidentialité', badge: 'required', desc: 'Engagez-vous à ne pas divulguer les informations confidentielles du client (données, stratégie, tarifs…). Précisez la durée de l\\'obligation (souvent 2 à 5 ans après la mission).' },
          nda: { icon: '📝', name: 'NDA (accord de non-divulgation)', badge: 'required', desc: 'Formalisez le NDA dans le corps du contrat ou en annexe. Définissez ce qui est considéré confidentiel, les exceptions (informations déjà publiques) et les sanctions en cas de violation.' },
          concurrence: { icon: '🚫', name: 'Non-concurrence (acceptation limitée)', badge: 'recommended', desc: 'Acceptez une clause de non-concurrence uniquement si elle est limitée dans le temps (max 1 an), le périmètre géographique et compensée financièrement. Une clause trop large peut être inopposable.' },
          exclusivite: { icon: '⭐', name: 'Exclusivité sectorielle', badge: 'recommended', desc: 'Si le client demande une exclusivité sur son secteur, négociez une contrepartie financière. Précisez la durée et le périmètre exact (métier, zone géo, taille d\\'entreprise).' },
          resiliation: { icon: '🚪', name: 'Conditions de résiliation', badge: 'required', desc: 'Délai de préavis (généralement 15 à 30 jours), indemnisation des travaux réalisés, sort des acomptes versés et des livrables en cours. Protège les deux parties.' },
          force: { icon: '⛈️', name: 'Clause de force majeure', badge: 'recommended', desc: 'Suspend les obligations des parties en cas d\\'événement imprévisible et irrésistible (pandémie, catastrophe, etc.). Définissez la procédure de notification et la durée maximale de suspension.' },
          responsabilite: { icon: '🛡️', name: 'Limitation de responsabilité', badge: 'recommended', desc: 'Plafonnez votre responsabilité au montant de la mission (ou à votre assurance RC Pro). Excluez les préjudices indirects et les pertes d\\'exploitation.' },
          litige: { icon: '⚖️', name: 'Droit applicable et juridiction compétente', badge: 'required', desc: 'Précisez la loi applicable (droit français) et le tribunal compétent (généralement le tribunal de commerce du lieu du freelance). Indispensable pour les clients étrangers.' },
        };

        document.getElementById('generateBtn').addEventListener('click', function() {
          var checked = Array.from(document.querySelectorAll('input[data-clause]:checked')).map(function(el) {
            return el.getAttribute('data-clause');
          });

          var clauses = CLAUSES.always.slice();
          checked.forEach(function(key) {
            if (CLAUSES[key]) clauses.push(CLAUSES[key]);
          });

          if (clauses.length === 0) {
            alert('Cochez au moins une situation pour générer votre checklist.');
            return;
          }

          var required = clauses.filter(function(c) { return c.badge === 'required'; });
          var recommended = clauses.filter(function(c) { return c.badge === 'recommended'; });
          var sorted = required.concat(recommended);

          document.getElementById('clauseCount').textContent = sorted.length + ' clause' + (sorted.length > 1 ? 's' : '');

          var html = sorted.map(function(c) {
            var badgeLabel = c.badge === 'required' ? 'Indispensable' : 'Recommandée';
            return '<div class="clause-item' + (c.badge === 'required' ? ' clause-required' : '') + '">' +
              '<div class="clause-icon">' + c.icon + '</div>' +
              '<div>' +
                '<div class="clause-name">' + c.name +
                  '<span class="clause-badge ' + c.badge + '">' + badgeLabel + '</span>' +
                '</div>' +
                '<div class="clause-desc">' + c.desc + '</div>' +
              '</div>' +
            '</div>';
          }).join('');

          document.getElementById('clauseList').innerHTML = html;

          var box = document.getElementById('resultBox');
          box.classList.add('show');
          box.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      `}} />
    </>
  )
}
