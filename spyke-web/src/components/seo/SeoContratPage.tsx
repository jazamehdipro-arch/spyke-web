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

function buildContractTemplate(params: {
  title: string
  date: string
  sellerName: string
  sellerSiret: string
  sellerAddress: string
  buyerName: string
  buyerAddress: string
  missionTitle: string
  missionDescription: string
  price: string
  paymentTerms: string
}) {
  const {
    title,
    date,
    sellerName,
    sellerSiret,
    sellerAddress,
    buyerName,
    buyerAddress,
    missionTitle,
    missionDescription,
    price,
    paymentTerms,
  } = params

  return `CONTRAT DE PRESTATION DE SERVICES\n\n${title ? `Titre : ${title}\n` : ''}${date ? `Date : ${date}\n` : ''}\nEntre les soussignés :\n- Prestataire : ${sellerName || '[Nom prestataire]'}${sellerSiret ? ` (SIRET : ${sellerSiret})` : ''}${sellerAddress ? `, ${sellerAddress}` : ''}\n- Client : ${buyerName || '[Nom client]'}${buyerAddress ? `, ${buyerAddress}` : ''}\n\n1. Objet\nLe présent contrat a pour objet la réalisation des prestations décrites ci-dessous.\n\n2. Prestations\nMission : ${missionTitle || '[Titre de la mission]'}\nDescription :\n${missionDescription || '[Décrivez le périmètre, livrables, délais, modalités]'}\n\n3. Prix et paiement\nPrix : ${price || '[Prix / TJM / forfait]'}\nModalités :\n${paymentTerms || "[Ex: 30% à la signature, solde à la livraison, paiement à 30 jours fin de mois]"}\n\n4. Propriété intellectuelle\nPréciser les droits cédés, conditions et périmètre de cession (le cas échéant).\n\n5. Confidentialité\nChaque partie s'engage à garder confidentielles les informations échangées.\n\n6. Résiliation\nPréciser les conditions de résiliation et les conséquences (facturation, restitution, etc.).\n\nFait à [Ville], le [Date].\n\nSignatures :\nPrestataire : ____________________\nClient : ____________________`
}

