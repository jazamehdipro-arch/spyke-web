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

type InvoiceLine = {
  id: string
  description: string
  qty: number
  unitPrice: number
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

function computeInvoiceTotals(lines: InvoiceLine[]) {
  let totalHt = 0
  for (const l of lines) totalHt += (l.qty || 0) * (l.unitPrice || 0)
  const totalTva = 0
  const totalTtc = totalHt + totalTva
  return { totalHt, totalTva, totalTtc }
}

function genQuoteNumber(dateStr: string, sequence = 1) {
  const d = new Date((dateStr || '').slice(0, 10) + 'T00:00:00')
  const year = !Number.isNaN(d.getTime()) ? d.getFullYear() : new Date().getFullYear()
  const month = String((!Number.isNaN(d.getTime()) ? d.getMonth() + 1 : new Date().getMonth() + 1)).padStart(2, '0')
  return `D${year}${month}-${String(sequence).padStart(3, '0')}`
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
  const [quoteNumberDirty, setQuoteNumberDirty] = useState(false)

  const [clientChoice, setClientChoice] = useState<DevisClientChoice>({ mode: 'none' })
  const [clients, setClients] = useState<Array<{ id: string; name: string; email?: string | null; siret?: string | null; address?: string | null; postal_code?: string | null; city?: string | null; country?: string | null }>>([])

  // Auto-number: DYYYYMM-001 (per user, per month)
  useEffect(() => {
    ;(async () => {
      try {
        if (!supabase || !userId) return
        if (quoteNumberDirty) return

        const d = new Date((dateIssue || '').slice(0, 10) + 'T00:00:00')
        const year = !Number.isNaN(d.getTime()) ? d.getFullYear() : new Date().getFullYear()
        const month = String((!Number.isNaN(d.getTime()) ? d.getMonth() + 1 : new Date().getMonth() + 1)).padStart(2, '0')
        const prefix = `D${year}${month}-`

        const { data } = await supabase
          .from('quotes')
          .select('number')
          .eq('user_id', userId)
          .like('number', `${prefix}%`)
          .order('created_at', { ascending: false })
          .limit(200)

        let max = 0
        for (const r of (data || []) as any[]) {
          const n = String(r.number || '')
          if (!n.startsWith(prefix)) continue
          const tail = n.slice(prefix.length)
          const seq = Number(tail)
          if (!Number.isNaN(seq)) max = Math.max(max, seq)
        }

        setQuoteNumber(genQuoteNumber(dateIssue, max + 1))
      } catch {
        // ignore
      }
    })()
  }, [supabase, userId, dateIssue, quoteNumberDirty])

  // Prefill from Client page (chain)
  useEffect(() => {
    try {
      const key = 'spyke_devis_client_id'
      const id = String(localStorage.getItem(key) || '')
      if (!id) return
      localStorage.removeItem(key)
      setClientChoice({ mode: 'existing', id })
    } catch {
      // ignore
    }
  }, [])

  const [mode, setMode] = useState<'list' | 'create'>('list')
  const [showQuotes, setShowQuotes] = useState(false)
  const [quotes, setQuotes] = useState<any[]>([])

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

  // Load clients + user prefs + quotes
  useEffect(() => {
    ;(async () => {
      if (!supabase || !userId) return

      const [{ data: clientsData }, { data: profileData }, { data: quotesData }] = await Promise.all([
        supabase.from('clients').select('id,name,email,siret,address,postal_code,city,country').order('created_at', { ascending: false }),
        supabase
          .from('profiles')
          .select('vat_enabled,deposit_percent,payment_delay_days,quote_validity_days')
          .eq('id', userId)
          .maybeSingle(),
        supabase.from('quotes').select('id,number,title,status,total_ttc,created_at').order('created_at', { ascending: false }).limit(30),
      ])

      setClients(
        (clientsData || []).map((c: any) => ({
          id: c.id,
          name: c.name,
          email: c.email,
          siret: c.siret,
          address: c.address,
          postal_code: c.postal_code,
          city: c.city,
          country: c.country,
        }))
      )

      setQuotes(quotesData || [])

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

  async function openQuote(id: string) {
    try {
      if (!supabase || !id) return
      const { data: q } = await supabase
        .from('quotes')
        .select('id,client_id,number,title,status,date_issue,validity_until,notes,total_ttc')
        .eq('id', id)
        .maybeSingle()
      if (!q) return

      const { data: qLines } = await supabase
        .from('quote_lines')
        .select('label,description,qty,unit_price_ht,vat_rate,position')
        .eq('quote_id', id)
        .order('position', { ascending: true })

      setTitle(String((q as any).title || ''))
      setNotes(String((q as any).notes || ''))

      const num = String((q as any).number || '')
      if (num) {
        setQuoteNumber(num)
        setQuoteNumberDirty(true)
      }

      const di = String((q as any).date_issue || '')
      if (di) setDateIssue(di)

      // Best-effort: validityUntil → validityDays
      const vu = String((q as any).validity_until || '')
      if (di && vu) {
        const a = new Date(di + 'T00:00:00').getTime()
        const b = new Date(vu + 'T00:00:00').getTime()
        if (!Number.isNaN(a) && !Number.isNaN(b) && b >= a) {
          const days = Math.round((b - a) / (1000 * 60 * 60 * 24))
          if (days > 0 && days < 366) setValidityDays(days)
        }
      }

      if ((q as any).client_id) setClientChoice({ mode: 'existing', id: String((q as any).client_id) })

      if (Array.isArray(qLines) && qLines.length) {
        setLines(
          qLines.map((l: any, idx: number) => ({
            id: String(Date.now()) + '-' + String(idx),
            label: String(l.label || ''),
            description: String(l.description || ''),
            qty: Number(l.qty || 0) || 0,
            unitPriceHt: Number(l.unit_price_ht || 0) || 0,
            vatRate: Number(l.vat_rate || 0) || 0,
          }))
        )
      }

      setMode('create')
    } catch {
      // ignore
    }
  }

  function resetNewQuote() {
    setMode('create')
    setTitle('')
    setNotes('')
    setClientChoice({ mode: 'existing', id: '' })
    setLines([
      {
        id: '0',
        label: '',
        description: '',
        qty: 1,
        unitPriceHt: 0,
        vatRate: lines[0]?.vatRate ?? 20,
      },
    ])
    const t = new Date().toISOString().slice(0, 10)
    setDateIssue(t)
    setQuoteNumberDirty(false)
  }

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
    try {
      if (!supabase) throw new Error('Supabase non initialisé')
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData?.session?.access_token
      if (!token) throw new Error('Non connecté')

      // Seller info from profile (best-effort)
      let seller: any = {
        name: userFullName || 'Votre entreprise',
        addressLines: [],
        siret: '',
        vatNumber: '',
        iban: '',
        bic: '',
      }

      if (userId) {
        const { data: profile } = await supabase
          .from('profiles')
          // fields are best-effort (some may not exist depending on your schema)
          .select('full_name,company_name,logo_path,address,postal_code,city,country,siret,vat_number,iban,bic')
          .eq('id', userId)
          .maybeSingle()

        const companyName = (profile as any)?.company_name || (profile as any)?.full_name || userFullName
        const addressLines: string[] = []
        const addr = (profile as any)?.address
        const pc = (profile as any)?.postal_code
        const city = (profile as any)?.city
        const country = (profile as any)?.country
        if (addr) addressLines.push(String(addr))
        const cityLine = [pc, city].filter(Boolean).join(' ')
        if (cityLine) addressLines.push(cityLine)
        if (country) addressLines.push(String(country))

        const logoPath = String((profile as any)?.logo_path || '')
        let logoUrl = ''
        if (logoPath) {
          const pub = supabase.storage.from('logos').getPublicUrl(logoPath)
          logoUrl = String(pub?.data?.publicUrl || '')
        }

        seller = {
          ...seller,
          name: companyName || seller.name,
          addressLines,
          siret: String((profile as any)?.siret || ''),
          vatNumber: String((profile as any)?.vat_number || ''),
          iban: String((profile as any)?.iban || ''),
          bic: String((profile as any)?.bic || ''),
          logoUrl,
        }
      }

      // Buyer info
      let buyer: any = { name: previewClientLabel || 'Client', addressLines: [], siret: '' }
      if (clientChoice.mode === 'existing' && clientChoice.id) {
        const { data: c } = await supabase
          .from('clients')
          .select('name,siret,address,postal_code,city,country')
          .eq('id', clientChoice.id)
          .maybeSingle()

        const addressLines: string[] = []
        const addr = (c as any)?.address
        const pc = (c as any)?.postal_code
        const city = (c as any)?.city
        const country = (c as any)?.country
        if (addr) addressLines.push(String(addr))
        const cityLine = [pc, city].filter(Boolean).join(' ')
        if (cityLine) addressLines.push(cityLine)
        if (country) addressLines.push(String(country))

        buyer = {
          name: String((c as any)?.name || previewClientLabel || 'Client'),
          siret: String((c as any)?.siret || ''),
          addressLines,
        }
      } else if (clientChoice.mode === 'new') {
        const addressLines: string[] = []
        if (clientChoice.address) addressLines.push(String(clientChoice.address))
        const cityLine = [clientChoice.postalCode, clientChoice.city].filter(Boolean).join(' ')
        if (cityLine) addressLines.push(cityLine)
        buyer = {
          name: clientChoice.name || previewClientLabel || 'Client',
          siret: String(clientChoice.siret || ''),
          addressLines,
        }
      }

      const payload = {
        quoteNumber,
        title,
        dateIssue,
        validityUntil,
        logoUrl: String((seller as any)?.logoUrl || ''),
        seller: {
          name: seller.name,
          addressLines: seller.addressLines,
          siret: seller.siret,
          vatNumber: seller.vatNumber,
          iban: seller.iban,
          bic: seller.bic,
        },
        buyer,
        lines,
        notes,
        totals,
      }

      const res = await fetch('/api/devis-pdf', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      const blob = await res.blob()
      if (!res.ok) {
        let msg = 'Erreur PDF'
        try {
          const t = await blob.text()
          msg = t || msg
        } catch {}
        throw new Error(msg)
      }

      // Persist quote in DB for chain devis → facture/contrat
      try {
        if (userId) {
          // Find client_id when possible
          const client_id = clientChoice.mode === 'existing' ? clientChoice.id : null

          const { data: qRow, error: qErr } = await supabase
            .from('quotes')
            // Important: onConflict must match the unique constraint (user_id, number)
            // otherwise repeated “Générer PDF” won’t update the same quote.
            .upsert(
              {
                user_id: userId,
                client_id,
                number: quoteNumber,
                title: title || null,
                status: 'draft',
                date_issue: dateIssue || null,
                validity_until: validityUntil || null,
                notes: notes || null,
                total_ht: totals.totalHt,
                total_tva: totals.totalTva,
                total_ttc: totals.totalTtc,
                buyer_snapshot: buyer,
                seller_snapshot: seller,
              } as any,
              { onConflict: 'user_id,number' }
            )
            .select('id')
            .single()

          if (qErr) {
            try {
              console.error('Persist quote error', qErr)
            } catch {}
            alert(`PDF généré, mais sauvegarde en base impossible: ${qErr.message}`)
          } else if (qRow?.id) {
            // Save for chain navigation
            try {
              localStorage.setItem('spyke_last_quote_id', String(qRow.id))
            } catch {}

            // Replace lines
            const { error: delErr } = await supabase.from('quote_lines').delete().eq('quote_id', qRow.id)
            if (delErr) {
              try {
                console.error('Persist quote lines delete error', delErr)
              } catch {}
              alert(`PDF généré, mais lignes devis non sauvegardées: ${delErr.message}`)
            }

            if (lines.length) {
              const { error: insErr } = await supabase.from('quote_lines').insert(
                lines.map((l, idx) => ({
                  quote_id: qRow.id,
                  position: idx,
                  label: l.label,
                  description: l.description,
                  qty: l.qty,
                  unit_price_ht: l.unitPriceHt,
                  vat_rate: l.vatRate,
                })) as any
              )
              if (insErr) {
                try {
                  console.error('Persist quote lines insert error', insErr)
                } catch {}
                alert(`PDF généré, mais lignes devis non sauvegardées: ${insErr.message}`)
              }
            }

            // Refresh list
            const { data: quotesData, error: qSelErr } = await supabase
              .from('quotes')
              .select('id,number,title,status,total_ttc,created_at')
              .order('created_at', { ascending: false })
              .limit(30)
            if (qSelErr) {
              try {
                console.error('Refresh quotes list error', qSelErr)
              } catch {}
            }
            setQuotes(quotesData || [])
          } else {
            alert('PDF généré, mais sauvegarde en base impossible: aucun identifiant devis retourné')
          }
        }
      } catch (e: any) {
        // Do not fail PDF generation, but surface the issue so it can be fixed (RLS, schema, etc.)
        try {
          console.error('Persist quote failed', e)
        } catch {}
        alert(`PDF généré, mais sauvegarde en base impossible: ${e?.message || 'Erreur Supabase'}`)
      }

      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Devis-${quoteNumber}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (e: any) {
      alert(e?.message || 'Erreur PDF')
    }
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

      {mode === 'list' ? (
        <>
          <div className="page-header">
            <div>
              <h1 className="page-title">Devis</h1>
              <p className="page-subtitle">Consultez vos devis et créez-en un nouveau</p>
            </div>
            <div className="header-actions">
              <button className="btn btn-primary" type="button" onClick={resetNewQuote}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Nouveau devis
              </button>
            </div>
          </div>

          <div className="card" style={{ marginTop: 20 }}>
            <div className="card-header">
              <h3 className="card-title">📄 Devis récents</h3>
            </div>

            {quotes.length === 0 ? (
              <div className="empty-state" style={{ padding: 24 }}>
                <div className="empty-state-icon">📄</div>
                <h4>Aucun devis</h4>
                <p>Créez votre premier devis en cliquant sur “Nouveau devis”.</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ textAlign: 'left', fontSize: 12, color: 'var(--gray-500)' }}>
                      <th style={{ padding: '10px 8px', borderBottom: '1px solid var(--gray-200)' }}>N°</th>
                      <th style={{ padding: '10px 8px', borderBottom: '1px solid var(--gray-200)' }}>Titre</th>
                      <th style={{ padding: '10px 8px', borderBottom: '1px solid var(--gray-200)' }}>Statut</th>
                      <th style={{ padding: '10px 8px', borderBottom: '1px solid var(--gray-200)', textAlign: 'right' }}>Total</th>
                      <th style={{ padding: '10px 8px', borderBottom: '1px solid var(--gray-200)', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quotes.map((q) => (
                      <tr key={q.id}>
                        <td style={{ padding: '12px 8px', borderBottom: '1px solid var(--gray-100)' }}>{q.number}</td>
                        <td style={{ padding: '12px 8px', borderBottom: '1px solid var(--gray-100)' }}>{q.title || '—'}</td>
                        <td style={{ padding: '12px 8px', borderBottom: '1px solid var(--gray-100)' }}>{q.status || 'draft'}</td>
                        <td style={{ padding: '12px 8px', borderBottom: '1px solid var(--gray-100)', textAlign: 'right', fontWeight: 700 }}>{formatMoney(Number(q.total_ttc || 0))}</td>
                        <td style={{ padding: '12px 8px', borderBottom: '1px solid var(--gray-100)', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                            <button className="btn btn-secondary" type="button" onClick={() => openQuote(String(q.id))}>
                              Ouvrir
                            </button>
                            <button
                              className="btn btn-secondary"
                              type="button"
                              onClick={() => {
                                try { localStorage.setItem('spyke_contract_from_quote_id', String(q.id)) } catch {}
                                ;(window as any).__spyke_setTab?.('contrats')
                              }}
                            >
                              Contrat
                            </button>
                            <button
                              className="btn btn-secondary"
                              type="button"
                              onClick={() => {
                                try { localStorage.setItem('spyke_invoice_from_quote_id', String(q.id)) } catch {}
                                ;(window as any).__spyke_setTab?.('factures')
                              }}
                            >
                              Facture
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          <button className="btn btn-secondary" type="button" onClick={() => setMode('list')} style={{ marginBottom: 16 }}>
            ← Retour aux devis
          </button>

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
                    onChange={(e) => {
                      setQuoteNumber(e.target.value)
                      setQuoteNumberDirty(true)
                    }}
                    placeholder="D202602-001"
                  />
                  <div style={{ marginTop: 6, fontSize: 12, color: 'var(--gray-500)' }}>
                    Format conseillé : DYYYYMM-001 (auto). Vous pouvez modifier ce numéro si besoin.
                  </div>
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

              {clientChoice.mode === 'existing' ? (
                (() => {
                  const c = clients.find((x) => x.id === clientChoice.id)
                  const addressLine = [c?.address, [c?.postal_code, c?.city].filter(Boolean).join(' '), c?.country]
                    .filter(Boolean)
                    .join(', ')
                  return (
                    <div className="card" style={{ background: 'var(--gray-50)', border: '1px dashed var(--gray-200)', marginTop: 12 }}>
                      <div style={{ fontSize: 13, color: 'var(--gray-500)' }}>
                        <div><b>Email</b> : {c?.email || '—'}</div>
                        <div><b>SIRET</b> : {c?.siret || '—'}</div>
                        <div><b>Adresse</b> : {addressLine || '—'}</div>
                      </div>
                    </div>
                  )
                })()
              ) : clientChoice.mode === 'new' ? (
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
            <button
              className="btn btn-secondary"
              type="button"
              onClick={() => {
                try {
                  localStorage.setItem('spyke_contract_from_quote_number', quoteNumber)
                } catch {}
                ;(window as any).__spyke_setTab?.('contrats')
                try {
                  const key = 'spyke_contract_from_quote_id'
                  // Prefer DB id if available (saved after PDF)
                  // Fallback: contracts page can search by number later
                } catch {}
              }}
            >
              Générer un contrat
            </button>
            <button className="btn btn-primary" type="button" onClick={generatePdf}>
              Générer PDF
            </button>
          </div>

          <div style={{ marginTop: 16, fontSize: 12, color: 'var(--gray-500)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <span>
              Généré pour {userFullName || 'Utilisateur'} {userJob ? `· ${userJob}` : ''}
            </span>
            <button className="btn btn-secondary" type="button" onClick={() => setShowQuotes((s) => !s)}>
              {showQuotes ? 'Masquer' : 'Voir'} mes devis
            </button>
          </div>

          {showQuotes ? (
            <div className="card" style={{ marginTop: 16 }}>
              <div className="card-header">
                <h3 className="card-title">📄 Mes devis récents</h3>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ textAlign: 'left', fontSize: 12, color: 'var(--gray-500)' }}>
                      <th style={{ padding: '10px 8px', borderBottom: '1px solid var(--gray-200)' }}>N°</th>
                      <th style={{ padding: '10px 8px', borderBottom: '1px solid var(--gray-200)' }}>Titre</th>
                      <th style={{ padding: '10px 8px', borderBottom: '1px solid var(--gray-200)' }}>Statut</th>
                      <th style={{ padding: '10px 8px', borderBottom: '1px solid var(--gray-200)', textAlign: 'right' }}>Total</th>
                      <th style={{ padding: '10px 8px', borderBottom: '1px solid var(--gray-200)', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quotes.map((q) => (
                      <tr key={q.id}>
                        <td style={{ padding: '12px 8px', borderBottom: '1px solid var(--gray-100)' }}>{q.number}</td>
                        <td style={{ padding: '12px 8px', borderBottom: '1px solid var(--gray-100)' }}>{q.title || '—'}</td>
                        <td style={{ padding: '12px 8px', borderBottom: '1px solid var(--gray-100)' }}>{q.status || 'draft'}</td>
                        <td style={{ padding: '12px 8px', borderBottom: '1px solid var(--gray-100)', textAlign: 'right', fontWeight: 700 }}>{formatMoney(Number(q.total_ttc || 0))}</td>
                        <td style={{ padding: '12px 8px', borderBottom: '1px solid var(--gray-100)', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                            <button
                              className="btn btn-secondary"
                              type="button"
                              onClick={() => {
                                try { localStorage.setItem('spyke_contract_from_quote_id', String(q.id)) } catch {}
                                ;(window as any).__spyke_setTab?.('contrats')
                              }}
                            >
                              Contrat
                            </button>
                            <button
                              className="btn btn-secondary"
                              type="button"
                              onClick={() => {
                                try { localStorage.setItem('spyke_invoice_from_quote_id', String(q.id)) } catch {}
                                ;(window as any).__spyke_setTab?.('factures')
                              }}
                            >
                              Facture
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
          </div>
        </div>
        </>
      )}
    </div>
  )
}

function genInvoiceNumber(dateStr: string, sequence = 1) {
  const d = new Date((dateStr || '').slice(0, 10) + 'T00:00:00')
  const year = !Number.isNaN(d.getTime()) ? d.getFullYear() : new Date().getFullYear()
  return `${year}-${String(sequence).padStart(3, '0')}`
}

function ContratsV1({
  clients,
  userId,
  userFullName,
  userJob,
}: {
  clients: Array<{ id: string; name: string; email: string | null }>
  userId: string | null
  userFullName: string
  userJob: string
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

  const [prestaName, setPrestaName] = useState(userFullName || '')
  const [prestaSiret, setPrestaSiret] = useState('')
  const [prestaAddress, setPrestaAddress] = useState('')
  const [prestaActivity, setPrestaActivity] = useState(userJob || '')
  const [prestaEmail, setPrestaEmail] = useState('')

  const [contractFromQuoteId, setContractFromQuoteId] = useState<string>('')
  const [quotes, setQuotes] = useState<any[]>([])

  const [mode, setMode] = useState<'list' | 'create'>('list')
  const [showContracts, setShowContracts] = useState(false)
  const [contracts, setContracts] = useState<any[]>([])
  const [selectedContractId, setSelectedContractId] = useState<string>('')

  const [clientId, setClientId] = useState('')
  const [clientName, setClientName] = useState('')
  const [clientSiret, setClientSiret] = useState('')
  const [clientAddress, setClientAddress] = useState('')
  const [clientRepresentant, setClientRepresentant] = useState('')
  const [clientEmail, setClientEmail] = useState('')

  const [missionDescription, setMissionDescription] = useState('')
  const [missionLivrables, setMissionLivrables] = useState('')
  const [missionStart, setMissionStart] = useState(today)
  const [missionEnd, setMissionEnd] = useState(addDays(today, 30))
  const [missionLieu, setMissionLieu] = useState<'distance' | 'client' | 'prestataire' | 'mixte'>('distance')
  const [missionRevisions, setMissionRevisions] = useState<'2' | '3' | '5' | 'illimite'>('2')

  const [pricingType, setPricingType] = useState<'forfait' | 'tjm' | 'horaire'>('forfait')
  const [pricingAmount, setPricingAmount] = useState<number>(0)
  const [pricingDays, setPricingDays] = useState<number>(0)
  const [tvaRegime, setTvaRegime] = useState<'franchise' | 'tva'>('franchise')
  const [paymentSchedule, setPaymentSchedule] = useState<'30' | '50' | 'tiers' | 'fin'>('30')
  const [paymentDelay, setPaymentDelay] = useState<'reception' | '15' | '30' | '45'>('30')

  const [ipClause, setIpClause] = useState<'cession' | 'licence' | 'prestataire'>('cession')
  const [confidentialityClause, setConfidentialityClause] = useState<'oui' | 'non'>('oui')
  const [nonCompeteClause, setNonCompeteClause] = useState<'non' | '6mois' | '12mois'>('non')
  const [terminationClause, setTerminationClause] = useState<'15' | '30' | 'mutuel'>('15')

  const [contractText, setContractText] = useState<string>('')

  // Prefill seller from profile (best-effort)
  useEffect(() => {
    ;(async () => {
      if (!supabase || !userId) return
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name,company_name,address,postal_code,city,country,siret,email')
        .eq('id', userId)
        .maybeSingle()

      const companyName = (profile as any)?.company_name || (profile as any)?.full_name || userFullName
      const addr = (profile as any)?.address
      const pc = (profile as any)?.postal_code
      const city = (profile as any)?.city
      const country = (profile as any)?.country

      const addressLines: string[] = []
      if (addr) addressLines.push(String(addr))
      const cityLine = [pc, city].filter(Boolean).join(' ')
      if (cityLine) addressLines.push(cityLine)
      if (country) addressLines.push(String(country))

      setPrestaName(String(companyName || ''))
      setPrestaSiret(String((profile as any)?.siret || ''))
      setPrestaAddress(addressLines.join(', '))
      setPrestaEmail(String((profile as any)?.email || ''))
    })()
  }, [supabase, userId, userFullName])

  useEffect(() => {
    ;(async () => {
      try {
        if (!supabase) return
        const [{ data, error }, { data: cData }] = await Promise.all([
          supabase
            .from('quotes')
            .select('id,number,title,total_ttc,created_at')
            .order('created_at', { ascending: false })
            .limit(50),
          supabase
            .from('contracts')
            .select('id,title,status,amount_ht,created_at,client_id,quote_id')
            .order('created_at', { ascending: false })
            .limit(50),
        ])
        if (error) throw error
        setQuotes((data || []) as any[])
        setContracts((cData || []) as any[])
      } catch {
        setQuotes([])
        setContracts([])
      }

      // Auto-import from Devis button
      try {
        const key = 'spyke_contract_from_quote_id'
        let id = String(localStorage.getItem(key) || '')
        if (!id) id = String(localStorage.getItem('spyke_last_quote_id') || '')
        if (id) {
          localStorage.removeItem(key)
          await importFromQuote(id)
        }
      } catch {}
    })()
  }, [supabase])

  async function importFromQuote(id: string) {
    setContractFromQuoteId(id)
    if (!supabase || !id) return

    const { data: q, error: qErr } = await supabase
      .from('quotes')
      .select('id,client_id,title,total_ht,total_ttc,date_issue,validity_until,buyer_snapshot')
      .eq('id', id)
      .maybeSingle()
    if (qErr || !q) return

    const buyerSnap: any = (q as any).buyer_snapshot || null
    if (buyerSnap) {
      setClientName(String(buyerSnap.name || ''))
      setClientSiret(String(buyerSnap.siret || ''))
      setClientAddress(Array.isArray(buyerSnap.addressLines) ? buyerSnap.addressLines.filter(Boolean).join(', ') : '')
      setClientEmail(String(buyerSnap.email || ''))
    }

    if ((q as any).client_id) setClientId(String((q as any).client_id))

    const { data: qLines } = await supabase
      .from('quote_lines')
      .select('label,description,qty,unit_price_ht,position')
      .eq('quote_id', id)
      .order('position', { ascending: true })

    const desc = (qLines || [])
      .map((l: any) => {
        const base = l.label || ''
        const extra = l.description ? ` — ${l.description}` : ''
        return `${base}${extra}`.trim()
      })
      .filter(Boolean)
      .join('\n')

    if (desc) setMissionDescription(desc)
    if (!missionLivrables) setMissionLivrables('Livrables à définir.')

    const ht = Number((q as any).total_ht || 0)
    setPricingType('forfait')
    setPricingAmount(ht)
    setPricingDays(0)

    if ((q as any).date_issue) setMissionStart(String((q as any).date_issue))
  }

  async function openContract(id: string) {
    setSelectedContractId(id)
    if (!supabase || !id) return

    const { data: c } = await supabase
      .from('contracts')
      .select('id,client_id,quote_id,title,status,contract_text,mission_start,mission_end,amount_ht,tva_regime,buyer_snapshot,seller_snapshot')
      .eq('id', id)
      .maybeSingle()
    if (!c) return

    if ((c as any).quote_id) setContractFromQuoteId(String((c as any).quote_id))
    if ((c as any).client_id) setClientId(String((c as any).client_id))
    if ((c as any).mission_start) setMissionStart(String((c as any).mission_start))
    if ((c as any).mission_end) setMissionEnd(String((c as any).mission_end))

    const buyerSnap: any = (c as any).buyer_snapshot || null
    if (buyerSnap) {
      setClientName(String(buyerSnap.name || ''))
      setClientEmail(String(buyerSnap.email || ''))
      setClientSiret(String(buyerSnap.siret || ''))
      setClientAddress(Array.isArray(buyerSnap.addressLines) ? buyerSnap.addressLines.filter(Boolean).join(', ') : String(buyerSnap.address || ''))
      setClientRepresentant(String(buyerSnap.representant || ''))
    }

    const sellerSnap: any = (c as any).seller_snapshot || null
    if (sellerSnap) {
      setPrestaName(String(sellerSnap.name || prestaName || ''))
      setPrestaEmail(String(sellerSnap.email || prestaEmail || ''))
      setPrestaSiret(String(sellerSnap.siret || prestaSiret || ''))
      setPrestaAddress(Array.isArray(sellerSnap.addressLines) ? sellerSnap.addressLines.filter(Boolean).join(', ') : String(sellerSnap.address || ''))
      setPrestaActivity(String(sellerSnap.activity || prestaActivity || ''))
    }

    if ((c as any).amount_ht != null) {
      setPricingType('forfait')
      setPricingAmount(Number((c as any).amount_ht || 0))
      setPricingDays(0)
    }

    if ((c as any).tva_regime) setTvaRegime(String((c as any).tva_regime) === 'tva' ? 'tva' : 'franchise')

    const txt = String((c as any).contract_text || '')
    if (txt) setContractText(txt)

    setShowContracts(false)
  }

  async function selectClient(id: string) {
    setClientId(id)
    if (!supabase || !id) return
    const { data: c } = await supabase
      .from('clients')
      .select('name,email,siret,address,postal_code,city,country')
      .eq('id', id)
      .maybeSingle()

    const addr = (c as any)?.address
    const pc = (c as any)?.postal_code
    const city = (c as any)?.city
    const country = (c as any)?.country
    const addressLines: string[] = []
    if (addr) addressLines.push(String(addr))
    const cityLine = [pc, city].filter(Boolean).join(' ')
    if (cityLine) addressLines.push(cityLine)
    if (country) addressLines.push(String(country))

    setClientName(String((c as any)?.name || ''))
    setClientEmail(String((c as any)?.email || ''))
    setClientSiret(String((c as any)?.siret || ''))
    setClientAddress(addressLines.join(', '))
  }

  function buildContractText() {
    const todayStr = new Date().toLocaleDateString('fr-FR')
    const startDate = formatDateFr(missionStart) || 'À définir'
    const endDate = formatDateFr(missionEnd) || 'À définir'

    const lieuMap: any = {
      distance: 'à distance',
      client: 'dans les locaux du client',
      prestataire: 'dans les locaux du prestataire',
      mixte: 'en mode mixte (distance et présentiel)',
    }
    const revMap: any = {
      '2': 'deux (2)',
      '3': 'trois (3)',
      '5': 'cinq (5)',
      illimite: 'un nombre illimité de',
    }

    const amount = Number(pricingAmount || 0).toFixed(2)
    let pricingText = ''
    if (pricingType === 'forfait') {
      pricingText = `La rémunération du Prestataire est fixée à un forfait global de ${amount} € HT.`
    } else if (pricingType === 'tjm') {
      const est = (Number(pricingAmount || 0) * Number(pricingDays || 0)).toFixed(2)
      pricingText = `La rémunération du Prestataire est fixée à un taux journalier de ${amount} € HT/jour, pour une durée estimée de ${pricingDays} jours, soit un montant estimé de ${est} € HT.`
    } else {
      const est = (Number(pricingAmount || 0) * Number(pricingDays || 0)).toFixed(2)
      pricingText = `La rémunération du Prestataire est fixée à un taux horaire de ${amount} € HT/heure, pour une durée estimée de ${pricingDays} heures, soit un montant estimé de ${est} € HT.`
    }

    const tvaText = tvaRegime === 'franchise'
      ? 'TVA non applicable, article 293 B du CGI.'
      : 'Les montants sont soumis à la TVA au taux de 20%.'

    const scheduleMap: any = {
      '30': '30% du montant total à la signature du présent contrat, et 70% à la livraison finale',
      '50': '50% du montant total à la signature du présent contrat, et 50% à la livraison finale',
      tiers: '1/3 du montant total à la signature, 1/3 à mi-parcours de la mission, et 1/3 à la livraison finale',
      fin: '100% du montant total à la livraison finale',
    }

    const delayMap: any = { reception: 'à réception de facture', '15': 'sous 15 jours', '30': 'sous 30 jours', '45': 'sous 45 jours' }

    const ipMap: any = {
      cession: `Le Prestataire cède au Client, à titre exclusif, l'ensemble des droits de propriété intellectuelle sur les livrables produits dans le cadre du présent contrat (droits de reproduction, de représentation, d'adaptation et de modification), pour le monde entier et pour toute la durée de protection légale. Cette cession est effective après paiement intégral de la rémunération prévue.`,
      licence: `Le Prestataire accorde au Client une licence d'utilisation non exclusive sur les livrables produits dans le cadre du présent contrat. Le Client peut utiliser, reproduire et diffuser les livrables pour ses besoins propres. Le Prestataire conserve la propriété intellectuelle et le droit de réutiliser les méthodes et savoir-faire développés.`,
      prestataire: `Le Prestataire conserve l'intégralité des droits de propriété intellectuelle sur les livrables produits. Le Client dispose d'un droit d'usage limité à l'objet du contrat. Toute reproduction, modification ou diffusion au-delà de cet usage nécessite l'accord écrit préalable du Prestataire.`,
    }

    const termMap: any = { '15': '15 jours calendaires', '30': '30 jours calendaires', mutuel: "d'un commun accord entre les Parties, formalisé par écrit" }

    const lines: string[] = []
    lines.push('CONTRAT DE PRESTATION DE SERVICE')
    lines.push(`Établi le ${todayStr}`)
    lines.push('')
    lines.push('Entre les soussignés :')
    lines.push(`${prestaName || 'Le Prestataire'}, ${prestaActivity || 'Prestataire de services'}, immatriculé sous le SIRET ${prestaSiret || '—'}, dont le siège est situé au ${prestaAddress || '—'}, ci-après dénommé « le Prestataire ». 
`) 
    lines.push(`${clientName || 'Le Client'}, immatriculé sous le SIRET ${clientSiret || '—'}, dont le siège est situé au ${clientAddress || '—'}, représenté par ${clientRepresentant || '—'}, ci-après dénommé « le Client ». 
`)

    lines.push('Article 1 — Objet du contrat')
    lines.push(missionDescription || 'Prestation de service.')
    lines.push('')

    lines.push('Article 2 — Livrables')
    lines.push(missionLivrables || 'Livrables à définir.')
    lines.push(`Le Client dispose de ${revMap[missionRevisions]} révisions incluses dans le prix convenu.`)
    lines.push('')

    lines.push('Article 3 — Durée et lieu d\'exécution')
    lines.push(`La mission débute le ${startDate} et se termine le ${endDate}. Elle sera exécutée ${lieuMap[missionLieu]}.`)
    lines.push('')

    lines.push('Article 4 — Rémunération')
    lines.push(pricingText)
    lines.push(tvaText)
    lines.push(`Le paiement sera effectué selon l'échéancier suivant : ${scheduleMap[paymentSchedule]}. Chaque paiement est exigible ${delayMap[paymentDelay]}.`)
    lines.push('')

    lines.push('Article 5 — Propriété intellectuelle')
    lines.push(ipMap[ipClause])
    lines.push('')

    if (confidentialityClause === 'oui') {
      lines.push('Article 6 — Confidentialité')
      lines.push("Chacune des Parties s'engage à considérer comme confidentielles et à ne pas divulguer les informations de l'autre Partie dont elle pourrait avoir connaissance à l'occasion de l'exécution du présent contrat. Cette obligation reste en vigueur pendant 2 ans après la fin du contrat.")
      lines.push('')
    }

    if (nonCompeteClause !== 'non') {
      const duration = nonCompeteClause === '6mois' ? '6 mois' : '12 mois'
      lines.push('Article 7 — Non-concurrence')
      lines.push(`Le Prestataire s'engage, pendant une durée de ${duration} à compter de la fin du présent contrat, à ne pas fournir de services similaires à un concurrent direct du Client, identifié d'un commun accord entre les Parties.`)
      lines.push('')
    }

    lines.push('Article 8 — Résiliation')
    lines.push(`Le présent contrat peut être résilié par anticipation moyennant un préavis de ${termMap[terminationClause]}.`)
    lines.push('')

    lines.push('Fait en deux exemplaires originaux.')
    lines.push('')
    lines.push('Signatures :')
    lines.push(`Le Prestataire : ${prestaName || ''}`)
    lines.push('Signature : ____________________')
    lines.push('')
    lines.push(`Le Client : ${clientName || ''}`)
    lines.push('Signature : ____________________')

    return lines.join('\n')
  }

  async function generateContractPdf() {
    try {
      if (!supabase) throw new Error('Supabase non initialisé')
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData?.session?.access_token
      if (!token) throw new Error('Non connecté')

      // best-effort logo
      let logoUrl = ''
      if (userId) {
        const { data: profile } = await supabase.from('profiles').select('logo_path').eq('id', userId).maybeSingle()
        const logoPath = String((profile as any)?.logo_path || '')
        if (logoPath) {
          const pub = supabase.storage.from('logos').getPublicUrl(logoPath)
          logoUrl = String(pub?.data?.publicUrl || '')
        }
      }

      const finalText = contractText || buildContractText()

      // Persist contract in DB
      try {
        if (!userId) {
          alert("PDF généré, mais l'utilisateur n'est pas chargé (userId manquant) : impossible de sauvegarder le contrat en base. Recharge la page et réessaie.")
        } else {

          const amount_ht =
            pricingType === 'forfait'
              ? Number(pricingAmount || 0)
              : Number(pricingAmount || 0) * Number(pricingDays || 0)

          // try find existing by (user_id, client_id, mission_start) - best-effort
          let existingQ = supabase.from('contracts').select('id').eq('user_id', userId)
          existingQ = clientId ? existingQ.eq('client_id', clientId) : existingQ.is('client_id', null)
          const { data: existing } = await existingQ.order('created_at', { ascending: false }).limit(1).maybeSingle()

          const row = {
            user_id: userId,
            client_id: clientId || null,
            quote_id: contractFromQuoteId || null,
            title: 'Contrat de prestation de service',
            status: 'draft',
            contract_text: finalText,
            mission_start: missionStart || null,
            mission_end: missionEnd || null,
            amount_ht,
            tva_regime: tvaRegime,
            buyer_snapshot: {
              name: clientName,
              email: clientEmail,
              siret: clientSiret,
              addressLines: clientAddress ? String(clientAddress).split(',').map((x) => x.trim()).filter(Boolean) : [],
              representant: clientRepresentant,
            },
            seller_snapshot: {
              name: prestaName,
              email: prestaEmail,
              siret: prestaSiret,
              addressLines: prestaAddress ? String(prestaAddress).split(',').map((x) => x.trim()).filter(Boolean) : [],
              activity: prestaActivity,
            },
          } as any

          if (existing?.id) {
            await supabase.from('contracts').update(row).eq('id', existing.id)
          } else {
            await supabase.from('contracts').insert(row)
          }

          // Refresh list so it appears immediately in the UI/dashboard
          try {
            const { data: cData } = await supabase
              .from('contracts')
              .select('id,title,status,amount_ht,created_at,client_id,quote_id')
              .order('created_at', { ascending: false })
              .limit(50)
            setContracts((cData || []) as any[])
          } catch {}
        }
      } catch (e: any) {
        // Do not fail PDF generation, but surface the issue so it can be fixed (RLS, schema, etc.)
        try {
          console.error('Persist contract failed', e)
        } catch {}
        alert(`PDF généré, mais sauvegarde du contrat en base impossible: ${e?.message || 'Erreur Supabase'}`)
      }

      const payload = {
        title: 'Contrat de prestation de service',
        date: today,
        logoUrl,
        contractText: finalText,
        parties: {
          sellerName: prestaName,
          buyerName: clientName,
        },
      }

      const res = await fetch('/api/contrat-pdf', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })
      const blob = await res.blob()
      if (!res.ok) throw new Error((await blob.text()) || 'Erreur PDF')

      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Contrat-${new Date().toISOString().slice(0, 10)}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (e: any) {
      alert(e?.message || 'Erreur PDF')
    }
  }

  return (
    <div className="contrats-v1">
      <div className="page-header">
        <div>
          <h1 className="page-title">Contrats</h1>
          <p className="page-subtitle">Consultez vos contrats et créez-en un nouveau</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-primary" type="button" onClick={() => setMode('create')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Nouveau contrat
          </button>
        </div>
      </div>

      {mode === 'list' ? (
        <div className="card" style={{ marginTop: 20 }}>
          <div className="card-header">
            <h3 className="card-title">📝 Contrats récents</h3>
          </div>
          {contracts.length === 0 ? (
            <div className="empty-state" style={{ padding: 24 }}>
              <div className="empty-state-icon">📝</div>
              <h4>Aucun contrat</h4>
              <p>Créez votre premier contrat en cliquant sur “Nouveau contrat”.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ textAlign: 'left', fontSize: 12, color: 'var(--gray-500)' }}>
                    <th style={{ padding: '10px 8px', borderBottom: '1px solid var(--gray-200)' }}>Titre</th>
                    <th style={{ padding: '10px 8px', borderBottom: '1px solid var(--gray-200)' }}>Statut</th>
                    <th style={{ padding: '10px 8px', borderBottom: '1px solid var(--gray-200)', textAlign: 'right' }}>Montant</th>
                    <th style={{ padding: '10px 8px', borderBottom: '1px solid var(--gray-200)', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {contracts.map((c) => (
                    <tr key={c.id}>
                      <td style={{ padding: '12px 8px', borderBottom: '1px solid var(--gray-100)' }}>{c.title || 'Contrat'}</td>
                      <td style={{ padding: '12px 8px', borderBottom: '1px solid var(--gray-100)' }}>{c.status || 'draft'}</td>
                      <td style={{ padding: '12px 8px', borderBottom: '1px solid var(--gray-100)', textAlign: 'right', fontWeight: 700 }}>
                        {formatMoney(Number(c.amount_ht || 0))}
                      </td>
                      <td style={{ padding: '12px 8px', borderBottom: '1px solid var(--gray-100)', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                          <button
                            className="btn btn-secondary"
                            type="button"
                            onClick={() => {
                              openContract(String(c.id))
                              setMode('create')
                            }}
                          >
                            Ouvrir
                          </button>
                          <button
                            className="btn btn-secondary"
                            type="button"
                            onClick={() => {
                              try { localStorage.setItem('spyke_invoice_from_contract_id', String(c.id)) } catch {}
                              ;(window as any).__spyke_setTab?.('factures')
                            }}
                          >
                            Facture
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <>
          <button className="btn btn-secondary" type="button" onClick={() => setMode('list')} style={{ marginBottom: 16 }}>
            ← Retour aux contrats
          </button>

          <div className="card">
        <div className="form-section">
          <div className="form-section-title">Importer depuis un devis</div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Choisir un devis</label>
              <select className="form-select" value={contractFromQuoteId} onChange={(e) => importFromQuote(e.target.value)}>
                <option value="">—</option>
                {quotes.map((q) => (
                  <option key={q.id} value={q.id}>
                    {q.number}{q.title ? ` — ${q.title}` : ''}{q.total_ttc != null ? ` (${formatMoney(Number(q.total_ttc) || 0)})` : ''}
                  </option>
                ))}
              </select>
              <div style={{ marginTop: 6, fontSize: 12, color: 'var(--gray-500)' }}>
                Astuce : génère un devis en PDF pour qu’il apparaisse ici.
              </div>
            </div>
          </div>
        </div>

        <div className="form-section-title">Prestataire (vous)</div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Nom / Raison sociale</label>
            <input className="form-input" value={prestaName} onChange={(e) => setPrestaName(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">SIRET</label>
            <input className="form-input" value={prestaSiret} onChange={(e) => setPrestaSiret(e.target.value)} />
          </div>
        </div>
        <div className="form-row single">
          <div className="form-group">
            <label className="form-label">Adresse</label>
            <input className="form-input" value={prestaAddress} onChange={(e) => setPrestaAddress(e.target.value)} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Activité / Métier</label>
            <input className="form-input" value={prestaActivity} onChange={(e) => setPrestaActivity(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" type="email" value={prestaEmail} onChange={(e) => setPrestaEmail(e.target.value)} />
          </div>
        </div>

        <div className="form-section" style={{ marginTop: 24 }}>
          <div className="form-section-title">Client</div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Importer depuis vos clients</label>
              <select className="form-select" value={clientId} onChange={(e) => selectClient(e.target.value)}>
                <option value="">Choisir…</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Nom / Raison sociale</label>
              <input className="form-input" value={clientName} onChange={(e) => setClientName(e.target.value)} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">SIRET client</label>
              <input className="form-input" value={clientSiret} onChange={(e) => setClientSiret(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Représentant du client</label>
              <input className="form-input" value={clientRepresentant} onChange={(e) => setClientRepresentant(e.target.value)} placeholder="Jean Martin, Directeur" />
            </div>
          </div>
          <div className="form-row single">
            <div className="form-group">
              <label className="form-label">Adresse du client</label>
              <input className="form-input" value={clientAddress} onChange={(e) => setClientAddress(e.target.value)} />
            </div>
          </div>
          <div className="form-row single">
            <div className="form-group">
              <label className="form-label">Email du client</label>
              <input className="form-input" type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} />
            </div>
          </div>
        </div>

        <div className="form-section" style={{ marginTop: 24 }}>
          <div className="form-section-title">Mission</div>
          <div className="form-row single">
            <div className="form-group">
              <label className="form-label">Description détaillée</label>
              <textarea className="form-textarea" value={missionDescription} onChange={(e) => setMissionDescription(e.target.value)} />
            </div>
          </div>
          <div className="form-row single">
            <div className="form-group">
              <label className="form-label">Livrables attendus</label>
              <textarea className="form-textarea" value={missionLivrables} onChange={(e) => setMissionLivrables(e.target.value)} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Début</label>
              <input className="form-input" type="date" value={missionStart} onChange={(e) => setMissionStart(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Fin</label>
              <input className="form-input" type="date" value={missionEnd} onChange={(e) => setMissionEnd(e.target.value)} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Lieu d'exécution</label>
              <select className="form-select" value={missionLieu} onChange={(e) => setMissionLieu(e.target.value as any)}>
                <option value="distance">À distance</option>
                <option value="client">Locaux du client</option>
                <option value="prestataire">Locaux du prestataire</option>
                <option value="mixte">Mixte</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Révisions incluses</label>
              <select className="form-select" value={missionRevisions} onChange={(e) => setMissionRevisions(e.target.value as any)}>
                <option value="2">2 révisions</option>
                <option value="3">3 révisions</option>
                <option value="5">5 révisions</option>
                <option value="illimite">Illimitées</option>
              </select>
            </div>
          </div>
        </div>

        <div className="form-section" style={{ marginTop: 24 }}>
          <div className="form-section-title">Conditions financières</div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Type de tarification</label>
              <select className="form-select" value={pricingType} onChange={(e) => setPricingType(e.target.value as any)}>
                <option value="forfait">Forfait</option>
                <option value="tjm">TJM</option>
                <option value="horaire">Horaire</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Montant (€ HT)</label>
              <input className="form-input" type="number" value={String(pricingAmount)} onChange={(e) => setPricingAmount(Number(e.target.value) || 0)} />
            </div>
          </div>

          {pricingType === 'tjm' || pricingType === 'horaire' ? (
            <div className="form-row single">
              <div className="form-group">
                <label className="form-label">Nombre de jours/heures estimés</label>
                <input className="form-input" type="number" value={String(pricingDays)} onChange={(e) => setPricingDays(Number(e.target.value) || 0)} />
              </div>
            </div>
          ) : null}

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Régime TVA</label>
              <select className="form-select" value={tvaRegime} onChange={(e) => setTvaRegime(e.target.value as any)}>
                <option value="franchise">Franchise en base</option>
                <option value="tva">Assujetti à la TVA</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Modalités de paiement</label>
              <select className="form-select" value={paymentSchedule} onChange={(e) => setPaymentSchedule(e.target.value as any)}>
                <option value="30">30/70</option>
                <option value="50">50/50</option>
                <option value="tiers">1/3 - 1/3 - 1/3</option>
                <option value="fin">100% fin</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Délai de paiement</label>
              <select className="form-select" value={paymentDelay} onChange={(e) => setPaymentDelay(e.target.value as any)}>
                <option value="reception">À réception</option>
                <option value="15">15 jours</option>
                <option value="30">30 jours</option>
                <option value="45">45 jours</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Propriété intellectuelle</label>
              <select className="form-select" value={ipClause} onChange={(e) => setIpClause(e.target.value as any)}>
                <option value="cession">Cession après paiement</option>
                <option value="licence">Licence</option>
                <option value="prestataire">Reste au prestataire</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Confidentialité</label>
              <select className="form-select" value={confidentialityClause} onChange={(e) => setConfidentialityClause(e.target.value as any)}>
                <option value="oui">Oui</option>
                <option value="non">Non</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Non concurrence</label>
              <select className="form-select" value={nonCompeteClause} onChange={(e) => setNonCompeteClause(e.target.value as any)}>
                <option value="non">Non</option>
                <option value="6mois">6 mois</option>
                <option value="12mois">12 mois</option>
              </select>
            </div>
          </div>

          <div className="form-row single">
            <div className="form-group">
              <label className="form-label">Résiliation anticipée</label>
              <select className="form-select" value={terminationClause} onChange={(e) => setTerminationClause(e.target.value as any)}>
                <option value="15">Préavis 15 jours</option>
                <option value="30">Préavis 30 jours</option>
                <option value="mutuel">Commun accord</option>
              </select>
            </div>
          </div>
        </div>

        <div className="btn-group" style={{ marginTop: 18 }}>
          <button
            className="btn btn-secondary"
            type="button"
            onClick={() => {
              const txt = buildContractText()
              setContractText(txt)
            }}
          >
            Générer l'aperçu
          </button>

          <button
            className="btn btn-secondary"
            type="button"
            onClick={async () => {
              try {
                // Persist contract then jump to Factures with link
                if (!supabase || !userId) throw new Error('Session manquante')

                const txt = contractText || buildContractText()
                const amount_ht =
                  pricingType === 'forfait'
                    ? Number(pricingAmount || 0)
                    : Number(pricingAmount || 0) * Number(pricingDays || 0)

                const row = {
                  user_id: userId,
                  client_id: clientId || null,
                  quote_id: contractFromQuoteId || null,
                  title: 'Contrat de prestation de service',
                  status: 'draft',
                  contract_text: txt,
                  mission_start: missionStart || null,
                  mission_end: missionEnd || null,
                  amount_ht,
                  tva_regime: tvaRegime,
                  buyer_snapshot: {
                    name: clientName,
                    email: clientEmail,
                    siret: clientSiret,
                    addressLines: clientAddress ? String(clientAddress).split(',').map((x) => x.trim()).filter(Boolean) : [],
                    representant: clientRepresentant,
                  },
                  seller_snapshot: {
                    name: prestaName,
                    email: prestaEmail,
                    siret: prestaSiret,
                    addressLines: prestaAddress ? String(prestaAddress).split(',').map((x) => x.trim()).filter(Boolean) : [],
                    activity: prestaActivity,
                  },
                } as any

                const { data: inserted, error } = await supabase
                  .from('contracts')
                  .insert(row)
                  .select('id')
                  .single()

                if (error) throw error

                if (inserted?.id) {
                  localStorage.setItem('spyke_invoice_from_contract_id', String(inserted.id))
                  ;(window as any).__spyke_setTab?.('factures')
                }
              } catch (e: any) {
                alert(e?.message || 'Erreur')
              }
            }}
          >
            Générer une facture
          </button>

          <button className="btn btn-primary" type="button" onClick={generateContractPdf}>
            Télécharger PDF
          </button>
        </div>

        {contractText ? (
          <div style={{ marginTop: 18 }}>
            <div className="form-section-title">Aperçu</div>
            <div className="output-box" style={{ whiteSpace: 'pre-wrap', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>
              {contractText}
            </div>
          </div>
        ) : null}
      </div>
        </>
      )}
    </div>
  )
}

function FacturesV1({
  clients,
  userId,
  userFullName,
}: {
  clients: Array<{ id: string; name: string; email: string | null }>
  userId: string | null
  userFullName: string
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

  const [mode, setMode] = useState<'list' | 'create'>('list')

  const [quotes, setQuotes] = useState<any[]>([])
  const [invoices, setInvoices] = useState<any[]>([])
  const [selectedQuoteId, setSelectedQuoteId] = useState<string>('')
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>('')

  const [invoiceDate, setInvoiceDate] = useState(today)
  const [paymentDelayDays, setPaymentDelayDays] = useState(30)
  const [dueDate, setDueDate] = useState(() => addDays(today, 30))
  const [invoiceNumber, setInvoiceNumber] = useState(() => genInvoiceNumber(today, 1))

  const [buyer, setBuyer] = useState<any>({ name: '', email: '', addressLines: [] })
  const [clientId, setClientId] = useState('')
  const [lines, setLines] = useState<InvoiceLine[]>(() => [
    { id: '0', description: '', qty: 1, unitPrice: 0 },
  ])

  const totals = useMemo(() => computeInvoiceTotals(lines), [lines])

  useEffect(() => {
    setDueDate(addDays(invoiceDate, paymentDelayDays || 0))
    setInvoiceNumber(genInvoiceNumber(invoiceDate, 1))
  }, [invoiceDate, paymentDelayDays])

  useEffect(() => {
    ;(async () => {
      try {
        if (!supabase) return

        // Auto-import from Devis list
        try {
          const key = 'spyke_invoice_from_quote_id'
          const id = String(localStorage.getItem(key) || '')
          if (id) {
            localStorage.removeItem(key)
            await importQuote(id)
            setMode('create')
          }
        } catch {}

        const [{ data, error }, { data: invData }] = await Promise.all([
          supabase
            .from('quotes')
            .select('id,number,title,date_issue,total_ttc')
            .order('created_at', { ascending: false })
            .limit(50),
          supabase
            .from('invoices')
            .select('id,number,status,date_issue,due_date,total_ttc,client_id,created_at')
            .order('created_at', { ascending: false })
            .limit(50),
        ])

        if (error) throw error
        setQuotes((data || []) as any[])
        setInvoices((invData || []) as any[])
      } catch {
        setQuotes([])
      }
    })()
  }, [mode, supabase])

  async function selectClient(id: string) {
    setClientId(id)
    if (!supabase || !id) return
    const { data: c } = await supabase
      .from('clients')
      .select('name,email,address,postal_code,city,country')
      .eq('id', id)
      .maybeSingle()

    const addressLines: string[] = []
    const addr = (c as any)?.address
    const pc = (c as any)?.postal_code
    const city = (c as any)?.city
    const country = (c as any)?.country
    if (addr) addressLines.push(String(addr))
    const cityLine = [pc, city].filter(Boolean).join(' ')
    if (cityLine) addressLines.push(cityLine)
    if (country) addressLines.push(String(country))

    setBuyer({
      name: String((c as any)?.name || ''),
      email: String((c as any)?.email || ''),
      addressLines,
    })
  }

  async function importQuote(id: string) {
    setSelectedQuoteId(id)
    if (!supabase || !id) return

    const { data: q, error: qErr } = await supabase
      .from('quotes')
      .select('id,number,title,date_issue,validity_until,total_ht,total_tva,total_ttc,buyer_snapshot')
      .eq('id', id)
      .maybeSingle()
    if (qErr || !q) return

    const { data: qLines } = await supabase
      .from('quote_lines')
      .select('label,description,qty,unit_price_ht,vat_rate,position')
      .eq('quote_id', id)
      .order('position', { ascending: true })

    const buyerSnap: any = (q as any).buyer_snapshot || null
    if (buyerSnap) {
      setBuyer({
        name: String(buyerSnap.name || ''),
        email: String(buyerSnap.email || ''),
        addressLines: Array.isArray(buyerSnap.addressLines) ? buyerSnap.addressLines : [],
      })
    }

    const imported = (qLines || []).map((l: any, idx: number) => ({
      id: String(Date.now() + idx),
      description: l.label ? `${l.label}${l.description ? ` — ${l.description}` : ''}` : String(l.description || ''),
      qty: Number(l.qty || 0),
      unitPrice: Number(l.unit_price_ht || 0),
    }))

    setLines(imported.length ? imported : [{ id: '0', description: '', qty: 1, unitPrice: 0 }])
  }

  async function openInvoice(id: string) {
    setSelectedInvoiceId(id)
    if (!supabase || !id) return

    const { data: inv } = await supabase
      .from('invoices')
      .select('id,number,status,date_issue,due_date,payment_terms_days,total_ttc,buyer_snapshot,client_id')
      .eq('id', id)
      .maybeSingle()
    if (!inv) return

    setInvoiceNumber(String((inv as any).number || ''))
    if ((inv as any).date_issue) setInvoiceDate(String((inv as any).date_issue))
    if ((inv as any).due_date) setDueDate(String((inv as any).due_date))
    if ((inv as any).payment_terms_days != null) setPaymentDelayDays(Number((inv as any).payment_terms_days) || 0)

    const buyerSnap: any = (inv as any).buyer_snapshot || null
    if (buyerSnap) {
      setBuyer({
        name: String(buyerSnap.name || ''),
        email: String(buyerSnap.email || ''),
        addressLines: Array.isArray(buyerSnap.addressLines) ? buyerSnap.addressLines : [],
      })
    } else if ((inv as any).client_id) {
      await selectClient(String((inv as any).client_id))
    }

    const { data: invLines } = await supabase
      .from('invoice_lines')
      .select('description,qty,unit_price,position')
      .eq('invoice_id', id)
      .order('position', { ascending: true })

    const mapped = (invLines || []).map((l: any, idx: number) => ({
      id: String(Date.now() + idx),
      description: String(l.description || ''),
      qty: Number(l.qty || 0),
      unitPrice: Number(l.unit_price || 0),
    }))
    setLines(mapped.length ? mapped : [{ id: '0', description: '', qty: 1, unitPrice: 0 }])

    setMode('create')
  }

  function updateLine(id: string, patch: Partial<InvoiceLine>) {
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)))
  }

  function addLine() {
    setLines((prev) => [...prev, { id: String(Date.now()), description: '', qty: 1, unitPrice: 0 }])
  }

  function removeLine(id: string) {
    setLines((prev) => (prev.length <= 1 ? prev : prev.filter((l) => l.id !== id)))
  }

  useEffect(() => {
    ;(async () => {
      try {
        if (!supabase) return
        const key = 'spyke_invoice_from_contract_id'
        const contractId = String(localStorage.getItem(key) || '')
        if (!contractId) return
        localStorage.removeItem(key)

        const { data: c } = await supabase
          .from('contracts')
          .select('id,quote_id,client_id,buyer_snapshot,amount_ht,mission_start,mission_end')
          .eq('id', contractId)
          .maybeSingle()
        if (!c) return

        if ((c as any).client_id) {
          await selectClient(String((c as any).client_id))
        } else {
          const buyerSnap: any = (c as any).buyer_snapshot || null
          if (buyerSnap) setBuyer({ name: String(buyerSnap.name || ''), email: String(buyerSnap.email || ''), addressLines: buyerSnap.addressLines || [] })
        }

        // If linked to a quote, import it for lines
        if ((c as any).quote_id) {
          await importQuote(String((c as any).quote_id))
        } else {
          const amt = Number((c as any).amount_ht || 0)
          setLines([{ id: String(Date.now()), description: 'Prestation', qty: 1, unitPrice: amt }])
        }
      } catch {
        // ignore
      }
    })()
  }, [supabase])

  async function generateInvoicePdf() {
    try {
      if (!supabase) throw new Error('Supabase non initialisé')
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData?.session?.access_token
      if (!token) throw new Error('Non connecté')

      let seller: any = {
        name: userFullName || 'Votre entreprise',
        addressLines: [],
        siret: '',
        iban: '',
        bic: '',
        bankName: '',
        bankAccount: '',
        logoUrl: '',
      }

      if (userId) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name,company_name,logo_path,address,postal_code,city,country,siret,iban,bic,bank_name,bank_account')
          .eq('id', userId)
          .maybeSingle()

        const companyName = (profile as any)?.company_name || (profile as any)?.full_name || userFullName
        const addressLines: string[] = []
        const addr = (profile as any)?.address
        const pc = (profile as any)?.postal_code
        const city = (profile as any)?.city
        const country = (profile as any)?.country
        if (addr) addressLines.push(String(addr))
        const cityLine = [pc, city].filter(Boolean).join(' ')
        if (cityLine) addressLines.push(cityLine)
        if (country) addressLines.push(String(country))

        const logoPath = String((profile as any)?.logo_path || '')
        let logoUrl = ''
        if (logoPath) {
          const pub = supabase.storage.from('logos').getPublicUrl(logoPath)
          logoUrl = String(pub?.data?.publicUrl || '')
        }

        seller = {
          ...seller,
          name: companyName || seller.name,
          addressLines,
          siret: String((profile as any)?.siret || ''),
          iban: String((profile as any)?.iban || ''),
          bic: String((profile as any)?.bic || ''),
          bankName: String((profile as any)?.bank_name || ''),
          bankAccount: String((profile as any)?.bank_account || ''),
          logoUrl,
        }
      }

      const payload = {
        invoiceNumber,
        dateIssue: invoiceDate,
        dueDate,
        logoUrl: String((seller as any)?.logoUrl || ''),
        seller: {
          name: seller.name,
          addressLines: seller.addressLines,
          siret: seller.siret,
          iban: seller.iban,
          bic: seller.bic,
          bankName: seller.bankName,
          bankAccount: seller.bankAccount,
        },
        buyer: {
          name: buyer?.name || '',
          addressLines: buyer?.addressLines || [],
        },
        lines: lines.map((l) => ({ description: l.description, qty: l.qty, unitPrice: l.unitPrice })),
        totals,
      }

      const res = await fetch('/api/facture-pdf', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${token}`,
        },
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

      // Persist invoice in DB
      try {
        if (!userId) {
          alert("PDF généré, mais l'utilisateur n'est pas chargé (userId manquant) : impossible de sauvegarder la facture en base. Recharge la page et réessaie.")
        } else {

          const client_id = clientId || null

          const { data: existing } = await supabase
            .from('invoices')
            .select('id')
            .eq('user_id', userId)
            .eq('number', invoiceNumber)
            .maybeSingle()

          const row = {
            user_id: userId,
            client_id,
            quote_id: selectedQuoteId || null,
            number: invoiceNumber,
            status: 'draft',
            date_issue: invoiceDate || null,
            due_date: dueDate || null,
            payment_terms_days: paymentDelayDays || null,
            notes: null,
            total_ht: totals.totalHt,
            total_tva: totals.totalTva,
            total_ttc: totals.totalTtc,
            buyer_snapshot: buyer,
            seller_snapshot: seller,
          } as any

          let invoiceId: string | null = null
          if (existing?.id) {
            await supabase.from('invoices').update(row).eq('id', existing.id)
            invoiceId = String(existing.id)
          } else {
            const { data: inv, error: invErr } = await supabase.from('invoices').insert(row).select('id').single()
            if (!invErr && inv?.id) invoiceId = String(inv.id)
          }

          if (invoiceId) {
            await supabase.from('invoice_lines').delete().eq('invoice_id', invoiceId)
            if (lines.length) {
              await supabase.from('invoice_lines').insert(
                lines.map((l, idx) => ({
                  invoice_id: invoiceId,
                  position: idx,
                  description: l.description,
                  qty: l.qty,
                  unit_price: l.unitPrice,
                })) as any
              )
            }
          }

          // Refresh list so it appears immediately in the UI/dashboard
          try {
            const { data: invData } = await supabase
              .from('invoices')
              .select('id,number,status,date_issue,due_date,total_ttc,client_id,created_at')
              .order('created_at', { ascending: false })
              .limit(50)
            setInvoices((invData || []) as any[])
          } catch {}
        }
      } catch (e: any) {
        // Do not fail PDF generation, but surface the issue so it can be fixed (RLS, schema, etc.)
        try {
          console.error('Persist invoice failed', e)
        } catch {}
        alert(`PDF généré, mais sauvegarde de la facture en base impossible: ${e?.message || 'Erreur Supabase'}`)
      }

      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Facture-${invoiceNumber}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (e: any) {
      alert(e?.message || 'Erreur PDF')
    }
  }

  return (
    <div className="factures-v1">
      {mode === 'list' ? (
        <>
          <div className="page-header">
            <div>
              <h1 className="page-title">Factures</h1>
              <p className="page-subtitle">Gérez et suivez toutes vos factures</p>
            </div>
            <div className="header-actions">
              <button className="btn btn-primary" type="button" onClick={() => setMode('create')}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Nouvelle facture
              </button>
            </div>
          </div>

          <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
            <div className="stat-card">
              <div className="stat-header">
                <div className="stat-icon blue">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 1v22" />
                    <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
                  </svg>
                </div>
              </div>
              <div className="stat-value">0 €</div>
              <div className="stat-label">Total facturé</div>
            </div>

            <div className="stat-card">
              <div className="stat-header">
                <div className="stat-icon green">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </div>
              </div>
              <div className="stat-value">0 €</div>
              <div className="stat-label">Payé</div>
            </div>

            <div className="stat-card">
              <div className="stat-header">
                <div className="stat-icon yellow">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 6v6l4 2" />
                  </svg>
                </div>
              </div>
              <div className="stat-value">0 €</div>
              <div className="stat-label">En attente</div>
            </div>

            <div className="stat-card">
              <div className="stat-header">
                <div className="stat-icon red">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                </div>
              </div>
              <div className="stat-value">0 €</div>
              <div className="stat-label">En retard</div>
            </div>
          </div>

          <div className="card" style={{ marginTop: 20 }}>
            <div className="card-header">
              <h3 className="card-title">🧾 Factures récentes</h3>
            </div>

            {invoices.length === 0 ? (
              <div className="empty-state" style={{ padding: 24 }}>
                <div className="empty-state-icon">📄</div>
                <h4>Aucune facture</h4>
                <p>Créez votre première facture en cliquant sur “Nouvelle facture”.</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ textAlign: 'left', fontSize: 12, color: 'var(--gray-500)' }}>
                      <th style={{ padding: '10px 8px', borderBottom: '1px solid var(--gray-200)' }}>N°</th>
                      <th style={{ padding: '10px 8px', borderBottom: '1px solid var(--gray-200)' }}>Client</th>
                      <th style={{ padding: '10px 8px', borderBottom: '1px solid var(--gray-200)' }}>Statut</th>
                      <th style={{ padding: '10px 8px', borderBottom: '1px solid var(--gray-200)' }}>Émise le</th>
                      <th style={{ padding: '10px 8px', borderBottom: '1px solid var(--gray-200)' }}>Échéance</th>
                      <th style={{ padding: '10px 8px', borderBottom: '1px solid var(--gray-200)', textAlign: 'right' }}>Total</th>
                      <th style={{ padding: '10px 8px', borderBottom: '1px solid var(--gray-200)', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((inv) => (
                      <tr key={inv.id}>
                        <td style={{ padding: '12px 8px', borderBottom: '1px solid var(--gray-100)' }}>{inv.number}</td>
                        <td style={{ padding: '12px 8px', borderBottom: '1px solid var(--gray-100)' }}>
                          {clients.find((c) => c.id === inv.client_id)?.name || '—'}
                        </td>
                        <td style={{ padding: '12px 8px', borderBottom: '1px solid var(--gray-100)' }}>{inv.status || 'draft'}</td>
                        <td style={{ padding: '12px 8px', borderBottom: '1px solid var(--gray-100)' }}>{inv.date_issue ? formatDateFr(String(inv.date_issue)) : '—'}</td>
                        <td style={{ padding: '12px 8px', borderBottom: '1px solid var(--gray-100)' }}>{inv.due_date ? formatDateFr(String(inv.due_date)) : '—'}</td>
                        <td style={{ padding: '12px 8px', borderBottom: '1px solid var(--gray-100)', textAlign: 'right', fontWeight: 700 }}>{formatMoney(Number(inv.total_ttc || 0))}</td>
                        <td style={{ padding: '12px 8px', borderBottom: '1px solid var(--gray-100)', textAlign: 'right' }}>
                          <button className="btn btn-secondary" type="button" onClick={() => openInvoice(String(inv.id))}>
                            Ouvrir
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          <button className="btn btn-secondary" type="button" onClick={() => setMode('list')} style={{ marginBottom: 16 }}>
            ← Retour aux factures
          </button>

          <div className="page-header">
            <div>
              <h1 className="page-title">Nouvelle facture</h1>
              <p className="page-subtitle">Créez une facture (UI) — la sauvegarde viendra ensuite</p>
            </div>
          </div>

          <div className="card">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Importer depuis un devis</label>
                <select
                  className="form-select"
                  value={selectedQuoteId}
                  onChange={(e) => importQuote(e.target.value)}
                >
                  <option value="">Choisir un devis…</option>
                  {quotes.map((q) => (
                    <option key={q.id} value={q.id}>
                      {q.number}{q.title ? ` — ${q.title}` : ''}{q.total_ttc != null ? ` (${formatMoney(Number(q.total_ttc) || 0)})` : ''}
                    </option>
                  ))}
                </select>
                <div style={{ marginTop: 6, fontSize: 12, color: 'var(--gray-500)' }}>
                  Astuce : génère au moins un devis en PDF pour qu’il apparaisse ici.
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Ou sélectionner un client</label>
                <select className="form-select" value={clientId} onChange={(e) => selectClient(e.target.value)}>
                  <option value="">Choisir…</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">N° de facture</label>
                <input className="form-input" value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Date</label>
                <input className="form-input" type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Délai de paiement</label>
                <select className="form-select" value={String(paymentDelayDays)} onChange={(e) => setPaymentDelayDays(Number(e.target.value) || 0)}>
                  <option value="0">À réception</option>
                  <option value="15">15 jours</option>
                  <option value="30">30 jours</option>
                  <option value="45">45 jours</option>
                  <option value="60">60 jours</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Échéance</label>
                <input className="form-input" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Destinataire (nom)</label>
                <input className="form-input" value={buyer?.name || ''} onChange={(e) => setBuyer({ ...buyer, name: e.target.value })} />
              </div>

              <div className="form-group">
                <label className="form-label">Email (optionnel)</label>
                <input className="form-input" value={buyer?.email || ''} onChange={(e) => setBuyer({ ...buyer, email: e.target.value })} />
              </div>
            </div>

            <div className="form-group" style={{ marginTop: 8 }}>
              <label className="form-label">Prestations</label>

              <div className="invoice-lines">
                <div className="invoice-lines-header">
                  <div>Description</div>
                  <div style={{ textAlign: 'center' }}>Qté</div>
                  <div style={{ textAlign: 'right' }}>PU</div>
                  <div style={{ textAlign: 'right' }}>Total</div>
                  <div />
                </div>

                {lines.map((l) => (
                  <div key={l.id} className="invoice-line">
                    <input
                      className="form-input"
                      value={l.description}
                      onChange={(e) => updateLine(l.id, { description: e.target.value })}
                      placeholder="Description de la prestation"
                    />
                    <input
                      className="form-input"
                      type="number"
                      value={String(l.qty)}
                      min={0}
                      onChange={(e) => updateLine(l.id, { qty: Number(e.target.value) || 0 })}
                      style={{ textAlign: 'center' }}
                    />
                    <input
                      className="form-input"
                      type="number"
                      value={String(l.unitPrice)}
                      min={0}
                      step={0.01}
                      onChange={(e) => updateLine(l.id, { unitPrice: Number(e.target.value) || 0 })}
                      style={{ textAlign: 'right' }}
                    />
                    <input
                      className="form-input"
                      disabled
                      value={formatMoney((l.qty || 0) * (l.unitPrice || 0))}
                      style={{ textAlign: 'right' }}
                    />
                    <button
                      type="button"
                      className="invoice-remove"
                      onClick={() => removeLine(l.id)}
                      style={{ visibility: lines.length > 1 ? 'visible' : 'hidden' }}
                      title="Supprimer"
                    >
                      ×
                    </button>
                  </div>
                ))}

                <button type="button" className="btn-add-prestation" onClick={addLine}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  Ajouter une ligne
                </button>
              </div>
            </div>

            <div className="preview-card" style={{ marginTop: 16 }}>
              <div className="preview-section">
                <div className="preview-section-title">Totaux</div>
                <div className="preview-row">
                  <span>Total HT</span>
                  <span>{formatMoney(totals.totalHt)}</span>
                </div>
                <div className="preview-row">
                  <span>Total TTC</span>
                  <span>{formatMoney(totals.totalTtc)}</span>
                </div>
              </div>
            </div>

            <div className="btn-group" style={{ marginTop: 18 }}>
              <button className="btn btn-secondary" type="button" onClick={() => alert('Brouillon: à connecter')}>
                Enregistrer brouillon
              </button>
              <button className="btn btn-primary" type="button" onClick={generateInvoicePdf}>
                Générer PDF
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

type Tab = 'dashboard' | 'clients' | 'assistant' | 'devis' | 'factures' | 'contrats' | 'analyseur' | 'settings'

type ModalName = 'newClient' | 'editClient' | 'newDevis'

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
  siret: string | null
  address: string | null
  postal_code: string | null
  city: string | null
  country: string | null
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
  const [editingClientId, setEditingClientId] = useState<string>('')
  const [clientsView, setClientsView] = useState<'table' | 'detail'>('table')
  const [viewClientId, setViewClientId] = useState<string>('')
  const [clientSearch, setClientSearch] = useState<string>('')
  const [clientStats, setClientStats] = useState<
    Record<string, { quotes: number; invoices: number; contracts: number; totalInvoiced: number; lastStatus: string }>
  >({})

  const [assistantContext, setAssistantContext] = useState<string>('')
  const [assistantOutput, setAssistantOutput] = useState<string>('')

  // Dashboard data
  const [dashboardQuotes, setDashboardQuotes] = useState<any[]>([])
  const [dashboardInvoices, setDashboardInvoices] = useState<any[]>([])
  const [dashboardContracts, setDashboardContracts] = useState<any[]>([])
  const [dashboardCaMonth, setDashboardCaMonth] = useState<number>(0)
  const [dashboardActiveClients, setDashboardActiveClients] = useState<number>(0)
  const [dashboardPendingQuotes, setDashboardPendingQuotes] = useState<number>(0)

  // Allow sub-components to navigate tabs
  useEffect(() => {
    ;(window as any).__spyke_setTab = (t: Tab) => setTab(t)
    return () => {
      try {
        delete (window as any).__spyke_setTab
      } catch {}
    }
  }, [])

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
          .select('id,name,email,phone,siret,address,postal_code,city,country,notes')
          .order('created_at', { ascending: false })

        if (clientsError) throw clientsError
        setClients((clientsData || []) as ClientRow[])
        await refreshClientStats()
        await refreshDashboardData()
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
      .select('id,name,email,phone,siret,address,postal_code,city,country,notes')
      .order('created_at', { ascending: false })
    if (!error) {
      setClients((data || []) as ClientRow[])
      await refreshClientStats()
    }
  }

  async function deleteClient(id: string) {
    if (!supabase) return
    const c = clients.find((x) => x.id === id)
    const ok = confirm(`Supprimer le client “${c?.name || ''}” ?`)
    if (!ok) return

    try {
      setLoading(true)
      const { error } = await supabase.from('clients').delete().eq('id', id)
      if (error) throw error
      if (selectedClientId === id) setSelectedClientId('')
      if (editingClientId === id) setEditingClientId('')
      if (viewClientId === id) {
        setViewClientId('')
        setClientsView('table')
      }
      await refreshClients()
    } catch (e: any) {
      alert(e?.message || 'Erreur suppression client')
    } finally {
      setLoading(false)
    }
  }

  async function refreshDashboardData() {
    if (!supabase || !userId) return
    try {
      const now = new Date()
      const y = now.getFullYear()
      const m = now.getMonth()
      const start = new Date(y, m, 1)
      const end = new Date(y, m + 1, 1)
      const startStr = start.toISOString().slice(0, 10)
      const endStr = end.toISOString().slice(0, 10)

      const [{ data: q }, { data: inv }, { data: ctr }, { data: invMonth }, { count: clientsCount }] = await Promise.all([
        supabase.from('quotes').select('id,number,title,status,total_ttc,created_at').order('created_at', { ascending: false }).limit(5),
        supabase
          .from('invoices')
          .select('id,number,status,total_ttc,created_at,due_date,client_id')
          .order('created_at', { ascending: false })
          .limit(5),
        supabase.from('contracts').select('id,title,status,amount_ht,created_at,client_id').order('created_at', { ascending: false }).limit(5),
        supabase
          .from('invoices')
          .select('total_ttc,date_issue')
          .gte('date_issue', startStr)
          .lt('date_issue', endStr),
        supabase.from('clients').select('id', { count: 'exact', head: true }),
      ])

      setDashboardQuotes(q || [])
      setDashboardInvoices(inv || [])
      setDashboardContracts(ctr || [])
      setDashboardActiveClients(Number(clientsCount || 0))

      let ca = 0
      for (const r of (invMonth || []) as any[]) ca += Number(r.total_ttc || 0)
      setDashboardCaMonth(ca)

      const pending = (q || []).filter((x: any) => {
        const s = String(x.status || '')
        return s && !['accepted', 'paid', 'rejected', 'cancelled'].includes(s)
      }).length
      setDashboardPendingQuotes(pending)
    } catch {
      // ignore
    }
  }

  async function refreshClientStats() {
    if (!supabase) return
    try {
      const [{ data: qData }, { data: iData }, { data: cData }] = await Promise.all([
        supabase.from('quotes').select('client_id').not('client_id', 'is', null),
        supabase.from('invoices').select('client_id,total_ttc,status,created_at').not('client_id', 'is', null),
        supabase.from('contracts').select('client_id').not('client_id', 'is', null),
      ])

      const map: Record<
        string,
        { quotes: number; invoices: number; contracts: number; totalInvoiced: number; lastStatus: string; lastAt: number }
      > = {}

      for (const q of (qData || []) as any[]) {
        const id = String(q.client_id)
        if (!map[id]) map[id] = { quotes: 0, invoices: 0, contracts: 0, totalInvoiced: 0, lastStatus: '—', lastAt: 0 }
        map[id].quotes += 1
      }

      for (const c of (cData || []) as any[]) {
        const id = String(c.client_id)
        if (!map[id]) map[id] = { quotes: 0, invoices: 0, contracts: 0, totalInvoiced: 0, lastStatus: '—', lastAt: 0 }
        map[id].contracts += 1
      }

      for (const inv of (iData || []) as any[]) {
        const id = String(inv.client_id)
        if (!map[id]) map[id] = { quotes: 0, invoices: 0, contracts: 0, totalInvoiced: 0, lastStatus: '—', lastAt: 0 }
        map[id].invoices += 1
        map[id].totalInvoiced += Number(inv.total_ttc || 0)
        const t = inv.created_at ? new Date(inv.created_at).getTime() : 0
        if (t >= map[id].lastAt) {
          map[id].lastAt = t
          map[id].lastStatus = String(inv.status || '—')
        }
      }

      const cleaned: any = {}
      for (const [k, v] of Object.entries(map)) {
        cleaned[k] = {
          quotes: v.quotes,
          invoices: v.invoices,
          contracts: v.contracts,
          totalInvoiced: v.totalInvoiced,
          lastStatus: v.lastStatus,
        }
      }
      setClientStats(cleaned)
    } catch {
      // ignore
    }
  }

  // (duplication removed: replaced by "Nouveau devis")

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

        /* ===== FACTURES (UI) ===== */
        .factures-v1 .invoice-lines {
          border: 1px solid var(--gray-200);
          border-radius: 14px;
          padding: 12px;
          background: var(--gray-50);
        }

        .factures-v1 .invoice-lines-header {
          display: grid;
          grid-template-columns: 2fr 90px 130px 140px 40px;
          gap: 10px;
          padding: 6px 4px 10px;
          font-size: 11px;
          font-weight: 700;
          color: var(--gray-400);
          text-transform: uppercase;
          letter-spacing: 0.6px;
        }

        .factures-v1 .invoice-line {
          display: grid;
          grid-template-columns: 2fr 90px 130px 140px 40px;
          gap: 10px;
          align-items: center;
          padding: 8px 4px;
        }

        .factures-v1 .invoice-line .form-input {
          width: 100%;
          max-width: 100%;
        }

        .factures-v1 .invoice-remove {
          width: 34px;
          height: 34px;
          border: none;
          border-radius: 10px;
          background: var(--red-light);
          color: var(--red);
          cursor: pointer;
          font-size: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .factures-v1 .invoice-remove:hover {
          background: var(--red);
          color: var(--white);
        }

        @media (max-width: 900px) {
          .factures-v1 .invoice-lines-header {
            display: none;
          }
          .factures-v1 .invoice-line {
            grid-template-columns: 1fr 1fr;
          }
          .factures-v1 .invoice-line input:nth-child(1) {
            grid-column: 1 / -1;
          }
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

          {/* Assistant IA (déplacé plus bas) */}

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

          <button className={`nav-item ${tab === 'factures' ? 'active' : ''}`} onClick={() => setTab('factures')}>
            <svg viewBox="0 0 24 24">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
            Factures
          </button>

          <button className={`nav-item ${tab === 'contrats' ? 'active' : ''}`} onClick={() => setTab('contrats')}>
            <svg viewBox="0 0 24 24">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <path d="M8 13h8" />
              <path d="M8 17h8" />
            </svg>
            Contrats
          </button>

          <span className="nav-section-title">Outils</span>

          <button className={`nav-item ${tab === 'analyseur' ? 'active' : ''}`} onClick={() => setTab('analyseur')}>
            <svg viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            Analyseur de projet
          </button>

          <button className={`nav-item ${tab === 'assistant' ? 'active' : ''}`} onClick={() => setTab('assistant')}>
            <svg viewBox="0 0 24 24">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            </svg>
            Assistant IA
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
              <div className="stat-value">{formatMoney(dashboardCaMonth)}</div>
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
              <div className="stat-value">{dashboardActiveClients}</div>
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
              <div className="stat-value">{dashboardPendingQuotes}</div>
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
                <div className="quick-action" onClick={() => setTab('devis')}>
                  <div className="quick-action-icon">📄</div>
                  <div className="quick-action-text">
                    <h4>Nouveau devis</h4>
                    <p>Créer en 2 min</p>
                  </div>
                </div>

                <div className="quick-action" onClick={() => setTab('factures')}> 
                  <div className="quick-action-icon">💰</div>
                  <div className="quick-action-text">
                    <h4>Nouvelle facture</h4>
                    <p>Importer un devis</p>
                  </div>
                </div>

                <div className="quick-action" onClick={() => setTab('contrats')}>
                  <div className="quick-action-icon">📝</div>
                  <div className="quick-action-text">
                    <h4>Nouveau contrat</h4>
                    <p>Générer un PDF</p>
                  </div>
                </div>

                <div className="quick-action" onClick={() => setTab('analyseur')}>
                  <div className="quick-action-icon">🔍</div>
                  <div className="quick-action-text">
                    <h4>Analyse projet</h4>
                    <p>Lire un brief</p>
                  </div>
                </div>

                <div className="quick-action" onClick={() => setTab('assistant')}>
                  <div className="quick-action-icon">✉️</div>
                  <div className="quick-action-text">
                    <h4>Assistant IA</h4>
                    <p>Emails & relances</p>
                  </div>
                </div>

                <div className="quick-action" onClick={() => setModal('newClient')}>
                  <div className="quick-action-icon">👤</div>
                  <div className="quick-action-text">
                    <h4>Ajouter client</h4>
                    <p>Nouveau contact</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="cards-grid">
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
              {dashboardQuotes.length === 0 ? (
                <div className="empty-state" style={{ padding: 24 }}>
                  <p>Aucun devis pour le moment</p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ textAlign: 'left', fontSize: 12, color: 'var(--gray-500)' }}>
                        <th style={{ padding: '10px 8px', borderBottom: '1px solid var(--gray-200)' }}>N°</th>
                        <th style={{ padding: '10px 8px', borderBottom: '1px solid var(--gray-200)' }}>Titre</th>
                        <th style={{ padding: '10px 8px', borderBottom: '1px solid var(--gray-200)' }}>Statut</th>
                        <th style={{ padding: '10px 8px', borderBottom: '1px solid var(--gray-200)', textAlign: 'right' }}>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboardQuotes.map((q) => (
                        <tr key={q.id}>
                          <td style={{ padding: '12px 8px', borderBottom: '1px solid var(--gray-100)' }}>{q.number}</td>
                          <td style={{ padding: '12px 8px', borderBottom: '1px solid var(--gray-100)' }}>{q.title || '—'}</td>
                          <td style={{ padding: '12px 8px', borderBottom: '1px solid var(--gray-100)' }}>{q.status || 'draft'}</td>
                          <td style={{ padding: '12px 8px', borderBottom: '1px solid var(--gray-100)', textAlign: 'right', fontWeight: 700 }}>
                            {formatMoney(Number(q.total_ttc || 0))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="card">
              <div className="card-header">
                <h3 className="card-title">💰 Factures</h3>
                <a
                  href="#"
                  className="card-action"
                  onClick={(e) => {
                    e.preventDefault()
                    setTab('factures')
                  }}
                >
                  Ouvrir
                </a>
              </div>
              {dashboardInvoices.length === 0 ? (
                <div className="empty-state" style={{ padding: 24 }}>
                  <p>Importez un devis puis générez la facture PDF.</p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ textAlign: 'left', fontSize: 12, color: 'var(--gray-500)' }}>
                        <th style={{ padding: '10px 8px', borderBottom: '1px solid var(--gray-200)' }}>N°</th>
                        <th style={{ padding: '10px 8px', borderBottom: '1px solid var(--gray-200)' }}>Statut</th>
                        <th style={{ padding: '10px 8px', borderBottom: '1px solid var(--gray-200)' }}>Échéance</th>
                        <th style={{ padding: '10px 8px', borderBottom: '1px solid var(--gray-200)', textAlign: 'right' }}>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboardInvoices.map((inv) => (
                        <tr key={inv.id}>
                          <td style={{ padding: '12px 8px', borderBottom: '1px solid var(--gray-100)' }}>{inv.number}</td>
                          <td style={{ padding: '12px 8px', borderBottom: '1px solid var(--gray-100)' }}>{inv.status || 'draft'}</td>
                          <td style={{ padding: '12px 8px', borderBottom: '1px solid var(--gray-100)' }}>
                            {inv.due_date ? formatDateFr(String(inv.due_date)) : '—'}
                          </td>
                          <td style={{ padding: '12px 8px', borderBottom: '1px solid var(--gray-100)', textAlign: 'right', fontWeight: 700 }}>
                            {formatMoney(Number(inv.total_ttc || 0))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="card">
              <div className="card-header">
                <h3 className="card-title">📝 Contrats</h3>
                <a
                  href="#"
                  className="card-action"
                  onClick={(e) => {
                    e.preventDefault()
                    setTab('contrats')
                  }}
                >
                  Ouvrir
                </a>
              </div>
              {dashboardContracts.length === 0 ? (
                <div className="empty-state" style={{ padding: 24 }}>
                  <p>Générez un contrat et téléchargez le PDF.</p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ textAlign: 'left', fontSize: 12, color: 'var(--gray-500)' }}>
                        <th style={{ padding: '10px 8px', borderBottom: '1px solid var(--gray-200)' }}>Titre</th>
                        <th style={{ padding: '10px 8px', borderBottom: '1px solid var(--gray-200)' }}>Statut</th>
                        <th style={{ padding: '10px 8px', borderBottom: '1px solid var(--gray-200)', textAlign: 'right' }}>Montant</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboardContracts.map((c) => (
                        <tr key={c.id}>
                          <td style={{ padding: '12px 8px', borderBottom: '1px solid var(--gray-100)' }}>{c.title || 'Contrat'}</td>
                          <td style={{ padding: '12px 8px', borderBottom: '1px solid var(--gray-100)' }}>{c.status || 'draft'}</td>
                          <td style={{ padding: '12px 8px', borderBottom: '1px solid var(--gray-100)', textAlign: 'right', fontWeight: 700 }}>
                            {formatMoney(Number(c.amount_ht || 0))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
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

          {clientsView === 'detail' ? (
            (() => {
              const c = clients.find((x) => x.id === viewClientId)
              return (
                <div className="card">
                  <button
                    className="btn btn-secondary"
                    type="button"
                    onClick={() => {
                      setClientsView('table')
                      setViewClientId('')
                    }}
                    style={{ marginBottom: 12 }}
                  >
                    ← Retour
                  </button>

                  <div className="page-header" style={{ marginBottom: 12 }}>
                    <div>
                      <h2 className="page-title" style={{ fontSize: 20 }}>Fiche client</h2>
                      <p className="page-subtitle">{c?.name || ''}</p>
                    </div>
                    <div className="header-actions">
                      <button
                        className="btn btn-secondary"
                        type="button"
                        onClick={() => {
                          if (!c) return
                          setEditingClientId(c.id)
                          setModal('editClient')
                        }}
                      >
                        ✏️ Modifier
                      </button>
                      <button
                        className="btn btn-secondary"
                        type="button"
                        onClick={() => {
                          if (!c) return
                          try {
                            localStorage.setItem('spyke_devis_client_id', c.id)
                          } catch {}
                          ;(window as any).__spyke_setTab?.('devis')
                        }}
                      >
                        📄 Nouveau devis
                      </button>
                      <button
                        className="btn btn-secondary"
                        type="button"
                        onClick={() => {
                          if (!c) return
                          deleteClient(c.id)
                        }}
                      >
                        🗑️ Supprimer
                      </button>
                    </div>
                  </div>

                  {!c ? (
                    <div className="empty-state"><p>Client introuvable</p></div>
                  ) : (
                    <div style={{ fontSize: 14, color: 'var(--gray-700)' }}>
                      <div><b>Email:</b> {c.email || '—'}</div>
                      <div><b>Téléphone:</b> {c.phone || '—'}</div>
                      <div><b>SIRET:</b> {c.siret || '—'}</div>
                      <div style={{ marginTop: 8 }}>
                        <b>Adresse:</b> {[c.address, [c.postal_code, c.city].filter(Boolean).join(' '), c.country].filter(Boolean).join(', ') || '—'}
                      </div>
                      {c.notes ? (
                        <div style={{ marginTop: 8 }}>
                          <b>Notes:</b>
                          <div style={{ whiteSpace: 'pre-wrap', marginTop: 4 }}>{c.notes}</div>
                        </div>
                      ) : null}

                      <div className="btn-group" style={{ marginTop: 18 }}>
                        <button
                          className="btn btn-secondary"
                          type="button"
                          onClick={() => {
                            setSelectedClientId(c.id)
                            setTab('assistant')
                          }}
                        >
                          ✉️ Écrire un email
                        </button>
                        <button className="btn btn-secondary" type="button" onClick={() => setTab('devis')}>
                          📄 Faire un devis
                        </button>
                        <button className="btn btn-secondary" type="button" onClick={() => setTab('factures')}>
                          💰 Faire une facture
                        </button>
                        <button className="btn btn-secondary" type="button" onClick={() => setTab('contrats')}>
                          📝 Faire un contrat
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })()
          ) : (
            <div className="card">
              <div className="form-row" style={{ marginBottom: 0 }}>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Rechercher</label>
                  <input
                    className="form-input"
                    placeholder="Tapez un nom, un email, une ville…"
                    value={clientSearch}
                    onChange={(e) => setClientSearch(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ marginTop: 12, overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ textAlign: 'left', fontSize: 12, color: 'var(--gray-500)' }}>
                      <th style={{ padding: '10px 8px', borderBottom: '1px solid var(--gray-200)' }}>Client</th>
                      <th style={{ padding: '10px 8px', borderBottom: '1px solid var(--gray-200)' }}>Contact</th>
                      <th style={{ padding: '10px 8px', borderBottom: '1px solid var(--gray-200)' }}>Ville</th>
                      <th style={{ padding: '10px 8px', borderBottom: '1px solid var(--gray-200)' }}>Devis</th>
                      <th style={{ padding: '10px 8px', borderBottom: '1px solid var(--gray-200)' }}>Contrats</th>
                      <th style={{ padding: '10px 8px', borderBottom: '1px solid var(--gray-200)' }}>Factures</th>
                      <th style={{ padding: '10px 8px', borderBottom: '1px solid var(--gray-200)', textAlign: 'right' }}>Total facturé</th>
                      <th style={{ padding: '10px 8px', borderBottom: '1px solid var(--gray-200)' }}>Dernier statut</th>
                      <th style={{ padding: '10px 8px', borderBottom: '1px solid var(--gray-200)', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(clients
                      .filter((c) => {
                        const q = clientSearch.trim().toLowerCase()
                        if (!q) return true
                        return [c.name, c.email, c.phone, c.city, c.address]
                          .filter(Boolean)
                          .some((x) => String(x).toLowerCase().includes(q))
                      })
                      .map((c) => {
                        const s = clientStats[c.id] || { quotes: 0, invoices: 0, contracts: 0, totalInvoiced: 0, lastStatus: '—' }
                        return (
                          <tr
                            key={c.id}
                            style={{ cursor: 'pointer' }}
                            onClick={() => {
                              setViewClientId(c.id)
                              setClientsView('detail')
                            }}
                          >
                            <td style={{ padding: '12px 8px', borderBottom: '1px solid var(--gray-100)' }}>
                              <div style={{ fontWeight: 700, color: 'var(--black)' }}>{c.name}</div>
                              <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>{c.siret || ''}</div>
                            </td>
                            <td style={{ padding: '12px 8px', borderBottom: '1px solid var(--gray-100)' }}>
                              <div style={{ fontSize: 13 }}>{c.email || '—'}</div>
                              <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>{c.phone || ''}</div>
                            </td>
                            <td style={{ padding: '12px 8px', borderBottom: '1px solid var(--gray-100)' }}>{c.city || '—'}</td>
                            <td style={{ padding: '12px 8px', borderBottom: '1px solid var(--gray-100)' }}>{s.quotes}</td>
                            <td style={{ padding: '12px 8px', borderBottom: '1px solid var(--gray-100)' }}>{s.contracts}</td>
                            <td style={{ padding: '12px 8px', borderBottom: '1px solid var(--gray-100)' }}>{s.invoices}</td>
                            <td style={{ padding: '12px 8px', borderBottom: '1px solid var(--gray-100)', textAlign: 'right', fontWeight: 700 }}>
                              {formatMoney(Number(s.totalInvoiced || 0))}
                            </td>
                            <td style={{ padding: '12px 8px', borderBottom: '1px solid var(--gray-100)' }}>{s.lastStatus}</td>
                            <td style={{ padding: '12px 8px', borderBottom: '1px solid var(--gray-100)', textAlign: 'right' }}>
                              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                                <button
                                  type="button"
                                  className="btn btn-secondary"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setEditingClientId(c.id)
                                    setModal('editClient')
                                  }}
                                >
                                  ✏️
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-secondary"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    try { localStorage.setItem('spyke_devis_client_id', c.id) } catch {}
                                    ;(window as any).__spyke_setTab?.('devis')
                                  }}
                                >
                                  📄
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-secondary"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setSelectedClientId(c.id)
                                    setTab('assistant')
                                  }}
                                >
                                  ✉️
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-secondary"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    deleteClient(c.id)
                                  }}
                                >
                                  🗑️
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      }))}
                  </tbody>
                </table>

                {clients.length === 0 ? (
                  <div className="empty-state" style={{ padding: 24 }}>
                    <p>Aucun client</p>
                  </div>
                ) : null}
              </div>
            </div>
          )}
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

          <DevisV4 userFullName={userFullName} userJob={userJob} userId={userId} />
        </div>

        {/* Factures */}
        <div id="tab-factures" className={`tab-content ${tab === 'factures' ? 'active' : ''}`}>
          <FacturesV1 clients={clients} userId={userId} userFullName={userFullName} />
        </div>

        {/* Contrats */}
        <div id="tab-contrats" className={`tab-content ${tab === 'contrats' ? 'active' : ''}`}>
          <ContratsV1 clients={clients} userId={userId} userFullName={userFullName} userJob={userJob} />
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
              <label className="form-label">SIRET (optionnel)</label>
              <input name="client_siret" type="text" className="form-input" placeholder="123 456 789 00012" />
            </div>
            <div className="form-group">
              <label className="form-label">Adresse</label>
              <input name="client_address" type="text" className="form-input" placeholder="12 rue de la Paix" />
            </div>
            <div className="form-group">
              <label className="form-label">Code postal</label>
              <input name="client_postal_code" type="text" className="form-input" placeholder="75002" />
            </div>
            <div className="form-group">
              <label className="form-label">Ville</label>
              <input name="client_city" type="text" className="form-input" placeholder="Paris" />
            </div>
            <div className="form-group">
              <label className="form-label">Pays</label>
              <input name="client_country" type="text" className="form-input" placeholder="France" />
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
                  const siret = String(
                    (modalEl?.querySelector('[name="client_siret"]') as HTMLInputElement | null)?.value || ''
                  ).trim()
                  const address = String(
                    (modalEl?.querySelector('[name="client_address"]') as HTMLInputElement | null)?.value || ''
                  ).trim()
                  const postal_code = String(
                    (modalEl?.querySelector('[name="client_postal_code"]') as HTMLInputElement | null)?.value || ''
                  ).trim()
                  const city = String(
                    (modalEl?.querySelector('[name="client_city"]') as HTMLInputElement | null)?.value || ''
                  ).trim()
                  const country = String(
                    (modalEl?.querySelector('[name="client_country"]') as HTMLInputElement | null)?.value || ''
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
                      siret: siret || null,
                      address: address || null,
                      postal_code: postal_code || null,
                      city: city || null,
                      country: country || null,
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

      {/* Modal: Edit Client */}
      <div
        className={`modal-overlay ${modal === 'editClient' ? 'active' : ''}`}
        id="modal-editClient"
        onClick={(e) => {
          if (e.target === e.currentTarget) setModal(null)
        }}
      >
        <div className="modal">
          <div className="modal-header">
            <h3 className="modal-title">Modifier le client</h3>
            <button className="modal-close" type="button" onClick={() => setModal(null)}>
              ✕
            </button>
          </div>
          <div className="modal-body">
            {(() => {
              const c = clients.find((x) => x.id === editingClientId)
              if (!c) return <div className="empty-state"><p>Client introuvable</p></div>

              return (
                <>
                  <div className="form-group">
                    <label className="form-label">Nom / Entreprise</label>
                    <input name="edit_client_name" type="text" className="form-input" defaultValue={c.name || ''} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input name="edit_client_email" type="email" className="form-input" defaultValue={c.email || ''} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Téléphone</label>
                    <input name="edit_client_phone" type="tel" className="form-input" defaultValue={c.phone || ''} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">SIRET</label>
                    <input name="edit_client_siret" type="text" className="form-input" defaultValue={c.siret || ''} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Adresse</label>
                    <input name="edit_client_address" type="text" className="form-input" defaultValue={c.address || ''} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Code postal</label>
                    <input name="edit_client_postal_code" type="text" className="form-input" defaultValue={c.postal_code || ''} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Ville</label>
                    <input name="edit_client_city" type="text" className="form-input" defaultValue={c.city || ''} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Pays</label>
                    <input name="edit_client_country" type="text" className="form-input" defaultValue={c.country || ''} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Notes</label>
                    <textarea name="edit_client_notes" className="form-textarea" rows={3} defaultValue={c.notes || ''} />
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

                        const modalEl = document.getElementById('modal-editClient')
                        const name = String((modalEl?.querySelector('[name="edit_client_name"]') as HTMLInputElement | null)?.value || '').trim()
                        const email = String((modalEl?.querySelector('[name="edit_client_email"]') as HTMLInputElement | null)?.value || '').trim()
                        const phone = String((modalEl?.querySelector('[name="edit_client_phone"]') as HTMLInputElement | null)?.value || '').trim()
                        const siret = String((modalEl?.querySelector('[name="edit_client_siret"]') as HTMLInputElement | null)?.value || '').trim()
                        const address = String((modalEl?.querySelector('[name="edit_client_address"]') as HTMLInputElement | null)?.value || '').trim()
                        const postal_code = String((modalEl?.querySelector('[name="edit_client_postal_code"]') as HTMLInputElement | null)?.value || '').trim()
                        const city = String((modalEl?.querySelector('[name="edit_client_city"]') as HTMLInputElement | null)?.value || '').trim()
                        const country = String((modalEl?.querySelector('[name="edit_client_country"]') as HTMLInputElement | null)?.value || '').trim()
                        const notes = String((modalEl?.querySelector('[name="edit_client_notes"]') as HTMLTextAreaElement | null)?.value || '').trim()

                        if (!name) {
                          alert('Nom requis')
                          return
                        }

                        try {
                          setLoading(true)
                          const { error } = await supabase
                            .from('clients')
                            .update({
                              name,
                              email: email || null,
                              phone: phone || null,
                              siret: siret || null,
                              address: address || null,
                              postal_code: postal_code || null,
                              city: city || null,
                              country: country || null,
                              notes: notes || null,
                            })
                            .eq('id', c.id)

                          if (error) throw error
                          setModal(null)
                          await refreshClients()
                        } catch (e: any) {
                          alert(e?.message || 'Erreur modification client')
                        } finally {
                          setLoading(false)
                        }
                      }}
                    >
                      {loading ? 'Enregistrement…' : 'Enregistrer'}
                    </button>
                  </div>
                </>
              )
            })()}
          </div>
        </div>
      </div>
    </>
  )
}
