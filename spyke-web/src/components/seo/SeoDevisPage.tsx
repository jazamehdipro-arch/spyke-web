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

// ---------------------------------------------------------------------------
// DevisPreview — mini live document preview
// ---------------------------------------------------------------------------
type DevisPreviewProps = {
  sellerName: string
  buyerName: string
  quoteNumber: string
  dateIssue: string
  lines: DevisLine[]
  totals: { totalHt: number; totalTva: number; totalTtc: number }
  title: string
}

function DevisPreview({ sellerName, buyerName, quoteNumber, dateIssue, lines, totals, title }: DevisPreviewProps) {
  const ph = '#d1d5db'
  const displayLines = lines.slice(0, 4)

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', fontSize: 10, lineHeight: 1.4, border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden', background: '#fff' }}>
      {/* Dark header */}
      <div style={{ background: '#0f172a', padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: '#facc15', fontWeight: 800, fontSize: 13, letterSpacing: 1 }}>DEVIS</span>
          <span style={{ color: '#94a3b8', fontSize: 9 }}>
            {quoteNumber || <span style={{ color: ph }}>N°…</span>}
          </span>
        </div>
        <span style={{ color: sellerName ? '#e2e8f0' : ph, fontSize: 9, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {sellerName || 'Votre nom'}
        </span>
      </div>

      {/* Body */}
      <div style={{ padding: '10px 12px', background: '#fff' }}>
        {/* Date + title */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, gap: 8 }}>
          <span style={{ color: dateIssue ? '#374151' : ph, fontSize: 9 }}>
            {dateIssue || 'Date…'}
          </span>
          {title && <span style={{ color: '#374151', fontSize: 9, fontStyle: 'italic', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</span>}
        </div>

        {/* Adressé à */}
        <div style={{ marginBottom: 10, padding: '6px 8px', background: '#f8fafc', borderRadius: 4, borderLeft: '2px solid #facc15' }}>
          <div style={{ fontSize: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: '#94a3b8', marginBottom: 3 }}>Adressé à</div>
          <div style={{ color: buyerName ? '#111827' : ph, fontWeight: buyerName ? 600 : 400 }}>
            {buyerName || 'Nom du client'}
          </div>
        </div>

        {/* Lines table */}
        <div style={{ marginBottom: 10 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 9 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                <th style={{ textAlign: 'left', padding: '3px 4px', color: '#6b7280', fontWeight: 600 }}>Description</th>
                <th style={{ textAlign: 'right', padding: '3px 4px', color: '#6b7280', fontWeight: 600, whiteSpace: 'nowrap' }}>Qté</th>
                <th style={{ textAlign: 'right', padding: '3px 4px', color: '#6b7280', fontWeight: 600, whiteSpace: 'nowrap' }}>PU HT</th>
                <th style={{ textAlign: 'right', padding: '3px 4px', color: '#6b7280', fontWeight: 600, whiteSpace: 'nowrap' }}>Total HT</th>
              </tr>
            </thead>
            <tbody>
              {displayLines.map((l) => {
                const lineHt = (l.qty || 0) * (l.unitPriceHt || 0)
                return (
                  <tr key={l.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '3px 4px', color: l.label ? '#111827' : ph, maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {l.label || 'Description'}
                    </td>
                    <td style={{ padding: '3px 4px', textAlign: 'right', color: '#374151' }}>{l.qty}</td>
                    <td style={{ padding: '3px 4px', textAlign: 'right', color: '#374151', whiteSpace: 'nowrap' }}>{formatMoney(l.unitPriceHt)}</td>
                    <td style={{ padding: '3px 4px', textAlign: 'right', color: '#374151', whiteSpace: 'nowrap' }}>{formatMoney(lineHt)}</td>
                  </tr>
                )
              })}
              {lines.length > 4 && (
                <tr>
                  <td colSpan={4} style={{ padding: '3px 4px', color: '#94a3b8', fontSize: 8, fontStyle: 'italic' }}>
                    + {lines.length - 4} autre{lines.length - 4 > 1 ? 's' : ''} ligne{lines.length - 4 > 1 ? 's' : ''}…
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2, marginBottom: 8 }}>
          <div style={{ display: 'flex', gap: 16, fontSize: 9, color: '#6b7280' }}>
            <span>Sous-total HT</span>
            <span style={{ minWidth: 60, textAlign: 'right' }}>{formatMoney(totals.totalHt)}</span>
          </div>
          <div style={{ display: 'flex', gap: 16, fontSize: 9, color: '#6b7280' }}>
            <span>TVA</span>
            <span style={{ minWidth: 60, textAlign: 'right' }}>{formatMoney(totals.totalTva)}</span>
          </div>
          <div style={{ display: 'flex', gap: 16, fontSize: 10, fontWeight: 700, color: '#0f172a', borderTop: '1px solid #e5e7eb', paddingTop: 4, marginTop: 2 }}>
            <span>Total TTC</span>
            <span style={{ minWidth: 60, textAlign: 'right' }}>{formatMoney(totals.totalTtc)}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ background: '#f8fafc', borderTop: '1px solid #e5e7eb', padding: '5px 12px', textAlign: 'center', fontSize: 8, color: '#94a3b8' }}>
        Généré avec Spyke · spykeapp.fr
      </div>
    </div>
  )
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

  const [showPreviewDrawer, setShowPreviewDrawer] = useState(false)

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
      {pdfPreviewUrl ? (
        <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',zIndex:500,display:'flex',alignItems:'center',justifyContent:'center',padding:16 }}
          onClick={(e) => { if(e.target!==e.currentTarget)return; try{URL.revokeObjectURL(pdfPreviewUrl)}catch{} setPdfPreviewUrl(''); setLockedHint(null) }}>
          <div style={{ background:'#fff',borderRadius:16,width:'min(1100px,96vw)',height:'min(86vh,900px)',overflow:'hidden',boxShadow:'0 30px 90px rgba(0,0,0,0.4)',display:'flex',flexDirection:'column' }}>
            <div style={{ padding:'12px 16px',borderBottom:'1px solid #f0f0f0',display:'flex',alignItems:'center',justifyContent:'space-between',gap:12 }}>
              <span style={{ fontSize:14,fontWeight:700,color:'#111',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{pdfPreviewFilenameRef.current||'Devis.pdf'}</span>
              <button className="btn btn-secondary" type="button" onClick={() => { try{URL.revokeObjectURL(pdfPreviewUrl)}catch{} setPdfPreviewUrl(''); setLockedHint(null) }}>Fermer</button>
            </div>
            <div style={{ flex:1,minHeight:0,background:'#f8fafc' }}><PdfInlineViewer url={pdfPreviewUrl} /></div>
            <div style={{ padding:12,borderTop:'1px solid #f0f0f0',background:'#fff',display:'flex',flexDirection:'column',gap:10 }}>
              {lockedHint && <div style={{ padding:'10px 14px',borderRadius:10,background:'rgba(250,204,21,0.15)',border:'1px solid rgba(250,204,21,0.3)',display:'flex',alignItems:'center',justifyContent:'space-between',gap:10,flexWrap:'wrap' }}>
                <span style={{ fontSize:13,fontWeight:700 }}>{lockedHint}</span>
                <div style={{ display:'flex',gap:8 }}><button className="btn btn-secondary" type="button" onClick={() => setLockedHint(null)}>Fermer</button><button className="btn btn-primary" type="button" onClick={goSignup}>Connexion</button></div>
              </div>}
              <div style={{ padding:'10px 14px',borderRadius:10,background:'#fff7ed',border:'1px solid #fed7aa',display:'flex',alignItems:'center',justifyContent:'space-between',gap:10,flexWrap:'wrap' }}>
                <span style={{ fontSize:13,color:'#92400e',fontWeight:600 }}>⚠️ PDF avec filigrane — créez un compte pour le supprimer.</span>
                <button className="btn btn-primary" type="button" onClick={goSignup} style={{ fontSize:12,flexShrink:0 }}>Supprimer le filigrane →</button>
              </div>
              <div style={{ display:'flex',justifyContent:'space-between',gap:10,flexWrap:'wrap' }}>
                <div style={{ display:'flex',gap:8 }}>
                  <button className="btn btn-secondary" type="button" style={{ opacity:0.5,cursor:'not-allowed' }} onClick={() => setLockedHint('Créez un compte gratuit pour envoyer par email et signer.')}>Envoyer 🔒</button>
                  <button className="btn btn-secondary" type="button" style={{ opacity:0.5,cursor:'not-allowed' }} onClick={() => setLockedHint('Créez un compte gratuit pour envoyer par email et signer.')}>Signer 🔒</button>
                </div>
                <div style={{ display:'flex',gap:8,alignItems:'center' }}>
                  <a className="btn btn-secondary" href={pdfPreviewUrl} download={pdfPreviewFilenameRef.current||'devis.pdf'}>Télécharger</a>
                  <button className="btn btn-primary" type="button" onClick={goSignup}>Créer un compte gratuit</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Mobile preview drawer — zIndex 400, above form, below PDF preview (500) */}
      {showPreviewDrawer && (
        <>
          {/* Backdrop */}
          <div
            style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.45)',zIndex:400 }}
            onClick={() => setShowPreviewDrawer(false)}
          />
          {/* Panel */}
          <div style={{ position:'fixed',bottom:0,left:0,right:0,zIndex:400,background:'#fff',borderRadius:'20px 20px 0 0',maxHeight:'80vh',overflowY:'auto',padding:'20px 16px 32px',boxShadow:'0 -8px 40px rgba(0,0,0,0.18)' }}>
            {/* Header row */}
            <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16 }}>
              <span style={{ fontWeight:800,fontSize:16,color:'#0f172a' }}>Aperçu du document</span>
              <button
                type="button"
                onClick={() => setShowPreviewDrawer(false)}
                style={{ background:'#f1f5f9',border:'none',borderRadius:8,padding:'6px 12px',fontWeight:700,fontSize:13,cursor:'pointer',color:'#0a0a0a' }}
              >
                ✕ Fermer
              </button>
            </div>
            <DevisPreview
              sellerName={sellerName}
              buyerName={buyerName}
              quoteNumber={quoteNumber}
              dateIssue={dateIssue}
              lines={lines}
              totals={totals}
              title={title}
            />
            <p style={{ marginTop:12,textAlign:'center',fontSize:11,color:'#94a3b8' }}>
              Aperçu simplifié · Cliquez sur Générer pour le vrai PDF
            </p>
          </div>
        </>
      )}

      <nav className="seo-navbar">
        <a className="seo-nav-logo" href="/"><div className="seo-nav-logo-icon"><svg viewBox="0 0 24 24"><path d="M13 3L4 14h7l-2 7 9-11h-7l2-7z"/></svg></div><span className="seo-nav-logo-text">Spyke</span></a>
        <div className="seo-nav-tools">
          <a className="seo-nav-tool active" href="/devis-freelance">Devis</a>
          <a className="seo-nav-tool" href="/facture-auto-entrepreneur">Facture</a>
          <a className="seo-nav-tool" href="/contrat-freelance">Contrat</a>
        </div>
        <a className="seo-nav-cta" href="/connexion.html">Essayer gratuitement</a>
      </nav>

      <section className="seo-hero">
        <div className="seo-hero-badge"><span className="seo-hero-badge-dot"/>Outil 100 % gratuit</div>
        <h1>Créez votre <span>devis freelance</span><br/>en 2 minutes chrono</h1>
        <p className="seo-hero-sub">Formulaire simple, PDF professionnel prêt à envoyer. <b>Gratuit, sans inscription.</b></p>
        <div className="seo-hero-trust">
          <span className="seo-hero-trust-item"><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>2 450+ docs générés</span>
          <span className="seo-hero-trust-item"><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>Sans inscription</span>
          <span className="seo-hero-trust-item"><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>PDF professionnel</span>
          <span className="seo-hero-trust-item"><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>HT / TVA / TTC</span>
        </div>
      </section>

      <div className="seo-ai-banner">
        <div className="seo-ai-icon"><svg viewBox="0 0 24 24"><path d="M13 3L4 14h7l-2 7 9-11h-7l2-7z"/></svg><div className="seo-ai-lock"><svg viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></div></div>
        <div style={{ flex:1 }}><div className="seo-ai-title">Remplissage IA depuis un brief client</div><div className="seo-ai-sub">Importez un PDF ou une image — l&apos;IA pré-remplit votre devis automatiquement</div></div>
        <button className="seo-ai-btn" type="button" onClick={goSignup}>Fonctionnalité Pro</button>
      </div>

      <div className="seo-workspace">
        <div className="seo-form-col">

          <div className="seo-section">
            <div className="seo-section-header"><div className="seo-section-num">1</div><div className="seo-section-title">Vos informations</div></div>
            <div className="seo-section-body">
              <div className="seo-grid">
                <div className="seo-group"><label className="seo-label">Nom / Raison sociale *</label><input className="seo-input" value={sellerName} onChange={(e)=>setSellerName(e.target.value)} placeholder="Jean Dupont"/></div>
                <div className="seo-group"><label className="seo-label">SIRET</label><input className="seo-input" value={sellerSiret} onChange={(e)=>setSellerSiret(e.target.value)} placeholder="123 456 789 00012"/></div>
                <div className="seo-group full"><label className="seo-label">Adresse</label><input className="seo-input" value={sellerAddress} onChange={(e)=>setSellerAddress(e.target.value)} placeholder="15 rue de la Paix"/></div>
                <div className="seo-group"><label className="seo-label">Code postal</label><input className="seo-input" value={sellerPostalCode} onChange={(e)=>setSellerPostalCode(e.target.value)} placeholder="75002"/></div>
                <div className="seo-group"><label className="seo-label">Ville</label><input className="seo-input" value={sellerCity} onChange={(e)=>setSellerCity(e.target.value)} placeholder="Paris"/></div>
                <div className="seo-group"><label className="seo-label">N° TVA (optionnel)</label><input className="seo-input" value={sellerVatNumber} onChange={(e)=>setSellerVatNumber(e.target.value)} placeholder="FR…"/></div>
                <div className="seo-group"><label className="seo-label">IBAN (optionnel)</label><input className="seo-input" value={sellerIban} onChange={(e)=>setSellerIban(e.target.value)}/></div>
                <div className="seo-group"><label className="seo-label">BIC (optionnel)</label><input className="seo-input" value={sellerBic} onChange={(e)=>setSellerBic(e.target.value)}/></div>
                <div className="seo-group full"><label className="seo-label">Logo (optionnel)</label><input type="file" accept="image/*" className="seo-input" onChange={(e)=>onPickLogo(e.target.files?.[0]||null)}/></div>
              </div>
            </div>
          </div>

          <div className="seo-section">
            <div className="seo-section-header"><div className="seo-section-num">2</div><div className="seo-section-title">Client</div></div>
            <div className="seo-section-body">
              <div className="seo-grid">
                <div className="seo-group"><label className="seo-label">Nom / Entreprise *</label><input className="seo-input" value={buyerName} onChange={(e)=>setBuyerName(e.target.value)} placeholder="Agence Créative SAS"/></div>
                <div className="seo-group"><label className="seo-label">SIRET (optionnel)</label><input className="seo-input" value={buyerSiret} onChange={(e)=>setBuyerSiret(e.target.value)}/></div>
                <div className="seo-group full"><label className="seo-label">Adresse</label><input className="seo-input" value={buyerAddress} onChange={(e)=>setBuyerAddress(e.target.value)} placeholder="22 rue …"/></div>
                <div className="seo-group"><label className="seo-label">Code postal</label><input className="seo-input" value={buyerPostalCode} onChange={(e)=>setBuyerPostalCode(e.target.value)}/></div>
                <div className="seo-group"><label className="seo-label">Ville</label><input className="seo-input" value={buyerCity} onChange={(e)=>setBuyerCity(e.target.value)}/></div>
              </div>
            </div>
          </div>

          <div className="seo-section">
            <div className="seo-section-header"><div className="seo-section-num">3</div><div className="seo-section-title">Détails</div></div>
            <div className="seo-section-body">
              <div className="seo-grid">
                <div className="seo-group"><label className="seo-label">Numéro de devis *</label><input className="seo-input" value={quoteNumber} onChange={(e)=>setQuoteNumber(e.target.value)} placeholder="D202602-001"/></div>
                <div className="seo-group"><label className="seo-label">Date</label><input type="date" className="seo-input" value={dateIssue} onChange={(e)=>setDateIssue(e.target.value)}/></div>
                <div className="seo-group"><label className="seo-label">Validité</label><select className="seo-select" value={String(validityDays)} onChange={(e)=>setValidityDays(Number(e.target.value)||30)}><option value="15">15 jours</option><option value="30">30 jours</option><option value="45">45 jours</option><option value="60">60 jours</option><option value="90">90 jours</option></select></div>
                <div className="seo-group"><label className="seo-label">Titre du devis</label><input className="seo-input" value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="Création site vitrine"/></div>
              </div>
            </div>
          </div>

          <div className="seo-section">
            <div className="seo-section-header"><div className="seo-section-num">4</div><div className="seo-section-title">Prestations</div></div>
            <div className="seo-section-body">
              <div className="seo-table-wrap">
                <table className="seo-table">
                  <thead><tr><th>Description</th><th style={{width:60}}>Qté</th><th style={{width:110}}>Prix HT</th><th style={{width:80}}>TVA</th><th/></tr></thead>
                  <tbody>
                    {lines.map((l)=>(
                      <tr key={l.id}>
                        <td><input className="seo-input" value={l.label} onChange={(e)=>updateLine(l.id,{label:e.target.value})} placeholder="Développement frontend"/><input className="seo-input" style={{marginTop:6,fontSize:12}} value={l.description} onChange={(e)=>updateLine(l.id,{description:e.target.value})} placeholder="Détails (optionnel)"/></td>
                        <td><input className="seo-input" type="number" min={1} value={String(l.qty)} onChange={(e)=>updateLine(l.id,{qty:Number(e.target.value)||0})}/></td>
                        <td><input className="seo-input" type="number" step={0.01} value={String(l.unitPriceHt)} onChange={(e)=>updateLine(l.id,{unitPriceHt:Number(e.target.value)||0})}/></td>
                        <td><select className="seo-select" value={String(l.vatRate)} onChange={(e)=>updateLine(l.id,{vatRate:Number(e.target.value)||0})}><option value="0">0%</option><option value="5.5">5,5%</option><option value="10">10%</option><option value="20">20%</option></select></td>
                        <td><button className="seo-btn-remove" type="button" onClick={()=>removeLine(l.id)}>×</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button className="seo-btn-add" type="button" onClick={addLine}>+ Ajouter une prestation</button>
              <div className="seo-totals"><div className="seo-totals-box">
                <div className="seo-total-row"><span>Sous-total HT</span><span>{formatMoney(totals.totalHt)}</span></div>
                <div className="seo-total-row"><span>TVA</span><span>{formatMoney(totals.totalTva)}</span></div>
                <div className="seo-total-row final"><span className="l">Total TTC</span><span className="v">{formatMoney(totals.totalTtc)}</span></div>
              </div></div>
            </div>
          </div>

          <div className="seo-section">
            <div className="seo-section-header"><div className="seo-section-num">5</div><div className="seo-section-title">Notes</div><span className="seo-section-subtitle">Optionnel</span></div>
            <div className="seo-section-body"><textarea className="seo-textarea" style={{width:'100%'}} value={notes} onChange={(e)=>setNotes(e.target.value)} placeholder="Conditions de paiement, acompte, délais…"/></div>
          </div>

        </div>

        <div className="seo-summary-col">
          <div className="seo-summary">
            <div style={{ padding:'14px 16px', borderBottom:'1px solid #f3f4f6' }}>
              <div style={{ fontSize:10, fontWeight:800, textTransform:'uppercase', letterSpacing:1, color:'#94a3b8', marginBottom:10 }}>Aperçu en direct</div>
              <DevisPreview sellerName={sellerName} buyerName={buyerName} quoteNumber={quoteNumber} dateIssue={dateIssue} lines={lines} totals={totals} title={title} />
            </div>
            <div className="seo-summary-actions">
              <button className="seo-btn-generate" type="button" onClick={generatePdf}>Générer mon devis PDF ↓</button>
              <p className="seo-summary-note"><span>Gratuit</span><span className="seo-summary-note-dot"/><span>Sans inscription</span><span className="seo-summary-note-dot"/><span>PDF pro</span></p>
            </div>
            {showSoftSignupNudge && <div className="seo-summary-nudge">
              <div className="seo-summary-nudge-title">Sauvegarder vos devis ?</div>
              <div className="seo-summary-nudge-text">Créez un compte gratuit pour centraliser vos clients, retrouver vos devis et les convertir en facture.</div>
              <button className="seo-summary-nudge-btn" type="button" onClick={goSignup}>Créer un compte gratuit →</button>
            </div>}
          </div>
          <div className="seo-mini-tools">
            <div className="seo-mini-tools-title">Autres outils gratuits</div>
            <a href="/devis-freelance" className="seo-mini-tool active"><span className="seo-mini-tool-dot" style={{background:'#facc15'}}/>Devis freelance</a>
            <a href="/facture-auto-entrepreneur" className="seo-mini-tool"><span className="seo-mini-tool-dot" style={{background:'#3b82f6'}}/>Facture auto-entrepreneur</a>
            <a href="/contrat-freelance" className="seo-mini-tool"><span className="seo-mini-tool-dot" style={{background:'#f97316'}}/>Contrat freelance</a>
          </div>
        </div>
      </div>

      <div className="seo-mobile-bar">
        <div className="seo-mobile-bar-info"><div className="seo-mobile-bar-label">Total TTC</div><div className="seo-mobile-bar-amount">{formatMoney(totals.totalTtc)}</div></div>
        <div style={{ display:'flex', gap:8 }}>
          <button
            type="button"
            onClick={() => setShowPreviewDrawer(true)}
            style={{ padding:'12px 14px', background:'#f1f5f9', border:'none', borderRadius:10, fontWeight:700, fontSize:13, cursor:'pointer', color:'#0a0a0a', whiteSpace:'nowrap' }}
          >
            👁 Aperçu
          </button>
          <button className="seo-mobile-bar-btn" type="button" onClick={generatePdf}>Générer le PDF ↓</button>
        </div>
      </div>

      <div className={showEmailModal?'seo-modal-overlay active':'seo-modal-overlay'} onClick={(e)=>{ if(e.target===e.currentTarget) setShowEmailModal(false) }}>
        <div className="seo-modal">
          <h3>Votre devis est prêt !</h3>
          <p>Créez un compte gratuit pour envoyer par email, faire signer et retrouver vos devis.</p>
          <button type="button" style={{width:'100%',padding:'14px',background:'#0f172a',color:'#fff',border:'none',borderRadius:12,fontWeight:800,fontSize:15,cursor:'pointer',marginBottom:10}} onClick={goSignup}>Créer un compte gratuit</button>
          <button className="seo-modal-skip" type="button" onClick={()=>setShowEmailModal(false)}>Non merci, juste télécharger</button>
        </div>
      </div>
    </div>
  )
}
