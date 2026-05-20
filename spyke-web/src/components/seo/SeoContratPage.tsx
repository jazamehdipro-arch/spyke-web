'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import PdfInlineViewer from '@/components/PdfInlineViewer'
import { buildCanonicalContractText } from '@/lib/buildCanonicalContractText'

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

function formatDateFr(d: string) {
  const s = String(d || '').trim()
  // Input from <input type="date"> is YYYY-MM-DD
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (m) return `${m[3]}/${m[2]}/${m[1]}`
  return s
}

function buildContractText() {
  // Must match the canonical contract text used in the app tool.
  // We only replace bracket placeholders (filled in the PDF template engine).
  return `SPYKE
CONTRAT DE PRESTATION DE SERVICES
N° [NUMÉRO DU CONTRAT]
ENTRE LES SOUSSIGNÉS :
LE PRESTATAIRE
[Madame/Monsieur] [PRÉNOM NOM],
inscrit(e) à l'INSEE sous le numéro SIRET
[NUMÉRO SIRET], dont le domicile
professionnel est situé au [ADRESSE
PRESTATAIRE].
Ci-après dénommé(e) « le PRESTATAIRE »
LE CLIENT
[Forme sociale (SARL, SAS, etc.)], au
capital de [MONTANT] euros, immatriculée
au RCS de [VILLE RCS] sous le numéro
[NUMÉRO RCS], dont le siège social est
situé au [ADRESSE CLIENT], représentée
par [Madame/Monsieur PRÉNOM NOM], en
qualité de [FONCTION], dûment habilité(e) à
cet effet.
Ci-après dénommé(e) « le CLIENT »
Ensemble dénommées les « PARTIES » ou individuellement la « PARTIE ».
ARTICLE 1 — PRÉAMBULE
Le texte ci-dessous est un exemple de préambule. Lors de la génération du contrat, ce paragraphe sera remplacé par
le contexte réel de la mission.
Dans le cadre de [DÉCRIRE LE PROJET DU CLIENT], le CLIENT souhaite faire appel à un prestataire
indépendant afin de [DÉCRIRE L'OBJECTIF DE LA MISSION].
Le PRESTATAIRE a déclaré disposer des compétences particulières requises pour répondre aux
besoins du CLIENT et qu'il intervient régulièrement et de manière significative auprès de nombreuses
entreprises dont les besoins et les exigences sont similaires à ceux du CLIENT.
Les PARTIES ont eu l'occasion d'échanger sur le sujet et de poser toutes les questions utiles, en ont
obtenu toutes les réponses et ont ainsi pu s'assurer des éléments déterminants attendus du CLIENT.
C'est dans ce contexte que les Parties se sont réunies afin de préciser au sein du présent contrat,
ci-après le « Contrat », les conditions dans lesquelles le PRESTATAIRE fournira ses prestations au
CLIENT.
ARTICLE 2 — DURÉE DU CONTRAT
Le Contrat prendra effet le [DATE DÉBUT] et se terminera de plein droit le [DATE FIN], ci-après la «
Période Contractuelle ».
À l'expiration de la Période Contractuelle, le Contrat prendra fin automatiquement sans qu'aucune
formalité ne soit nécessaire, sauf accord écrit des deux Parties pour son renouvellement.
ARTICLE 3 — OBLIGATIONS DU PRESTATAIRE
3.1 — Prestations
En contrepartie du prix ferme et certain visé à l'article 4, le PRESTATAIRE s'engage à effectuer les
prestations visées dans le devis et/ou la proposition commerciale figurant à l'annexe 1 des présentes,
comprenant notamment :
- [Description de la prestation 1]
- [Description de la prestation 2]
- [Description de la prestation 3]
Le PRESTATAIRE inclut [NOMBRE] tour(s) de révisions dans le cadre de la présente mission ; toute
demande de modification supplémentaire au-delà de ce nombre fera l'objet d'un devis complémentaire
accepté par le CLIENT préalablement à sa réalisation.
ARTICLE 4 — CONDITIONS FINANCIÈRES
4.1 — Prix
En contrepartie de la réalisation des prestations visées à l'article 3 des présentes, le CLIENT s'engage à
verser une somme forfaitaire au profit du PRESTATAIRE dont le montant s'élève inconditionnellement et
invariablement à [MONTANT] € HT ([PRIX EN LETTRES] euros hors taxe), ci-après le « Prix ».
4.2 — Modalités de paiement
Le PRESTATAIRE facturera le CLIENT selon les conditions financières suivantes :
Échéance % du Prix Montant HT Date
Acompte [%] [MONTANT] € [DATE]
Solde [%] [MONTANT] € [DATE]
La facture sera réglée par le CLIENT par virement bancaire sur le compte du PRESTATAIRE à [30
JOURS / 45 JOURS / 60 JOURS] fin de mois à compter de la date d'émission de la facture originale
conforme envoyée par le PRESTATAIRE.
Adresse de facturation : [ADRESSE DE FACTURATION DU PRESTATAIRE]
ARTICLE 5 — PROPRIÉTÉ INTELLECTUELLE
[CESSION APRÈS PAIEMENT / LICENCE D'UTILISATION / CESSION TOTALE]
ARTICLE 6 — CONFIDENTIALITÉ
[OUI / NON]
ARTICLE 7 — RÉSILIATION
[PRÉAVIS 15 JOURS / 30 JOURS / SANS PRÉAVIS]
Fait à ____________________, le ____________________.
Signatures :
Le PRESTATAIRE : ____________________
Le CLIENT : ____________________`
}

