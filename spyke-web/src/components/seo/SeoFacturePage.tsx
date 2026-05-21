'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import PdfInlineViewer from '@/components/PdfInlineViewer'

type Line = { id: string; description: string; qty: number; unitPrice: number }

function formatMoney(amount: number) {
  return (amount || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'
}

function computeTotals(lines: Line[]) {
  let totalHt = 0
  for (const l of lines) totalHt += (l.qty || 0) * (l.unitPrice || 0)
  const totalTva = 0
  return { totalHt, totalTva, totalTtc: totalHt + totalTva }
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

// ─── FacturePreview ───────────────────────────────────────────────────────────

type PreviewLine = { id: string; description: string; qty: number; unitPrice: number }
type PreviewTotals = { totalHt: number; totalTva: number; totalTtc: number }

function FacturePreview({
  sellerName,
  buyerName,
  invoiceNumber,
  dateIssue,
  dueDate,
  lines,
  totals,
}: {
  sellerName: string
  buyerName: string
  invoiceNumber: string
  dateIssue: string
  dueDate: string
  lines: PreviewLine[]
  totals: PreviewTotals
}) {
  const ph = (val: string | number | undefined | null, fallback: string) => {
    const s = String(val ?? '').trim()
    return s ? (
      <span>{s}</span>
    ) : (
      <span style={{ color: '#d1d5db', fontStyle: 'italic' }}>{fallback}</span>
    )
  }

  const displayLines = lines.length > 0 ? lines.slice(0, 4) : []

  return (
    <div
      style={{
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: 10,
        lineHeight: 1.4,
        color: '#1e293b',
        background: '#fff',
        border: '1px solid #e2e8f0',
        borderRadius: 8,
        overflow: 'hidden',
      }}
    >
      {/* Dark header */}
      <div
        style={{
          background: '#0f172a',
          padding: '10px 12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        }}
      >
        <div>
          <div style={{ color: '#facc15', fontWeight: 800, fontSize: 13, letterSpacing: 1 }}>FACTURE</div>
          <div style={{ color: '#94a3b8', fontSize: 9, marginTop: 2 }}>
            {ph(invoiceNumber, 'N° de facture')}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ color: '#f8fafc', fontWeight: 700, fontSize: 10 }}>
            {ph(sellerName, 'Votre nom')}
          </div>
          {dateIssue && (
            <div style={{ color: '#94a3b8', fontSize: 8, marginTop: 2 }}>
              Émis le {dateIssue}
            </div>
          )}
          {dueDate && (
            <div style={{ color: '#94a3b8', fontSize: 8 }}>
              Échéance {dueDate}
            </div>
          )}
        </div>
      </div>

      {/* Adressé à */}
      <div style={{ padding: '8px 12px', borderBottom: '1px solid #f1f5f9' }}>
        <div style={{ fontSize: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, color: '#94a3b8', marginBottom: 3 }}>
          Adressé à
        </div>
        <div style={{ fontWeight: 600, fontSize: 10 }}>
          {ph(buyerName, 'Nom du client')}
        </div>
      </div>

      {/* Lines table */}
      <div style={{ padding: '8px 12px', borderBottom: '1px solid #f1f5f9' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 9 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
              <th style={{ textAlign: 'left', padding: '3px 0', fontWeight: 700, color: '#64748b', fontSize: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Description</th>
              <th style={{ textAlign: 'center', padding: '3px 4px', fontWeight: 700, color: '#64748b', fontSize: 8, textTransform: 'uppercase', letterSpacing: 0.5, width: 28 }}>Qté</th>
              <th style={{ textAlign: 'right', padding: '3px 0', fontWeight: 700, color: '#64748b', fontSize: 8, textTransform: 'uppercase', letterSpacing: 0.5, width: 52 }}>PU HT</th>
              <th style={{ textAlign: 'right', padding: '3px 0', fontWeight: 700, color: '#64748b', fontSize: 8, textTransform: 'uppercase', letterSpacing: 0.5, width: 52 }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {displayLines.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ padding: '6px 0', color: '#d1d5db', fontStyle: 'italic', fontSize: 9 }}>
                  Aucune ligne
                </td>
              </tr>
            ) : (
              displayLines.map((l) => {
                const lineTotal = (l.qty || 0) * (l.unitPrice || 0)
                return (
                  <tr key={l.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td style={{ padding: '4px 0', color: l.description.trim() ? '#1e293b' : '#d1d5db', fontStyle: l.description.trim() ? 'normal' : 'italic' }}>
                      {l.description.trim() || 'Description…'}
                    </td>
                    <td style={{ textAlign: 'center', padding: '4px 4px', color: '#475569' }}>{l.qty}</td>
                    <td style={{ textAlign: 'right', padding: '4px 0', color: '#475569' }}>
                      {(l.unitPrice || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td style={{ textAlign: 'right', padding: '4px 0', fontWeight: 600, color: '#1e293b' }}>
                      {lineTotal.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2, borderBottom: '1px solid #f1f5f9' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', width: 140, fontSize: 9, color: '#64748b' }}>
          <span>Sous-total HT</span>
          <span>{formatMoney(totals.totalHt)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', width: 140, fontSize: 9, color: '#64748b' }}>
          <span>TVA</span>
          <span>{formatMoney(totals.totalTva)}</span>
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            width: 140,
            fontSize: 10,
            fontWeight: 800,
            color: '#0f172a',
            marginTop: 3,
            paddingTop: 4,
            borderTop: '1.5px solid #0f172a',
          }}
        >
          <span>Total TTC</span>
          <span>{formatMoney(totals.totalTtc)}</span>
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding: '5px 12px', background: '#f8fafc' }}>
        <div style={{ fontSize: 7, color: '#94a3b8', textAlign: 'center' }}>
          Document généré via Spyke · spyke.fr
        </div>
      </div>
    </div>
  )
}

// ─── SeoFacturePage ───────────────────────────────────────────────────────────

export default function SeoFacturePage() {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), [])
  const pdfCountKey = 'spyke_seo_facture_pdf_count_v1'

  const [pdfCount, setPdfCount] = useState(0)

  const [sellerName, setSellerName] = useState('')
  const [sellerSiret, setSellerSiret] = useState('')
  const [sellerAddress, setSellerAddress] = useState('')
  const [sellerPostalCode, setSellerPostalCode] = useState('')
  const [sellerCity, setSellerCity] = useState('')
  const [sellerCountry, setSellerCountry] = useState('France')
  const [sellerIban, setSellerIban] = useState('')
  const [sellerBic, setSellerBic] = useState('')
  const [sellerBankName, setSellerBankName] = useState('')
  const [sellerBankAccount, setSellerBankAccount] = useState('')

  const [logoDataUrl, setLogoDataUrl] = useState<string>('')

  const [buyerName, setBuyerName] = useState('')
  const [buyerAddress, setBuyerAddress] = useState('')
  const [buyerPostalCode, setBuyerPostalCode] = useState('')
  const [buyerCity, setBuyerCity] = useState('')
  const [buyerCountry, setBuyerCountry] = useState('France')

  const [invoiceNumber, setInvoiceNumber] = useState('F-2026-001')
  const [dateIssue, setDateIssue] = useState(today)
  const [dueDate, setDueDate] = useState('')

  const [lines, setLines] = useState<Line[]>(() => [{ id: '0', description: '', qty: 1, unitPrice: 0 }])
  const totals = useMemo(() => computeTotals(lines), [lines])

  const [showEmailModal, setShowEmailModal] = useState(false)
  const [email, setEmail] = useState('')

  const [showPreviewDrawer, setShowPreviewDrawer] = useState(false)

  useEffect(() => {
    const d = new Date()
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    setInvoiceNumber(`F${yyyy}${mm}-001`)

    setPdfCount(readCount(pdfCountKey))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function updateLine(id: string, patch: Partial<Line>) {
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)))
  }

  function addLine() {
    setLines((prev) => [...prev, { id: String(Date.now()), description: '', qty: 1, unitPrice: 0 }])
  }

  function removeLine(id: string) {
    setLines((prev) => (prev.length <= 1 ? prev : prev.filter((l) => l.id !== id)))
  }

  function persistSeoDraft() {
    try {
      const key = 'spyke_seo_invoice_draft_v1'
      const sellerAddressLines = [sellerAddress, [sellerPostalCode, sellerCity].filter(Boolean).join(' '), sellerCountry]
        .filter((x) => String(x || '').trim())
      const buyerAddressLines = [buyerAddress, [buyerPostalCode, buyerCity].filter(Boolean).join(' '), buyerCountry]
        .filter((x) => String(x || '').trim())

      const totals = computeTotals(lines)

      const draft = {
        createdAt: new Date().toISOString(),
        kind: 'facture',
        invoiceNumber,
        dateIssue,
        dueDate,
        logoUrl: logoDataUrl || '',
        seller: {
          name: sellerName,
          addressLines: sellerAddressLines,
          siret: sellerSiret,
          iban: sellerIban,
          bic: sellerBic,
        },
        buyer: {
          name: buyerName,
          addressLines: buyerAddressLines,
        },
        lines,
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
      if (!invoiceNumber.trim()) throw new Error('Renseigne un numéro de facture')

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
        invoiceNumber,
        dateIssue,
        dueDate,
        logoUrl: logoDataUrl || '',
        seller: {
          name: sellerName,
          addressLines: sellerAddressLines,
          siret: sellerSiret,
          iban: sellerIban,
          bic: sellerBic,
          bankName: sellerBankName,
          bankAccount: sellerBankAccount,
        },
        buyer: {
          name: buyerName,
          addressLines: buyerAddressLines,
        },
        lines,
        totals,
      }

      const res = await fetch('/api/public/facture-pdf', {
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
      pdfPreviewFilenameRef.current = `Facture-${invoiceNumber}.pdf`

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
                {pdfPreviewFilenameRef.current || 'Facture.pdf'}
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
                  <a className="btn btn-secondary" href={pdfPreviewUrl} download={pdfPreviewFilenameRef.current || 'facture.pdf'}>
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
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.45)',
            zIndex: 400,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowPreviewDrawer(false)
          }}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: '20px 20px 0 0',
              maxHeight: '80vh',
              overflow: 'auto',
              padding: '20px 16px 32px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a' }}>Aperçu du document</div>
              <button
                type="button"
                onClick={() => setShowPreviewDrawer(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#64748b', padding: '4px 8px' }}
              >
                ✕ Fermer
              </button>
            </div>
            <FacturePreview
              sellerName={sellerName}
              buyerName={buyerName}
              invoiceNumber={invoiceNumber}
              dateIssue={dateIssue}
              dueDate={dueDate}
              lines={lines}
              totals={totals}
            />
            <div style={{ marginTop: 12, fontSize: 11, color: '#94a3b8', textAlign: 'center' }}>
              Aperçu simplifié · Cliquez sur Générer pour le vrai PDF
            </div>
          </div>
        </div>
      ) : null}


      <nav className="seo-navbar">
        <a className="seo-nav-logo" href="/"><div className="seo-nav-logo-icon"><svg viewBox="0 0 24 24"><path d="M13 3L4 14h7l-2 7 9-11h-7l2-7z"/></svg></div><span className="seo-nav-logo-text">Spyke</span></a>
        <div className="seo-nav-tools">
          <a className="seo-nav-tool" href="/devis-freelance">Devis</a>
          <a className="seo-nav-tool active" href="/facture-auto-entrepreneur">Facture</a>
          <a className="seo-nav-tool" href="/contrat-freelance">Contrat</a>
        </div>
        <a className="seo-nav-cta" href="/connexion.html">Connexion / Inscription</a>
      </nav>

      <section className="seo-hero">
        <div className="seo-hero-badge"><span className="seo-hero-badge-dot"/>Outil 100 % gratuit</div>
        <h1>Créez votre <span>facture</span><br/>en 2 minutes chrono</h1>
        <p className="seo-hero-sub">Formulaire simple, PDF professionnel prêt à envoyer. <b>Gratuit, sans inscription.</b></p>
        <div className="seo-hero-trust">
          <span className="seo-hero-trust-item"><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>2 450+ docs générés</span>
          <span className="seo-hero-trust-item"><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>Sans inscription</span>
          <span className="seo-hero-trust-item"><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>PDF professionnel</span>
          <span className="seo-hero-trust-item"><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>Mentions légales incluses</span>
        </div>
      </section>

      <div className="seo-ai-banner">
        <div className="seo-ai-icon"><svg viewBox="0 0 24 24"><path d="M13 3L4 14h7l-2 7 9-11h-7l2-7z"/></svg><div className="seo-ai-lock"><svg viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></div></div>
        <div style={{flex:1}}><div className="seo-ai-title">Remplissage IA depuis un brief client</div><div className="seo-ai-sub">Importez un PDF ou une image — l&apos;IA pré-remplit votre facture automatiquement</div></div>
        <button className="seo-ai-btn" type="button" onClick={goSignup}>Fonctionnalité Pro</button>
      </div>

      <div className="seo-workspace">
        <div className="seo-form-col">

          <div className="seo-section">
            <div className="seo-section-header"><div className="seo-section-num">1</div><div className="seo-section-title">Vos informations</div></div>
            <div className="seo-section-body">
              <div className="seo-grid">
                <div className="seo-group"><label className="seo-label">Nom / Raison sociale *</label><input className="seo-input" value={sellerName} onChange={(e)=>setSellerName(e.target.value)} placeholder="Jean Dupont"/></div>
                <div className="seo-group"><label className="seo-label">SIRET</label><input className="seo-input" value={sellerSiret} onChange={(e)=>setSellerSiret(e.target.value)}/></div>
                <div className="seo-group full"><label className="seo-label">Adresse</label><input className="seo-input" value={sellerAddress} onChange={(e)=>setSellerAddress(e.target.value)}/></div>
                <div className="seo-group"><label className="seo-label">Code postal</label><input className="seo-input" value={sellerPostalCode} onChange={(e)=>setSellerPostalCode(e.target.value)}/></div>
                <div className="seo-group"><label className="seo-label">Ville</label><input className="seo-input" value={sellerCity} onChange={(e)=>setSellerCity(e.target.value)}/></div>
                <div className="seo-group"><label className="seo-label">IBAN (optionnel)</label><input className="seo-input" value={sellerIban} onChange={(e)=>setSellerIban(e.target.value)}/></div>
                <div className="seo-group"><label className="seo-label">BIC (optionnel)</label><input className="seo-input" value={sellerBic} onChange={(e)=>setSellerBic(e.target.value)}/></div>
                <div className="seo-group"><label className="seo-label">Banque (optionnel)</label><input className="seo-input" value={sellerBankName} onChange={(e)=>setSellerBankName(e.target.value)}/></div>
                <div className="seo-group full"><label className="seo-label">Logo (optionnel)</label><input type="file" accept="image/*" className="seo-input" onChange={(e)=>onPickLogo(e.target.files?.[0]||null)}/></div>
              </div>
            </div>
          </div>

          <div className="seo-section">
            <div className="seo-section-header"><div className="seo-section-num">2</div><div className="seo-section-title">Client</div></div>
            <div className="seo-section-body">
              <div className="seo-grid">
                <div className="seo-group"><label className="seo-label">Nom / Entreprise *</label><input className="seo-input" value={buyerName} onChange={(e)=>setBuyerName(e.target.value)} placeholder="Agence Créative SAS"/></div>
                <div className="seo-group full"><label className="seo-label">Adresse</label><input className="seo-input" value={buyerAddress} onChange={(e)=>setBuyerAddress(e.target.value)}/></div>
                <div className="seo-group"><label className="seo-label">Code postal</label><input className="seo-input" value={buyerPostalCode} onChange={(e)=>setBuyerPostalCode(e.target.value)}/></div>
                <div className="seo-group"><label className="seo-label">Ville</label><input className="seo-input" value={buyerCity} onChange={(e)=>setBuyerCity(e.target.value)}/></div>
              </div>
            </div>
          </div>

          <div className="seo-section">
            <div className="seo-section-header"><div className="seo-section-num">3</div><div className="seo-section-title">Détails</div></div>
            <div className="seo-section-body">
              <div className="seo-grid">
                <div className="seo-group"><label className="seo-label">Numéro de facture *</label><input className="seo-input" value={invoiceNumber} onChange={(e)=>setInvoiceNumber(e.target.value)}/></div>
                <div className="seo-group"><label className="seo-label">Date d&apos;émission</label><input type="date" className="seo-input" value={dateIssue} onChange={(e)=>setDateIssue(e.target.value)}/></div>
                <div className="seo-group"><label className="seo-label">Date d&apos;échéance (optionnel)</label><input type="date" className="seo-input" value={dueDate} onChange={(e)=>setDueDate(e.target.value)}/></div>
              </div>
            </div>
          </div>

          <div className="seo-section">
            <div className="seo-section-header"><div className="seo-section-num">4</div><div className="seo-section-title">Lignes</div></div>
            <div className="seo-section-body">
              <div className="seo-table-wrap">
                <table className="seo-table">
                  <thead><tr><th>Description</th><th style={{width:60}}>Qté</th><th style={{width:110}}>PU HT</th><th/></tr></thead>
                  <tbody>
                    {lines.map((l)=>(
                      <tr key={l.id}>
                        <td><input className="seo-input" value={l.description} onChange={(e)=>updateLine(l.id,{description:e.target.value})} placeholder="Prestation de développement…"/></td>
                        <td><input className="seo-input" type="number" min={1} value={String(l.qty)} onChange={(e)=>updateLine(l.id,{qty:Number(e.target.value)||0})}/></td>
                        <td><input className="seo-input" type="number" step={0.01} value={String(l.unitPrice)} onChange={(e)=>updateLine(l.id,{unitPrice:Number(e.target.value)||0})}/></td>
                        <td><button className="seo-btn-remove" type="button" onClick={()=>removeLine(l.id)}>×</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button className="seo-btn-add" type="button" onClick={addLine}>+ Ajouter une ligne</button>
              <div className="seo-totals"><div className="seo-totals-box">
                <div className="seo-total-row"><span>Sous-total HT</span><span>{formatMoney(totals.totalHt)}</span></div>
                <div className="seo-total-row"><span>TVA</span><span>{formatMoney(totals.totalTva)}</span></div>
                <div className="seo-total-row final"><span className="l">Total TTC</span><span className="v">{formatMoney(totals.totalTtc)}</span></div>
              </div></div>
            </div>
          </div>

        </div>

        <div className="seo-summary-col">
          <div className="seo-summary">
            <div style={{ padding: '14px 16px', borderBottom: '1px solid #f3f4f6' }}>
              <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, color: '#94a3b8', marginBottom: 10 }}>Aperçu en direct</div>
              <FacturePreview
                sellerName={sellerName}
                buyerName={buyerName}
                invoiceNumber={invoiceNumber}
                dateIssue={dateIssue}
                dueDate={dueDate}
                lines={lines}
                totals={totals}
              />
            </div>
            <div className="seo-summary-actions">
              <button className="seo-btn-generate" type="button" onClick={generatePdf}>Générer ma facture PDF ↓</button>
              <p className="seo-summary-note"><span>Gratuit</span><span className="seo-summary-note-dot"/><span>Sans inscription</span><span className="seo-summary-note-dot"/><span>PDF pro</span></p>
            </div>
            {showSoftSignupNudge && <div className="seo-summary-nudge">
              <div className="seo-summary-nudge-title">Sauvegarder vos factures ?</div>
              <div className="seo-summary-nudge-text">Créez un compte gratuit pour centraliser clients et factures, et transformer un devis en facture en 1 clic.</div>
              <button className="seo-summary-nudge-btn" type="button" onClick={goSignup}>Créer un compte gratuit →</button>
            </div>}
          </div>
          <div className="seo-mini-tools">
            <div className="seo-mini-tools-title">Autres outils gratuits</div>
            <a href="/devis-freelance" className="seo-mini-tool"><span className="seo-mini-tool-dot" style={{background:'#facc15'}}/>Devis freelance</a>
            <a href="/facture-auto-entrepreneur" className="seo-mini-tool active"><span className="seo-mini-tool-dot" style={{background:'#3b82f6'}}/>Facture auto-entrepreneur</a>
            <a href="/contrat-freelance" className="seo-mini-tool"><span className="seo-mini-tool-dot" style={{background:'#f97316'}}/>Contrat freelance</a>
          </div>
        </div>
      </div>

      <div className="seo-mobile-bar">
        <div className="seo-mobile-bar-info"><div className="seo-mobile-bar-label">Total TTC</div><div className="seo-mobile-bar-amount">{formatMoney(totals.totalTtc)}</div></div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
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

      <div className={showEmailModal?'seo-modal-overlay active':'seo-modal-overlay'} onClick={(e)=>e.target===e.currentTarget&&setShowEmailModal(false)}>
        <div className="seo-modal">
          <h3>Votre facture est prête !</h3>
          <p>Créez un compte gratuit pour envoyer par email, signer et retrouver vos factures.</p>
          <button type="button" style={{width:'100%',padding:'14px',background:'#0f172a',color:'#fff',border:'none',borderRadius:12,fontWeight:800,fontSize:15,cursor:'pointer',marginBottom:10}} onClick={goSignup}>Créer un compte gratuit</button>
          <button className="seo-modal-skip" type="button" onClick={()=>setShowEmailModal(false)}>Non merci, juste télécharger</button>
        </div>
      </div>
    </div>
  )
}
