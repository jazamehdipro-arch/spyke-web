'use client'

import { useEffect, useMemo, useState } from 'react'

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

export default function SeoFacturePage() {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), [])
  const storageKey = 'spyke_seo_facture_generated_v1'

  const [sellerName, setSellerName] = useState('')
  const [sellerSiret, setSellerSiret] = useState('')
  const [sellerAddress, setSellerAddress] = useState('')
  const [sellerPostalCode, setSellerPostalCode] = useState('')
  const [sellerCity, setSellerCity] = useState('')
  const [sellerCountry, setSellerCountry] = useState('France')
  const [sellerIban, setSellerIban] = useState('')
  const [sellerBic, setSellerBic] = useState('')

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

  function requireSignup() {
    window.location.href = '/connexion.html'
  }

  async function generatePdf() {
    try {
      const already = window.localStorage.getItem(storageKey)
      if (already) return requireSignup()

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
        seller: {
          name: sellerName,
          addressLines: sellerAddressLines,
          siret: sellerSiret,
          iban: sellerIban,
          bic: sellerBic,
          bankName: '',
          bankAccount: '',
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

      downloadBlob(blob, `Facture-${invoiceNumber}.pdf`)
      window.localStorage.setItem(storageKey, '1')
      setShowEmailModal(true)
    } catch (e: any) {
      alert(e?.message || 'Erreur PDF')
    }
  }

  // Reuse SEO Devis CSS already loaded on its page; for simplicity keep minimal shared look.
  // (We keep the same class names so styling is consistent when copied between pages.)
  return (
    <div className="seo-tool">
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
          font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'DM Sans', sans-serif;
          background: var(--gray-50);
          color: var(--gray-900);
          min-height: 100vh;
        }
        .seo-navbar { background: var(--black); padding: 16px 40px; display: flex; align-items: center; justify-content: space-between; position: sticky; top: 0; z-index: 50; }
        .seo-nav-logo { display: flex; align-items: center; gap: 10px; text-decoration: none; }
        .seo-nav-logo-icon { width: 32px; height: 32px; background: var(--gray-800); border-radius: 8px; display: flex; align-items: center; justify-content: center; }
        .seo-nav-logo-icon svg { width: 18px; height: 18px; fill: var(--yellow); }
        .seo-nav-logo-text { font-weight: 800; font-size: 20px; color: var(--white); }
        .seo-nav-tools { display: flex; gap: 6px; }
        .seo-nav-tool { padding: 8px 16px; border-radius: 8px; font-size: 13px; font-weight: 600; color: var(--gray-400); text-decoration: none; }
        .seo-nav-tool:hover { color: var(--white); background: var(--gray-800); }
        .seo-nav-tool.active { color: var(--yellow); background: var(--gray-800); }
        .seo-nav-cta { padding: 9px 20px; background: var(--yellow); color: var(--black); border-radius: 10px; font-size: 13px; font-weight: 800; text-decoration: none; }
        .seo-hero { background: var(--black); padding: 56px 40px 46px; text-align: center; }
        .seo-hero h1 { font-size: 40px; font-weight: 900; color: var(--white); letter-spacing: -1.4px; line-height: 1.15; max-width: 760px; margin: 0 auto 14px; }
        .seo-hero h1 span { color: var(--yellow); }
        .seo-hero-sub { font-size: 16px; color: var(--gray-400); max-width: 620px; margin: 0 auto; line-height: 1.7; }
        .seo-form-wrap { max-width: 900px; margin: 32px auto 0; padding: 0 40px; }
        .seo-card { background: var(--white); border: 1px solid var(--gray-200); border-radius: 16px; padding: 28px 32px; margin-bottom: 18px; }
        .seo-card-title { font-size: 15px; font-weight: 900; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid var(--gray-100); }
        .seo-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .seo-group { display: flex; flex-direction: column; gap: 6px; }
        .seo-group.full { grid-column: 1 / -1; }
        .seo-label { font-size: 12px; font-weight: 700; color: var(--gray-600); }
        .seo-input, .seo-select { padding: 11px 14px; border: 1.5px solid var(--gray-200); border-radius: 10px; font-size: 14px; color: var(--gray-900); outline: none; background: var(--gray-50); }
        .seo-input:focus, .seo-select:focus { border-color: var(--yellow); box-shadow: 0 0 0 3px var(--yellow-glow); background: var(--white); }
        .seo-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        .seo-table th { text-align: left; font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.8px; color: var(--gray-400); padding: 8px 10px; border-bottom: 1px solid var(--gray-200); }
        .seo-table td { padding: 6px 10px; }
        .seo-btn-add { display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; background: none; border: 1.5px dashed var(--gray-300); border-radius: 8px; font-size: 13px; font-weight: 800; color: var(--gray-500); cursor: pointer; margin-top: 12px; }
        .seo-btn-remove { width: 28px; height: 28px; border: none; background: rgba(239, 68, 68, 0.08); color: #ef4444; border-radius: 6px; cursor: pointer; font-size: 16px; }
        .seo-totals { display: flex; justify-content: flex-end; margin-top: 18px; }
        .seo-totals-box { min-width: 280px; }
        .seo-total-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; color: var(--gray-600); }
        .seo-total-row.final { border-top: 2px solid var(--gray-200); margin-top: 8px; padding-top: 12px; }
        .seo-total-row.final .l { font-weight: 900; font-size: 16px; color: var(--black); }
        .seo-total-row.final .v { font-weight: 900; font-size: 22px; color: var(--black); }
        .seo-generate { text-align: center; margin-top: 8px; }
        .seo-btn-generate { padding: 16px 48px; background: var(--black); color: var(--white); border: none; border-radius: 14px; font-size: 16px; font-weight: 900; cursor: pointer; }
        .seo-note { font-size: 12px; color: var(--gray-400); margin-top: 10px; }
        .seo-modal-overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 200; align-items: center; justify-content: center; }
        .seo-modal-overlay.active { display: flex; }
        .seo-modal { background: var(--white); border-radius: 20px; padding: 32px 34px; max-width: 440px; width: 90%; text-align: center; }
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
        }
      `}</style>

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
        <h1>Créez votre <span>facture</span> en 2 minutes</h1>
        <p className="seo-hero-sub">Remplissez le formulaire, téléchargez votre facture en PDF. Gratuit, sans inscription.</p>
      </section>

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
          <p className="seo-note">Gratuit 1 fois. À la 2e génération, création de compte.</p>
        </div>
      </div>

      <div className={showEmailModal ? 'seo-modal-overlay active' : 'seo-modal-overlay'} onClick={(e) => e.target === e.currentTarget && setShowEmailModal(false)}>
        <div className="seo-modal">
          <h3>Votre facture est prête !</h3>
          <p>Voulez-vous aussi la recevoir par email ?</p>
          <div className="seo-modal-form">
            <input className="seo-input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="votre@email.com" />
            <button type="button" onClick={() => { if (!email.trim()) return; alert('Envoi email : à brancher'); setShowEmailModal(false) }}>Envoyer</button>
          </div>
          <button className="seo-modal-skip" type="button" onClick={() => setShowEmailModal(false)}>Non merci, c'est tout</button>
        </div>
      </div>
    </div>
  )
}