// ---------------------------------------------------------------------------
// ContratPreview — mini live HTML document preview styled like a real contract
// ---------------------------------------------------------------------------
function ContratPreview({
  sellerName,
  buyerName,
  contractNumber,
  date,
  missionDescription,
  pricingAmount,
  pricingType,
}: {
  sellerName: string
  buyerName: string
  contractNumber: string
  date: string
  missionDescription: string
  pricingAmount: string
  pricingType: string
}) {
  const ph = '#d1d5db'

  const displayDate = date ? formatDateFr(date) : ''
  const missionExcerpt = missionDescription
    ? missionDescription.slice(0, 120) + (missionDescription.length > 120 ? '…' : '')
    : ''

  return (
    <div
      style={{
        borderRadius: 10,
        overflow: 'hidden',
        border: '1px solid #e5e7eb',
        fontFamily: 'system-ui, sans-serif',
        fontSize: 11,
        lineHeight: 1.45,
        background: '#fff',
        boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
      }}
    >
      {/* Dark header */}
      <div
        style={{
          background: '#0f172a',
          padding: '10px 12px 8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              fontSize: 13,
              fontWeight: 900,
              letterSpacing: 2,
              color: '#facc15',
              textTransform: 'uppercase',
            }}
          >
            CONTRAT
          </span>
          {contractNumber ? (
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', fontWeight: 500 }}>
              N° {contractNumber}
            </span>
          ) : (
            <span style={{ fontSize: 10, color: ph, fontWeight: 400 }}>N° —</span>
          )}
        </div>
        <span style={{ fontSize: 10, color: displayDate ? 'rgba(255,255,255,0.65)' : ph, fontWeight: 500 }}>
          {displayDate || 'jj/mm/aaaa'}
        </span>
      </div>

      {/* Party cards */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid #f3f4f6' }}>
        {/* Prestataire */}
        <div
          style={{
            flex: 1,
            padding: '8px 10px',
            borderRight: '1px solid #f3f4f6',
            background: '#fafafa',
          }}
        >
          <div
            style={{
              fontSize: 8,
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: 1,
              color: '#94a3b8',
              marginBottom: 4,
            }}
          >
            Prestataire
          </div>
          <div
            style={{
              fontWeight: 700,
              fontSize: 11,
              color: sellerName ? '#0f172a' : ph,
              wordBreak: 'break-word',
            }}
          >
            {sellerName || 'Votre nom'}
          </div>
        </div>

        {/* Client */}
        <div style={{ flex: 1, padding: '8px 10px', background: '#fafafa' }}>
          <div
            style={{
              fontSize: 8,
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: 1,
              color: '#94a3b8',
              marginBottom: 4,
            }}
          >
            Client
          </div>
          <div
            style={{
              fontWeight: 700,
              fontSize: 11,
              color: buyerName ? '#0f172a' : ph,
              wordBreak: 'break-word',
            }}
          >
            {buyerName || 'Nom du client'}
          </div>
        </div>
      </div>

      {/* Mission excerpt */}
      <div style={{ padding: '8px 10px', borderBottom: pricingAmount ? '1px solid #f3f4f6' : 'none' }}>
        <div
          style={{
            fontSize: 8,
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: 1,
            color: '#94a3b8',
            marginBottom: 4,
          }}
        >
          Mission
        </div>
        <div
          style={{
            fontSize: 10,
            color: missionExcerpt ? '#374151' : ph,
            lineHeight: 1.5,
            wordBreak: 'break-word',
          }}
        >
          {missionExcerpt || 'Décrivez le périmètre de la mission…'}
        </div>
      </div>

      {/* Price badge */}
      {pricingAmount ? (
        <div style={{ padding: '6px 10px', background: '#f0fdf4' }}>
          <span
            style={{
              display: 'inline-block',
              padding: '2px 8px',
              borderRadius: 20,
              background: '#dcfce7',
              border: '1px solid #86efac',
              fontSize: 10,
              fontWeight: 800,
              color: '#166534',
            }}
          >
            {pricingAmount}
            {pricingType ? ' · ' + pricingType : ''}
          </span>
        </div>
      ) : null}
    </div>
  )
}

export default function SeoContratPage() {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), [])
  const pdfCountKey = 'spyke_seo_contrat_pdf_count_v2'

  const [pdfCount, setPdfCount] = useState(0)

  const [title, setTitle] = useState('Contrat de prestation de service')
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

  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string>('')
  const pdfPreviewFilenameRef = useRef<string>('')

  const [lockedHint, setLockedHint] = useState<null | string>(null)

  const [showPreviewDrawer, setShowPreviewDrawer] = useState(false)

  useEffect(() => {
    setPdfCount(readCount(pdfCountKey))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    setContractText(
      buildCanonicalContractText({
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
          representant: buyerRepresentant,
          address: buyerAddress,
        },
        mission: {
          startDate: formatDateFr(missionStartDate) || missionStartDate,
          endDate: formatDateFr(missionEndDate) || missionEndDate,
          description: missionDescription,
          deliverables: missionDeliverables,
          revisions: missionRevisions,
        },
        pricing: { amount: pricingAmount },
        paymentSchedule,
        paymentDelay,
        ipClause,
        confidentiality,
        termination,
      })
    )
  }, [
    contractNumber,
    sellerName,
    sellerSiret,
    sellerAddress,
    sellerActivity,
    sellerEmail,
    buyerName,
    buyerRepresentant,
    buyerAddress,
    missionStartDate,
    missionEndDate,
    missionDescription,
    missionDeliverables,
    missionRevisions,
    pricingAmount,
    paymentSchedule,
    paymentDelay,
    ipClause,
    confidentiality,
    termination,
  ])

  function persistSeoDraft() {
    try {
      const key = 'spyke_seo_contract_draft_v1'
      const fallbackNumber = contractNumber?.trim() ? contractNumber : `SEO-${new Date().toISOString().slice(0, 10)}-${String(Date.now()).slice(-5)}`
      const draft = {
        createdAt: new Date().toISOString(),
        kind: 'contrat',
        contractNumber: fallbackNumber,
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
        contractText,
      }
      window.localStorage.setItem(key, JSON.stringify(draft))
    } catch {
      // ignore
    }
  }

  function goSignup() {
    persistSeoDraft()
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
          startDate: formatDateFr(missionStartDate) || missionStartDate,
          endDate: formatDateFr(missionEndDate) || missionEndDate,
          location: (() => {
            const v = String(missionLocation || '').toLowerCase().trim()
            if (v === 'distance' || v.includes('distance')) return 'À DISTANCE'
            if (v === 'client' || v.includes('site')) return 'SUR SITE'
            if (v === 'mixte') return 'MIXTE'
            return missionLocation
          })(),
          revisions: missionRevisions === 'illimite' ? 'ILLIMITÉES' : missionRevisions,
          description: missionDescription,
          deliverables: missionDeliverables,
        },
        pricing: {
          type: (() => {
            const v = String(pricingType || '').toLowerCase().trim()
            if (v === 'forfait') return 'FORFAIT'
            if (v === 'tjm') return 'TJM'
            if (v === 'horaire' || v === 'heure' || v === 'taux horaire') return 'TAUX HORAIRE'
            return pricingType
          })(),
          amount: (() => {
            const n = Number(String(pricingAmount || '').replace(',', '.'))
            if (!Number.isFinite(n) || !n) return pricingAmount
            const v = String(pricingType || '').toLowerCase().trim()
            if (v === 'tjm') return n.toFixed(2) + ' € HT / jour'
            if (v === 'horaire' || v === 'heure' || v === 'taux horaire') return n.toFixed(2) + ' € HT / heure'
            return n.toFixed(2) + ' € HT'
          })(),
        },
        vatRegime: (() => {
          const v = String(vatRegime || '').toLowerCase().trim()
          if (v === 'franchise') return 'FRANCHISE EN BASE'
          if (v === 'assujetti') return 'ASSUJETTI'
          return vatRegime
        })(),
        paymentSchedule: (() => {
          const v = String(paymentSchedule || '').toLowerCase().trim()
          if (v === '30') return '30/70'
          if (v === '50') return '50/50'
          if (v === 'fin') return '100% FIN'
          return v ? 'PERSONNALISÉ' : ''
        })(),
        paymentDelay: (() => {
          const d = String(paymentDelay || '').trim()
          if (d === '30') return '30 JOURS'
          if (d === '45') return '45 JOURS'
          if (d === '60') return '60 JOURS'
          if (d === '15') return '15 JOURS'
          if (d === 'reception') return 'À RÉCEPTION'
          return paymentDelay
        })(),
        ipClause: (() => {
          const v = String(ipClause || '').toLowerCase().trim()
          if (v === 'cession') return 'CESSION APRÈS PAIEMENT'
          if (v === 'licence') return "LICENCE D'UTILISATION"
          if (v === 'totale') return 'CESSION TOTALE'
          return ipClause
        })(),
        confidentiality: (() => {
          const v = String(confidentiality || '').toLowerCase().trim()
          if (v === 'oui') return 'OUI'
          if (v === 'non') return 'NON'
          return confidentiality
        })(),
        termination: (() => {
          const v = String(termination || '').trim()
          if (v === '15') return 'PRÉAVIS 15 JOURS'
          if (v === '30') return 'PRÉAVIS 30 JOURS'
          if (v === 'sans') return 'SANS PRÉAVIS'
          return termination
        })(),
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

      // Show the same kind of PDF preview modal as in the app (buttons locked on SEO page).
      try {
        if (pdfPreviewUrl) URL.revokeObjectURL(pdfPreviewUrl)
      } catch {}
      const nextUrl = URL.createObjectURL(blob)
      setPdfPreviewUrl(nextUrl)
      pdfPreviewFilenameRef.current = `Contrat-${contractNumber || 'spyke'}.pdf`

      const nextCount = pdfCount + 1
      setPdfCount(nextCount)
      writeCount(pdfCountKey, nextCount)

      // optional lead-capture can still be shown later; keep disabled for now
      // setShowEmailModal(true)
    } catch (e: any) {
      alert(e?.message || 'Erreur PDF')
    }
  }

  const showSoftSignupNudge = pdfCount >= 1

  return (
    <div className="seo-tool">
      {/* PDF Preview modal (SEO): same UI pattern as the app, but actions are locked */}
      {pdfPreviewUrl ? (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.55)',
            zIndex: 500,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
          onClick={(e) => {
            if (e.target !== e.currentTarget) return
            try {
              if (pdfPreviewUrl) URL.revokeObjectURL(pdfPreviewUrl)
            } catch {}
            setPdfPreviewUrl('')
          }}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 16,
              width: 'min(1100px, 96vw)',
              height: 'min(86vh, 900px)',
              overflow: 'hidden',
              boxShadow: '0 30px 90px rgba(0,0,0,0.35)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                padding: '12px 14px',
                borderBottom: '1px solid rgba(0,0,0,0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 700, color: 'rgba(0,0,0,0.85)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {pdfPreviewFilenameRef.current || 'Contrat.pdf'}
              </div>
              <button
                className="btn btn-secondary"
                type="button"
                onClick={() => {
                  try {
                    if (pdfPreviewUrl) URL.revokeObjectURL(pdfPreviewUrl)
                  } catch {}
                  setPdfPreviewUrl('')
                }}
              >
                Fermer
              </button>
            </div>

            <div style={{ flex: 1, minHeight: 0, background: '#f8fafc' }}>
              <PdfInlineViewer url={pdfPreviewUrl} />
            </div>

            <div style={{ padding: 12, borderTop: '1px solid rgba(0,0,0,0.08)', background: '#fff' }}>
              {lockedHint ? (
                <div
                  style={{
                    marginBottom: 10,
                    padding: '10px 12px',
                    borderRadius: 12,
                    background: 'rgba(250, 204, 21, 0.18)',
                    border: '1px solid rgba(250, 204, 21, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 10,
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 800, color: 'rgba(0,0,0,0.85)' }}>{lockedHint}</div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button className="btn btn-secondary" type="button" onClick={() => setLockedHint(null)}>
                      Fermer
                    </button>
                    <button className="btn btn-primary" type="button" onClick={goSignup}>
                      Connexion
                    </button>
                  </div>
                </div>
              ) : null}

              <div style={{ marginBottom: 10, padding: '10px 14px', borderRadius: 10, background: '#fff7ed', border: '1px solid #fed7aa', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 13, color: '#92400e', fontWeight: 600 }}>
                  ⚠️ Ce PDF contient un filigrane Spyke — créez un compte gratuit pour le supprimer.
                </span>
                <button className="btn btn-primary" type="button" onClick={goSignup} style={{ fontSize: 12, padding: '6px 16px', flexShrink: 0 }}>
                  Supprimer le filigrane →
                </button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <button
                    className="btn btn-secondary"
                    type="button"
                    aria-disabled="true"
                    title="Crée un compte gratuit pour utiliser cette fonction"
                    onClick={() => setLockedHint('Créer un compte gratuit pour utiliser ces fonctions (signature, envoi mail, envoi pour signature).')}
                    style={{ opacity: 0.55, cursor: 'not-allowed' }}
                  >
                    Signer 🔒
                  </button>
                  <button
                    className="btn btn-secondary"
                    type="button"
                    aria-disabled="true"
                    title="Crée un compte gratuit pour utiliser cette fonction"
                    onClick={() => setLockedHint('Créer un compte gratuit pour utiliser ces fonctions (signature, envoi mail, envoi pour signature).')}
                    style={{ opacity: 0.55, cursor: 'not-allowed' }}
                  >
                    Envoyer par mail 🔒
                  </button>
                  <button
                    className="btn btn-secondary"
                    type="button"
                    aria-disabled="true"
                    title="Crée un compte gratuit pour utiliser cette fonction"
                    onClick={() => setLockedHint('Créer un compte gratuit pour utiliser ces fonctions (signature, envoi mail, envoi pour signature).')}
                    style={{ opacity: 0.55, cursor: 'not-allowed' }}
                  >
                    Envoyer pour signature 🔒
                  </button>
                </div>

                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                  <a className="btn btn-secondary" href={pdfPreviewUrl} download={pdfPreviewFilenameRef.current || 'contrat.pdf'}>
                    Télécharger
                  </a>
                  <button className="btn btn-primary" type="button" onClick={goSignup}>
                    Créer un compte gratuit
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Mobile preview drawer */}
      {showPreviewDrawer ? (
        <>
          {/* Semi-transparent dark backdrop */}
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.45)',
              zIndex: 400,
            }}
            onClick={() => setShowPreviewDrawer(false)}
          />
          {/* White rounded-top panel */}
          <div
            style={{
              position: 'fixed',
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 400,
              borderRadius: '20px 20px 0 0',
              background: '#fff',
              maxHeight: '80vh',
              overflowY: 'auto',
              padding: '20px 16px 32px',
              boxShadow: '0 -8px 40px rgba(0,0,0,0.18)',
            }}
          >
            {/* Header row */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 16,
              }}
            >
              <span style={{ fontSize: 15, fontWeight: 800, color: '#0f172a' }}>Aperçu du document</span>
              <button
                type="button"
                onClick={() => setShowPreviewDrawer(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 700,
                  color: '#6b7280',
                  padding: '4px 8px',
                }}
              >
                ✕ Fermer
              </button>
            </div>

            {/* Preview */}
            <ContratPreview
              sellerName={sellerName}
              buyerName={buyerName}
              contractNumber={contractNumber}
              date={date}
              missionDescription={missionDescription}
              pricingAmount={pricingAmount}
              pricingType={pricingType}
            />

            {/* Note */}
            <p
              style={{
                marginTop: 12,
                fontSize: 11,
                color: '#94a3b8',
                textAlign: 'center',
              }}
            >
              Aperçu simplifié · Cliquez sur Générer pour le vrai PDF
            </p>
          </div>
        </>
      ) : null}

      <nav className="seo-navbar">
        <a href="/" className="seo-nav-logo"><div className="seo-nav-logo-icon"><svg viewBox="0 0 24 24"><path d="M13 3L4 14h7l-2 7 9-11h-7l2-7z"/></svg></div><span className="seo-nav-logo-text">Spyke</span></a>
        <div className="seo-nav-tools">
          <a href="/devis-freelance" className="seo-nav-tool">Devis</a>
          <a href="/facture-auto-entrepreneur" className="seo-nav-tool">Facture</a>
          <a href="/contrat-freelance" className="seo-nav-tool active">Contrat</a>
        </div>
        <a href="/connexion.html" className="seo-nav-cta">Essayer gratuitement</a>
      </nav>

      <section className="seo-hero">
        <div className="seo-hero-badge"><span className="seo-hero-badge-dot"/>Outil 100 % gratuit</div>
        <h1>Créez votre <span>contrat freelance</span><br/>en 2 minutes chrono</h1>
        <p className="seo-hero-sub">Remplissez les champs essentiels, téléchargez un PDF. <b>Gratuit, sans inscription.</b></p>
        <div className="seo-hero-trust">
          <span className="seo-hero-trust-item"><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>2 450+ docs générés</span>
          <span className="seo-hero-trust-item"><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>Sans inscription</span>
          <span className="seo-hero-trust-item"><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>PDF professionnel</span>
          <span className="seo-hero-trust-item"><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>Conforme au droit français</span>
        </div>
      </section>

      <div className="seo-workspace">
        <div className="seo-form-col">

          <div className="seo-section">
            <div className="seo-section-header"><div className="seo-section-num">1</div><div className="seo-section-title">Contrat</div></div>
            <div className="seo-section-body">
              <div className="seo-grid">
                <div className="seo-group"><label className="seo-label">Titre</label><input className="seo-input" value={title} onChange={(e)=>setTitle(e.target.value)}/></div>
                <div className="seo-group"><label className="seo-label">Numéro (optionnel)</label><input className="seo-input" value={contractNumber} onChange={(e)=>setContractNumber(e.target.value)} placeholder="C202604-001"/></div>
                <div className="seo-group"><label className="seo-label">Date</label><input type="date" className="seo-input" value={date} onChange={(e)=>setDate(e.target.value)}/></div>
                <div className="seo-group"><label className="seo-label">Logo (optionnel)</label><input type="file" accept="image/*" className="seo-input" onChange={(e)=>onPickLogo(e.target.files?.[0]||null)}/></div>
              </div>
            </div>
          </div>

          <div className="seo-section">
            <div className="seo-section-header"><div className="seo-section-num">2</div><div className="seo-section-title">Prestataire</div></div>
            <div className="seo-section-body">
              <div className="seo-grid">
                <div className="seo-group"><label className="seo-label">Nom / Raison sociale *</label><input className="seo-input" value={sellerName} onChange={(e)=>setSellerName(e.target.value)}/></div>
                <div className="seo-group"><label className="seo-label">SIRET (optionnel)</label><input className="seo-input" value={sellerSiret} onChange={(e)=>setSellerSiret(e.target.value)}/></div>
                <div className="seo-group"><label className="seo-label">Activité (optionnel)</label><input className="seo-input" value={sellerActivity} onChange={(e)=>setSellerActivity(e.target.value)} placeholder="Développement web"/></div>
                <div className="seo-group"><label className="seo-label">Email (optionnel)</label><input className="seo-input" value={sellerEmail} onChange={(e)=>setSellerEmail(e.target.value)} placeholder="contact@…"/></div>
                <div className="seo-group full"><label className="seo-label">Adresse (optionnel)</label><input className="seo-input" value={sellerAddress} onChange={(e)=>setSellerAddress(e.target.value)}/></div>
              </div>
            </div>
          </div>

          <div className="seo-section">
            <div className="seo-section-header"><div className="seo-section-num">3</div><div className="seo-section-title">Client</div></div>
            <div className="seo-section-body">
              <div className="seo-grid">
                <div className="seo-group"><label className="seo-label">Nom / Entreprise *</label><input className="seo-input" value={buyerName} onChange={(e)=>setBuyerName(e.target.value)}/></div>
                <div className="seo-group"><label className="seo-label">SIRET (optionnel)</label><input className="seo-input" value={buyerSiret} onChange={(e)=>setBuyerSiret(e.target.value)}/></div>
                <div className="seo-group"><label className="seo-label">Représentant (optionnel)</label><input className="seo-input" value={buyerRepresentant} onChange={(e)=>setBuyerRepresentant(e.target.value)} placeholder="Nom du signataire"/></div>
                <div className="seo-group"><label className="seo-label">Email (optionnel)</label><input className="seo-input" value={buyerEmail} onChange={(e)=>setBuyerEmail(e.target.value)} placeholder="client@…"/></div>
                <div className="seo-group full"><label className="seo-label">Adresse (optionnel)</label><input className="seo-input" value={buyerAddress} onChange={(e)=>setBuyerAddress(e.target.value)}/></div>
              </div>
            </div>
          </div>

          <div className="seo-section">
            <div className="seo-section-header"><div className="seo-section-num">4</div><div className="seo-section-title">Mission</div></div>
            <div className="seo-section-body">
              <div className="seo-grid">
                <div className="seo-group"><label className="seo-label">Début (optionnel)</label><input type="date" className="seo-input" value={missionStartDate} onChange={(e)=>setMissionStartDate(e.target.value)}/></div>
                <div className="seo-group"><label className="seo-label">Fin (optionnel)</label><input type="date" className="seo-input" value={missionEndDate} onChange={(e)=>setMissionEndDate(e.target.value)}/></div>
                <div className="seo-group"><label className="seo-label">Lieu (optionnel)</label><input className="seo-input" value={missionLocation} onChange={(e)=>setMissionLocation(e.target.value)} placeholder="À distance / sur site / mixte"/></div>
                <div className="seo-group"><label className="seo-label">Révisions (optionnel)</label><input className="seo-input" value={missionRevisions} onChange={(e)=>setMissionRevisions(e.target.value)} placeholder="2"/></div>
                <div className="seo-group full"><label className="seo-label">Description de la mission *</label><textarea className="seo-textarea" value={missionDescription} onChange={(e)=>setMissionDescription(e.target.value)} placeholder="Décris le périmètre, les modalités, les délais…"/></div>
                <div className="seo-group full"><label className="seo-label">Livrables (optionnel)</label><textarea className="seo-textarea" value={missionDeliverables} onChange={(e)=>setMissionDeliverables(e.target.value)} placeholder="- Maquette&#10;- Code source&#10;- Documentation…"/></div>
              </div>
            </div>
          </div>

          <div className="seo-section">
            <div className="seo-section-header"><div className="seo-section-num">5</div><div className="seo-section-title">Prix & clauses</div><span className="seo-section-subtitle">Optionnel</span></div>
            <div className="seo-section-body">
              <div className="seo-grid">
                <div className="seo-group"><label className="seo-label">Type</label><input className="seo-input" value={pricingType} onChange={(e)=>setPricingType(e.target.value)} placeholder="Forfait / TJM / Taux horaire"/></div>
                <div className="seo-group"><label className="seo-label">Montant</label><input className="seo-input" value={pricingAmount} onChange={(e)=>setPricingAmount(e.target.value)} placeholder="1 500€"/></div>
                <div className="seo-group"><label className="seo-label">Régime TVA</label><input className="seo-input" value={vatRegime} onChange={(e)=>setVatRegime(e.target.value)} placeholder="Franchise en base / assujetti"/></div>
                <div className="seo-group"><label className="seo-label">Échéancier</label><input className="seo-input" value={paymentSchedule} onChange={(e)=>setPaymentSchedule(e.target.value)} placeholder="30/70, 50/50…"/></div>
                <div className="seo-group"><label className="seo-label">Délai de paiement</label><input className="seo-input" value={paymentDelay} onChange={(e)=>setPaymentDelay(e.target.value)} placeholder="30 jours"/></div>
                <div className="seo-group"><label className="seo-label">Clause IP</label><input className="seo-input" value={ipClause} onChange={(e)=>setIpClause(e.target.value)} placeholder="Cession après paiement…"/></div>
                <div className="seo-group"><label className="seo-label">Confidentialité</label><input className="seo-input" value={confidentiality} onChange={(e)=>setConfidentiality(e.target.value)} placeholder="Oui / Non"/></div>
                <div className="seo-group full"><label className="seo-label">Résiliation / préavis</label><input className="seo-input" value={termination} onChange={(e)=>setTermination(e.target.value)} placeholder="Préavis 30 jours…"/></div>
              </div>
            </div>
          </div>

          <div className="seo-section">
            <div className="seo-section-header"><div className="seo-section-num">6</div><div className="seo-section-title">Aperçu texte</div><span className="seo-section-subtitle">Modifiable</span></div>
            <div className="seo-section-body"><textarea className="seo-textarea" style={{minHeight:200,width:'100%'}} value={contractText} onChange={(e)=>setContractText(e.target.value)}/></div>
          </div>

        </div>

        <div className="seo-summary-col">
          <div className="seo-summary">
            <div style={{ padding: '14px 16px', borderBottom: '1px solid #f3f4f6' }}>
              <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, color: '#94a3b8', marginBottom: 10 }}>Aperçu en direct</div>
              <ContratPreview
                sellerName={sellerName}
                buyerName={buyerName}
                contractNumber={contractNumber}
                date={date}
                missionDescription={missionDescription}
                pricingAmount={pricingAmount}
                pricingType={pricingType}
              />
            </div>
            <div className="seo-summary-actions">
              <button className="seo-btn-generate" type="button" onClick={generatePdf}>Générer mon contrat PDF ↓</button>
              <p className="seo-summary-note"><span>Gratuit</span><span className="seo-summary-note-dot"/><span>Sans inscription</span><span className="seo-summary-note-dot"/><span>PDF pro</span></p>
            </div>
            {showSoftSignupNudge && <div className="seo-summary-nudge">
              <div className="seo-summary-nudge-title">Sauvegarder vos contrats ?</div>
              <div className="seo-summary-nudge-text">Créez un compte gratuit pour centraliser vos clients, contrats, devis et factures.</div>
              <button className="seo-summary-nudge-btn" type="button" onClick={goSignup}>Créer un compte gratuit →</button>
            </div>}
          </div>
          <div className="seo-mini-tools">
            <div className="seo-mini-tools-title">Autres outils gratuits</div>
            <a href="/devis-freelance" className="seo-mini-tool"><span className="seo-mini-tool-dot" style={{background:'#facc15'}}/>Devis freelance</a>
            <a href="/facture-auto-entrepreneur" className="seo-mini-tool"><span className="seo-mini-tool-dot" style={{background:'#3b82f6'}}/>Facture auto-entrepreneur</a>
            <a href="/contrat-freelance" className="seo-mini-tool active"><span className="seo-mini-tool-dot" style={{background:'#f97316'}}/>Contrat freelance</a>
          </div>
        </div>
      </div>

      <div className="seo-mobile-bar">
        <div className="seo-mobile-bar-info"><div className="seo-mobile-bar-label">Contrat freelance</div><div className="seo-mobile-bar-amount" style={{fontSize:15,fontWeight:700}}>PDF gratuit</div></div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            onClick={() => setShowPreviewDrawer(true)}
            style={{ padding: '12px 14px', background: '#f1f5f9', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: 'pointer', color: '#0a0a0a', whiteSpace: 'nowrap' }}
          >
            👁 Aperçu
          </button>
          <button className="seo-mobile-bar-btn" type="button" onClick={generatePdf}>Générer le PDF ↓</button>
        </div>
      </div>
    </div>
  )
}
