'use client'

import { useMemo, useState } from 'react'

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

export default function SeoContratPage() {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), [])
  const storageKey = 'spyke_seo_contrat_generated_v1'

  const [sellerName, setSellerName] = useState('')
  const [buyerName, setBuyerName] = useState('')
  const [title, setTitle] = useState('Contrat de prestation de services')
  const [date, setDate] = useState(today)
  const [contractText, setContractText] = useState(
    `CONTRAT DE PRESTATION DE SERVICES\n\nEntre les soussignés :\n- Prestataire : [Nom] (ci-après « le Prestataire »)\n- Client : [Nom] (ci-après « le Client »)\n\n1. Objet\nLe présent contrat a pour objet la réalisation des prestations décrites ci-dessous.\n\n2. Prestations\nDécrire précisément le périmètre, livrables, délais et modalités.\n\n3. Prix et paiement\nDécrire le prix, l'échéancier, les pénalités de retard, etc.\n\n4. Propriété intellectuelle\nDécrire les droits cédés, conditions, etc.\n\n5. Résiliation\nDécrire les conditions de résiliation.\n\nFait à [Ville], le [Date].\n\nSignatures :\nPrestataire : ____________________\nClient : ____________________`
  )

  const [showEmailModal, setShowEmailModal] = useState(false)
  const [email, setEmail] = useState('')

  function requireSignup() {
    window.location.href = '/connexion.html'
  }

  async function generatePdf() {
    try {
      const already = window.localStorage.getItem(storageKey)
      if (already) return requireSignup()

      if (!contractText.trim()) throw new Error('Renseigne le texte du contrat')

      const payload = {
        title,
        date,
        contractText,
        parties: { sellerName, buyerName },
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

      downloadBlob(blob, `Contrat.pdf`)
      window.localStorage.setItem(storageKey, '1')
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
          --gray-800: #27272a;
          --gray-900: #18181b;
          --yellow: #facc15;
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
        .wrap { max-width: 900px; margin: 32px auto 0; padding: 0 40px; }
        .card { background: var(--white); border: 1px solid var(--gray-200); border-radius: 16px; padding: 28px 32px; margin-bottom: 18px; }
        .title { font-size: 15px; font-weight: 900; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid var(--gray-100); }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .group { display: flex; flex-direction: column; gap: 6px; }
        .label { font-size: 12px; font-weight: 700; color: var(--gray-600); }
        .input, .textarea { padding: 11px 14px; border: 1.5px solid var(--gray-200); border-radius: 10px; font-size: 14px; color: var(--gray-900); outline: none; background: var(--gray-50); }
        .input:focus, .textarea:focus { border-color: var(--yellow); box-shadow: 0 0 0 3px var(--yellow-glow); background: var(--white); }
        .textarea { resize: vertical; min-height: 280px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; }
        .generate { text-align: center; margin-top: 8px; }
        .btn { padding: 16px 48px; background: var(--black); color: var(--white); border: none; border-radius: 14px; font-size: 16px; font-weight: 900; cursor: pointer; }
        .note { font-size: 12px; color: var(--gray-400); margin-top: 10px; }
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
          .wrap { padding: 0 20px; }
          .grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <nav className="seo-navbar">
        <a className="seo-nav-logo" href="/">
          <div className="seo-nav-logo-icon"><svg viewBox="0 0 24 24"><path d="M13 3L4 14h7l-2 7 9-11h-7l2-7z" /></svg></div>
          <span className="seo-nav-logo-text">Spyke</span>
        </a>
        <div className="seo-nav-tools">
          <a className="seo-nav-tool" href="/devis-freelance">Devis gratuit</a>
          <a className="seo-nav-tool" href="/facture-auto-entrepreneur">Facture gratuite</a>
          <a className="seo-nav-tool active" href="/contrat-freelance">Contrat gratuit</a>
        </div>
        <a className="seo-nav-cta" href="/connexion.html">Créer un compte gratuit</a>
      </nav>

      <section className="seo-hero">
        <h1>Générez un <span>contrat freelance</span> en PDF</h1>
        <p className="seo-hero-sub">Éditez le texte et téléchargez votre contrat. Gratuit 1 fois, sans inscription.</p>
      </section>

      <div className="wrap">
        <div className="card">
          <div className="title">Informations</div>
          <div className="grid">
            <div className="group">
              <label className="label">Titre</label>
              <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="group">
              <label className="label">Date</label>
              <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="group">
              <label className="label">Prestataire (optionnel)</label>
              <input className="input" value={sellerName} onChange={(e) => setSellerName(e.target.value)} placeholder="Nom du prestataire" />
            </div>
            <div className="group">
              <label className="label">Client (optionnel)</label>
              <input className="input" value={buyerName} onChange={(e) => setBuyerName(e.target.value)} placeholder="Nom du client" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="title">Texte du contrat</div>
          <textarea className="textarea" value={contractText} onChange={(e) => setContractText(e.target.value)} />
        </div>

        <div className="generate">
          <button className="btn" type="button" onClick={generatePdf}>Générer mon contrat en PDF</button>
          <p className="note">Gratuit 1 fois. À la 2e génération, création de compte.</p>
        </div>
      </div>

      <div className={showEmailModal ? 'seo-modal-overlay active' : 'seo-modal-overlay'} onClick={(e) => e.target === e.currentTarget && setShowEmailModal(false)}>
        <div className="seo-modal">
          <h3>Votre contrat est prêt !</h3>
          <p>Voulez-vous aussi le recevoir par email ?</p>
          <div className="seo-modal-form">
            <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="votre@email.com" />
            <button type="button" onClick={() => { if (!email.trim()) return; alert('Envoi email : à brancher'); setShowEmailModal(false) }}>Envoyer</button>
          </div>
          <button className="seo-modal-skip" type="button" onClick={() => setShowEmailModal(false)}>Non merci, c'est tout</button>
        </div>
      </div>
    </div>
  )
}
