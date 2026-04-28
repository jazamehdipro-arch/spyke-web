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


      <nav className="seo-navbar">
        <a className="seo-nav-logo" href="/">
          <div className="seo-nav-logo-icon"><svg viewBox="0 0 24 24"><path d="M13 3L4 14h7l-2 7 9-11h-7l2-7z" /></svg></div>
          <span className="seo-nav-logo-text">Spyke</span>
        </a>
        <div className="seo-nav-tools">
          <a className="seo-nav-tool" href="/devis-freelance">Devis gratuit</a>
          <a className="seo-nav-tool active" href="/facture-auto-entrepreneur">Facture gratuite</a>
          <a className="seo-nav-tool" href="/contrat-freelance">Contrat gratuit</a>
        </div>
        <a className="seo-nav-cta" href="/connexion.html">Créer un compte gratuit</a>
      </nav>

      <section className="seo-hero">
        <div className="seo-hero-badge"><span className="seo-hero-badge-dot" /> Outil 100% gratuit</div>
        <h1>Créez votre <span>facture</span> en 2 minutes</h1>
        <p className="seo-hero-sub">Remplissez le formulaire, téléchargez votre facture en PDF. <b>Gratuit, sans inscription</b>.</p>
        <div className="seo-hero-trust">
          <span className="seo-hero-trust-item"><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg>2 450+ documents générés</span>
          <span className="seo-hero-trust-item"><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg>Sans inscription</span>
          <span className="seo-hero-trust-item"><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg>PDF pro</span>
          <span className="seo-hero-trust-item"><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg>Mentions légales incluses</span>
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
          <div className="seo-ai-sub">Importez un PDF ou une image, l'IA pré-remplit votre facture automatiquement</div>
        </div>
        <button className="seo-ai-btn" type="button" onClick={goSignup}>Fonctionnalité Spyke Pro</button>
      </div>

      {showSoftSignupNudge ? (
        <div className="seo-soft-nudge">
          <div className="seo-soft-nudge-card">
            <div>
              <div className="seo-soft-nudge-text">Vous aimez l'outil ?</div>
              <div className="seo-soft-nudge-sub">Créez un compte gratuit pour sauvegarder vos clients et retrouver vos factures.</div>
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
              <input className="seo-input" value={sellerName} onChange={(e) => setSellerName(e.target.value)} />
            </div>
            <div className="seo-group">
              <label className="seo-label">SIRET</label>
              <input className="seo-input" value={sellerSiret} onChange={(e) => setSellerSiret(e.target.value)} />
            </div>
            <div className="seo-group full">
              <label className="seo-label">Adresse</label>
              <input className="seo-input" value={sellerAddress} onChange={(e) => setSellerAddress(e.target.value)} />
            </div>
            <div className="seo-group">
              <label className="seo-label">Code postal</label>
              <input className="seo-input" value={sellerPostalCode} onChange={(e) => setSellerPostalCode(e.target.value)} />
            </div>
            <div className="seo-group">
              <label className="seo-label">Ville</label>
              <input className="seo-input" value={sellerCity} onChange={(e) => setSellerCity(e.target.value)} />
            </div>
            <div className="seo-group">
              <label className="seo-label">Pays</label>
              <input className="seo-input" value={sellerCountry} onChange={(e) => setSellerCountry(e.target.value)} />
            </div>
            <div className="seo-group">
              <label className="seo-label">IBAN (optionnel)</label>
              <input className="seo-input" value={sellerIban} onChange={(e) => setSellerIban(e.target.value)} />
            </div>
            <div className="seo-group">
              <label className="seo-label">BIC (optionnel)</label>
              <input className="seo-input" value={sellerBic} onChange={(e) => setSellerBic(e.target.value)} />
            </div>
            <div className="seo-group">
              <label className="seo-label">Banque (optionnel)</label>
              <input className="seo-input" value={sellerBankName} onChange={(e) => setSellerBankName(e.target.value)} />
            </div>
            <div className="seo-group">
              <label className="seo-label">Compte / Intitulé (optionnel)</label>
              <input className="seo-input" value={sellerBankAccount} onChange={(e) => setSellerBankAccount(e.target.value)} />
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
          <div className="seo-card-title">Client</div>
          <div className="seo-grid">
            <div className="seo-group">
              <label className="seo-label">Nom du client / Entreprise</label>
              <input className="seo-input" value={buyerName} onChange={(e) => setBuyerName(e.target.value)} />
            </div>
            <div className="seo-group full">
              <label className="seo-label">Adresse</label>
              <input className="seo-input" value={buyerAddress} onChange={(e) => setBuyerAddress(e.target.value)} />
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
          <div className="seo-card-title">Détails</div>
          <div className="seo-grid">
            <div className="seo-group">
              <label className="seo-label">Numéro de facture</label>
              <input className="seo-input" value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} />
            </div>
            <div className="seo-group">
              <label className="seo-label">Date d'émission</label>
              <input type="date" className="seo-input" value={dateIssue} onChange={(e) => setDateIssue(e.target.value)} />
            </div>
            <div className="seo-group">
              <label className="seo-label">Date d'échéance (optionnel)</label>
              <input type="date" className="seo-input" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          </div>
        </div>

        <div className="seo-card">
          <div className="seo-card-title">Lignes</div>
          <table className="seo-table">
            <thead>
              <tr>
                <th>Description</th>
                <th>Qté</th>
                <th>PU HT</th>
                <th style={{ textAlign: 'center' }} />
              </tr>
            </thead>
            <tbody>
              {lines.map((l) => (
                <tr key={l.id}>
                  <td><input className="seo-input" value={l.description} onChange={(e) => updateLine(l.id, { description: e.target.value })} /></td>
                  <td><input className="seo-input" type="number" min={1} value={String(l.qty)} onChange={(e) => updateLine(l.id, { qty: Number(e.target.value) || 0 })} /></td>
                  <td><input className="seo-input" type="number" step={0.01} value={String(l.unitPrice)} onChange={(e) => updateLine(l.id, { unitPrice: Number(e.target.value) || 0 })} /></td>
                  <td style={{ textAlign: 'center' }}><button className="seo-btn-remove" type="button" onClick={() => removeLine(l.id)}>×</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          <button className="seo-btn-add" type="button" onClick={addLine}>+ Ajouter une ligne</button>

          <div className="seo-totals">
            <div className="seo-totals-box">
              <div className="seo-total-row"><span>Sous-total HT</span><span>{formatMoney(totals.totalHt)}</span></div>
              <div className="seo-total-row"><span>TVA</span><span>{formatMoney(totals.totalTva)}</span></div>
              <div className="seo-total-row final"><span className="l">Total TTC</span><span className="v">{formatMoney(totals.totalTtc)}</span></div>
            </div>
          </div>
        </div>

        <div className="seo-generate">
          <button className="seo-btn-generate" type="button" onClick={generatePdf}>Générer ma facture en PDF</button>
          <p className="seo-note">Gratuit, sans inscription.</p>
        </div>
      </div>

      <div className={showEmailModal ? 'seo-modal-overlay active' : 'seo-modal-overlay'} onClick={(e) => e.target === e.currentTarget && setShowEmailModal(false)}>
        <div className="seo-modal">
          <h3>Votre facture est prête !</h3>
          <p>Créez un compte gratuit pour envoyer vos factures par email, les signer et les retrouver à tout moment.</p>
          <button type="button" style={{ width: '100%', padding: '14px', background: '#0a0a0a', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 900, fontSize: 15, cursor: 'pointer', marginBottom: 10 }} onClick={goSignup}>Créer un compte gratuit</button>
          <button className="seo-modal-skip" type="button" onClick={() => setShowEmailModal(false)}>Non merci, juste télécharger</button>
        </div>
      </div>
    </div>
  )
}
