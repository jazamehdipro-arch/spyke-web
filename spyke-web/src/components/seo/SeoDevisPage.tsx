'use client'

import { useEffect, useMemo, useState } from 'react'

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

export default function SeoDevisPage() {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), [])

  // Gate: 1 free generation for this SEO page
  const storageKey = 'spyke_seo_devis_generated_v1'

  const [used, setUsed] = useState(false)
  const [showLimitModal, setShowLimitModal] = useState(false)

  const [sellerName, setSellerName] = useState('')
  const [sellerSiret, setSellerSiret] = useState('')
  const [sellerAddress, setSellerAddress] = useState('')
  const [sellerPostalCode, setSellerPostalCode] = useState('')
  const [sellerCity, setSellerCity] = useState('')
  const [sellerCountry, setSellerCountry] = useState('France')
  const [sellerVatNumber, setSellerVatNumber] = useState('')
  const [sellerIban, setSellerIban] = useState('')
  const [sellerBic, setSellerBic] = useState('')

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

  const [lines, setLines] = useState<DevisLine[]>(() => [
    { id: '0', label: '', description: '', qty: 1, unitPriceHt: 0, vatRate: 20 },
  ])

  const totals = useMemo(() => computeTotals(lines), [lines])
  const validityUntil = useMemo(() => addDays(dateIssue, validityDays), [dateIssue, validityDays])

  const [showEmailModal, setShowEmailModal] = useState(false)
  const [email, setEmail] = useState('')

  useEffect(() => {
    // Improve defaults: quote number based on month
    const d = new Date()
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    setQuoteNumber(`D${yyyy}${mm}-001`)
  }, [])

  useEffect(() => {
    try {
      setUsed(Boolean(window.localStorage.getItem(storageKey)))
    } catch {
      setUsed(false)
    }
  }, [])

  function updateLine(id: string, patch: Partial<DevisLine>) {
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)))
  }

  function addLine() {
    setLines((prev) => [
      ...prev,
      { id: String(Date.now()), label: '', description: '', qty: 1, unitPriceHt: 0, vatRate: prev[0]?.vatRate ?? 20 },
    ])
  }

  function removeLine(id: string) {
    setLines((prev) => (prev.length <= 1 ? prev : prev.filter((l) => l.id !== id)))
  }

  function goSignup() {
    window.location.href = '/connexion.html'
  }

  async function generatePdf() {
    try {
      if (used) {
        setShowLimitModal(true)
        return
      }

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

      downloadBlob(blob, `Devis-${quoteNumber}.pdf`)

      try {
        window.localStorage.setItem(storageKey, '1')
      } catch {}
      setUsed(true)

      // show optional email capture
      setShowEmailModal(true)
    } catch (e: any) {
      alert(e?.message || 'Erreur PDF')
    }
  }

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

        .seo-ai-banner { max-width: 900px; margin: -18px auto 0; padding: 18px 28px; background: var(--gray-100); border: 1.5px dashed var(--gray-300); border-radius: 14px; display: flex; align-items: center; gap: 16px; position: relative; z-index: 2; }
        .seo-ai-icon { width: 42px; height: 42px; background: var(--gray-200); border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; position: relative; }
        .seo-ai-icon svg { width: 20px; height: 20px; fill: var(--gray-400); }
        .seo-ai-lock { position: absolute; bottom: -3px; right: -3px; width: 16px; height: 16px; background: var(--gray-500); border-radius: 4px; display: flex; align-items: center; justify-content: center; }
        .seo-ai-lock svg { width: 9px; height: 9px; fill: var(--white); }
        .seo-ai-title { font-size: 14px; font-weight: 900; color: var(--gray-500); }
        .seo-ai-sub { font-size: 12px; color: var(--gray-400); }
        .seo-ai-btn { padding: 8px 18px; background: var(--black); color: var(--white); border: none; border-radius: 8px; font-size: 12px; font-weight: 900; cursor: pointer; white-space: nowrap; }

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

        .seo-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        .seo-table th { text-align: left; font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.8px; color: var(--gray-400); padding: 8px 10px; border-bottom: 1px solid var(--gray-200); }
        .seo-table td { padding: 6px 10px; }
        .seo-table input, .seo-table select { width: 100%; }
        .seo-btn-add { display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; background: none; border: 1.5px dashed var(--gray-300); border-radius: 8px; font-size: 13px; font-weight: 900; color: var(--gray-500); cursor: pointer; margin-top: 12px; }
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

        .seo-modal-overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); z-index: 200; align-items: center; justify-content: center; }
        .seo-modal-overlay.active { display: flex; }
        .seo-modal { background: var(--white); border-radius: 20px; padding: 32px 34px; max-width: 460px; width: 90%; text-align: center; }
        .seo-modal h3 { font-size: 20px; font-weight: 900; margin: 0 0 6px; }
        .seo-modal p { font-size: 14px; color: var(--gray-500); margin: 0 0 18px; }
        .seo-modal-form { display: flex; gap: 10px; margin-bottom: 12px; }
        .seo-modal-form input { flex: 1; }
        .seo-modal-form button { padding: 12px 18px; background: var(--black); color: var(--white); border: none; border-radius: 10px; font-weight: 900; cursor: pointer; white-space: nowrap; }
        .seo-modal-skip { font-size: 13px; color: var(--gray-400); cursor: pointer; background: none; border: none; }

        @media (max-width: 768px) {
          .seo-navbar { padding: 12px 20px; }
          .seo-nav-tools { display: none; }
          .seo-hero { padding: 40px 20px 34px; }
          .seo-hero h1 { font-size: 28px; }
          .seo-form-wrap { padding: 0 20px; }
          .seo-grid { grid-template-columns: 1fr; }
          .seo-ai-banner { margin: -14px 20px 0; flex-direction: column; text-align: center; }
        }
      `}</style>

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
          <button className="seo-btn-generate" type="button" onClick={generatePdf}>
            {used ? 'PDF gratuit utilisé — créer un compte' : 'Générer mon devis en PDF'}
          </button>
          <p className="seo-note">
            {used
              ? "Vous avez déjà généré votre PDF gratuit depuis cette page. Créez un compte pour en générer d'autres."
              : '1 PDF gratuit sur cette page. Ensuite, création de compte obligatoire.'}
          </p>
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
          <p>Voulez-vous aussi le recevoir par email ?</p>
          <div className="seo-modal-form">
            <input className="seo-input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="votre@email.com" />
            <button
              type="button"
              onClick={() => {
                if (!email.trim()) return
                alert("Envoi email : à brancher (prochaine étape)")
                setShowEmailModal(false)
              }}
            >
              Envoyer
            </button>
          </div>
          <button className="seo-modal-skip" type="button" onClick={() => setShowEmailModal(false)}>
            Non merci, c'est tout
          </button>
        </div>
      </div>

      <div className={showLimitModal ? 'seo-modal-overlay active' : 'seo-modal-overlay'} onClick={(e) => e.target === e.currentTarget && setShowLimitModal(false)}>
        <div className="seo-modal">
          <h3>PDF gratuit déjà utilisé</h3>
          <p>
            Vous avez déjà généré <b>1 devis gratuit</b> depuis cette page.
            <br />
            Pour en générer d'autres (et sauvegarder vos infos), créez un compte Spyke.
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button type="button" style={{ padding: '12px 18px', borderRadius: 10, border: '1px solid #e4e4e7', background: '#fff', fontWeight: 900, cursor: 'pointer' }} onClick={() => setShowLimitModal(false)}>
              Fermer
            </button>
            <button type="button" style={{ padding: '12px 18px', borderRadius: 10, border: 'none', background: '#0a0a0a', color: '#fff', fontWeight: 900, cursor: 'pointer' }} onClick={goSignup}>
              Créer un compte
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
