"use client"

import { useEffect, useMemo, useState } from 'react'
import { getSupabase } from '@/lib/supabaseClient'

type DevisClientChoice =
  | { mode: 'existing'; id: string }
  | { mode: 'new'; name: string; siret?: string; address?: string; postalCode?: string; city?: string }
  | { mode: 'none' }

type DevisLine = {
  id: string
  label: string
  description: string
  qty: number
  unitPriceHt: number
  vatRate: number
}

function formatMoney(amount: number) {
  return amount.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'
}

function formatDateFr(dateStr: string) {
  // dateStr expected: YYYY-MM-DD
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
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

function computeTotals(lines: DevisLine[]) {
  let totalHt = 0
  let totalTva = 0
  for (const l of lines) {
    const lineHt = (l.qty || 0) * (l.unitPriceHt || 0)
    const lineTva = lineHt * ((l.vatRate || 0) / 100)
    totalHt += lineHt
    totalTva += lineTva
  }
  const totalTtc = totalHt + totalTva
  return { totalHt, totalTva, totalTtc }
}

function genQuoteNumber(dateStr: string, sequence = 1) {
  const d = new Date((dateStr || '').slice(0, 10) + 'T00:00:00')
  const year = !Number.isNaN(d.getTime()) ? d.getFullYear() : new Date().getFullYear()
  const month = String((!Number.isNaN(d.getTime()) ? d.getMonth() + 1 : new Date().getMonth() + 1)).padStart(2, '0')
  return `D${year}${month}-${sequence}`
}

function DevisV4({
  userFullName,
  userJob,
  userId,
}: {
  userFullName: string
  userJob: string
  userId: string | null
}) {
  const supabase = useMemo(() => {
    try {
      return getSupabase()
    } catch {
      return null
    }
  }, [])

  const today = useMemo(() => {
    const d = new Date()
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    return `${yyyy}-${mm}-${dd}`
  }, [])

  const [title, setTitle] = useState('')
  const [dateIssue, setDateIssue] = useState(today)
  const [validityDays, setValidityDays] = useState(30)
  const [quoteNumber, setQuoteNumber] = useState(() => genQuoteNumber(today, 1))

  const [clientChoice, setClientChoice] = useState<DevisClientChoice>({ mode: 'none' })
  const [clients, setClients] = useState<Array<{ id: string; name: string }>>([])

  const [lines, setLines] = useState<DevisLine[]>(() => [
    {
      id: '0',
      label: '',
      description: '',
      qty: 1,
      unitPriceHt: 0,
      vatRate: 20,
    },
  ])

  const [depositPercent, setDepositPercent] = useState(30)
  const [paymentDelayDays, setPaymentDelayDays] = useState(30)
  const [notes, setNotes] = useState('')

  // Load clients + user prefs for defaults
  useEffect(() => {
    ;(async () => {
      if (!supabase || !userId) return

      const [{ data: clientsData }, { data: profileData }] = await Promise.all([
        supabase.from('clients').select('id,name').order('created_at', { ascending: false }),
        supabase
          .from('profiles')
          .select('vat_enabled,deposit_percent,payment_delay_days,quote_validity_days')
          .eq('id', userId)
          .maybeSingle(),
      ])

      setClients((clientsData || []).map((c: any) => ({ id: c.id, name: c.name })))

      const vatEnabled = Boolean((profileData as any)?.vat_enabled)
      const defaultVat = vatEnabled ? 20 : 0
      setLines((prev) => prev.map((l) => ({ ...l, vatRate: defaultVat })))

      const dp = Number((profileData as any)?.deposit_percent)
      if (!Number.isNaN(dp) && dp >= 0) setDepositPercent(dp)
      const pd = Number((profileData as any)?.payment_delay_days)
      if (!Number.isNaN(pd) && pd >= 0) setPaymentDelayDays(pd)
      const vd = Number((profileData as any)?.quote_validity_days)
      if (!Number.isNaN(vd) && vd > 0) setValidityDays(vd)
    })()
  }, [supabase, userId])

  useEffect(() => {
    setQuoteNumber(genQuoteNumber(dateIssue, 1))
  }, [dateIssue])

  const totals = useMemo(() => computeTotals(lines), [lines])
  const depositAmount = useMemo(() => totals.totalTtc * ((depositPercent || 0) / 100), [totals.totalTtc, depositPercent])

  const validityUntil = useMemo(() => addDays(dateIssue, validityDays || 0), [dateIssue, validityDays])

  function updateLine(id: string, patch: Partial<DevisLine>) {
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)))
  }

  function addLine() {
    setLines((prev) => {
      const nextId = String(Date.now())
      const defaultVat = prev[0]?.vatRate ?? 20
      return [
        ...prev,
        {
          id: nextId,
          label: '',
          description: '',
          qty: 1,
          unitPriceHt: 0,
          vatRate: defaultVat,
        },
      ]
    })
  }

  function removeLine(id: string) {
    setLines((prev) => (prev.length <= 1 ? prev : prev.filter((l) => l.id !== id)))
  }

  const previewClientLabel = useMemo(() => {
    if (clientChoice.mode === 'existing') {
      const c = clients.find((x) => x.id === clientChoice.id)
      return c?.name || 'Client'
    }
    if (clientChoice.mode === 'new') return clientChoice.name || 'Nouveau client'
    return 'Aucun client sélectionné'
  }, [clientChoice, clients])

  async function generatePdf() {
    // placeholder for now – we'll wire real PDF generation next
    alert('PDF: prochaine étape. (La page Devis a été refaite comme demandé)')
  }

  return (
    <div className="devis-v4">
      <style jsx global>{`
        .devis-v4 {
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
          --blue: #1e40af;
          --blue-light: #dbeafe;
          --red: #ef4444;
        }

        .devis-v4 .devis-container {
          display: grid;
          grid-template-columns: 1fr 400px;
          gap: 32px;
          align-items: start;
        }

        .devis-v4 .card {
          background: var(--white);
          border-radius: 16px;
          padding: 28px;
          border: 1px solid var(--gray-200);
        }

        .devis-v4 .form-section {
          margin-bottom: 28px;
        }
        .devis-v4 .form-section:last-child {
          margin-bottom: 0;
        }

        .devis-v4 .form-section-title {
          font-size: 14px;
          font-weight: 600;
          color: var(--gray-500);
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 16px;
          padding-bottom: 8px;
          border-bottom: 1px solid var(--gray-200);
        }

        .devis-v4 .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 16px;
        }
        .devis-v4 .form-row.single {
          grid-template-columns: 1fr;
        }

        .devis-v4 .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .devis-v4 .form-label {
          font-size: 14px;
          font-weight: 500;
          color: var(--gray-700);
        }

        .devis-v4 .form-input,
        .devis-v4 .form-select,
        .devis-v4 .form-textarea {
          box-sizing: border-box;
          width: 100%;
          max-width: 100%;
          padding: 12px 14px;
          border: 1px solid var(--gray-300);
          border-radius: 10px;
          font-size: 14px;
          font-family: inherit;
          transition: all 0.2s;
          background: var(--white);
        }

        .devis-v4 .form-input:focus,
        .devis-v4 .form-select:focus,
        .devis-v4 .form-textarea:focus {
          outline: none;
          border-color: var(--yellow);
          box-shadow: 0 0 0 3px rgba(250, 204, 21, 0.15);
        }

        .devis-v4 .form-textarea {
          resize: vertical;
          min-height: 80px;
        }

        .devis-v4 .info-box {
          background: var(--blue-light);
          border-radius: 10px;
          padding: 14px 16px;
          display: flex;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 20px;
        }

        .devis-v4 .info-box svg {
          width: 20px;
          height: 20px;
          stroke: var(--blue);
          flex-shrink: 0;
          margin-top: 2px;
        }

        .devis-v4 .info-box p {
          font-size: 13px;
          color: var(--blue);
          line-height: 1.5;
        }

        .devis-v4 .prestations-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .devis-v4 .prestation-item {
          /* Important: override older global styles in this file that target .prestation-item */
          display: block;
          background: var(--gray-50);
          border-radius: 12px;
          padding: 20px;
          border: 1px solid var(--gray-200);
          position: relative;
        }

        .devis-v4 .prestation-item input.form-input,
        .devis-v4 .prestation-item select.form-select,
        .devis-v4 .prestation-item textarea.form-textarea {
          width: 100%;
          max-width: 100%;
        }

        .devis-v4 .prestation-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .devis-v4 .prestation-number {
          font-size: 13px;
          font-weight: 600;
          color: var(--gray-500);
        }

        .devis-v4 .prestation-remove {
          width: 28px;
          height: 28px;
          border: none;
          background: var(--red);
          color: var(--white);
          border-radius: 6px;
          cursor: pointer;
          font-size: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .devis-v4 .prestation-row {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr;
          gap: 12px;
          margin-bottom: 12px;
        }

        .devis-v4 .prestation-item .form-row.single {
          margin-top: 12px;
        }

        .devis-v4 .prestation-item .form-textarea {
          width: 100%;
          display: block;
        }

        .devis-v4 .btn-add-prestation {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 14px;
          background: var(--gray-100);
          border: 2px dashed var(--gray-300);
          border-radius: 10px;
          color: var(--gray-600);
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          width: 100%;
          font-family: inherit;
        }

        .devis-v4 .preview-card {
          position: sticky;
          top: 32px;
        }

        .devis-v4 .preview-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .devis-v4 .preview-title {
          font-family: 'Syne', sans-serif;
          font-size: 18px;
          font-weight: 600;
          color: var(--black);
        }

        .devis-v4 .preview-badge {
          background: var(--blue-light);
          color: var(--blue);
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
        }

        .devis-v4 .preview-section {
          margin-bottom: 20px;
          padding-bottom: 16px;
          border-bottom: 1px solid var(--gray-200);
        }

        .devis-v4 .preview-section-title {
          font-size: 12px;
          font-weight: 600;
          color: var(--gray-400);
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 8px;
        }

        .devis-v4 .preview-info {
          font-size: 14px;
          color: var(--gray-700);
        }

        .devis-v4 .preview-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          font-size: 14px;
        }

        .devis-v4 .preview-row.total {
          font-weight: 600;
          font-size: 16px;
          color: var(--black);
          border-top: 2px solid var(--gray-200);
          margin-top: 8px;
          padding-top: 12px;
        }

        .devis-v4 .btn-group {
          display: flex;
          gap: 12px;
          margin-top: 24px;
        }

        .devis-v4 .btn {
          flex: 1;
          padding: 14px 20px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          font-family: inherit;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          border: none;
        }

        .devis-v4 .btn-primary {
          background: var(--black);
          color: var(--white);
        }

        .devis-v4 .btn-secondary {
          background: var(--gray-100);
          color: var(--gray-700);
        }

        @media (max-width: 1200px) {
          .devis-v4 .devis-container {
            grid-template-columns: 1fr;
          }
          .devis-v4 .preview-card {
            position: static;
          }
        }

        @media (max-width: 768px) {
          .devis-v4 .prestation-row {
            grid-template-columns: 1fr 1fr;
          }
          .devis-v4 .form-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="devis-container">
        <div className="form-wrapper">
          <div className="card">
            <div className="info-box">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4M12 8h.01" />
              </svg>
              <p>
                Vos informations (nom, adresse, SIRET) sont automatiquement récupérées depuis votre profil.
              </p>
            </div>

            <div className="form-section">
              <div className="form-section-title">Informations du devis</div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Titre du devis</label>
                  <input
                    type="text"
                    className="form-input"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: Création site vitrine"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Numéro du devis</label>
                  <input
                    type="text"
                    className="form-input"
                    value={quoteNumber}
                    readOnly
                    style={{ background: 'var(--gray-100)' }}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Date d'émission</label>
                  <input
                    type="date"
                    className="form-input"
                    value={dateIssue}
                    onChange={(e) => setDateIssue(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Validité (jours)</label>
                  <select
                    className="form-select"
                    value={String(validityDays)}
                    onChange={(e) => setValidityDays(Number(e.target.value))}
                  >
                    <option value="15">15 jours</option>
                    <option value="30">30 jours</option>
                    <option value="60">60 jours</option>
                    <option value="90">90 jours</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="form-section">
              <div className="form-section-title">Client</div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Sélectionner un client</label>
                  <select
                    className="form-select"
                    value={
                      clientChoice.mode === 'existing'
                        ? clientChoice.id
                        : clientChoice.mode === 'new'
                          ? 'new'
                          : ''
                    }
                    onChange={(e) => {
                      const v = e.target.value
                      if (v === 'new') {
                        setClientChoice({ mode: 'new', name: '' })
                      } else if (v) {
                        setClientChoice({ mode: 'existing', id: v })
                      } else {
                        setClientChoice({ mode: 'none' })
                      }
                    }}
                  >
                    <option value="">-- Choisir un client existant --</option>
                    {(clients || []).map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                    <option value="new">+ Nouveau client</option>
                  </select>
                </div>
              </div>

              {clientChoice.mode === 'new' ? (
                <>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Nom / Entreprise</label>
                      <input
                        type="text"
                        className="form-input"
                        value={clientChoice.name}
                        onChange={(e) => setClientChoice({ ...clientChoice, name: e.target.value })}
                        placeholder="Nom ou raison sociale"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">SIRET (optionnel)</label>
                      <input
                        type="text"
                        className="form-input"
                        value={clientChoice.siret || ''}
                        onChange={(e) => setClientChoice({ ...clientChoice, siret: e.target.value })}
                        placeholder="123 456 789 00012"
                      />
                    </div>
                  </div>
                  <div className="form-row single">
                    <div className="form-group">
                      <label className="form-label">Adresse</label>
                      <input
                        type="text"
                        className="form-input"
                        value={clientChoice.address || ''}
                        onChange={(e) => setClientChoice({ ...clientChoice, address: e.target.value })}
                        placeholder="Adresse complète"
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Code postal</label>
                      <input
                        type="text"
                        className="form-input"
                        value={clientChoice.postalCode || ''}
                        onChange={(e) => setClientChoice({ ...clientChoice, postalCode: e.target.value })}
                        placeholder="75000"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Ville</label>
                      <input
                        type="text"
                        className="form-input"
                        value={clientChoice.city || ''}
                        onChange={(e) => setClientChoice({ ...clientChoice, city: e.target.value })}
                        placeholder="Paris"
                      />
                    </div>
                  </div>
                </>
              ) : null}
            </div>

            <div className="form-section">
              <div className="form-section-title">Prestations</div>
              <div className="prestations-list">
                {lines.map((l, idx) => (
                  <div key={l.id} className="prestation-item">
                    <div className="prestation-header">
                      <span className="prestation-number">Prestation {idx + 1}</span>
                      <button
                        type="button"
                        className="prestation-remove"
                        onClick={() => removeLine(l.id)}
                        style={{ display: lines.length > 1 ? 'flex' : 'none' }}
                      >
                        ×
                      </button>
                    </div>
                    <div className="prestation-row">
                      <div className="form-group">
                        <label className="form-label">Libellé</label>
                        <input
                          type="text"
                          className="form-input"
                          value={l.label}
                          onChange={(e) => updateLine(l.id, { label: e.target.value })}
                          placeholder="Nom de la prestation"
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Quantité</label>
                        <input
                          type="number"
                          className="form-input"
                          value={String(l.qty)}
                          min={1}
                          onChange={(e) => updateLine(l.id, { qty: Number(e.target.value) || 0 })}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Prix unitaire HT</label>
                        <input
                          type="number"
                          className="form-input"
                          value={String(l.unitPriceHt)}
                          step={0.01}
                          onChange={(e) => updateLine(l.id, { unitPriceHt: Number(e.target.value) || 0 })}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">TVA %</label>
                        <select
                          className="form-select"
                          value={String(l.vatRate)}
                          onChange={(e) => updateLine(l.id, { vatRate: Number(e.target.value) || 0 })}
                        >
                          <option value="0">0%</option>
                          <option value="5.5">5.5%</option>
                          <option value="10">10%</option>
                          <option value="20">20%</option>
                        </select>
                      </div>
                    </div>
                    <div className="form-row single">
                      <div className="form-group">
                        <label className="form-label">Description (optionnel)</label>
                        <textarea
                          className="form-textarea"
                          value={l.description}
                          onChange={(e) => updateLine(l.id, { description: e.target.value })}
                          placeholder="Détails de la prestation..."
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button type="button" className="btn-add-prestation" onClick={addLine}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                Ajouter une prestation
              </button>
            </div>

            <div className="form-section">
              <div className="form-section-title">Options</div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Acompte demandé</label>
                  <select
                    className="form-select"
                    value={String(depositPercent)}
                    onChange={(e) => setDepositPercent(Number(e.target.value) || 0)}
                  >
                    <option value="0">Pas d'acompte</option>
                    <option value="30">30%</option>
                    <option value="50">50%</option>
                    <option value="100">100%</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Délai de paiement</label>
                  <select
                    className="form-select"
                    value={String(paymentDelayDays)}
                    onChange={(e) => setPaymentDelayDays(Number(e.target.value) || 0)}
                  >
                    <option value="0">À réception</option>
                    <option value="15">15 jours</option>
                    <option value="30">30 jours</option>
                    <option value="45">45 jours</option>
                  </select>
                </div>
              </div>
              <div className="form-row single">
                <div className="form-group">
                  <label className="form-label">Notes / Conditions particulières (optionnel)</label>
                  <textarea
                    className="form-textarea"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Conditions spécifiques au devis..."
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="preview-card card">
          <div className="preview-header">
            <span className="preview-title">Récapitulatif</span>
            <span className="preview-badge">Brouillon</span>
          </div>

          <div className="preview-section">
            <div className="preview-section-title">Devis</div>
            <p className="preview-info">
              <strong>{quoteNumber}</strong>
            </p>
            <p className="preview-info">{title || '-'}</p>
            <p className="preview-info" style={{ marginTop: 8 }}>
              Émis le {formatDateFr(dateIssue) || '-'}
              {validityUntil ? ` · Valide jusqu'au ${formatDateFr(validityUntil)}` : ''}
            </p>
          </div>

          <div className="preview-section">
            <div className="preview-section-title">Client</div>
            <p className="preview-info">{previewClientLabel}</p>
          </div>

          <div className="preview-section">
            <div className="preview-section-title">Montants</div>
            <div className="preview-row">
              <span className="label">Sous-total HT</span>
              <span className="value">{formatMoney(totals.totalHt)}</span>
            </div>
            <div className="preview-row">
              <span className="label">TVA</span>
              <span className="value">{formatMoney(totals.totalTva)}</span>
            </div>
            <div className="preview-row total">
              <span className="label">Total TTC</span>
              <span className="value">{formatMoney(totals.totalTtc)}</span>
            </div>
            {depositPercent > 0 && depositPercent < 100 ? (
              <div className="preview-row">
                <span className="label">Acompte à verser</span>
                <span className="value">{formatMoney(depositAmount)}</span>
              </div>
            ) : null}
          </div>

          <div className="btn-group">
            <button className="btn btn-secondary" type="button" onClick={() => alert('Email: à connecter')}
            >
              Envoyer par mail
            </button>
            <button className="btn btn-primary" type="button" onClick={generatePdf}>
              Générer PDF
            </button>
          </div>

          <div style={{ marginTop: 16, fontSize: 12, color: 'var(--gray-500)' }}>
            Généré pour {userFullName || 'Utilisateur'} {userJob ? `· ${userJob}` : ''}
          </div>
        </div>
      </div>
    </div>
  )
}

