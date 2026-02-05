"use client"

import { useEffect, useMemo, useRef, useState } from 'react'
import { getSupabase } from '@/lib/supabaseClient'

type TvaChoice = 'oui' | 'non'

type ToneChoice = 'professionnel' | 'chaleureux' | 'formel' | 'decontracte'

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [tva, setTva] = useState<TvaChoice>('non')
  const [tone, setTone] = useState<ToneChoice>('professionnel')
  const [loading, setLoading] = useState(false)

  const supabase = useMemo(() => {
    try {
      return getSupabase()
    } catch {
      return null
    }
  }, [])

  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string>('')
  const [logoPreviewName, setLogoPreviewName] = useState<string>('logo.png')
  const [logoPreviewSize, setLogoPreviewSize] = useState<string>('0 KB')

  const logoInputRef = useRef<HTMLInputElement | null>(null)

  const progressWidthPx = useMemo(() => {
    // Total line width = container width - 80px (left/right 40px) in the original.
    // Here we approximate with %: step1=0%, step2=50%, step3=100%.
    return `${((currentStep - 1) / 2) * 100}%`
  }, [currentStep])

  useEffect(() => {
    ;(async () => {
      if (!supabase) return
      const { data } = await supabase.auth.getSession()
      if (!data.session) {
        // must be logged in to complete onboarding
        window.location.href = 'connexion.html'
      }
    })()
  }, [supabase])

  function nextStep(step: number) {
    setCurrentStep(step)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function prevStep(step: number) {
    setCurrentStep(step)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleLogoUpload(file?: File) {
    if (!file) return

    setLogoFile(file)

    const reader = new FileReader()
    reader.onload = (e) => {
      const url = String(e.target?.result || '')
      setLogoPreviewUrl(url)
      setLogoPreviewName(file.name)
      setLogoPreviewSize(`${(file.size / 1024).toFixed(0)} KB`)
    }
    reader.readAsDataURL(file)
  }

  function removeLogo() {
    if (logoInputRef.current) logoInputRef.current.value = ''
    setLogoFile(null)
    setLogoPreviewUrl('')
  }

  function getValue(id: string) {
    const el = document.getElementById(id) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null
    return el?.value ?? ''
  }

  async function finishOnboarding() {
    if (!supabase) {
      alert('Supabase non configuré (env manquantes)')
      return
    }

    try {
      setLoading(true)

      const { data: sessionData } = await supabase.auth.getSession()
      const session = sessionData.session
      if (!session?.user) throw new Error('Vous devez être connecté pour terminer l’onboarding')

      const userId = session.user.id

      let logoPath: string | null = null
      if (logoFile) {
        // Convention: <userId>/<filename>
        logoPath = `${userId}/${logoFile.name}`
        const { error: uploadError } = await supabase.storage
          .from('logos')
          .upload(logoPath, logoFile, { upsert: true })
        if (uploadError) throw uploadError
      }

      const payload = {
        id: userId,
        first_name: getValue('prenom'),
        last_name: getValue('nom'),
        job: getValue('metier'),
        legal_status: getValue('statut'),
        siret: getValue('siret') || null,
        vat_number: getValue('numtva') || null,
        address: getValue('adresse') || null,
        vat_enabled: tva === 'oui',
        vat_rate: tva === 'oui' ? Number(getValue('tauxTva') || 0) : 0,
        tjm: Number(getValue('tjm') || 0) || null,
        payment_delay_days: Number(getValue('delaiPaiement') || 0) || null,
        deposit_percent: Number(getValue('acompte') || 0) || null,
        quote_validity_days: Number(getValue('validiteDevis') || 0) || null,
        email_tone: tone,
        legal_mentions: getValue('mentionsLegales') || null,
        logo_url: logoPath,
        onboarding_completed: true,
      }

      const { error: upsertError } = await supabase.from('profiles').upsert(payload, { onConflict: 'id' })
      if (upsertError) throw upsertError

      window.location.href = 'app.html'
    } catch (err: any) {
      alert(err?.message || 'Erreur onboarding')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <style jsx global>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        :root {
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
          --yellow-light: #fef9c3;
          --yellow-dark: #eab308;
          --green: #22c55e;
          --green-light: #dcfce7;
          --red: #ef4444;
        }

        body {
          font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
          background: var(--gray-50);
          color: var(--gray-900);
          line-height: 1.6;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          -webkit-font-smoothing: antialiased;
        }

        header {
          padding: 24px 48px;
          background: var(--white);
          border-bottom: 1px solid var(--gray-200);
        }

        .header-content {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
        }

        .logo {
          display: flex;
          align-items: center;
          gap: 10px;
          font-family: 'Syne', sans-serif;
          font-size: 26px;
          font-weight: 700;
          color: var(--black);
          text-decoration: none;
        }

        .logo-icon {
          width: 36px;
          height: 36px;
          background: var(--black);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .logo-icon svg {
          width: 20px;
          height: 20px;
          fill: var(--yellow);
        }

        .header-skip {
          font-size: 14px;
          color: var(--gray-500);
          text-decoration: none;
          transition: color 0.2s;
          white-space: nowrap;
        }

        .header-skip:hover {
          color: var(--gray-700);
        }

        main {
          flex: 1;
          display: flex;
          justify-content: center;
          padding: 48px 24px;
        }

        .onboarding-container {
          width: 100%;
          max-width: 600px;
        }

        .progress-container {
          margin-bottom: 48px;
        }

        .progress-steps {
          display: flex;
          justify-content: space-between;
          position: relative;
          margin-bottom: 16px;
        }

        .progress-steps::before {
          content: '';
          position: absolute;
          top: 20px;
          left: 40px;
          right: 40px;
          height: 3px;
          background: var(--gray-200);
          z-index: 0;
        }

        .progress-line {
          position: absolute;
          top: 20px;
          left: 40px;
          height: 3px;
          background: var(--yellow);
          z-index: 1;
          transition: width 0.4s ease;
          width: ${progressWidthPx};
          max-width: calc(100% - 80px);
        }

        .progress-step {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          position: relative;
          z-index: 2;
        }

        .step-circle {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: var(--white);
          border: 3px solid var(--gray-200);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Syne', sans-serif;
          font-size: 16px;
          font-weight: 700;
          color: var(--gray-400);
          transition: all 0.3s ease;
        }

        .progress-step.active .step-circle {
          border-color: var(--yellow);
          background: var(--yellow);
          color: var(--black);
        }

        .progress-step.completed .step-circle {
          border-color: var(--green);
          background: var(--green);
          color: var(--white);
        }

        .step-label {
          font-size: 13px;
          font-weight: 500;
          color: var(--gray-400);
          transition: color 0.3s ease;
        }

        .progress-step.active .step-label,
        .progress-step.completed .step-label {
          color: var(--gray-700);
        }

        .onboarding-card {
          background: var(--white);
          border-radius: 24px;
          padding: 48px;
          border: 1px solid var(--gray-200);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
        }

        .card-header {
          text-align: center;
          margin-bottom: 40px;
        }

        .card-icon {
          width: 64px;
          height: 64px;
          background: var(--yellow-light);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
          margin: 0 auto 20px;
        }

        .card-header h1 {
          font-family: 'Syne', sans-serif;
          font-size: 28px;
          font-weight: 700;
          color: var(--black);
          margin-bottom: 8px;
        }

        .card-header p {
          font-size: 16px;
          color: var(--gray-500);
        }

        .form-step {
          display: none;
        }

        .form-step.active {
          display: block;
        }

        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        .form-grid .form-group.full {
          grid-column: 1 / -1;
        }

        .form-group {
          margin-bottom: 24px;
        }

        .form-group:last-child {
          margin-bottom: 0;
        }

        .form-label {
          display: block;
          font-size: 14px;
          font-weight: 600;
          color: var(--gray-700);
          margin-bottom: 8px;
        }

        .form-label .optional {
          font-weight: 400;
          color: var(--gray-400);
        }

        .form-input,
        .form-select,
        .form-textarea {
          width: 100%;
          padding: 14px 18px;
          border: 2px solid var(--gray-200);
          border-radius: 12px;
          font-size: 15px;
          font-family: inherit;
          transition: all 0.2s ease;
          background: var(--white);
          color: var(--gray-900);
        }

        .form-input:focus,
        .form-select:focus,
        .form-textarea:focus {
          outline: none;
          border-color: var(--yellow);
          box-shadow: 0 0 0 4px rgba(250, 204, 21, 0.15);
        }

        .form-input::placeholder,
        .form-textarea::placeholder {
          color: var(--gray-400);
        }

        .form-textarea {
          min-height: 100px;
          resize: vertical;
        }

        .form-select {
          cursor: pointer;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%23a1a1aa' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 14px center;
          padding-right: 48px;
        }

        .logo-upload {
          border: 2px dashed var(--gray-300);
          border-radius: 12px;
          padding: 32px;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s ease;
          background: var(--gray-50);
        }

        .logo-upload:hover {
          border-color: var(--yellow);
          background: var(--yellow-light);
        }

        .logo-upload-icon {
          width: 48px;
          height: 48px;
          background: var(--white);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 12px;
          font-size: 24px;
          border: 1px solid var(--gray-200);
        }

        .logo-upload p {
          font-size: 14px;
          color: var(--gray-500);
        }

        .logo-upload span {
          color: var(--yellow-dark);
          font-weight: 600;
        }

        .logo-preview {
          display: none;
          align-items: center;
          gap: 16px;
          padding: 16px;
          background: var(--gray-50);
          border-radius: 12px;
          border: 1px solid var(--gray-200);
        }

        .logo-preview.active {
          display: flex;
        }

        .logo-preview img {
          width: 64px;
          height: 64px;
          object-fit: contain;
          border-radius: 8px;
          background: var(--white);
          border: 1px solid var(--gray-200);
        }

        .logo-preview-info {
          flex: 1;
        }

        .logo-preview-info h4 {
          font-size: 14px;
          font-weight: 600;
          color: var(--gray-900);
          margin-bottom: 2px;
        }

        .logo-preview-info p {
          font-size: 13px;
          color: var(--gray-500);
        }

        .logo-preview-remove {
          width: 36px;
          height: 36px;
          border: none;
          background: var(--red);
          color: var(--white);
          border-radius: 8px;
          cursor: pointer;
          font-size: 18px;
          transition: all 0.2s;
        }

        .logo-preview-remove:hover {
          background: #dc2626;
        }

        .tone-options {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }

        .tone-option {
          padding: 16px;
          border: 2px solid var(--gray-200);
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: center;
          background: var(--white);
        }

        .tone-option:hover {
          border-color: var(--gray-300);
        }

        .tone-option.active {
          border-color: var(--yellow);
          background: var(--yellow-light);
        }

        .tone-option-icon {
          font-size: 24px;
          margin-bottom: 8px;
        }

        .tone-option-label {
          font-size: 14px;
          font-weight: 600;
          color: var(--gray-700);
          margin-bottom: 4px;
        }

        .tone-option-desc {
          font-size: 12px;
          color: var(--gray-500);
        }

        .tva-toggle {
          display: flex;
          gap: 12px;
          margin-bottom: 16px;
        }

        .tva-option {
          flex: 1;
          padding: 14px;
          border: 2px solid var(--gray-200);
          border-radius: 12px;
          cursor: pointer;
          text-align: center;
          font-size: 14px;
          font-weight: 600;
          color: var(--gray-600);
          transition: all 0.2s ease;
          background: var(--white);
        }

        .tva-option:hover {
          border-color: var(--gray-300);
        }

        .tva-option.active {
          border-color: var(--yellow);
          background: var(--yellow-light);
          color: var(--black);
        }

        .tva-rate {
          display: none;
        }

        .tva-rate.active {
          display: block;
        }

        .form-actions {
          display: flex;
          gap: 16px;
          margin-top: 40px;
        }

        .btn {
          flex: 1;
          padding: 16px 32px;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          font-family: inherit;
          cursor: pointer;
          transition: all 0.2s ease;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .btn-secondary {
          background: var(--gray-100);
          color: var(--gray-700);
        }

        .btn-secondary:hover {
          background: var(--gray-200);
        }

        .btn-primary {
          background: var(--black);
          color: var(--white);
        }

        .btn-primary:hover {
          background: var(--gray-800);
          transform: translateY(-2px);
        }

        .btn-success {
          background: var(--yellow);
          color: var(--black);
        }

        .btn-success:hover {
          background: var(--yellow-dark);
          transform: translateY(-2px);
        }

        .btn svg {
          width: 20px;
          height: 20px;
        }

        @media (max-width: 640px) {
          header {
            padding: 16px 20px;
          }

          main {
            padding: 32px 16px;
          }

          .onboarding-card {
            padding: 32px 24px;
          }

          .form-grid {
            grid-template-columns: 1fr;
          }

          .form-grid .form-group.full {
            grid-column: 1;
          }

          .progress-steps::before {
            left: 20px;
            right: 20px;
          }

          .progress-line {
            left: 20px;
          }

          .step-label {
            display: none;
          }

          .tone-options {
            grid-template-columns: 1fr;
          }

          .form-actions {
            flex-direction: column;
          }
        }
      `}</style>

      <header>
        <div className="header-content">
          <a href="#" className="logo">
            <div className="logo-icon">
              <svg viewBox="0 0 24 24">
                <path d="M13 3L4 14h7l-2 7 9-11h-7l2-7z" />
              </svg>
            </div>
            Spyke
          </a>
          <a href="app.html" className="header-skip">
            Passer cette étape →
          </a>
        </div>
      </header>

      <main>
        <div className="onboarding-container">
          <div className="progress-container">
            <div className="progress-steps">
              <div className="progress-line" id="progressLine" />

              <div
                className={`progress-step ${currentStep === 1 ? 'active' : currentStep > 1 ? 'completed' : ''}`}
                data-step="1"
              >
                <div className="step-circle">{currentStep > 1 ? '✓' : '1'}</div>
                <span className="step-label">Vous</span>
              </div>

              <div
                className={`progress-step ${currentStep === 2 ? 'active' : currentStep > 2 ? 'completed' : ''}`}
                data-step="2"
              >
                <div className="step-circle">{currentStep > 2 ? '✓' : '2'}</div>
                <span className="step-label">Entreprise</span>
              </div>

              <div className={`progress-step ${currentStep === 3 ? 'active' : ''}`} data-step="3">
                <div className="step-circle">3</div>
                <span className="step-label">Préférences</span>
              </div>
            </div>
          </div>

          <div className="onboarding-card">
            {/* Step 1 */}
            <div className={`form-step ${currentStep === 1 ? 'active' : ''}`} id="step1">
              <div className="card-header">
                <div className="card-icon">👋</div>
                <h1>Bienvenue sur Spyke !</h1>
                <p>Commençons par faire connaissance</p>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Prénom</label>
                  <input type="text" className="form-input" placeholder="Votre prénom" id="prenom" />
                </div>
                <div className="form-group">
                  <label className="form-label">Nom</label>
                  <input type="text" className="form-input" placeholder="Votre nom" id="nom" />
                </div>
                <div className="form-group full">
                  <label className="form-label">Métier / Activité</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ex: Développeur web, Designer, Consultant..."
                    id="metier"
                  />
                </div>
              </div>

              <div className="form-actions">
                <button className="btn btn-primary" type="button" onClick={() => nextStep(2)}>
                  Continuer
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Step 2 */}
            <div className={`form-step ${currentStep === 2 ? 'active' : ''}`} id="step2">
              <div className="card-header">
                <div className="card-icon">🏢</div>
                <h1>Votre entreprise</h1>
                <p>Ces infos apparaîtront sur vos devis</p>
              </div>

              <div className="form-group">
                <label className="form-label">Statut juridique</label>
                <select className="form-select" id="statut" defaultValue="">
                  <option value="">Sélectionner...</option>
                  <option value="auto">Auto-entrepreneur / Micro-entreprise</option>
                  <option value="ei">Entreprise individuelle (EI)</option>
                  <option value="eurl">EURL</option>
                  <option value="sasu">SASU</option>
                  <option value="sarl">SARL</option>
                  <option value="sas">SAS</option>
                </select>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">
                    SIRET <span className="optional">(optionnel)</span>
                  </label>
                  <input type="text" className="form-input" placeholder="123 456 789 00012" id="siret" />
                </div>
                <div className="form-group">
                  <label className="form-label">
                    N° TVA <span className="optional">(si applicable)</span>
                  </label>
                  <input type="text" className="form-input" placeholder="FR12345678901" id="numtva" />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Adresse <span className="optional">(optionnel)</span>
                </label>
                <input type="text" className="form-input" placeholder="Adresse complète" id="adresse" />
              </div>

              <div className="form-group">
                <label className="form-label">Assujetti à la TVA ?</label>
                <div className="tva-toggle">
                  <div className={`tva-option ${tva === 'non' ? 'active' : ''}`} onClick={() => setTva('non')}>
                    Non (franchise)
                  </div>
                  <div className={`tva-option ${tva === 'oui' ? 'active' : ''}`} onClick={() => setTva('oui')}>
                    Oui
                  </div>
                </div>
                <div className={`tva-rate ${tva === 'oui' ? 'active' : ''}`} id="tvaRate">
                  <select className="form-select" id="tauxTva" defaultValue="20">
                    <option value="20">20% (taux normal)</option>
                    <option value="10">10% (taux intermédiaire)</option>
                    <option value="5.5">5,5% (taux réduit)</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Logo <span className="optional">(optionnel)</span>
                </label>

                {!logoPreviewUrl ? (
                  <div
                    className="logo-upload"
                    id="logoUpload"
                    onClick={() => {
                      logoInputRef.current?.click()
                    }}
                  >
                    <div className="logo-upload-icon">📷</div>
                    <p>
                      <span>Cliquez pour uploader</span> ou glissez votre logo ici
                    </p>
                    <p style={{ fontSize: 12, marginTop: 8 }}>PNG, JPG jusqu&apos;à 2MB</p>
                    <input
                      ref={logoInputRef}
                      type="file"
                      id="logoInput"
                      accept="image/*"
                      onChange={(e) => handleLogoUpload(e.target.files?.[0])}
                      style={{ display: 'none' }}
                    />
                  </div>
                ) : (
                  <div className="logo-preview active" id="logoPreview">
                    <img src={logoPreviewUrl} alt="Logo" id="logoPreviewImg" />
                    <div className="logo-preview-info">
                      <h4 id="logoPreviewName">{logoPreviewName}</h4>
                      <p id="logoPreviewSize">{logoPreviewSize}</p>
                    </div>
                    <button className="logo-preview-remove" type="button" onClick={removeLogo}>
                      ✕
                    </button>
                  </div>
                )}
              </div>

              <div className="form-actions">
                <button className="btn btn-secondary" type="button" onClick={() => prevStep(1)}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 12H5M12 19l-7-7 7-7" />
                  </svg>
                  Retour
                </button>
                <button className="btn btn-primary" type="button" onClick={() => nextStep(3)}>
                  Continuer
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Step 3 */}
            <div className={`form-step ${currentStep === 3 ? 'active' : ''}`} id="step3">
              <div className="card-header">
                <div className="card-icon">⚙️</div>
                <h1>Vos préférences</h1>
                <p>Personnalisez Spyke selon vos habitudes</p>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Taux journalier (TJM)</label>
                  <input type="text" className="form-input" placeholder="Ex: 400" id="tjm" />
                </div>
                <div className="form-group">
                  <label className="form-label">Délai de paiement</label>
                  <select className="form-select" id="delaiPaiement" defaultValue="30">
                    <option value="0">À réception</option>
                    <option value="15">15 jours</option>
                    <option value="30">30 jours</option>
                    <option value="45">45 jours</option>
                    <option value="60">60 jours</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Acompte par défaut</label>
                  <select className="form-select" id="acompte" defaultValue="30">
                    <option value="0">Pas d&apos;acompte</option>
                    <option value="30">30%</option>
                    <option value="50">50%</option>
                    <option value="100">100% (paiement total)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Validité des devis</label>
                  <select className="form-select" id="validiteDevis" defaultValue="30">
                    <option value="15">15 jours</option>
                    <option value="30">30 jours</option>
                    <option value="60">60 jours</option>
                    <option value="90">90 jours</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Ton préféré pour les emails</label>
                <div className="tone-options">
                  <div
                    className={`tone-option ${tone === 'professionnel' ? 'active' : ''}`}
                    onClick={() => setTone('professionnel')}
                    data-tone="professionnel"
                  >
                    <div className="tone-option-icon">💼</div>
                    <div className="tone-option-label">Professionnel</div>
                    <div className="tone-option-desc">Clair, direct, efficace</div>
                  </div>
                  <div
                    className={`tone-option ${tone === 'chaleureux' ? 'active' : ''}`}
                    onClick={() => setTone('chaleureux')}
                    data-tone="chaleureux"
                  >
                    <div className="tone-option-icon">😊</div>
                    <div className="tone-option-label">Chaleureux</div>
                    <div className="tone-option-desc">Amical, proche, humain</div>
                  </div>
                  <div
                    className={`tone-option ${tone === 'formel' ? 'active' : ''}`}
                    onClick={() => setTone('formel')}
                    data-tone="formel"
                  >
                    <div className="tone-option-icon">🎩</div>
                    <div className="tone-option-label">Formel</div>
                    <div className="tone-option-desc">Soutenu, corporate</div>
                  </div>
                  <div
                    className={`tone-option ${tone === 'decontracte' ? 'active' : ''}`}
                    onClick={() => setTone('decontracte')}
                    data-tone="decontracte"
                  >
                    <div className="tone-option-icon">✌️</div>
                    <div className="tone-option-label">Décontracté</div>
                    <div className="tone-option-desc">Cool, startup vibes</div>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Mentions légales devis <span className="optional">(optionnel)</span>
                </label>
                <textarea
                  className="form-textarea"
                  placeholder="Ex: TVA non applicable, art. 293 B du CGI..."
                  id="mentionsLegales"
                />
              </div>

              <div className="form-actions">
                <button className="btn btn-secondary" type="button" onClick={() => prevStep(2)}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 12H5M12 19l-7-7 7-7" />
                  </svg>
                  Retour
                </button>
                <button className="btn btn-success" type="button" onClick={finishOnboarding}>
                  Terminer
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
