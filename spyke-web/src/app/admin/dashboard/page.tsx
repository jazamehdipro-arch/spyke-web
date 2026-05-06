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

export default function AdminDashboardPage() {
  const supabase = useMemo(() => getSupabase(), [])
  const [status, setStatus] = useState<'loading' | 'forbidden' | 'ready'>('loading')
  const [period, setPeriod] = useState<Period>('7d')
  const [daily, setDaily] = useState<DailyMetric[]>([])
  const [grouped, setGrouped] = useState<GroupedRow[]>([])
  const [topPages, setTopPages] = useState<TopPage[]>([])
  const [pdfEvents, setPdfEvents] = useState<PdfEvent[]>([])
  const [pdfError, setPdfError] = useState<string | null>(null)
  const [appStats, setAppStats] = useState<AppStats | null>(null)

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

      const [{ data: dailyRows }, { data: groupedRows }, { data: topRows }] = await Promise.all([
        supabase.from('analytics_daily_metrics').select('*').limit(90),
        supabase.from('analytics_page_views_daily_grouped').select('day,page_group,page_views').limit(2700),
        supabase
          .from('analytics_events')
          .select('path')
          .eq('event_name', 'page_view')
          .gte('created_at', new Date(Date.now() - 30 * 86400000).toISOString())
          .not('path', 'is', null)
          .limit(5000),
      ])

      setDaily((dailyRows ?? []) as DailyMetric[])
      setGrouped((groupedRows ?? []) as GroupedRow[])

      // Aggregate top pages client-side
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
        const [pdfRes, appRes] = await Promise.all([
          fetch('/api/analytics/pdf-events', { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`/api/analytics/app-stats?days=30`, { headers: { Authorization: `Bearer ${token}` } }),
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
      } else {
        setPdfError('Token de session introuvable')
      }

      setStatus('ready')
    })()
  }, [supabase])

  if (status === 'loading') return <div style={s.center}>Chargement…</div>
  if (status === 'forbidden') return <div style={s.center}>Accès refusé.</div>

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const periodDays = period === 'today' ? 1 : period === '7d' ? 7 : 30

  const inPeriod = (day: string, offset = 0) => {
    const d = new Date(day)
    const start = new Date(today)
    start.setDate(start.getDate() - periodDays * (offset + 1))
    const end = new Date(today)
    end.setDate(end.getDate() - periodDays * offset)
    return d >= start && d < end
  }

  const cur = daily.filter(r => inPeriod(r.day, 0))
  const prev = daily.filter(r => inPeriod(r.day, 1))

  const sum = (rows: DailyMetric[], key: keyof DailyMetric) =>
    rows.reduce((a, r) => a + ((r[key] as number) || 0), 0)

  const delta = (a: number, b: number) => (b === 0 ? null : Math.round(((a - b) / b) * 100))

  const kpis = [
    {
      label: 'Page vues',
      cur: sum(cur, 'page_views'),
      prev: sum(prev, 'page_views'),
      color: '#6366f1',
      icon: '👁',
    },
    {
      label: 'PDF générés',
      cur: sum(cur, 'pdf_generated'),
      prev: sum(prev, 'pdf_generated'),
      color: '#10b981',
      icon: '📄',
    },
    {
      label: 'Emails envoyés',
      cur: sum(cur, 'email_sent'),
      prev: sum(prev, 'email_sent'),
      color: '#f59e0b',
      icon: '✉️',
    },
    {
      label: 'Événements total',
      cur: sum(cur, 'total_events'),
      prev: sum(prev, 'total_events'),
      color: '#8b5cf6',
      icon: '⚡',
    },
  ]

  // Chart data — last periodDays days of page_views
  const chartDays = daily
    .filter(r => {
      const d = new Date(r.day)
      const start = new Date(today)
      start.setDate(start.getDate() - periodDays)
      return d >= start
    })
    .sort((a, b) => (a.day < b.day ? -1 : 1))

  // Grouped totals for current period
  const groupCur = grouped.filter(r => inPeriod(r.day, 0))
  const groupTotals: Record<string, number> = {}
  for (const r of groupCur) {
    groupTotals[r.page_group] = (groupTotals[r.page_group] || 0) + r.page_views
  }

  // Top pages for selected period
  const topPagesFiltered = period === '30d'
    ? topPages
    : topPages.slice(0, 15)

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <h1 style={s.title}>Dashboard Analytics</h1>
        <div style={s.tabs}>
          {(['today', '7d', '30d'] as Period[]).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              style={{ ...s.tab, ...(period === p ? s.tabActive : {}) }}
            >
              {p === 'today' ? "Aujourd'hui" : p === '7d' ? '7 jours' : '30 jours'}
            </button>
          ))}
        </div>
      </div>

      {/* KPI cards */}
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

      {/* Bar chart */}
      {chartDays.length > 0 && (
        <div style={s.card}>
          <h2 style={s.sectionTitle}>Vues journalières</h2>
          <BarChart days={chartDays} />
        </div>
      )}

      {/* Category breakdown + Top pages */}
      <div style={s.twoCol}>
        {/* Category breakdown */}
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

        {/* Top pages */}
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

      {/* App stats — comptes + documents */}
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

      {/* PDF events */}
      {(
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
      )}

      {/* Daily table */}
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

function AppSignupsChart({
  daily,
  period,
  today,
}: {
  daily: { day: string; count: number }[]
  period: string
  today: Date
}) {
  const days = period === 'today' ? 1 : period === '7d' ? 7 : 30
  const cutoff = new Date(today)
  cutoff.setDate(cutoff.getDate() - days)
  const filtered = daily
    .filter(d => new Date(d.day) >= cutoff)
    .sort((a, b) => (a.day < b.day ? -1 : 1))

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
              {d.count > 0 && (
                <text x={x + barW / 2} y={H - h - 3} textAnchor="middle" fontSize={9} fill="#0ea5e9" fontWeight="700">
                  {d.count}
                </text>
              )}
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
      <svg
        width="100%"
        viewBox={`0 0 ${Math.max(560, days.length * (barW + 4))} ${H + 32}`}
        style={{ display: 'block' }}
      >
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map(f => (
          <line
            key={f}
            x1={0} y1={H - f * H}
            x2={days.length * (barW + 4)} y2={H - f * H}
            stroke="#f0f0f0" strokeWidth={1}
          />
        ))}
        {days.map((d, i) => {
          const h = Math.max(2, Math.round((d.page_views / max) * H))
          const x = i * (barW + 4)
          const showLabel = days.length <= 14 || i % Math.ceil(days.length / 10) === 0
          return (
            <g key={d.day}>
              <rect x={x} y={H - h} width={barW} height={h} rx={3} fill="#6366f1" opacity={0.85} />
              {showLabel && (
                <text
                  x={x + barW / 2} y={H + 18}
                  textAnchor="middle" fontSize={9} fill="#888"
                >
                  {new Date(d.day).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                </text>
              )}
              {d.page_views > 0 && h > 18 && (
                <text x={x + barW / 2} y={H - h + 12} textAnchor="middle" fontSize={9} fill="#fff" fontWeight="600">
                  {d.page_views}
                </text>
              )}
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
  twoCol: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20, marginBottom: 0 },
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
}