type Tab = 'dashboard' | 'clients' | 'assistant' | 'devis' | 'analyseur' | 'settings'

type ModalName = 'newClient' | 'newDevis'

type Tone = 'pro' | 'chaleureux' | 'formel'

type Template =
  | 'Réponse'
  | 'Relance'
  | 'Relance devis'
  | 'Négociation'
  | 'Refus poli'
  | 'Facture'

type ClientRow = {
  id: string
  name: string
  email: string | null
  phone: string | null
  notes: string | null
}

export default function AppHtmlPage() {
  const [tab, setTab] = useState<Tab>('dashboard')
  const [modal, setModal] = useState<ModalName | null>(null)
  const [tone, setTone] = useState<Tone>('pro')
  const [template, setTemplate] = useState<Template>('Réponse')

  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  const supabase = useMemo(() => {
    try {
      return getSupabase()
    } catch {
      return null
    }
  }, [])

  const [userFullName, setUserFullName] = useState<string>('')
  const [userPlan, setUserPlan] = useState<string>('Plan Free')
  const [userJob, setUserJob] = useState<string>('')
  const [userDefaultTone, setUserDefaultTone] = useState<string>('')

  const [clients, setClients] = useState<ClientRow[]>([])
  const [selectedClientId, setSelectedClientId] = useState<string>('')

  const [assistantContext, setAssistantContext] = useState<string>('')
  const [assistantOutput, setAssistantOutput] = useState<string>('')

  // Ensure authenticated session for the app
  useEffect(() => {
    ;(async () => {
      if (!supabase) return
      const { data } = await supabase.auth.getSession()
      if (!data.session?.user) {
        window.location.href = 'connexion.html'
        return
      }
      setUserId(data.session.user.id)
    })()
  }, [supabase])

  // Load profile + clients
  useEffect(() => {
    ;(async () => {
      if (!supabase || !userId) return
      try {
        setLoading(true)

        const { data: profile } = await supabase
          .from('profiles')
          .select('first_name,last_name,job,email_tone')
          .eq('id', userId)
          .maybeSingle()

        const full = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ').trim()
        setUserFullName(full || 'Utilisateur')
        setUserJob(String((profile as any)?.job || ''))
        setUserDefaultTone(String((profile as any)?.email_tone || ''))

        const { data: clientsData, error: clientsError } = await supabase
          .from('clients')
          .select('id,name,email,phone,notes')
          .order('created_at', { ascending: false })

        if (clientsError) throw clientsError
        setClients((clientsData || []) as ClientRow[])
      } finally {
        setLoading(false)
      }
    })()
  }, [supabase, userId])

  const initials = useMemo(() => {
    const parts = userFullName.split(' ').filter(Boolean)
    const a = parts[0]?.[0] ?? 'U'
    const b = parts[1]?.[0] ?? ''
    return (a + b).toUpperCase()
  }, [userFullName])

  async function refreshClients() {
    if (!supabase) return
    const { data, error } = await supabase
      .from('clients')
      .select('id,name,email,phone,notes')
      .order('created_at', { ascending: false })
    if (!error) setClients((data || []) as ClientRow[])
  }

  async function generateAssistantEmail() {
    try {
      setLoading(true)
      setAssistantOutput('')

      const client = clients.find((c) => c.id === selectedClientId)

      const toneLabel =
        tone === 'pro' ? 'professionnel' : tone === 'chaleureux' ? 'chaleureux' : 'formel'

      const prenom = userFullName.split(' ').filter(Boolean)[0] || 'Utilisateur'
      const metier = userJob || 'Freelance'
      const tonPrefere = userDefaultTone || 'professionnel'

      const system = `Tu es l'assistant email de Spyke, un outil pour freelances français.

Tu génères des emails professionnels en français.

RÈGLES :
- Sois concis, pas de blabla inutile
- Adapte le ton selon ce qui est demandé (professionnel, chaleureux, formel, décontracté)
- Utilise le nom du client si fourni
- Ne mets jamais de placeholders comme [Nom] ou [Date], écris directement
- Termine toujours par une formule de politesse adaptée au ton
- Ne mets pas d'objet sauf si demandé
- Écris uniquement l'email, rien d'autre (pas d'explication, pas de commentaire)
- Ne signe jamais “Spyke” ou “Spyke assistance IA”. La signature doit être celle du freelance.

LONGUEUR : Adapte la longueur au contexte.
- Relance / message simple → court (4-6 lignes)
- Réponse détaillée / négociation / explication → plus long si nécessaire

CONTEXTE UTILISATEUR :
- Prénom : ${prenom}
- Métier : ${metier}
- Ton préféré par défaut : ${tonPrefere}`

      const prompt = [
        `Type d'email: ${template}`,
        `Ton: ${toneLabel}`,
        client ? `Client: ${client.name}${client.email ? ` (${client.email})` : ''}` : '',
        `Contexte: ${assistantContext || '(vide)'}`,
        '',
        'Rédige l\'email final.',
      ]
        .filter(Boolean)
        .join('\n')

      const res = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ prompt, system }),
      })
      const json = await res.json().catch(() => null)
      if (!res.ok) throw new Error(json?.error || `Erreur IA (${res.status})`)

      setAssistantOutput(String(json?.text || '').trim())
    } catch (e: any) {
      alert(e?.message || 'Erreur IA')
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
          --red-light: #fee2e2;
          --blue: #3b82f6;
          --blue-light: #dbeafe;
          --sidebar-width: 260px;
        }

        html,
        body {
          height: 100%;
        }

        body {
          font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
          background: var(--gray-50);
          color: var(--gray-900);
          line-height: 1.6;
          -webkit-font-smoothing: antialiased;
          display: flex;
        }

        /* ===== SIDEBAR ===== */
        .sidebar {
          width: var(--sidebar-width);
          height: 100vh;
          background: var(--black);
          padding: 24px 16px;
          display: flex;
          flex-direction: column;
          position: fixed;
          left: 0;
          top: 0;
        }

        .sidebar-logo {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 0 12px;
          margin-bottom: 40px;
        }

        .sidebar-logo-icon {
          width: 40px;
          height: 40px;
          background: var(--yellow);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .sidebar-logo-icon svg {
          width: 22px;
          height: 22px;
          fill: var(--black);
        }

        .sidebar-logo-text {
          font-family: 'Syne', sans-serif;
          font-size: 24px;
          font-weight: 700;
          color: var(--white);
        }

        .sidebar-nav {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px 16px;
          border-radius: 12px;
          color: var(--gray-400);
          text-decoration: none;
          font-size: 15px;
          font-weight: 500;
          transition: all 0.2s ease;
          cursor: pointer;
          border: none;
          background: transparent;
          text-align: left;
        }

        .nav-item:hover {
          background: var(--gray-800);
          color: var(--white);
        }

        .nav-item.active {
          background: var(--yellow);
          color: var(--black);
        }

        .nav-item.active svg {
          stroke: var(--black);
        }

        .nav-item svg {
          width: 20px;
          height: 20px;
          stroke: currentColor;
          fill: none;
          stroke-width: 2;
        }

        .nav-section-title {
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: var(--gray-600);
          padding: 24px 16px 12px;
        }

        .sidebar-footer {
          padding-top: 24px;
          border-top: 1px solid var(--gray-800);
        }

        .user-profile {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          border-radius: 12px;
          cursor: pointer;
          transition: background 0.2s ease;
          border: none;
          background: transparent;
          width: 100%;
          text-align: left;
        }

        .user-profile:hover {
          background: var(--gray-800);
        }

        .user-avatar {
          width: 40px;
          height: 40px;
          background: var(--yellow);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Syne', sans-serif;
          font-size: 14px;
          font-weight: 700;
          color: var(--black);
        }

        .user-info h4 {
          font-size: 14px;
          font-weight: 600;
          color: var(--white);
        }

        .user-info p {
          font-size: 12px;
          color: var(--gray-500);
        }

        /* ===== MAIN CONTENT ===== */
        .main-content {
          flex: 1;
          margin-left: var(--sidebar-width);
          padding: 32px 40px;
          min-height: 100vh;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 32px;
          gap: 16px;
        }

        .page-title {
          font-family: 'Syne', sans-serif;
          font-size: 32px;
          font-weight: 700;
          color: var(--black);
        }

        .page-subtitle {
          font-size: 15px;
          color: var(--gray-500);
          margin-top: 4px;
        }

        .header-actions {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        /* ===== BUTTONS ===== */
        .btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          font-family: inherit;
          cursor: pointer;
          transition: all 0.2s ease;
          border: none;
          text-decoration: none;
        }

        .btn-primary {
          background: var(--black);
          color: var(--white);
        }

        .btn-primary:hover {
          background: var(--gray-800);
          transform: translateY(-2px);
        }

        .btn-secondary {
          background: var(--white);
          color: var(--gray-700);
          border: 2px solid var(--gray-200);
        }

        .btn-secondary:hover {
          border-color: var(--gray-300);
          background: var(--gray-50);
        }

        .btn-yellow {
          background: var(--yellow);
          color: var(--black);
        }

        .btn-yellow:hover {
          background: var(--yellow-dark);
        }

        .btn svg {
          width: 18px;
          height: 18px;
        }

        /* ===== STATS CARDS ===== */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
          margin-bottom: 32px;
        }

        .stat-card {
          background: var(--white);
          border-radius: 16px;
          padding: 24px;
          border: 1px solid var(--gray-200);
          transition: all 0.3s ease;
        }

        .stat-card:hover {
          border-color: var(--gray-300);
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
        }

        .stat-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 16px;
        }

        .stat-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .stat-icon.yellow {
          background: var(--yellow-light);
        }

        .stat-icon.green {
          background: var(--green-light);
        }

        .stat-icon.blue {
          background: var(--blue-light);
        }

        .stat-icon.red {
          background: var(--red-light);
        }

        .stat-icon svg {
          width: 24px;
          height: 24px;
          stroke-width: 2;
        }

        .stat-icon.yellow svg {
          stroke: var(--yellow-dark);
        }
        .stat-icon.green svg {
          stroke: var(--green);
        }
        .stat-icon.blue svg {
          stroke: var(--blue);
        }
        .stat-icon.red svg {
          stroke: var(--red);
        }

        .stat-value {
          font-family: 'Syne', sans-serif;
          font-size: 32px;
          font-weight: 700;
          color: var(--black);
          margin-bottom: 4px;
        }

        .stat-label {
          font-size: 14px;
          color: var(--gray-500);
        }

        /* ===== CARDS ===== */
        .cards-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
          margin-bottom: 32px;
        }

        .card {
          background: var(--white);
          border-radius: 16px;
          padding: 24px;
          border: 1px solid var(--gray-200);
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .card-title {
          font-family: 'Syne', sans-serif;
          font-size: 18px;
          font-weight: 600;
          color: var(--black);
        }

        .card-action {
          font-size: 13px;
          color: var(--gray-500);
          text-decoration: none;
          font-weight: 500;
          transition: color 0.2s ease;
        }

        .card-action:hover {
          color: var(--black);
        }

        /* ===== QUICK ACTIONS ===== */
        .quick-actions {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }

        .quick-action {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 16px;
          background: var(--gray-50);
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          border: 1px solid transparent;
        }

        .quick-action:hover {
          background: var(--white);
          border-color: var(--gray-200);
          transform: translateY(-2px);
        }

        .quick-action-icon {
          width: 44px;
          height: 44px;
          background: var(--black);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          color: var(--white);
        }

        .quick-action-text h4 {
          font-size: 14px;
          font-weight: 600;
          color: var(--black);
          margin-bottom: 2px;
        }

        .quick-action-text p {
          font-size: 12px;
          color: var(--gray-500);
        }

        /* ===== EMPTY STATE ===== */
        .empty-state {
          text-align: center;
          padding: 40px 20px;
          color: var(--gray-400);
        }

        .empty-state-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }

        .empty-state h4 {
          font-size: 16px;
          font-weight: 600;
          color: var(--gray-600);
          margin-bottom: 8px;
        }

        .empty-state p {
          font-size: 14px;
          color: var(--gray-400);
        }

        /* ===== TAB CONTENT ===== */
        .tab-content {
          display: none;
        }

        .tab-content.active {
          display: block;
        }

        /* ===== CLIENTS TAB ===== */
        .clients-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }

        /* ===== ASSISTANT IA TAB ===== */
        .assistant-container {
          display: grid;
          grid-template-columns: 300px 1fr;
          gap: 24px;
        }

        .assistant-sidebar {
          background: var(--white);
          border-radius: 16px;
          padding: 24px;
          border: 1px solid var(--gray-200);
        }

        .assistant-sidebar h3 {
          font-family: 'Syne', sans-serif;
          font-size: 16px;
          font-weight: 600;
          color: var(--black);
          margin-bottom: 16px;
        }

        .template-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .template-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 14px;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.2s ease;
          border: 1px solid transparent;
          background: transparent;
        }

        .template-item:hover {
          background: var(--gray-50);
        }

        .template-item.active {
          background: var(--yellow-light);
          border-color: var(--yellow);
        }

        .template-item-icon {
          font-size: 18px;
        }

        .template-item-text {
          font-size: 14px;
          font-weight: 500;
          color: var(--gray-700);
        }

        .template-item.active .template-item-text {
          color: var(--black);
          font-weight: 600;
        }

        .assistant-main {
          background: var(--white);
          border-radius: 16px;
          padding: 32px;
          border: 1px solid var(--gray-200);
        }

        .assistant-form {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .form-label {
          font-size: 14px;
          font-weight: 600;
          color: var(--gray-700);
        }

        .form-input,
        .form-select,
        .form-textarea {
          padding: 14px 18px;
          border: 2px solid var(--gray-200);
          border-radius: 12px;
          font-size: 15px;
          font-family: inherit;
          transition: all 0.2s ease;
          background: var(--white);
        }

        .form-input:focus,
        .form-select:focus,
        .form-textarea:focus {
          outline: none;
          border-color: var(--yellow);
          box-shadow: 0 0 0 4px rgba(250, 204, 21, 0.15);
        }

        .form-textarea {
          min-height: 150px;
          resize: vertical;
        }

        .form-row {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }

        .tone-selector {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .tone-option {
          flex: 1;
          padding: 12px;
          text-align: center;
          border: 2px solid var(--gray-200);
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 14px;
          font-weight: 500;
          background: var(--white);
          min-width: 100px;
        }

        .tone-option:hover {
          border-color: var(--gray-300);
        }

        .tone-option.active {
          border-color: var(--yellow);
          background: var(--yellow-light);
        }

        .output-box {
          background: var(--gray-50);
          border-radius: 12px;
          padding: 24px;
          min-height: 200px;
          border: 1px solid var(--gray-200);
        }

        .output-box.empty {
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--gray-400);
          font-size: 15px;
        }

        .output-actions {
          display: flex;
          gap: 12px;
          margin-top: 16px;
          flex-wrap: wrap;
        }

        /* ===== DEVIS TAB ===== */
        .devis-container {
          display: grid;
          grid-template-columns: 1fr 360px;
          gap: 24px;
        }

        .devis-form {
          background: var(--white);
          border-radius: 16px;
          padding: 32px;
          border: 1px solid var(--gray-200);
        }

        .devis-section {
          margin-bottom: 32px;
        }

        .devis-section:last-child {
          margin-bottom: 0;
        }

        .devis-section-title {
          font-family: 'Syne', sans-serif;
          font-size: 18px;
          font-weight: 600;
          color: var(--black);
          margin-bottom: 20px;
          padding-bottom: 12px;
          border-bottom: 1px solid var(--gray-100);
        }

        .prestation-item {
          display: grid;
          grid-template-columns: 1fr 100px 100px 40px;
          gap: 12px;
          margin-bottom: 12px;
          align-items: center;
        }

        .prestation-item input {
          padding: 12px 14px;
          border: 2px solid var(--gray-200);
          border-radius: 10px;
          font-size: 14px;
          font-family: inherit;
        }

        .prestation-item input:focus {
          outline: none;
          border-color: var(--yellow);
        }

        .btn-remove {
          width: 40px;
          height: 40px;
          border: none;
          background: var(--red-light);
          color: var(--red);
          border-radius: 10px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .btn-remove:hover {
          background: var(--red);
          color: var(--white);
        }

        .btn-add-prestation {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          padding: 14px;
          border: 2px dashed var(--gray-300);
          border-radius: 12px;
          background: transparent;
          color: var(--gray-500);
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-add-prestation:hover {
          border-color: var(--yellow);
          color: var(--yellow-dark);
          background: var(--yellow-light);
        }

        .devis-preview {
          background: var(--white);
          border-radius: 16px;
          padding: 24px;
          border: 1px solid var(--gray-200);
          position: sticky;
          top: 32px;
        }

        .preview-title {
          font-family: 'Syne', sans-serif;
          font-size: 18px;
          font-weight: 600;
          color: var(--black);
          margin-bottom: 20px;
        }

        .preview-row {
          display: flex;
          justify-content: space-between;
          padding: 12px 0;
          border-bottom: 1px solid var(--gray-100);
          font-size: 14px;
        }

        .preview-row:last-child {
          border-bottom: none;
        }

        .preview-row.total {
          font-family: 'Syne', sans-serif;
          font-size: 18px;
          font-weight: 600;
          color: var(--black);
          padding-top: 16px;
          margin-top: 8px;
          border-top: 2px solid var(--gray-200);
          border-bottom: none;
        }

        .preview-label {
          color: var(--gray-500);
        }

        .preview-value {
          font-weight: 600;
          color: var(--gray-900);
        }

        /* ===== MODAL ===== */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: none;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          backdrop-filter: blur(4px);
        }

        .modal-overlay.active {
          display: flex;
        }

        .modal {
          background: var(--white);
          border-radius: 20px;
          padding: 32px;
          width: 90%;
          max-width: 500px;
          max-height: 85vh;
          overflow-y: auto;
          animation: modalSlideIn 0.3s ease;
        }

        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          gap: 16px;
        }

        .modal-title {
          font-family: 'Syne', sans-serif;
          font-size: 22px;
          font-weight: 600;
          color: var(--black);
        }

        .modal-close {
          width: 36px;
          height: 36px;
          border: none;
          background: var(--gray-100);
          border-radius: 10px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          color: var(--gray-500);
          transition: all 0.2s ease;
        }

        .modal-close:hover {
          background: var(--gray-200);
          color: var(--black);
        }

        .modal-body {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .modal-actions {
          display: flex;
          gap: 12px;
          margin-top: 8px;
          flex-wrap: wrap;
        }

        .modal-actions .btn {
          flex: 1;
          min-width: 160px;
        }

        /* ===== RESPONSIVE ===== */
        @media (max-width: 1200px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .clients-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .assistant-container {
            grid-template-columns: 1fr;
          }

          .assistant-sidebar {
            display: none;
          }

          .devis-container {
            grid-template-columns: 1fr;
          }

          .devis-preview {
            position: static;
          }
        }

        @media (max-width: 768px) {
          .sidebar {
            transform: translateX(-100%);
          }

          .main-content {
            margin-left: 0;
            padding: 24px 20px;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }

          .cards-grid {
            grid-template-columns: 1fr;
          }

          .clients-grid {
            grid-template-columns: 1fr;
          }

          .quick-actions {
            grid-template-columns: 1fr;
          }

          .form-row {
            grid-template-columns: 1fr;
          }

          .prestation-item {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <svg viewBox="0 0 24 24">
              <path d="M13 3L4 14h7l-2 7 9-11h-7l2-7z" />
            </svg>
          </div>
          <span className="sidebar-logo-text">Spyke</span>
        </div>

        <nav className="sidebar-nav">
          <button className={`nav-item ${tab === 'dashboard' ? 'active' : ''}`} onClick={() => setTab('dashboard')}>
            <svg viewBox="0 0 24 24">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            Dashboard
          </button>

          <button className={`nav-item ${tab === 'clients' ? 'active' : ''}`} onClick={() => setTab('clients')}>
            <svg viewBox="0 0 24 24">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 00-3-3.87" />
              <path d="M16 3.13a4 4 0 010 7.75" />
            </svg>
            Clients
          </button>

          <button className={`nav-item ${tab === 'assistant' ? 'active' : ''}`} onClick={() => setTab('assistant')}>
            <svg viewBox="0 0 24 24">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            </svg>
            Assistant IA
          </button>

          <button className={`nav-item ${tab === 'devis' ? 'active' : ''}`} onClick={() => setTab('devis')}>
            <svg viewBox="0 0 24 24">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            Devis
          </button>

          <span className="nav-section-title">Outils</span>

          <button className={`nav-item ${tab === 'analyseur' ? 'active' : ''}`} onClick={() => setTab('analyseur')}>
            <svg viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            Analyseur de projet
          </button>
        </nav>

        <div className="sidebar-footer">
          <button className="user-profile" onClick={() => setTab('settings')}>
            <div className="user-avatar">{initials}</div>
            <div className="user-info">
              <h4>{userFullName}</h4>
              <p>{userPlan}</p>
            </div>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {/* Dashboard */}
        <div id="tab-dashboard" className={`tab-content ${tab === 'dashboard' ? 'active' : ''}`}> 
          <div className="page-header">
            <div>
              <h1 className="page-title">Dashboard</h1>
              <p className="page-subtitle">Bienvenue, {userFullName.split(' ')[0] || userFullName} 👋</p>
            </div>
            <div className="header-actions">
              <button className="btn btn-secondary" type="button">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Exporter
              </button>
              <button className="btn btn-primary" type="button" onClick={() => setModal('newDevis')}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Nouveau devis
              </button>
            </div>
          </div>

          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-header">
                <div className="stat-icon yellow">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
                  </svg>
                </div>
              </div>
              <div className="stat-value">0 €</div>
              <div className="stat-label">CA ce mois</div>
            </div>

            <div className="stat-card">
              <div className="stat-header">
                <div className="stat-icon green">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </div>
              </div>
              <div className="stat-value">0%</div>
              <div className="stat-label">Taux de conversion</div>
            </div>

            <div className="stat-card">
              <div className="stat-header">
                <div className="stat-icon blue">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                  </svg>
                </div>
              </div>
              <div className="stat-value">0</div>
              <div className="stat-label">Clients actifs</div>
            </div>

            <div className="stat-card">
              <div className="stat-header">
                <div className="stat-icon red">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                    <path d="M14 2v6h6" />
                  </svg>
                </div>
              </div>
              <div className="stat-value">0</div>
              <div className="stat-label">Devis en attente</div>
            </div>
          </div>

          <div className="cards-grid">
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">🔔 Relances suggérées</h3>
              </div>
              <div className="empty-state" style={{ padding: 24 }}>
                <p>Aucune relance nécessaire 👍</p>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h3 className="card-title">⚡ Actions rapides</h3>
              </div>
              <div className="quick-actions">
                <div className="quick-action" onClick={() => setTab('assistant')}>
                  <div className="quick-action-icon">✉️</div>
                  <div className="quick-action-text">
                    <h4>Nouvel email</h4>
                    <p>Générer avec l&apos;IA</p>
                  </div>
                </div>
                <div className="quick-action" onClick={() => setTab('devis')}>
                  <div className="quick-action-icon">📄</div>
                  <div className="quick-action-text">
                    <h4>Nouveau devis</h4>
                    <p>Créer en 2 min</p>
                  </div>
                </div>
                <div className="quick-action" onClick={() => setModal('newClient')}>
                  <div className="quick-action-icon">👤</div>
                  <div className="quick-action-text">
                    <h4>Ajouter client</h4>
                    <p>Nouveau contact</p>
                  </div>
                </div>
                <div className="quick-action" onClick={() => alert('Factures: bientôt')}>
                  <div className="quick-action-icon">💰</div>
                  <div className="quick-action-text">
                    <h4>Nouvelle facture</h4>
                    <p>Facturer un client</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="card-title">📄 Devis récents</h3>
              <a
                href="#"
                className="card-action"
                onClick={(e) => {
                  e.preventDefault()
                  setTab('devis')
                }}
              >
                Tout voir
              </a>
            </div>
            <div className="empty-state" style={{ padding: 24 }}>
              <p>Aucun devis pour le moment</p>
            </div>
          </div>
        </div>

        {/* Clients */}
        <div id="tab-clients" className={`tab-content ${tab === 'clients' ? 'active' : ''}`}>
          <div className="page-header">
            <div>
              <h1 className="page-title">Clients</h1>
              <p className="page-subtitle">Gérez votre portefeuille clients</p>
            </div>
            <div className="header-actions">
              <button className="btn btn-primary" type="button" onClick={() => setModal('newClient')}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Ajouter un client
              </button>
            </div>
          </div>

          <div className="clients-grid">
            {clients.length === 0 ? (
              <div className="card" style={{ gridColumn: '1 / -1' }}>
                <div className="empty-state">
                  <div className="empty-state-icon">👥</div>
                  <h4>Aucun client</h4>
                  <p>Ajoutez votre premier client pour commencer</p>
                  <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setModal('newClient')}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Ajouter un client
                  </button>
                </div>
              </div>
            ) : (
              clients.map((c) => (
                <div key={c.id} className="card" style={{ cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <div>
                      <div className="card-title">{c.name}</div>
                      <div style={{ fontSize: 13, color: 'var(--gray-500)', marginTop: 6 }}>
                        {c.email || '—'}
                        {c.phone ? ` · ${c.phone}` : ''}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedClientId(c.id)
                        setTab('assistant')
                      }}
                    >
                      ✉️ Email
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Assistant */}
        <div id="tab-assistant" className={`tab-content ${tab === 'assistant' ? 'active' : ''}`}>
          <div className="page-header">
            <div>
              <h1 className="page-title">Assistant IA</h1>
              <p className="page-subtitle">Générez des emails professionnels en quelques secondes</p>
            </div>
          </div>

          <div className="assistant-container">
            <div className="assistant-sidebar">
              <h3>Type d&apos;email</h3>
              <div className="template-list">
                {([
                  ['💬', 'Réponse'],
                  ['✉️', 'Relance'],
                  ['💰', 'Relance devis'],
                  ['🤝', 'Négociation'],
                  ['🚫', 'Refus poli'],
                  ['🧾', 'Facture'],
                ] as Array<[string, Template]>).map(([icon, label]) => (
                  <div
                    key={label}
                    className={`template-item ${template === label ? 'active' : ''}`}
                    onClick={() => setTemplate(label)}
                  >
                    <span className="template-item-icon">{icon}</span>
                    <span className="template-item-text">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="assistant-main">
              <form className="assistant-form" onSubmit={(e) => e.preventDefault()}>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Client</label>
                    <select
                      className="form-select"
                      value={selectedClientId}
                      onChange={(e) => setSelectedClientId(e.target.value)}
                    >
                      <option value="">Sélectionner un client</option>
                      {clients.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Ton</label>
                    <div className="tone-selector">
                      <div className={`tone-option ${tone === 'pro' ? 'active' : ''}`} onClick={() => setTone('pro')}>
                        Pro
                      </div>
                      <div
                        className={`tone-option ${tone === 'chaleureux' ? 'active' : ''}`}
                        onClick={() => setTone('chaleureux')}
                      >
                        Chaleureux
                      </div>
                      <div className={`tone-option ${tone === 'formel' ? 'active' : ''}`} onClick={() => setTone('formel')}>
                        Formel
                      </div>
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Contexte</label>
                  <textarea
                    className="form-textarea"
                    placeholder="Décrivez la situation, ce que vous souhaitez communiquer..."
                    value={assistantContext}
                    onChange={(e) => setAssistantContext(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Type</label>
                  <div className="template-list">
                    {([
                      ['💬', 'Réponse'],
                      ['✉️', 'Relance'],
                      ['💰', 'Relance devis'],
                      ['🤝', 'Négociation'],
                      ['🚫', 'Refus poli'],
                      ['🧾', 'Facture'],
                    ] as Array<[string, Template]>).map(([icon, label]) => (
                      <div
                        key={label}
                        className={`template-item ${template === label ? 'active' : ''}`}
                        onClick={() => setTemplate(label)}
                      >
                        <span className="template-item-icon">{icon}</span>
                        <span className="template-item-text">{label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  className="btn btn-yellow"
                  style={{ width: '100%' }}
                  onClick={generateAssistantEmail}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                    <path d="M12 2L2 7l10 5 10-5-10-5z" />
                    <path d="M2 17l10 5 10-5" />
                    <path d="M2 12l10 5 10-5" />
                  </svg>
                  Générer avec l&apos;IA
                </button>

                <div className="form-group">
                  <label className="form-label">Résultat</label>
                  <div className={`output-box ${assistantOutput ? '' : 'empty'}`}>{assistantOutput || "L'email généré apparaîtra ici..."}</div>
                  <div className="output-actions">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={async () => {
                        if (!assistantOutput) return
                        await navigator.clipboard.writeText(assistantOutput)
                      }}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                        <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                      </svg>
                      Copier
                    </button>
                    <button type="button" className="btn btn-secondary" onClick={generateAssistantEmail}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                        <polyline points="1 4 1 10 7 10" />
                        <path d="M3.51 15a9 9 0 102.13-9.36L1 10" />
                      </svg>
                      Régénérer
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Devis */}
        <div id="tab-devis" className={`tab-content ${tab === 'devis' ? 'active' : ''}`}>
          <div className="page-header">
            <div>
              <h1 className="page-title">Créer un devis</h1>
              <p className="page-subtitle">Remplissez les informations pour générer votre devis professionnel</p>
            </div>
          </div>

          <DevisV4
            userFullName={userFullName}
            userJob={userJob}
            userId={userId}
          />
        </div>

{/* Analyseur */}
        <div id="tab-analyseur" className={`tab-content ${tab === 'analyseur' ? 'active' : ''}`}>
          <div className="page-header">
            <div>
              <h1 className="page-title">Analyseur de projet</h1>
              <p className="page-subtitle">Analysez un brief client pour évaluer sa faisabilité</p>
            </div>
          </div>

          <div className="devis-container">
            <div className="devis-form">
              <div className="form-group">
                <label className="form-label">Brief du client</label>
                <textarea
                  className="form-textarea"
                  style={{ minHeight: 250 }}
                  placeholder="Collez ici le brief ou la demande de votre client..."
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Budget annoncé (optionnel)</label>
                  <input type="text" className="form-input" placeholder="Ex: 3000€" />
                </div>
                <div className="form-group">
                  <label className="form-label">Délai demandé (optionnel)</label>
                  <input type="text" className="form-input" placeholder="Ex: 2 semaines" />
                </div>
              </div>

              <button type="button" className="btn btn-yellow" style={{ width: '100%' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-4.35-4.35" />
                </svg>
                Analyser le projet
              </button>
            </div>

            <div className="devis-preview">
              <h3 className="preview-title">Résultat de l&apos;analyse</h3>
              <div className="empty-state" style={{ padding: '40px 20px' }}>
                <div className="empty-state-icon">🔍</div>
                <p>L&apos;analyse apparaîtra ici</p>
              </div>
            </div>
          </div>
        </div>

        {/* Settings */}
        <div id="tab-settings" className={`tab-content ${tab === 'settings' ? 'active' : ''}`}>
          <div className="page-header">
            <div>
              <h1 className="page-title">Paramètres</h1>
              <p className="page-subtitle">Configurez votre compte</p>
            </div>
          </div>
          <div className="card">
            <div className="empty-state">
              <div className="empty-state-icon">⚙️</div>
              <h4>Paramètres</h4>
              <p>Section en cours de développement</p>
            </div>
          </div>
        </div>
      </main>

      {/* Modal: New Client */}
      <div
        className={`modal-overlay ${modal === 'newClient' ? 'active' : ''}`}
        id="modal-newClient"
        onClick={(e) => {
          if (e.target === e.currentTarget) setModal(null)
        }}
      >
        <div className="modal">
          <div className="modal-header">
            <h3 className="modal-title">Nouveau client</h3>
            <button className="modal-close" type="button" onClick={() => setModal(null)}>
              ✕
            </button>
          </div>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Nom / Entreprise</label>
              <input name="client_name" type="text" className="form-input" placeholder="Ex: Digital Agency" />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input name="client_email" type="email" className="form-input" placeholder="contact@example.com" />
            </div>
            <div className="form-group">
              <label className="form-label">Téléphone</label>
              <input name="client_phone" type="tel" className="form-input" placeholder="06 12 34 56 78" />
            </div>
            <div className="form-group">
              <label className="form-label">Notes</label>
              <textarea
                name="client_notes"
                className="form-textarea"
                rows={3}
                placeholder="Informations complémentaires..."
              />
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" type="button" onClick={() => setModal(null)}>
                Annuler
              </button>
              <button
                className="btn btn-primary"
                type="button"
                onClick={async () => {
                  if (!supabase || !userId) {
                    alert('Session manquante')
                    return
                  }

                  const modalEl = document.getElementById('modal-newClient')
                  const name = String(
                    (modalEl?.querySelector('[name="client_name"]') as HTMLInputElement | null)?.value || ''
                  ).trim()
                  const email = String(
                    (modalEl?.querySelector('[name="client_email"]') as HTMLInputElement | null)?.value || ''
                  ).trim()
                  const phone = String(
                    (modalEl?.querySelector('[name="client_phone"]') as HTMLInputElement | null)?.value || ''
                  ).trim()
                  const notes = String(
                    (modalEl?.querySelector('[name="client_notes"]') as HTMLTextAreaElement | null)?.value || ''
                  ).trim()

                  if (!name) {
                    alert('Nom requis')
                    return
                  }

                  try {
                    setLoading(true)
                    const { error } = await supabase.from('clients').insert({
                      user_id: userId,
                      name,
                      email: email || null,
                      phone: phone || null,
                      notes: notes || null,
                    })
                    if (error) throw error
                    setModal(null)
                    await refreshClients()
                  } catch (e: any) {
                    alert(e?.message || 'Erreur ajout client')
                  } finally {
                    setLoading(false)
                  }
                }}
              >
                {loading ? 'Ajout…' : 'Ajouter le client'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
