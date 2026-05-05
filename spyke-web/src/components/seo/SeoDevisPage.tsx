'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import PdfInlineViewer from '@/components/PdfInlineViewer'

type DevisLine = {
  id: string
  label: string
  description: string
  qty: number
  unitPriceHt: number
  vatRate: number
}

function formatMoney(amount: number) {
  return (amount || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'
}

function computeTotals(lines: DevisLine[]) {
  let totalHt = 0
  let totalTva = 0
  for (const l of lines) {
    const lineHt = (l.qty || 0) * (l.unitPriceHt || 0)
    const lineTva = lineHt * ((l.vatRate || 0) / 100)
    totalHt += lineHt
    totalTva += lineTva
  }
  return { totalHt, totalTva, totalTtc: totalHt + totalTva }
}

function addDays(dateStr: string, days: number) {
  const d = new Date(dateStr + 'T00:00:00')
  if (Number.isNaN(d.getTime())) return ''
  d.setDate(d.getDate() + (days || 0))
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

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

export default function SeoDevisPage() {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), [])

  const pdfCountKey = 'spyke_seo_devis_pdf_count_v1'

  const [sellerName, setSellerName] = useState('')
  const [sellerSiret, setSellerSiret] = useState('')
  const [sellerAddress, setSellerAddress] = useState('')
  const [sellerPostalCode, setSellerPostalCode] = useState('')
  const [sellerCity, setSellerCity] = useState('')
  const [sellerCountry, setSellerCountry] = useState('France')
  const [sellerVatNumber, setSellerVatNumber] = useState('')
  const [sellerIban, setSellerIban] = useState('')
  const [sellerBic, setSellerBic] = useState('')

  const [logoDataUrl, setLogoDataUrl] = useState<string>('')

  const [buyerName, setBuyerName] = useState('')
  const [buyerSiret, setBuyerSiret] = useState('')
  const [buyerAddress, setBuyerAddress] = useState('')
  const [buyerPostalCode, setBuyerPostalCode] = useState('')
  const [buyerCity, setBuyerCity] = useState('')
  const [buyerCountry, setBuyerCountry] = useState('France')

  const [quoteNumber, setQuoteNumber] = useState('D-2026-001')
  const [dateIssue, setDateIssue] = useState(today)
  const [validityDays, setValidityDays] = useState(30)
  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')

  // VAT default: 0% (common for micro-entrepreneurs), can be changed per line
  const [lines, setLines] = useState<DevisLine[]>(() => [
    { id: '0', label: '', description: '', qty: 1, unitPriceHt: 0, vatRate: 0 },
  ])

  const totals = useMemo(() => computeTotals(lines), [lines])
  const validityUntil = useMemo(() => addDays(dateIssue, validityDays), [dateIssue, validityDays])

  const [showEmailModal, setShowEmailModal] = useState(false)
  const [email, setEmail] = useState('')

  const [pdfCount, setPdfCount] = useState(0)

  useEffect(() => {
    // Improve defaults: quote number based on month
    const d = new Date()
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    setQuoteNumber(`D${yyyy}${mm}-001`)

    setPdfCount(readCount(pdfCountKey))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function updateLine(id: string, patch: Partial<DevisLine>) {
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)))
  }

  function addLine() {
    setLines((prev) => [
      ...prev,
      { id: String(Date.now()), label: '', description: '', qty: 1, unitPriceHt: 0, vatRate: prev[0]?.vatRate ?? 0 },
    ])
  }

  function removeLine(id: string) {
    setLines((prev) => (prev.length <= 1 ? prev : prev.filter((l) => l.id !== id)))
  }

  function persistSeoDraft() {
    try {
      const key = 'spyke_seo_quote_draft_v1'
      const sellerAddressLines = [sellerAddress, [sellerPostalCode, sellerCity].filter(Boolean).join(' '), sellerCountry]
        .filter((x) => String(x || '').trim())
      const buyerAddressLines = [buyerAddress, [buyerPostalCode, buyerCity].filter(Boolean).join(' '), buyerCountry]
        .filter((x) => String(x || '').trim())

      const totals = computeTotals(lines)

      const draft = {
        createdAt: new Date().toISOString(),
        kind: 'devis',
        quoteNumber,
        title,
        dateIssue,
        validityUntil,
        logoUrl: logoDataUrl || '',
        seller: {
          name: sellerName,
          addressLines: sellerAddressLines,
          siret: sellerSiret,
          vatNumber: sellerVatNumber,
          iban: sellerIban,
          bic: sellerBic,
        },
        buyer: {
          name: buyerName,
          addressLines: buyerAddressLines,
          siret: buyerSiret,
        },
        lines,
        notes,
        totals,
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

  const [lockedHint, setLockedHint] = useState<null | string>(null)
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string>('')
  const pdfPreviewFilenameRef = useRef<string>('')

  async function generatePdf() {
    try {
      if (!sellerName.trim()) throw new Error('Renseigne ton nom / raison sociale')
      if (!buyerName.trim()) throw new Error('Renseigne le nom du client')
      if (!quoteNumber.trim()) throw new Error('Renseigne un numéro de devis')
      if (!dateIssue.trim()) throw new Error("Renseigne la date d'émission")

      const sellerAddressLines = [
        sellerAddress,
        [sellerPostalCode, sellerCity].filter(Boolean).join(' '),
        sellerCountry,
      ].filter((x) => String(x || '').trim()) as string[]

      const buyerAddressLines = [
        buyerAddress,
        [buyerPostalCode, buyerCity].filter(Boolean).join(' '),
        buyerCountry,
      ].filter((x) => String(x || '').trim()) as string[]

      const payload = {
        quoteNumber,
        title,
        dateIssue,
        validityUntil,
        logoUrl: logoDataUrl || '',
        seller: {
          name: sellerName,
          addressLines: sellerAddressLines,
          siret: sellerSiret,
          vatNumber: sellerVatNumber,
          iban: sellerIban,
          bic: sellerBic,
        },
        buyer: {
          name: buyerName,
          addressLines: buyerAddressLines,
          siret: buyerSiret,
        },
        lines,
        notes,
        totals,
      }

      const res = await fetch('/api/public/devis-pdf', {
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

      // Open preview modal (same UX as contrat SEO). Actions are locked; user can download or create an account.
      try {
        if (pdfPreviewUrl) URL.revokeObjectURL(pdfPreviewUrl)
      } catch {}
      const nextUrl = URL.createObjectURL(blob)
      setPdfPreviewUrl(nextUrl)
      pdfPreviewFilenameRef.current = `Devis-${quoteNumber}.pdf`

      const nextCount = pdfCount + 1
      setPdfCount(nextCount)
      writeCount(pdfCountKey, nextCount)

      setShowEmailModal(true)
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
            setLockedHint(null)
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
                {pdfPreviewFilenameRef.current || 'Devis.pdf'}
              </div>
              <button
                className="btn btn-secondary"
                type="button"
                onClick={() => {
                  try {
                    if (pdfPreviewUrl) URL.revokeObjectURL(pdfPreviewUrl)
                  } catch {}
                  setPdfPreviewUrl('')
                  setLockedHint(null)
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
                    onClick={() => setLockedHint('Créer un compte gratuit pour envoyer par email et signer.')}
                    style={{ opacity: 0.55, cursor: 'not-allowed' }}
                  >
                    Envoyer par mail 🔒
                  </button>
                  <button
                    className="btn btn-secondary"
                    type="button"
                    aria-disabled="true"
                    title="Crée un compte gratuit pour utiliser cette fonction"
                    onClick={() => setLockedHint('Créer un compte gratuit pour envoyer par email et signer.')}
                    style={{ opacity: 0.55, cursor: 'not-allowed' }}
                  >
                    Signer 🔒
                  </button>
                </div>

                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                  <a className="btn btn-secondary" href={pdfPreviewUrl} download={pdfPreviewFilenameRef.current || 'devis.pdf'}>
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

      <nav className="seo-navbar">
        <a className="seo-nav-logo" href="/">
          <div className="seo-nav-logo-icon">
            <svg viewBox="0 0 24 24"><path d="M13 3L4 14h7l-2 7 9-11h-7l2-7z" /></svg>
          </div>
          <span className="seo-nav-logo-text">Spyke</span>
        </a>
        <div className="seo-nav-tools">
          <a className="seo-nav-tool active" href="/devis-freelance">Devis gratuit</a>
          <a className="seo-nav-tool" href="/facture-auto-entrepreneur">Facture gratuite</a>
          <a className="seo-nav-tool" href="/contrat-freelance">Contrat gratuit</a>
        </div>
        <a className="seo-nav-cta" href="/connexion.html">Créer un compte gratuit</a>
      </nav>

      <section className="seo-hero">
        <div className="seo-hero-badge"><span className="seo-hero-badge-dot" /> Outil 100% gratuit</div>
        <h1>Créez votre <span>devis freelance</span> en 2 minutes</h1>
        <p className="seo-hero-sub">Remplissez le formulaire, téléchargez votre devis en PDF professionnel. <b>Gratuit, sans inscription</b>, conforme aux obligations légales.</p>
        <div className="seo-hero-trust">
          <span className="seo-hero-trust-item"><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg>2 450+ documents générés</span>
          <span className="seo-hero-trust-item"><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg>Sans inscription</span>
          <span className="seo-hero-trust-item"><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg>PDF pro</span>
          <span className="seo-hero-trust-item"><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg>TVA/HT/TTC</span>
        </div>
      </section>

      <div className="seo-ai-banner">
        <div className="seo-ai-icon">
          <svg viewBox="0 0 24 24"><path d="M13 3L4 14h7l-2 7 9-11h-7l2-7z" /></svg>
          <div className="seo-ai-lock">
            <svg viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div className="seo-ai-title">Remplissage IA depuis un brief client</div>
          <div className="seo-ai-sub">Importez un PDF ou une image, l'IA pré-remplit votre devis automatiquement</div>
        </div>
        <button className="seo-ai-btn" type="button" onClick={goSignup}>Fonctionnalité Spyke Pro</button>
      </div>

      {showSoftSignupNudge ? (
        <div className="seo-soft-nudge">
          <div className="seo-soft-nudge-card">
            <div>
              <div className="seo-soft-nudge-text">Vous aimez l'outil ?</div>
              <div className="seo-soft-nudge-sub">Créez un compte gratuit pour sauvegarder vos clients et retrouver vos devis.</div>
            </div>
            <button className="seo-soft-nudge-btn" type="button" onClick={goSignup}>Créer un compte</button>
          </div>
        </div>
      ) : null}

      <div className="seo-form-wrap">
        <div className="seo-card">
          <div className="seo-card-title">Vos informations (prestataire)</div>
          <div className="seo-grid">
            <div className="seo-group">
              <label className="seo-label">Nom / Raison sociale</label>
              <input className="seo-input" value={sellerName} onChange={(e) => setSellerName(e.target.value)} placeholder="Ex : Jean Dupont" />
            </div>
            <div className="seo-group">
              <label className="seo-label">SIRET</label>
              <input className="seo-input" value={sellerSiret} onChange={(e) => setSellerSiret(e.target.value)} placeholder="123 456 789 00012" />
            </div>
            <div className="seo-group full">
              <label className="seo-label">Adresse</label>
              <input className="seo-input" value={sellerAddress} onChange={(e) => setSellerAddress(e.target.value)} placeholder="15 rue de la Paix" />
            </div>
            <div className="seo-group">
              <label className="seo-label">Code postal</label>
              <input className="seo-input" value={sellerPostalCode} onChange={(e) => setSellerPostalCode(e.target.value)} placeholder="75002" />
            </div>
            <div className="seo-group">
              <label className="seo-label">Ville</label>
              <input className="seo-input" value={sellerCity} onChange={(e) => setSellerCity(e.target.value)} placeholder="Paris" />
            </div>
            <div className="seo-group">
              <label className="seo-label">Pays</label>
              <input className="seo-input" value={sellerCountry} onChange={(e) => setSellerCountry(e.target.value)} placeholder="France" />
            </div>
            <div className="seo-group">
              <label className="seo-label">N° TVA (optionnel)</label>
              <input className="seo-input" value={sellerVatNumber} onChange={(e) => setSellerVatNumber(e.target.value)} placeholder="FR…" />
            </div>
            <div className="seo-group">
              <label className="seo-label">IBAN (optionnel)</label>
              <input className="seo-input" value={sellerIban} onChange={(e) => setSellerIban(e.target.value)} />
            </div>
            <div className="seo-group">
              <label className="seo-label">BIC (optionnel)</label>
              <input className="seo-input" value={sellerBic} onChange={(e) => setSellerBic(e.target.value)} />
            </div>
            <div className="seo-group full">
              <label className="seo-label">Logo (optionnel)</label>
              <input
                type="file"
                accept="image/*"
                className="seo-input"
                onChange={(e) => onPickLogo(e.target.files?.[0] || null)}
              />
            </div>
          </div>
        </div>

        <div className="seo-card">
          <div className="seo-card-title">Informations du client</div>
          <div className="seo-grid">
            <div className="seo-group">
              <label className="seo-label">Nom du client / Entreprise</label>
              <input className="seo-input" value={buyerName} onChange={(e) => setBuyerName(e.target.value)} placeholder="Ex : Agence Créative SAS" />
            </div>
            <div className="seo-group">
              <label className="seo-label">SIRET (optionnel)</label>
              <input className="seo-input" value={buyerSiret} onChange={(e) => setBuyerSiret(e.target.value)} />
            </div>
            <div className="seo-group full">
              <label className="seo-label">Adresse</label>
              <input className="seo-input" value={buyerAddress} onChange={(e) => setBuyerAddress(e.target.value)} placeholder="22 rue ..." />
            </div>
            <div className="seo-group">
              <label className="seo-label">Code postal</label>
              <input className="seo-input" value={buyerPostalCode} onChange={(e) => setBuyerPostalCode(e.target.value)} />
            </div>
            <div className="seo-group">
              <label className="seo-label">Ville</label>
              <input className="seo-input" value={buyerCity} onChange={(e) => setBuyerCity(e.target.value)} />
            </div>
            <div className="seo-group">
              <label className="seo-label">Pays</label>
              <input className="seo-input" value={buyerCountry} onChange={(e) => setBuyerCountry(e.target.value)} />
            </div>
          </div>
        </div>

        <div className="seo-card">
          <div className="seo-card-title">Détails du devis</div>
          <div className="seo-grid">
            <div className="seo-group">
              <label className="seo-label">Numéro de devis</label>
              <input className="seo-input" value={quoteNumber} onChange={(e) => setQuoteNumber(e.target.value)} placeholder="D202602-001" />
            </div>
            <div className="seo-group">
              <label className="seo-label">Date du devis</label>
              <input type="date" className="seo-input" value={dateIssue} onChange={(e) => setDateIssue(e.target.value)} />
            </div>
            <div className="seo-group">
              <label className="seo-label">Validité</label>
              <select className="seo-select" value={String(validityDays)} onChange={(e) => setValidityDays(Number(e.target.value) || 30)}>
                <option value="15">15 jours</option>
                <option value="30">30 jours</option>
                <option value="45">45 jours</option>
                <option value="60">60 jours</option>
                <option value="90">90 jours</option>
              </select>
            </div>
            <div className="seo-group">
              <label className="seo-label">Titre du devis</label>
              <input className="seo-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex : Création site vitrine" />
            </div>
          </div>
        </div>

        <div className="seo-card">
          <div className="seo-card-title">Prestations</div>
          <table className="seo-table">
            <thead>
              <tr>
                <th>Description</th>
                <th>Qté</th>
                <th>Prix unit. HT</th>
                <th>TVA %</th>
                <th style={{ textAlign: 'center' }} />
              </tr>
            </thead>
            <tbody>
              {lines.map((l) => (
                <tr key={l.id}>
                  <td>
                    <input className="seo-input" value={l.label} onChange={(e) => updateLine(l.id, { label: e.target.value })} placeholder="Ex : Développement frontend" />
                    <div style={{ marginTop: 6 }}>
                      <input className="seo-input" value={l.description} onChange={(e) => updateLine(l.id, { description: e.target.value })} placeholder="Détails (optionnel)" />
                    </div>
                  </td>
                  <td>
                    <input className="seo-input" type="number" min={1} value={String(l.qty)} onChange={(e) => updateLine(l.id, { qty: Number(e.target.value) || 0 })} />
                  </td>
                  <td>
                    <input className="seo-input" type="number" step={0.01} value={String(l.unitPriceHt)} onChange={(e) => updateLine(l.id, { unitPriceHt: Number(e.target.value) || 0 })} />
                  </td>
                  <td>
                    <select className="seo-select" value={String(l.vatRate)} onChange={(e) => updateLine(l.id, { vatRate: Number(e.target.value) || 0 })}>
                      <option value="0">0%</option>
                      <option value="5.5">5,5%</option>
                      <option value="10">10%</option>
                      <option value="20">20%</option>
                    </select>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button className="seo-btn-remove" type="button" onClick={() => removeLine(l.id)} title="Supprimer">×</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button className="seo-btn-add" type="button" onClick={addLine}>+ Ajouter une prestation</button>

          <div className="seo-totals">
            <div className="seo-totals-box">
              <div className="seo-total-row"><span>Sous-total HT</span><span>{formatMoney(totals.totalHt)}</span></div>
              <div className="seo-total-row"><span>TVA</span><span>{formatMoney(totals.totalTva)}</span></div>
              <div className="seo-total-row final"><span className="l">Total TTC</span><span className="v">{formatMoney(totals.totalTtc)}</span></div>
            </div>
          </div>
        </div>

        <div className="seo-card">
          <div className="seo-card-title">Notes (optionnel)</div>
          <textarea className="seo-textarea" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Conditions, acompte, délais…" />
        </div>

        <div className="seo-generate">
          <button className="seo-btn-generate" type="button" onClick={generatePdf}>Générer mon devis en PDF</button>
          <p className="seo-note">Gratuit, sans inscription.</p>
        </div>
      </div>

      <div
        className={showEmailModal ? 'seo-modal-overlay active' : 'seo-modal-overlay'}
        onClick={(e) => {
          if (e.target === e.currentTarget) setShowEmailModal(false)
        }}
      >
        <div className="seo-modal">
          <h3>Votre devis est prêt !</h3>
          <p>Créez un compte gratuit pour envoyer vos devis par email, les faire signer et les retrouver à tout moment.</p>
          <button type="button" style={{ width: '100%', padding: '14px', background: '#0a0a0a', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 900, fontSize: 15, cursor: 'pointer', marginBottom: 10 }} onClick={goSignup}>Créer un compte gratuit</button>
          <button className="seo-modal-skip" type="button" onClick={() => setShowEmailModal(false)}>
            Non merci, juste télécharger
          </button>
        </div>
      </div>
    </div>
  )
}
