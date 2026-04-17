'use client'

import { useEffect, useMemo, useState } from 'react'

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

function readCount(key: string) {
  try {
    const v = Number(window.localStorage.getItem(key) || '0')
    return Number.isFinite(v) && v >= 0 ? v : 0
  } catch {
    return 0
  }
}

function writeCount(key: string, value: number) {
  try {
    window.localStorage.setItem(key, String(Math.max(0, Math.floor(value || 0))))
  } catch {
    // ignore
  }
}

function buildContractText(params: {
  title: string
  date: string
  contractNumber: string
  sellerName: string
  sellerSiret: string
  sellerAddress: string
  buyerName: string
  buyerSiret: string
  buyerAddress: string
  missionDescription: string
  deliverables: string
  pricingType: string
  pricingAmount: string
  paymentSchedule: string
  paymentDelay: string
  termination: string
}) {
  const p = params
  const safe = (s: string) => String(s || '').trim()

  return [
    'CONTRAT DE PRESTATION DE SERVICES',
    '',
    safe(p.title) ? `Titre : ${safe(p.title)}` : null,
    safe(p.contractNumber) ? `Numéro : ${safe(p.contractNumber)}` : null,
    safe(p.date) ? `Date : ${safe(p.date)}` : null,
    '',
    'Entre les soussignés :',
    `- Prestataire : ${safe(p.sellerName) || 'Le prestataire'}${safe(p.sellerSiret) ? ` (SIRET : ${safe(p.sellerSiret)})` : ''}${safe(p.sellerAddress) ? `, ${safe(p.sellerAddress)}` : ''}`,
    `- Client : ${safe(p.buyerName) || 'Le client'}${safe(p.buyerSiret) ? ` (SIRET : ${safe(p.buyerSiret)})` : ''}${safe(p.buyerAddress) ? `, ${safe(p.buyerAddress)}` : ''}`,
    '',
    '1. Objet',
    "Le présent contrat a pour objet la réalisation des prestations décrites ci-dessous.",
    '',
    '2. Prestations',
    safe(p.missionDescription) ? safe(p.missionDescription) : 'Décrire la mission, le périmètre, les modalités et les délais.',
    safe(p.deliverables) ? `\nLivrables attendus :\n${safe(p.deliverables)}` : null,
    '',
    '3. Prix et paiement',
    safe(p.pricingType) || safe(p.pricingAmount)
      ? `Prix : ${[safe(p.pricingType), safe(p.pricingAmount)].filter(Boolean).join(' - ')}`
      : 'Prix : À définir',
    safe(p.paymentSchedule) ? `Échéancier : ${safe(p.paymentSchedule)}` : null,
    safe(p.paymentDelay) ? `Délai de paiement : ${safe(p.paymentDelay)}` : null,
    '',
    '4. Propriété intellectuelle',
    'Préciser les droits cédés, les conditions et le périmètre de cession (le cas échéant).',
    '',
    '5. Confidentialité',
    "Chaque partie s'engage à garder confidentielles les informations échangées.",
    '',
    '6. Résiliation',
    safe(p.termination) ? safe(p.termination) : 'Préciser les conditions de résiliation et ses conséquences (facturation, restitution, etc.).',
    '',
    'Fait à ________, le ________.',
    '',
    'Signatures :',
    'Prestataire : ____________________',
    'Client : ____________________',
  ]
    .filter((x) => x !== null)
    .join('\n')
}