export default function SeoContratPage() {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), [])
  const pdfCountKey = 'spyke_seo_contrat_pdf_count_v1'

  const [pdfCount, setPdfCount] = useState(0)

  const [title, setTitle] = useState('Contrat de prestation de services')
  const [date, setDate] = useState(today)

  const [sellerName, setSellerName] = useState('')
  const [sellerSiret, setSellerSiret] = useState('')
  const [sellerAddress, setSellerAddress] = useState('')

  const [buyerName, setBuyerName] = useState('')
  const [buyerAddress, setBuyerAddress] = useState('')

  const [missionTitle, setMissionTitle] = useState('')
  const [missionDescription, setMissionDescription] = useState('')
  const [price, setPrice] = useState('')
  const [paymentTerms, setPaymentTerms] = useState('')

  const [contractText, setContractText] = useState('')

  const [showEmailModal, setShowEmailModal] = useState(false)
  const [email, setEmail] = useState('')

  useEffect(() => {
    setPdfCount(readCount(pdfCountKey))
    setContractText(
      buildContractTemplate({
        title,
        date,
        sellerName,
        sellerSiret,
        sellerAddress,
        buyerName,
        buyerAddress,
        missionTitle,
        missionDescription,
        price,
        paymentTerms,
      })
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function goSignup() {
    window.location.href = '/connexion.html'
  }

  function regenerateTemplate() {
    setContractText(
      buildContractTemplate({
        title,
        date,
        sellerName,
        sellerSiret,
        sellerAddress,
        buyerName,
        buyerAddress,
        missionTitle,
        missionDescription,
        price,
        paymentTerms,
      })
    )
  }

  async function generatePdf() {
    try {
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
          --yellow-dark: #eab308;
          --yellow-glow: rgba(250, 204, 21, 0.15);
          --green: #22c55e;
          --green-light: rgba(34, 197, 94, 0.1);
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

        .seo-soft-nudge { max-width: 900px; margin: 12px auto 0; padding: 0 40px; }
        .seo-soft-nudge-card { background: rgba(250, 204, 21, 0.12); border: 1px solid rgba(250, 204, 21, 0.25); border-radius: 14px; padding: 14px 16px; display: flex; gap: 12px; align-items: center; justify-content: space-between; flex-wrap: wrap; }
        .seo-soft-nudge-text { color: #111827; font-size: 13px; font-weight: 700; }
        .seo-soft-nudge-sub { color: #374151; font-size: 12px; margin-top: 2px; }
        .seo-soft-nudge-btn { padding: 10px 14px; background: var(--black); color: var(--white); border: none; border-radius: 10px; font-weight: 900; cursor: pointer; white-space: nowrap; }

        .wrap { max-width: 900px; margin: 32px auto 0; padding: 0 40px; }
        .card { background: var(--white); border: 1px solid var(--gray-200); border-radius: 16px; padding: 28px 32px; margin-bottom: 18px; }
        .title { font-size: 15px; font-weight: 900; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid var(--gray-100); }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .group { display: flex; flex-direction: column; gap: 6px; }
        .group.full { grid-column: 1 / -1; }
        .label { font-size: 12px; font-weight: 700; color: var(--gray-600); }
        .input, .textarea { padding: 11px 14px; border: 1.5px solid var(--gray-200); border-radius: 10px; font-size: 14px; color: var(--gray-900); outline: none; background: var(--gray-50); }
        .input:focus, .textarea:focus { border-color: var(--yellow); box-shadow: 0 0 0 3px var(--yellow-glow); background: var(--white); }
        .textarea { resize: vertical; min-height: 320px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; }
        .row-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 10px; flex-wrap: wrap; }
        .btn-secondary { padding: 10px 14px; border: 1px solid var(--gray-200); background: var(--white); border-radius: 10px; font-weight: 900; cursor: pointer; }

        .generate { text-align: center; margin-top: 8px; }
        .btn { padding: 16px 48px; background: var(--black); color: var(--white); border: none; border-radius: 14px; font-size: 16px; font-weight: 900; cursor: pointer; }
        .note { font-size: 12px; color: var(--gray-400); margin-top: 10px; }

        .seo-modal-overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); z-index: 200; align-items: center; justify-content: center; }
        .seo-modal-overlay.active { display: flex; }
        .seo-modal { background: var(--white); border-radius: 20px; padding: 32px 34px; max-width: 440px; width: 90%; text-align: center; }
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
          .wrap { padding: 0 20px; }
          .grid { grid-template-columns: 1fr; }
          .seo-ai-banner { margin: -14px 20px 0; flex-direction: column; text-align: center; }
          .seo-soft-nudge { padding: 0 20px; }
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
        <div className="seo-hero-badge"><span className="seo-hero-badge-dot" /> Outil 100% gratuit</div>
        <h1>Créez votre <span>contrat freelance</span> en 2 minutes</h1>
        <p className="seo-hero-sub">Remplissez les informations, générez un PDF. <b>Gratuit, sans inscription</b>.</p>
        <div className="seo-hero-trust">
          <span className="seo-hero-trust-item"><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg>Sans inscription</span>
          <span className="seo-hero-trust-item"><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg>PDF pro</span>
          <span className="seo-hero-trust-item"><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg>Semi-guidé</span>
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
          <div className="seo-ai-sub">Importez un PDF ou une image, l'IA pré-remplit votre contrat automatiquement</div>
        </div>
        <button className="seo-ai-btn" type="button" onClick={goSignup}>Fonctionnalité Spyke Pro</button>
      </div>

      {showSoftSignupNudge ? (
        <div className="seo-soft-nudge">
          <div className="seo-soft-nudge-card">
            <div>
              <div className="seo-soft-nudge-text">Vous aimez l'outil ?</div>
              <div className="seo-soft-nudge-sub">Créez un compte gratuit pour retrouver vos contrats et les réutiliser.</div>
            </div>
            <button className="seo-soft-nudge-btn" type="button" onClick={goSignup}>Créer un compte</button>
          </div>
        </div>
      ) : null}

      <div className="wrap">
        <div className="card">
          <div className="title">Prestataire</div>
          <div className="grid">
            <div className="group">
              <label className="label">Nom / Raison sociale</label>
              <input className="input" value={sellerName} onChange={(e) => setSellerName(e.target.value)} placeholder="Ex : Jean Dupont" />
            </div>
            <div className="group">
              <label className="label">SIRET (optionnel)</label>
              <input className="input" value={sellerSiret} onChange={(e) => setSellerSiret(e.target.value)} placeholder="123 456 789 00012" />
            </div>
            <div className="group full">
              <label className="label">Adresse (optionnel)</label>
              <input className="input" value={sellerAddress} onChange={(e) => setSellerAddress(e.target.value)} placeholder="Adresse complète" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="title">Client</div>
          <div className="grid">
            <div className="group">
              <label className="label">Nom du client / Entreprise</label>
              <input className="input" value={buyerName} onChange={(e) => setBuyerName(e.target.value)} placeholder="Ex : Agence Créative SAS" />
            </div>
            <div className="group full">
              <label className="label">Adresse (optionnel)</label>
              <input className="input" value={buyerAddress} onChange={(e) => setBuyerAddress(e.target.value)} placeholder="Adresse du client" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="title">Mission</div>
          <div className="grid">
            <div className="group">
              <label className="label">Titre de la mission</label>
              <input className="input" value={missionTitle} onChange={(e) => setMissionTitle(e.target.value)} placeholder="Ex : Création site vitrine" />
            </div>
            <div className="group">
              <label className="label">Prix (forfait / TJM)</label>
              <input className="input" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Ex : 1500€ HT / TJM 400€" />
            </div>
            <div className="group full">
              <label className="label">Description / périmètre</label>
              <input className="input" value={missionDescription} onChange={(e) => setMissionDescription(e.target.value)} placeholder="Livrables, délais, modalités…" />
            </div>
            <div className="group full">
              <label className="label">Conditions de paiement</label>
              <input className="input" value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} placeholder="Ex : 30% à la signature, solde à la livraison" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="title">Détails + clauses (modifiable)</div>
          <div className="grid">
            <div className="group">
              <label className="label">Titre du contrat</label>
              <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="group">
              <label className="label">Date</label>
              <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="group full">
              <label className="label">Texte du contrat</label>
              <textarea className="textarea" value={contractText} onChange={(e) => setContractText(e.target.value)} />
            </div>
          </div>
          <div className="row-actions">
            <button className="btn-secondary" type="button" onClick={regenerateTemplate}>Régénérer le modèle</button>
          </div>
        </div>

        <div className="generate">
          <button className="btn" type="button" onClick={generatePdf}>Générer mon contrat en PDF</button>
          <p className="note">Gratuit, sans inscription.</p>
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
