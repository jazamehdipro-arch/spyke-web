'use client'

import { useEffect, useMemo, useState } from 'react'
import { getSupabase } from '@/lib/supabaseClient'

const ADMIN_EMAIL = 'Jazamehdi.pro@gmail.com'

type Period = 'today' | '7d' | '30d'

type DailyMetric = {
  day: string
  total_events: number
  page_views: number
  pdf_generated: number
  pdf_failed: number
  email_sent: number
  email_failed: number
}

type GroupedRow = {
  day: string
  page_group: 'blog' | 'seo_devis' | 'seo_facture' | 'seo_contrat' | 'other'
  page_views: number
}

type TopPage = { path: string; page_views: number }

type PdfEvent = {
  created_at: string
  path: string | null
  properties: Record<string, unknown>
}

type AppStats = {
  users: { cur: number; prev: number; daily: { day: string; count: number }[] }
  quotes: { cur: number; prev: number; daily: { day: string; count: number }[] }
  invoices: { cur: number; prev: number; daily: { day: string; count: number }[] }
  contracts: { cur: number; prev: number; daily: { day: string; count: number }[] }
}

type Source = { source: string; views: number }

export default function AdminDashboardPage() {
  const supabase = useMemo(() => getSupabase(), [])
  const [status, setStatus] = useState<'loading' | 'forbidden' | 'ready'>('loading')
  const [period, setPeriod] = useState<Period>('7d')
  const [daily, setDaily] = useState<DailyMetric[]>([])
  const [grouped, setGrouped] = useState<GroupedRow[]>([])
  const [topPages, setTopPages] = useState<TopPage[]>([])
  const [pdfEvents, setPdfEvents] = useState<PdfEvent[]>([])
  const [sources, setSources] = useState<Source[]>([])
  const [sourcePeriod, setSourcePeriod] = useState<Period>('30d')
  const [authToken, setAuthToken] = useState<string | null>(null)
  const [pdfError, setPdfError] = useState<string | null>(null)
  const [appStats, setAppStats] = useState<AppStats | null>(null)
  const [showReport, setShowReport] = useState(false)
  const [reportFrom, setReportFrom] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().split('T')[0]
  })
  const [reportTo, setReportTo] = useState(() => new Date().toISOString().split('T')[0])

  useEffect(() => {
    ;(async () => {
      const { data } = await supabase.auth.getUser()
      const email = data.user?.email
      if (!email || email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
        setStatus('forbidden')
        return
      }

      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData.session?.access_token
      setAuthToken(token ?? null)

      const nowLocal = new Date()
      const todayStr = `${nowLocal.getFullYear()}-${String(nowLocal.getMonth() + 1).padStart(2, '0')}-${String(nowLocal.getDate()).padStart(2, '0')}`
      const todayStart = new Date(nowLocal.getFullYear(), nowLocal.getMonth(), nowLocal.getDate()).toISOString()

      const [{ data: dailyRows }, { data: groupedRows }, { data: topRows }, todayEventsRes] = await Promise.all([
        supabase.from('analytics_daily_metrics').select('*').limit(90),
        supabase.from('analytics_page_views_daily_grouped').select('day,page_group,page_views').limit(2700),
        supabase
          .from('analytics_events')
          .select('path')
          .eq('event_name', 'page_view')
          .gte('created_at', new Date(Date.now() - 30 * 86400000).toISOString())
          .not('path', 'is', null)
          .limit(5000),
        // Use API route (service role) to bypass RLS on analytics_events
        fetch(`/api/analytics/today-events?from=${encodeURIComponent(todayStart)}`, {
          headers: { Authorization: `Bearer ${token}` },
        }).then(r => r.json()),
      ])

      // Build real-time today row from raw events
      const todayRaw = (todayEventsRes?.events ?? []) as { event_name: string }[]
      const count = (name: string) => todayRaw.filter(e => e.event_name === name).length
      const todayRow: DailyMetric = {
        day: todayStr,
        total_events: todayRaw.length,
        page_views: count('page_view'),
        pdf_generated: count('pdf_generated'),
        pdf_failed: count('pdf_failed'),
        email_sent: count('email_sent'),
        email_failed: count('email_failed'),
      }
      // Merge: replace today's aggregated row if present, otherwise prepend
      const historical = (dailyRows ?? []) as DailyMetric[]
      const withoutToday = historical.filter(r => r.day !== todayStr)
      setDaily([...withoutToday, todayRow])
      setGrouped((groupedRows ?? []) as GroupedRow[])

      const pathCount: Record<string, number> = {}
      for (const r of (topRows ?? []) as { path: string }[]) {
        if (r.path) pathCount[r.path] = (pathCount[r.path] || 0) + 1
      }
      const sorted = Object.entries(pathCount)
        .map(([path, page_views]) => ({ path, page_views }))
        .sort((a, b) => b.page_views - a.page_views)
        .slice(0, 20)
      setTopPages(sorted)

      if (token) {
        const [pdfRes, appRes, srcRes] = await Promise.all([
          fetch('/api/analytics/pdf-events', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/analytics/app-stats?days=30', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/analytics/sources?days=30', { headers: { Authorization: `Bearer ${token}` } }),
        ])
        const pdfJson = await pdfRes.json()
        if (pdfRes.ok) {
          setPdfEvents((pdfJson.events ?? []) as PdfEvent[])
        } else {
          setPdfError(`Erreur ${pdfRes.status}: ${pdfJson.error ?? 'inconnue'}`)
        }
        if (appRes.ok) {
          setAppStats(await appRes.json())
        }
        if (srcRes.ok) {
          const srcJson = await srcRes.json()
          setSources(srcJson.sources ?? [])
        }
      } else {
        setPdfError('Token de session introuvable')
      }

      setStatus('ready')
    })()
  }, [supabase])

  useEffect(() => {
    if (status !== 'ready' || !authToken) return
    const days = sourcePeriod === 'today' ? 1 : sourcePeriod === '7d' ? 7 : 30
    fetch(`/api/analytics/sources?days=${days}`, { headers: { Authorization: `Bearer ${authToken}` } })
      .then(r => r.json())
      .then(j => setSources(j.sources ?? []))
  }, [sourcePeriod, status, authToken])

  function downloadReport() {
    const from = new Date(reportFrom)
    const to = new Date(reportTo)
    to.setHours(23, 59, 59, 999)
    const fromLabel = new Date(reportFrom).toLocaleDateString('fr-FR')
    const toLabel = new Date(reportTo).toLocaleDateString('fr-FR')

    const filtered = daily
      .filter(r => { const d = new Date(r.day); return d >= from && d <= to })
      .sort((a, b) => (a.day < b.day ? -1 : 1))

    const userMap: Record<string, number> = {}
    const quoteMap: Record<string, number> = {}
    const invoiceMap: Record<string, number> = {}
    const contractMap: Record<string, number> = {}
    if (appStats) {
      for (const d of appStats.users.daily) userMap[d.day] = d.count
      for (const d of appStats.quotes.daily) quoteMap[d.day] = d.count
      for (const d of appStats.invoices.daily) invoiceMap[d.day] = d.count
      for (const d of appStats.contracts.daily) contractMap[d.day] = d.count
    }

    const s = (n: number | string) => String(n)
    const rows: (string | number)[][] = []

    // ── EN-TÊTE ──────────────────────────────────────────────────────────
    rows.push([`Compte rendu d'activité Spyke — du ${fromLabel} au ${toLabel}`])
    rows.push([])

    // ── KPIs GLOBAUX ─────────────────────────────────────────────────────
    rows.push(['=== KPIs GLOBAUX ==='])
    rows.push(['Indicateur', 'Valeur'])
    const totalViews  = filtered.reduce((a, r) => a + r.page_views, 0)
    const totalPdf    = filtered.reduce((a, r) => a + r.pdf_generated, 0)
    const totalFailed = filtered.reduce((a, r) => a + r.pdf_failed, 0)
    const totalEmails = filtered.reduce((a, r) => a + r.email_sent, 0)
    const totalUsers  = filtered.reduce((a, r) => a + (userMap[r.day] ?? 0), 0)
    const totalQuotes = filtered.reduce((a, r) => a + (quoteMap[r.day] ?? 0), 0)
    const totalInv    = filtered.reduce((a, r) => a + (invoiceMap[r.day] ?? 0), 0)
    const totalContr  = filtered.reduce((a, r) => a + (contractMap[r.day] ?? 0), 0)
    rows.push(['Pages vues', totalViews])
    rows.push(['PDF générés', totalPdf])
    rows.push(['PDF échoués', totalFailed])
    rows.push(['Emails envoyés', totalEmails])
    rows.push(['Nouveaux comptes', totalUsers])
    rows.push(['Devis créés', totalQuotes])
    rows.push(['Factures créées', totalInv])
    rows.push(['Contrats créés', totalContr])
    rows.push([])

    // ── ACTIVITÉ PAR SECTION ─────────────────────────────────────────────
    rows.push(['=== TRAFIC PAR SECTION ==='])
    rows.push(['Section', 'Pages vues', '% du total'])
    const sectionKeys: Record<string, string> = {
      blog: 'Blog', seo_devis: 'SEO — Devis',
      seo_facture: 'SEO — Facture', seo_contrat: 'SEO — Contrat', other: 'Autres'
    }
    const sectionTotals: Record<string, number> = {}
    for (const r of grouped) {
      const d = new Date(r.day)
      if (d >= from && d <= to) {
        sectionTotals[r.page_group] = (sectionTotals[r.page_group] || 0) + r.page_views
      }
    }
    const sectionSum = Object.values(sectionTotals).reduce((a, v) => a + v, 0) || 1
    for (const [key, label] of Object.entries(sectionKeys)) {
      const v = sectionTotals[key] ?? 0
      rows.push([label, v, `${Math.round((v / sectionSum) * 100)}%`])
    }
    rows.push([])

    // ── SOURCES DE TRAFIC ────────────────────────────────────────────────
    if (sources.length > 0) {
      rows.push(['=== SOURCES DE TRAFIC ==='])
      rows.push(['Source', 'Vues', '% du total'])
      const srcTotal = sources.reduce((a, s) => a + s.views, 0) || 1
      for (const src of sources) {
        rows.push([src.source, src.views, `${Math.round((src.views / srcTotal) * 100)}%`])
      }
      rows.push([])
    }

    // ── TOP PAGES ────────────────────────────────────────────────────────
    if (topPages.length > 0) {
      rows.push(['=== TOP PAGES (30j) ==='])
      rows.push(['Page', 'Vues'])
      for (const p of topPages.slice(0, 20)) {
        rows.push([p.path, p.page_views])
      }
      rows.push([])
    }

    // ── ACTIVITÉ QUOTIDIENNE ─────────────────────────────────────────────
    rows.push(['=== ACTIVITÉ QUOTIDIENNE ==='])
    rows.push(['Date', 'Pages vues', 'PDF générés', 'PDF échoués', 'Emails', 'Nvx comptes', 'Devis', 'Factures', 'Contrats'])
    for (const r of filtered) {
      rows.push([
        new Date(r.day).toLocaleDateString('fr-FR'),
        r.page_views, r.pdf_generated, r.pdf_failed, r.email_sent,
        userMap[r.day] ?? 0, quoteMap[r.day] ?? 0, invoiceMap[r.day] ?? 0, contractMap[r.day] ?? 0,
      ])
    }
    rows.push([
      'TOTAL', totalViews, totalPdf, totalFailed, totalEmails,
      totalUsers, totalQuotes, totalInv, totalContr,
    ])

    const csv = rows.map(row => row.map(cell => {
      const str = s(cell)
      return str.includes(';') || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str
    }).join(';')).join('\n')

    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `spyke-rapport-${reportFrom}-${reportTo}.csv`
    a.click()
    URL.revokeObjectURL(url)
    setShowReport(false)
  }

  if (status === 'loading') return <div style={s.center}>Chargement…</div>
  if (status === 'forbidden') return <div style={s.center}>Accès refusé.</div>

  const now = new Date()
  const today = new Date(now)
  today.setHours(0, 0, 0, 0)

  // Use local date string (YYYY-MM-DD) to avoid UTC vs local timezone mismatches
  const localDateStr = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  const todayStr = localDateStr(now)

  const periodDays = period === 'today' ? 1 : period === '7d' ? 7 : 30

  const inPeriod = (day: string, offset = 0) => {
    const startD = new Date(today)
    startD.setDate(startD.getDate() - periodDays * (offset + 1))
    const startStr = localDateStr(startD)
    if (offset === 0) {
      // current period: from start up to and including today
      return day >= startStr && day <= todayStr
    }
    const endD = new Date(today)
    endD.setDate(endD.getDate() - periodDays * offset)
    const endStr = localDateStr(endD)
    return day >= startStr && day < endStr
  }

  const cur = daily.filter(r => inPeriod(r.day, 0))
  const prev = daily.filter(r => inPeriod(r.day, 1))

  const sum = (rows: DailyMetric[], key: keyof DailyMetric) =>
    rows.reduce((a, r) => a + ((r[key] as number) || 0), 0)

  const delta = (a: number, b: number) => (b === 0 ? null : Math.round(((a - b) / b) * 100))

  const kpis = [
    { label: 'Page vues', cur: sum(cur, 'page_views'), prev: sum(prev, 'page_views'), color: '#6366f1', icon: '👁' },
    { label: 'PDF générés', cur: sum(cur, 'pdf_generated'), prev: sum(prev, 'pdf_generated'), color: '#10b981', icon: '📄' },
    { label: 'Emails envoyés', cur: sum(cur, 'email_sent'), prev: sum(prev, 'email_sent'), color: '#f59e0b', icon: '✉️' },
    { label: 'Événements total', cur: sum(cur, 'total_events'), prev: sum(prev, 'total_events'), color: '#8b5cf6', icon: '⚡' },
  ]

  const chartDays = daily
    .filter(r => {
      const d = new Date(r.day)
      const start = new Date(today)
      start.setDate(start.getDate() - periodDays)
      return d >= start
    })
    .sort((a, b) => (a.day < b.day ? -1 : 1))

  const groupCur = grouped.filter(r => inPeriod(r.day, 0))
  const groupTotals: Record<string, number> = {}
  for (const r of groupCur) {
    groupTotals[r.page_group] = (groupTotals[r.page_group] || 0) + r.page_views
  }

  const topPagesFiltered = period === '30d' ? topPages : topPages.slice(0, 15)

  return (
    <div style={s.page}>
      <div style={s.header}>
        <h1 style={s.title}>Dashboard Analytics</h1>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <a href="/admin/outreach" style={{ ...s.reportBtn, textDecoration: 'none', background: '#1a1a2e' }}>📧 Outreach Freelance</a>
        <a href="/admin/influencer" style={{ ...s.reportBtn, textDecoration: 'none', background: '#7c3aed' }}>🤝 Outreach Influenceurs</a>
        <button onClick={() => setShowReport(true)} style={s.reportBtn}>📥 Compte rendu</button>
        <div style={s.tabs}>
          {(['today', '7d', '30d'] as Period[]).map(p => (
            <button key={p} onClick={() => setPeriod(p)} style={{ ...s.tab, ...(period === p ? s.tabActive : {}) }}>
              {p === 'today' ? "Aujourd'hui" : p === '7d' ? '7 jours' : '30 jours'}
            </button>
          ))}
        </div>
        </div>
      </div>

      {showReport && (
        <div style={s.modalOverlay} onClick={() => setShowReport(false)}>
          <div style={s.modalBox} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 20px', fontSize: 17, fontWeight: 700, color: '#1e293b' }}>📥 Compte rendu d&apos;activité</h3>
            <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
              <label style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: '#64748b', marginBottom: 6, fontWeight: 600 }}>Du</div>
                <input type="date" value={reportFrom} onChange={e => setReportFrom(e.target.value)} style={s.dateInput} />
              </label>
              <label style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: '#64748b', marginBottom: 6, fontWeight: 600 }}>Au</div>
                <input type="date" value={reportTo} onChange={e => setReportTo(e.target.value)} style={s.dateInput} />
              </label>
            </div>
            <p style={{ fontSize: 12, color: '#94a3b8', margin: '0 0 20px', lineHeight: 1.5 }}>
              Le fichier CSV inclut : pages vues, PDF générés, emails, nouveaux comptes et documents (limités aux 30 derniers jours pour les données utilisateurs).
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowReport(false)} style={s.cancelBtn}>Annuler</button>
              <button onClick={downloadReport} style={s.dlBtn}>⬇ Télécharger CSV</button>
            </div>
          </div>
        </div>
      )}

      <div style={s.kpiRow}>
        {kpis.map(k => {
          const d = delta(k.cur, k.prev)
          return (
            <div key={k.label} style={{ ...s.kpiCard, borderTop: `4px solid ${k.color}` }}>
              <div style={s.kpiIcon}>{k.icon}</div>
              <div style={s.kpiValue}>{k.cur.toLocaleString('fr-FR')}</div>
              <div style={s.kpiLabel}>{k.label}</div>
              {d !== null && (
                <div style={{ ...s.kpiDelta, color: d >= 0 ? '#10b981' : '#ef4444' }}>
                  {d >= 0 ? '↑' : '↓'} {Math.abs(d)}% vs période préc.
                </div>
              )}
            </div>
          )
        })}
      </div>

      {chartDays.length > 0 && (
        <div style={s.card}>
          <h2 style={s.sectionTitle}>Vues journalières</h2>
          <BarChart days={chartDays} />
        </div>
      )}

      <div style={s.twoCol}>
        <div style={s.card}>
          <h2 style={s.sectionTitle}>Par catégorie</h2>
          {[
            { key: 'blog', label: 'Blog', color: '#6366f1' },
            { key: 'seo_devis', label: 'SEO — Devis', color: '#10b981' },
            { key: 'seo_facture', label: 'SEO — Facture', color: '#f59e0b' },
            { key: 'seo_contrat', label: 'SEO — Contrat', color: '#8b5cf6' },
            { key: 'other', label: 'Autres', color: '#94a3b8' },
          ].map(({ key, label, color }) => {
            const val = groupTotals[key] || 0
            const total = Object.values(groupTotals).reduce((a, b) => a + b, 0)
            const pct = total === 0 ? 0 : Math.round((val / total) * 100)
            return (
              <div key={key} style={s.catRow}>
                <div style={s.catLabel}>
                  <span style={{ ...s.catDot, background: color }} />
                  {label}
                </div>
                <div style={s.catBarWrap}>
                  <div style={{ ...s.catBar, width: `${pct}%`, background: color }} />
                </div>
                <div style={s.catVal}>{val.toLocaleString('fr-FR')}</div>
                <div style={s.catPct}>{pct}%</div>
              </div>
            )
          })}
        </div>

        <div style={s.card}>
          <h2 style={s.sectionTitle}>Top pages (30j)</h2>
          <div style={{ overflowY: 'auto', maxHeight: 320 }}>
            {topPagesFiltered.map((p, i) => {
              const max = topPagesFiltered[0]?.page_views || 1
              const pct = Math.round((p.page_views / max) * 100)
              return (
                <div key={p.path} style={s.topRow}>
                  <span style={s.topRank}>{i + 1}</span>
                  <div style={s.topInfo}>
                    <div style={s.topPath}>{p.path}</div>
                    <div style={s.topBarWrap}>
                      <div style={{ ...s.topBar, width: `${pct}%` }} />
                    </div>
                  </div>
                  <span style={s.topVal}>{p.page_views}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {sources.length > 0 && (
        <div style={s.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
            <h2 style={{ ...s.sectionTitle, margin: 0 }}>🔍 Sources de trafic</h2>
            <div style={s.tabs}>
              {(['today', '7d', '30d'] as Period[]).map(p => (
                <button key={p} onClick={() => setSourcePeriod(p)} style={{ ...s.tab, ...(sourcePeriod === p ? s.tabActive : {}) }}>
                  {p === 'today' ? "Aujourd'hui" : p === '7d' ? '7 jours' : '30 jours'}
                </button>
              ))}
            </div>
          </div>
          <div style={{ overflowY: 'auto', maxHeight: 300 }}>
            {sources.map((src, i) => {
              const max = sources[0]?.views || 1
              const pct = Math.round((src.views / max) * 100)
              const color = sourceColor(src.source)
              return (
                <div key={src.source} style={s.topRow}>
                  <span style={s.topRank}>{i + 1}</span>
                  <div style={s.topInfo}>
                    <div style={{ ...s.topPath, color: '#334155' }}>{src.source}</div>
                    <div style={s.topBarWrap}>
                      <div style={{ ...s.topBar, width: `${pct}%`, background: color }} />
                    </div>
                  </div>
                  <span style={s.topVal}>{src.views}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {appStats && (() => {
        const pick = (stat: { cur: number; prev: number; daily: { day: string; count: number }[] }) => {
          if (period === '30d') return { cur: stat.cur, prev: stat.prev }
          const days = period === 'today' ? 1 : 7
          const cutoff = new Date(today)
          cutoff.setDate(cutoff.getDate() - days)
          const cur = stat.daily.filter(d => new Date(d.day) >= cutoff).reduce((a, d) => a + d.count, 0)
          const cutoffPrev = new Date(today)
          cutoffPrev.setDate(cutoffPrev.getDate() - days * 2)
          const prev = stat.daily.filter(d => new Date(d.day) >= cutoffPrev && new Date(d.day) < cutoff).reduce((a, d) => a + d.count, 0)
          return { cur, prev }
        }
        const appKpis = [
          { label: 'Nouveaux comptes', icon: '👤', color: '#0ea5e9', ...pick(appStats.users) },
          { label: 'Devis créés', icon: '📋', color: '#6366f1', ...pick(appStats.quotes) },
          { label: 'Factures créées', icon: '🧾', color: '#10b981', ...pick(appStats.invoices) },
          { label: 'Contrats créés', icon: '📝', color: '#f59e0b', ...pick(appStats.contracts) },
        ]
        return (
          <div style={s.card}>
            <h2 style={s.sectionTitle}>🛠 Outil Spyke — activité utilisateurs</h2>
            <div style={s.kpiRow}>
              {appKpis.map(k => {
                const d = k.prev === 0 ? null : Math.round(((k.cur - k.prev) / k.prev) * 100)
                return (
                  <div key={k.label} style={{ ...s.kpiCard, borderTop: `4px solid ${k.color}` }}>
                    <div style={s.kpiIcon}>{k.icon}</div>
                    <div style={s.kpiValue}>{k.cur.toLocaleString('fr-FR')}</div>
                    <div style={s.kpiLabel}>{k.label}</div>
                    {d !== null && (
                      <div style={{ ...s.kpiDelta, color: d >= 0 ? '#10b981' : '#ef4444' }}>
                        {d >= 0 ? '↑' : '↓'} {Math.abs(d)}% vs période préc.
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            <AppSignupsChart daily={appStats.users.daily} period={period} today={today} />
          </div>
        )
      })()}

      <div style={s.card}>
        <h2 style={s.sectionTitle}>📄 Derniers PDF générés ({pdfEvents.length})</h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={s.table}>
            <thead>
              <tr>
                {['Date & heure', 'Type', 'Détails', 'Page'].map(h => (
                  <th key={h} style={s.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pdfError && (
                <tr><td colSpan={4} style={{ ...s.td, color: '#ef4444', textAlign: 'center', padding: 24 }}>{pdfError}</td></tr>
              )}
              {!pdfError && pdfEvents.length === 0 && (
                <tr><td colSpan={4} style={{ ...s.td, color: '#94a3b8', textAlign: 'center', padding: 24 }}>Aucun PDF généré trouvé</td></tr>
              )}
              {pdfEvents.map((e, i) => {
                const props = e.properties || {}
                const type = (props.type || props.kind || props.document_type || e.path?.split('/')[1] || '—') as string
                const details = Object.entries(props)
                  .filter(([k]) => !['type', 'kind', 'document_type', 'path'].includes(k))
                  .map(([k, v]) => `${k}: ${v}`)
                  .join(' · ') || '—'
                return (
                  <tr key={i}>
                    <td style={s.td}>
                      {new Date(e.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                      {' '}
                      <span style={{ color: '#94a3b8', fontSize: 12 }}>
                        {new Date(e.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>
                    <td style={s.td}>
                      <span style={{ ...s.badge, background: typeBg(type), color: typeColor(type) }}>
                        {type}
                      </span>
                    </td>
                    <td style={{ ...s.td, fontSize: 12, color: '#64748b', maxWidth: 300 }}>{details}</td>
                    <td style={{ ...s.td, fontSize: 12, color: '#94a3b8' }}>{e.path || '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div style={s.card}>
        <h2 style={s.sectionTitle}>Détail journalier</h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={s.table}>
            <thead>
              <tr>
                {['Date', 'Page vues', 'PDF générés', 'PDF échoués', 'Emails', 'Total événements'].map(h => (
                  <th key={h} style={s.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {daily
                .filter(r => inPeriod(r.day, 0))
                .sort((a, b) => (a.day < b.day ? 1 : -1))
                .map(r => (
                  <tr key={r.day}>
                    <td style={s.td}>{new Date(r.day).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}</td>
                    <td style={{ ...s.td, ...s.tdNum, color: '#6366f1', fontWeight: 600 }}>{r.page_views}</td>
                    <td style={{ ...s.td, ...s.tdNum, color: '#10b981' }}>{r.pdf_generated}</td>
                    <td style={{ ...s.td, ...s.tdNum, color: r.pdf_failed > 0 ? '#ef4444' : '#aaa' }}>{r.pdf_failed}</td>
                    <td style={{ ...s.td, ...s.tdNum, color: '#f59e0b' }}>{r.email_sent}</td>
                    <td style={{ ...s.td, ...s.tdNum }}>{r.total_events}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function AppSignupsChart({ daily, period, today }: { daily: { day: string; count: number }[]; period: string; today: Date }) {
  const days = period === 'today' ? 1 : period === '7d' ? 7 : 30
  const cutoff = new Date(today)
  cutoff.setDate(cutoff.getDate() - days)
  const filtered = daily.filter(d => new Date(d.day) >= cutoff).sort((a, b) => (a.day < b.day ? -1 : 1))
  if (filtered.length === 0) return null
  const max = Math.max(...filtered.map(d => d.count), 1)
  const H = 80
  const barW = Math.max(6, Math.min(32, Math.floor(560 / filtered.length) - 2))
  return (
    <div style={{ marginTop: 16, overflowX: 'auto' }}>
      <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>Nouveaux comptes / jour</div>
      <svg width="100%" viewBox={`0 0 ${Math.max(400, filtered.length * (barW + 4))} ${H + 28}`} style={{ display: 'block' }}>
        {filtered.map((d, i) => {
          const h = Math.max(2, Math.round((d.count / max) * H))
          const x = i * (barW + 4)
          return (
            <g key={d.day}>
              <rect x={x} y={H - h} width={barW} height={h} rx={3} fill="#0ea5e9" opacity={0.8} />
              {d.count > 0 && <text x={x + barW / 2} y={H - h - 3} textAnchor="middle" fontSize={9} fill="#0ea5e9" fontWeight="700">{d.count}</text>}
              <text x={x + barW / 2} y={H + 16} textAnchor="middle" fontSize={8} fill="#94a3b8">
                {new Date(d.day).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

function sourceColor(source: string) {
  if (source.includes('Google')) return '#4285f4'
  if (source.includes('Meta') || source.includes('Facebook') || source.includes('Instagram')) return '#1877f2'
  if (source.includes('LinkedIn')) return '#0a66c2'
  if (source.includes('Twitter') || source.includes('X')) return '#000000'
  if (source.includes('TikTok')) return '#ff0050'
  if (source.includes('Reddit')) return '#ff4500'
  if (source.includes('Direct')) return '#94a3b8'
  if (source.includes('Interne')) return '#6366f1'
  return '#10b981'
}

function typeBg(type: string) {
  if (type.includes('devis') || type.includes('quote')) return '#ede9fe'
  if (type.includes('facture') || type.includes('invoice')) return '#d1fae5'
  if (type.includes('contrat') || type.includes('contract')) return '#fef3c7'
  return '#f1f5f9'
}
function typeColor(type: string) {
  if (type.includes('devis') || type.includes('quote')) return '#7c3aed'
  if (type.includes('facture') || type.includes('invoice')) return '#065f46'
  if (type.includes('contrat') || type.includes('contract')) return '#92400e'
  return '#475569'
}

function BarChart({ days }: { days: { day: string; page_views: number }[] }) {
  const max = Math.max(...days.map(d => d.page_views), 1)
  const H = 140
  const barW = Math.max(4, Math.min(28, Math.floor(560 / days.length) - 2))
  return (
    <div style={{ overflowX: 'auto' }}>
      <svg width="100%" viewBox={`0 0 ${Math.max(560, days.length * (barW + 4))} ${H + 32}`} style={{ display: 'block' }}>
        {[0, 0.25, 0.5, 0.75, 1].map(f => (
          <line key={f} x1={0} y1={H - f * H} x2={days.length * (barW + 4)} y2={H - f * H} stroke="#f0f0f0" strokeWidth={1} />
        ))}
        {days.map((d, i) => {
          const h = Math.max(2, Math.round((d.page_views / max) * H))
          const x = i * (barW + 4)
          const showLabel = days.length <= 14 || i % Math.ceil(days.length / 10) === 0
          return (
            <g key={d.day}>
              <rect x={x} y={H - h} width={barW} height={h} rx={3} fill="#6366f1" opacity={0.85} />
              {showLabel && <text x={x + barW / 2} y={H + 18} textAnchor="middle" fontSize={9} fill="#888">{new Date(d.day).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}</text>}
              {d.page_views > 0 && h > 18 && <text x={x + barW / 2} y={H - h + 12} textAnchor="middle" fontSize={9} fill="#fff" fontWeight="600">{d.page_views}</text>}
            </g>
          )
        })}
      </svg>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  page: { maxWidth: 1100, margin: '0 auto', padding: '32px 20px', fontFamily: 'Arial, sans-serif', background: '#f8fafc', minHeight: '100vh' },
  center: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', fontSize: 16, color: '#666' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 },
  title: { fontSize: 24, fontWeight: 700, color: '#1e293b', margin: 0 },
  tabs: { display: 'flex', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden' },
  tab: { border: 'none', background: 'none', padding: '8px 18px', fontSize: 13, fontWeight: 500, color: '#64748b', cursor: 'pointer' },
  tabActive: { background: '#6366f1', color: '#fff' },
  kpiRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 20 },
  kpiCard: { background: '#fff', borderRadius: 12, padding: '20px 22px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  kpiIcon: { fontSize: 22, marginBottom: 8 },
  kpiValue: { fontSize: 32, fontWeight: 700, color: '#1e293b', lineHeight: 1 },
  kpiLabel: { fontSize: 13, color: '#64748b', marginTop: 6 },
  kpiDelta: { fontSize: 12, fontWeight: 600, marginTop: 6 },
  card: { background: '#fff', borderRadius: 12, padding: '20px 22px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', marginBottom: 20 },
  sectionTitle: { fontSize: 15, fontWeight: 700, color: '#1e293b', margin: '0 0 16px' },
  twoCol: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20, marginBottom: 20 },
  catRow: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 },
  catLabel: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#334155', minWidth: 130 },
  catDot: { width: 10, height: 10, borderRadius: '50%', flexShrink: 0 },
  catBarWrap: { flex: 1, background: '#f1f5f9', borderRadius: 4, height: 8, overflow: 'hidden' },
  catBar: { height: 8, borderRadius: 4, minWidth: 4, transition: 'width 0.4s' },
  catVal: { fontSize: 13, fontWeight: 700, color: '#1e293b', minWidth: 40, textAlign: 'right' },
  catPct: { fontSize: 12, color: '#94a3b8', minWidth: 36, textAlign: 'right' },
  topRow: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 },
  topRank: { fontSize: 12, color: '#94a3b8', fontWeight: 700, minWidth: 20, textAlign: 'right' },
  topInfo: { flex: 1, minWidth: 0 },
  topPath: { fontSize: 12, color: '#334155', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 3 },
  topBarWrap: { background: '#f1f5f9', borderRadius: 3, height: 5, overflow: 'hidden' },
  topBar: { height: 5, background: '#6366f1', borderRadius: 3, opacity: 0.7 },
  topVal: { fontSize: 13, fontWeight: 700, color: '#1e293b', minWidth: 35, textAlign: 'right' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  th: { textAlign: 'left', padding: '10px 12px', borderBottom: '2px solid #f1f5f9', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' },
  td: { padding: '10px 12px', borderBottom: '1px solid #f8fafc', color: '#334155' },
  tdNum: { textAlign: 'right' },
  badge: { display: 'inline-block', borderRadius: 6, padding: '2px 10px', fontSize: 12, fontWeight: 600 },
  reportBtn: { background: '#1e293b', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  modalOverlay: { position: 'fixed' as const, inset: 0, background: 'rgba(15,23,42,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 },
  modalBox: { background: '#fff', borderRadius: 14, padding: '28px 28px 24px', boxShadow: '0 8px 32px rgba(0,0,0,0.18)', width: '100%', maxWidth: 460 },
  dateInput: { width: '100%', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 12px', fontSize: 14, color: '#1e293b', outline: 'none', boxSizing: 'border-box' as const },
  cancelBtn: { background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: 8, padding: '9px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  dlBtn: { background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer' },
}