export default function SeoContratPage() {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), [])
  const pdfCountKey = 'spyke_seo_contrat_pdf_count_v2'

  const [pdfCount, setPdfCount] = useState(0)

  const [title, setTitle] = useState('Contrat de prestation de services')
  const [date, setDate] = useState(today)
  const [contractNumber, setContractNumber] = useState('')

  const [logoDataUrl, setLogoDataUrl] = useState<string>('')

  const [sellerName, setSellerName] = useState('')
  const [sellerSiret, setSellerSiret] = useState('')
  const [sellerAddress, setSellerAddress] = useState('')
  const [sellerActivity, setSellerActivity] = useState('')
  const [sellerEmail, setSellerEmail] = useState('')

  const [buyerName, setBuyerName] = useState('')
  const [buyerSiret, setBuyerSiret] = useState('')
  const [buyerRepresentant, setBuyerRepresentant] = useState('')
  const [buyerAddress, setBuyerAddress] = useState('')
  const [buyerEmail, setBuyerEmail] = useState('')

  const [missionStartDate, setMissionStartDate] = useState('')
  const [missionEndDate, setMissionEndDate] = useState('')
  const [missionLocation, setMissionLocation] = useState('')
  const [missionRevisions, setMissionRevisions] = useState('')
  const [missionDescription, setMissionDescription] = useState('')
  const [missionDeliverables, setMissionDeliverables] = useState('')

  const [pricingType, setPricingType] = useState('')
  const [pricingAmount, setPricingAmount] = useState('')
  const [vatRegime, setVatRegime] = useState('')
  const [paymentSchedule, setPaymentSchedule] = useState('')
  const [paymentDelay, setPaymentDelay] = useState('')
  const [ipClause, setIpClause] = useState('')
  const [confidentiality, setConfidentiality] = useState('')
  const [termination, setTermination] = useState('')

  const [contractText, setContractText] = useState('')

  const [showEmailModal, setShowEmailModal] = useState(false)
  const [email, setEmail] = useState('')

  useEffect(() => {
    setPdfCount(readCount(pdfCountKey))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    setContractText(
      buildContractText({
        title,
        date,
        contractNumber,
        sellerName,
        sellerSiret,
        sellerAddress,
        buyerName,
        buyerSiret,
        buyerAddress,
        missionDescription,
        deliverables: missionDeliverables,
        pricingType,
        pricingAmount,
        paymentSchedule,
        paymentDelay,
        termination,
      })
    )
  }, [
    title,
    date,
    contractNumber,
    sellerName,
    sellerSiret,
    sellerAddress,
    buyerName,
    buyerSiret,
    buyerAddress,
    missionDescription,
    missionDeliverables,
    pricingType,
    pricingAmount,
    paymentSchedule,
    paymentDelay,
    termination,
  ])

  function goSignup() {
    window.location.href = '/connexion.html'
  }

  async function onPickLogo(file: File | null) {
    try {
      if (!file) {
        setLogoDataUrl('')
        return
      }
      const reader = new FileReader()
      const dataUrl: string = await new Promise((resolve, reject) => {
        reader.onerror = () => reject(new Error('Lecture fichier impossible'))
        reader.onload = () => resolve(String(reader.result || ''))
        reader.readAsDataURL(file)
      })
      setLogoDataUrl(dataUrl)
    } catch {
      setLogoDataUrl('')
    }
  }

  async function generatePdf() {
    try {
      if (!sellerName.trim()) throw new Error('Renseigne le nom du prestataire')
      if (!buyerName.trim()) throw new Error('Renseigne le nom du client')
      if (!missionDescription.trim()) throw new Error('Décris au moins la mission')

      const payload = {
        title,
        date,
        logoUrl: logoDataUrl || '',
        contractText,
        contractNumber,
        seller: {
          name: sellerName,
          siret: sellerSiret,
          address: sellerAddress,
          activity: sellerActivity,
          email: sellerEmail,
        },
        buyer: {
          name: buyerName,
          siret: buyerSiret,
          representant: buyerRepresentant,
          address: buyerAddress,
          email: buyerEmail,
        },
        mission: {
          startDate: missionStartDate,
          endDate: missionEndDate,
          location: missionLocation,
          revisions: missionRevisions,
          description: missionDescription,
          deliverables: missionDeliverables,
        },
        pricing: {
          type: pricingType,
          amount: pricingAmount,
        },
        vatRegime,
        paymentSchedule,
        paymentDelay,
        ipClause,
        confidentiality,
        termination,
      }

      const res = await fetch('/api/public/contrat-pdf', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const blob = await res.blob()
      if (!res.ok) {
        let msg = 'Erreur PDF'
        try {
          msg = (await blob.text()) || msg
        } catch {}
        throw new Error(msg)
      }

      downloadBlob(blob, `Contrat-${contractNumber || 'spyke'}.pdf`)

      const nextCount = pdfCount + 1
      setPdfCount(nextCount)
      writeCount(pdfCountKey, nextCount)

      setShowEmailModal(true)
    } catch (e: any) {
      alert(e?.message || 'Erreur PDF')
    }
  }

  const showSoftSignupNudge = pdfCount >= 2

  return (
    <div className="seo-tool">
      <nav className="seo-navbar">
        <a href="/" className="seo-nav-logo">
          <div className="seo-nav-logo-icon">
            <svg viewBox="0 0 24 24">
              <path d="M13 3L4 14h7l-2 7 9-11h-7l2-7z" />
            </svg>
          </div>
          <span className="seo-nav-logo-text">Spyke</span>
        </a>
        <div className="seo-nav-tools">
          <a href="/devis-freelance" className="seo-nav-tool">Devis gratuit</a>
          <a href="/facture-auto-entrepreneur" className="seo-nav-tool">Facture gratuite</a>
          <a href="/contrat-freelance" className="seo-nav-tool active">Contrat gratuit</a>
        </div>
        <a href="/connexion.html" className="seo-nav-cta">Créer un compte gratuit</a>
      </nav>

      <section className="seo-hero">
        <div className="seo-hero-badge">
          <span className="seo-hero-badge-dot" /> Outil 100% gratuit (version test)
        </div>
        <h1>
          Créez votre <span>contrat freelance</span> en 2 minutes
        </h1>
        <p className="seo-hero-sub">
          Remplissez les champs essentiels, puis téléchargez un PDF. <b>Gratuit, sans inscription</b>.
        </p>
      </section>

      {showSoftSignupNudge ? (
        <div className="seo-soft-nudge">
          <div className="seo-soft-nudge-card">
            <div>
              <div className="seo-soft-nudge-text">Vous aimez l'outil ?</div>
              <div className="seo-soft-nudge-sub">Créez un compte pour centraliser vos clients, devis, contrats et factures.</div>
            </div>
            <button className="seo-soft-nudge-btn" type="button" onClick={goSignup}>
              Créer un compte
            </button>
          </div>
        </div>
      ) : null}

      <div className="seo-form-wrap">
        <div className="seo-card">
          <div className="seo-card-title">Contrat</div>
          <div className="seo-grid">
            <div className="seo-group">
              <label className="seo-label">Titre</label>
              <input className="seo-input" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="seo-group">
              <label className="seo-label">Numéro (optionnel)</label>
              <input className="seo-input" value={contractNumber} onChange={(e) => setContractNumber(e.target.value)} placeholder="C202604-001" />
            </div>
            <div className="seo-group">
              <label className="seo-label">Date</label>
              <input type="date" className="seo-input" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="seo-group full">
              <label className="seo-label">Logo (optionnel)</label>
              <input type="file" accept="image/*" className="seo-input" onChange={(e) => onPickLogo(e.target.files?.[0] || null)} />
            </div>
          </div>
        </div>

        <div className="seo-card">
          <div className="seo-card-title">Prestataire</div>
          <div className="seo-grid">
            <div className="seo-group">
              <label className="seo-label">Nom / Raison sociale</label>
              <input className="seo-input" value={sellerName} onChange={(e) => setSellerName(e.target.value)} />
            </div>
            <div className="seo-group">
              <label className="seo-label">SIRET (optionnel)</label>
              <input className="seo-input" value={sellerSiret} onChange={(e) => setSellerSiret(e.target.value)} />
            </div>
            <div className="seo-group">
              <label className="seo-label">Activité (optionnel)</label>
              <input className="seo-input" value={sellerActivity} onChange={(e) => setSellerActivity(e.target.value)} placeholder="Développement web" />
            </div>
            <div className="seo-group">
              <label className="seo-label">Email (optionnel)</label>
              <input className="seo-input" value={sellerEmail} onChange={(e) => setSellerEmail(e.target.value)} placeholder="contact@..." />
            </div>
            <div className="seo-group full">
              <label className="seo-label">Adresse (optionnel)</label>
              <input className="seo-input" value={sellerAddress} onChange={(e) => setSellerAddress(e.target.value)} />
            </div>
          </div>
        </div>

        <div className="seo-card">
          <div className="seo-card-title">Client</div>
          <div className="seo-grid">
            <div className="seo-group">
              <label className="seo-label">Nom / Entreprise</label>
              <input className="seo-input" value={buyerName} onChange={(e) => setBuyerName(e.target.value)} />
            </div>
            <div className="seo-group">
              <label className="seo-label">SIRET (optionnel)</label>
              <input className="seo-input" value={buyerSiret} onChange={(e) => setBuyerSiret(e.target.value)} />
            </div>
            <div className="seo-group">
              <label className="seo-label">Représentant (optionnel)</label>
              <input className="seo-input" value={buyerRepresentant} onChange={(e) => setBuyerRepresentant(e.target.value)} placeholder="Nom du signataire" />
            </div>
            <div className="seo-group">
              <label className="seo-label">Email (optionnel)</label>
              <input className="seo-input" value={buyerEmail} onChange={(e) => setBuyerEmail(e.target.value)} placeholder="client@..." />
            </div>
            <div className="seo-group full">
              <label className="seo-label">Adresse (optionnel)</label>
              <input className="seo-input" value={buyerAddress} onChange={(e) => setBuyerAddress(e.target.value)} />
            </div>
          </div>
        </div>

        <div className="seo-card">
          <div className="seo-card-title">Mission</div>
          <div className="seo-grid">
            <div className="seo-group">
              <label className="seo-label">Début (optionnel)</label>
              <input type="date" className="seo-input" value={missionStartDate} onChange={(e) => setMissionStartDate(e.target.value)} />
            </div>
            <div className="seo-group">
              <label className="seo-label">Fin (optionnel)</label>
              <input type="date" className="seo-input" value={missionEndDate} onChange={(e) => setMissionEndDate(e.target.value)} />
            </div>
            <div className="seo-group">
              <label className="seo-label">Lieu (optionnel)</label>
              <input className="seo-input" value={missionLocation} onChange={(e) => setMissionLocation(e.target.value)} placeholder="À distance / sur site / mixte" />
            </div>
            <div className="seo-group">
              <label className="seo-label">Révisions (optionnel)</label>
              <input className="seo-input" value={missionRevisions} onChange={(e) => setMissionRevisions(e.target.value)} placeholder="2" />
            </div>
            <div className="seo-group full">
              <label className="seo-label">Description de la mission</label>
              <textarea className="seo-textarea" value={missionDescription} onChange={(e) => setMissionDescription(e.target.value)} placeholder="Décris le périmètre, les modalités, les délais…" />
            </div>
            <div className="seo-group full">
              <label className="seo-label">Livrables (optionnel)</label>
              <textarea className="seo-textarea" value={missionDeliverables} onChange={(e) => setMissionDeliverables(e.target.value)} placeholder="- Maquette\n- Code source\n- Documentation…" />
            </div>
          </div>
        </div>

        <div className="seo-card">
          <div className="seo-card-title">Prix & clauses (optionnel)</div>
          <div className="seo-grid">
            <div className="seo-group">
              <label className="seo-label">Type</label>
              <input className="seo-input" value={pricingType} onChange={(e) => setPricingType(e.target.value)} placeholder="Forfait / TJM / Taux horaire" />
            </div>
            <div className="seo-group">
              <label className="seo-label">Montant</label>
              <input className="seo-input" value={pricingAmount} onChange={(e) => setPricingAmount(e.target.value)} placeholder="1 500€" />
            </div>
            <div className="seo-group">
              <label className="seo-label">Régime TVA</label>
              <input className="seo-input" value={vatRegime} onChange={(e) => setVatRegime(e.target.value)} placeholder="Franchise en base / assujetti" />
            </div>
            <div className="seo-group">
              <label className="seo-label">Échéancier</label>
              <input className="seo-input" value={paymentSchedule} onChange={(e) => setPaymentSchedule(e.target.value)} placeholder="30/70, 50/50…" />
            </div>
            <div className="seo-group">
              <label className="seo-label">Délai de paiement</label>
              <input className="seo-input" value={paymentDelay} onChange={(e) => setPaymentDelay(e.target.value)} placeholder="30 jours" />
            </div>
            <div className="seo-group">
              <label className="seo-label">Clause IP</label>
              <input className="seo-input" value={ipClause} onChange={(e) => setIpClause(e.target.value)} placeholder="Cession après paiement…" />
            </div>
            <div className="seo-group">
              <label className="seo-label">Confidentialité</label>
              <input className="seo-input" value={confidentiality} onChange={(e) => setConfidentiality(e.target.value)} placeholder="Oui / Non" />
            </div>
            <div className="seo-group full">
              <label className="seo-label">Résiliation / préavis</label>
              <input className="seo-input" value={termination} onChange={(e) => setTermination(e.target.value)} placeholder="Préavis 30 jours…" />
            </div>
          </div>
        </div>

        <div className="seo-card">
          <div className="seo-card-title">Aperçu texte (modifiable)</div>
          <textarea className="seo-textarea" style={{ minHeight: 220 }} value={contractText} onChange={(e) => setContractText(e.target.value)} />
        </div>

        <div className="seo-generate">
          <button type="button" className="seo-btn-generate" onClick={generatePdf}>
            Générer mon contrat en PDF
          </button>
          <p className="seo-note">Gratuit, sans inscription.</p>
        </div>
      </div>

      {/* Simple modal UX kept for parity with other SEO tools */}
      {showEmailModal ? (
        <div className="seo-modal-overlay">
          <div className="seo-modal">
            <h3>Votre contrat est prêt !</h3>
            <p>Voulez-vous aussi le recevoir par email ?</p>
            <div className="seo-modal-form">
              <input placeholder="votre@email.com" className="seo-input" value={email} onChange={(e) => setEmail(e.target.value)} />
              <button type="button" onClick={goSignup}>
                Envoyer
              </button>
            </div>
            <button type="button" className="seo-modal-skip" onClick={() => setShowEmailModal(false)}>
              Non merci, c'est tout
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
