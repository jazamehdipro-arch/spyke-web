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
inscrit(e) à l’INSEE sous le numéro SIRET
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
besoins du CLIENT et qu’il intervient régulièrement et de manière significative auprès de nombreuses
entreprises dont les besoins et les exigences sont similaires à ceux du CLIENT.
Les PARTIES ont eu l’occasion d’échanger sur le sujet et de poser toutes les questions utiles, en ont
obtenu toutes les réponses et ont ainsi pu s’assurer des éléments déterminants attendus du CLIENT.
C’est dans ce contexte que les Parties se sont réunies afin de préciser au sein du présent contrat,
ci-après le « Contrat », les conditions dans lesquelles le PRESTATAIRE fournira ses prestations au
CLIENT.
ARTICLE 2 — DURÉE DU CONTRAT
Le Contrat prendra effet le [DATE DÉBUT] et se terminera de plein droit le [DATE FIN], ci-après la «
Période Contractuelle ».
À l’expiration de la Période Contractuelle, le Contrat prendra fin automatiquement sans qu’aucune
formalité ne soit nécessaire, sauf accord écrit des deux Parties pour son renouvellement.
ARTICLE 3 — OBLIGATIONS DU PRESTATAIRE
3.1 — Prestations
En contrepartie du prix ferme et certain visé à l’article 4, le PRESTATAIRE s’engage à effectuer les
prestations visées dans le devis et/ou la proposition commerciale figurant à l’annexe 1 des présentes,
comprenant notamment :
- [Description de la prestation 1]
- [Description de la prestation 2]
- [Description de la prestation 3]
Le PRESTATAIRE inclut [NOMBRE] tour(s) de révisions dans le cadre de la présente mission ; toute
demande de modification supplémentaire au-delà de ce nombre fera l’objet d’un devis complémentaire
accepté par le CLIENT préalablement à sa réalisation.
ARTICLE 4 — CONDITIONS FINANCIÈRES
4.1 — Prix
En contrepartie de la réalisation des prestations visées à l’article 3 des présentes, le CLIENT s’engage à
verser une somme forfaitaire au profit du PRESTATAIRE dont le montant s’élève inconditionnellement et
invariablement à [MONTANT] € HT ([PRIX EN LETTRES] euros hors taxe), ci-après le « Prix ».
4.2 — Modalités de paiement
Le PRESTATAIRE facturera le CLIENT selon les conditions financières suivantes :
Échéance % du Prix Montant HT Date
Acompte [%] [MONTANT] € [DATE]
Solde [%] [MONTANT] € [DATE]
La facture sera réglée par le CLIENT par virement bancaire sur le compte du PRESTATAIRE à [30
JOURS / 45 JOURS / 60 JOURS] fin de mois à compter de la date d’émission de la facture originale
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

      <style jsx global>{`
        * { box-sizing: border-box; }
        .seo-tool {
          --black: #0a0a0a;
          --white: #ffffff;
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
          --yellow: #facc15;
          --yellow-dark: #eab308;
          --yellow-glow: rgba(250, 204, 21, 0.15);
          --green: #22c55e;
          --green-light: rgba(34, 197, 94, 0.1);
          font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'DM Sans', sans-serif;
          background: var(--gray-50);
          color: var(--gray-900);
          min-height: 100vh;
        }
        .seo-navbar {
          background: var(--black);
          padding: 16px 40px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: sticky;
          top: 0;
          z-index: 50;
        }
        .seo-nav-logo { display: flex; align-items: center; gap: 10px; text-decoration: none; }
        .seo-nav-logo-icon { width: 32px; height: 32px; background: var(--gray-800); border-radius: 8px; display: flex; align-items: center; justify-content: center; }
        .seo-nav-logo-icon svg { width: 18px; height: 18px; fill: var(--yellow); }
        .seo-nav-logo-text { font-weight: 800; font-size: 20px; color: var(--white); letter-spacing: -0.5px; }
        .seo-nav-tools { display: flex; gap: 6px; }
        .seo-nav-tool { padding: 8px 16px; border-radius: 8px; font-size: 13px; font-weight: 600; color: var(--gray-400); text-decoration: none; }
        .seo-nav-tool:hover { color: var(--white); background: var(--gray-800); }
        .seo-nav-tool.active { color: var(--yellow); background: var(--gray-800); }
        .seo-nav-cta { padding: 9px 20px; background: var(--yellow); color: var(--black); border-radius: 10px; font-size: 13px; font-weight: 800; text-decoration: none; }

        .seo-hero { background: var(--black); padding: 56px 40px 46px; text-align: center; position: relative; overflow: hidden; }
        .seo-hero::before { content: ''; position: absolute; width: 500px; height: 500px; border-radius: 50%; background: var(--yellow); opacity: 0.06; top: -200px; left: 50%; transform: translateX(-50%); filter: blur(100px); }
        .seo-hero-badge { display: inline-flex; align-items: center; gap: 8px; background: rgba(250, 204, 21, 0.1); border: 1px solid rgba(250, 204, 21, 0.2); color: var(--yellow); font-size: 12px; font-weight: 900; text-transform: uppercase; letter-spacing: 1.2px; padding: 6px 16px; border-radius: 999px; margin-bottom: 18px; position: relative; z-index: 1; }
        .seo-hero-badge-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--yellow); }
        .seo-hero h1 { font-size: 40px; font-weight: 900; color: var(--white); letter-spacing: -1.4px; line-height: 1.15; max-width: 760px; margin: 0 auto 14px; position: relative; z-index: 1; }
        .seo-hero h1 span { color: var(--yellow); }
        .seo-hero-sub { font-size: 16px; color: var(--gray-400); max-width: 620px; margin: 0 auto; line-height: 1.7; position: relative; z-index: 1; }
        .seo-hero-trust { display: flex; align-items: center; justify-content: center; gap: 24px; margin-top: 24px; position: relative; z-index: 1; flex-wrap: wrap; }
        .seo-hero-trust-item { display: flex; align-items: center; gap: 6px; font-size: 13px; color: var(--gray-500); }
        .seo-hero-trust-item svg { width: 16px; height: 16px; stroke: var(--green); fill: none; stroke-width: 2.5; }

        .seo-soft-nudge { max-width: 900px; margin: 12px auto 0; padding: 0 40px; }
        .seo-soft-nudge-card { background: rgba(250, 204, 21, 0.12); border: 1px solid rgba(250, 204, 21, 0.25); border-radius: 14px; padding: 14px 16px; display: flex; gap: 12px; align-items: center; justify-content: space-between; flex-wrap: wrap; }
        .seo-soft-nudge-text { color: #111827; font-size: 13px; font-weight: 700; }
        .seo-soft-nudge-sub { color: #374151; font-size: 12px; margin-top: 2px; }
        .seo-soft-nudge-btn { padding: 10px 14px; background: var(--black); color: var(--white); border: none; border-radius: 10px; font-weight: 900; cursor: pointer; white-space: nowrap; }

        .seo-form-wrap { max-width: 900px; margin: 32px auto 0; padding: 0 40px; }
        .seo-card { background: var(--white); border: 1px solid var(--gray-200); border-radius: 16px; padding: 28px 32px; margin-bottom: 18px; }
        .seo-card-title { font-size: 15px; font-weight: 900; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid var(--gray-100); }
        .seo-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .seo-group { display: flex; flex-direction: column; gap: 6px; }
        .seo-group.full { grid-column: 1 / -1; }
        .seo-label { font-size: 12px; font-weight: 700; color: var(--gray-600); }
        .seo-input, .seo-select, .seo-textarea { padding: 11px 14px; border: 1.5px solid var(--gray-200); border-radius: 10px; font-size: 14px; color: var(--gray-900); outline: none; background: var(--gray-50); }
        .seo-input:focus, .seo-select:focus, .seo-textarea:focus { border-color: var(--yellow); box-shadow: 0 0 0 3px var(--yellow-glow); background: var(--white); }
        .seo-textarea { resize: vertical; min-height: 70px; }

        .seo-generate { text-align: center; margin-top: 8px; }
        .seo-btn-generate { padding: 16px 48px; background: var(--black); color: var(--white); border: none; border-radius: 14px; font-size: 16px; font-weight: 900; cursor: pointer; }
        .seo-note { font-size: 12px; color: var(--gray-400); margin-top: 10px; }

        .seo-modal-overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); z-index: 200; align-items: center; justify-content: center; }
        .seo-modal-overlay.active { display: flex; }
        .seo-modal { background: var(--white); border-radius: 20px; padding: 32px 34px; max-width: 440px; width: 90%; text-align: center; }
        .seo-modal h3 { font-size: 20px; font-weight: 900; margin: 0 0 6px; }
        .seo-modal p { font-size: 14px; color: var(--gray-500); margin: 0 0 18px; }
        .seo-modal-form { display: flex; gap: 10px; margin-bottom: 12px; }
        .seo-modal-form input { flex: 1; }
        .seo-modal-form button { padding: 12px 18px; background: var(--black); color: var(--white); border: none; border-radius: 10px; font-weight: 900; cursor: pointer; }
        .seo-modal-skip { font-size: 13px; color: var(--gray-400); cursor: pointer; background: none; border: none; }

        @media (max-width: 768px) {
          .seo-navbar { padding: 12px 20px; }
          .seo-nav-tools { display: none; }
          .seo-hero { padding: 40px 20px 34px; }
          .seo-hero h1 { font-size: 28px; }
          .seo-form-wrap { padding: 0 20px; }
          .seo-grid { grid-template-columns: 1fr; }
          .seo-soft-nudge { padding: 0 20px; }
        }
      `}</style>
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
          <span className="seo-hero-badge-dot" /> Outil 100% gratuit
        </div>
        <h1>
          Créez votre <span>contrat freelance</span> en 2 minutes
        </h1>
        <p className="seo-hero-sub">
          Remplissez les champs essentiels, puis téléchargez un PDF. <b>Gratuit, sans inscription</b>.
        </p>
        <div className="seo-hero-trust">
          <span className="seo-hero-trust-item"><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg>2 450+ documents générés</span>
          <span className="seo-hero-trust-item"><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg>Sans inscription</span>
          <span className="seo-hero-trust-item"><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg>PDF pro</span>
          <span className="seo-hero-trust-item"><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg>Conforme au droit français</span>
        </div>
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
