'use client'

import { useEffect, useMemo, useState } from 'react'
import { getSupabase } from '@/lib/supabaseClient'

type DailyMetric = {
  day: string
  total_events: number
  page_views: number
  pdf_generated: number
  pdf_failed: number
  email_sent: number
  email_failed: number
}

const ADMIN_EMAIL = 'Jazamehdi.pro@gmail.com'

export default function AdminDashboardPage() {
  const supabase = useMemo(() => getSupabase(), [])
  const [status, setStatus] = useState<'loading' | 'forbidden' | 'ready'>('loading')
  const [metrics, setMetrics] = useState<DailyMetric[]>([])

  useEffect(() => {
    ;(async () => {
      const { data } = await supabase.auth.getUser()
      const email = data.user?.email

      if (!email || email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
        setStatus('forbidden')
        return
      }

      const { data: rows } = await supabase
        .from('analytics_daily_metrics')
        .select('day,total_events,page_views,pdf_generated,pdf_failed,email_sent,email_failed')
        .limit(30)

      setMetrics((rows ?? []) as DailyMetric[])
      setStatus('ready')
    })()
  }, [supabase])

  if (status === 'loading') return <div style={{ padding: 24 }}>Chargement…</div>

  if (status === 'forbidden') {
    return (
      <div style={{ padding: 24 }}>
        <h1 style={{ fontSize: 18, marginBottom: 8 }}>Accès refusé</h1>
        <p style={{ opacity: 0.75 }}>Connecte-toi avec l’email admin.</p>
      </div>
    )
  }

  const totals = metrics.reduce(
    (acc, d) => {
      acc.total += d.total_events || 0
      acc.pageViews += d.page_views || 0
      acc.pdfOk += d.pdf_generated || 0
      acc.pdfKo += d.pdf_failed || 0
      acc.emailOk += d.email_sent || 0
      acc.emailKo += d.email_failed || 0
      return acc
    },
    { total: 0, pageViews: 0, pdfOk: 0, pdfKo: 0, emailOk: 0, emailKo: 0 }
  )

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>
      <h1 style={{ fontSize: 22, marginBottom: 16 }}>Dashboard Spyke (admin)</h1>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 12,
          marginBottom: 20,
        }}
      >
        <Kpi label="Events (30j)" value={totals.total} />
        <Kpi label="Page views (30j)" value={totals.pageViews} />
        <Kpi label="PDF ok (30j)" value={totals.pdfOk} />
        <Kpi label="PDF ko (30j)" value={totals.pdfKo} />
        <Kpi label="Emails ok (30j)" value={totals.emailOk} />
        <Kpi label="Emails ko (30j)" value={totals.emailKo} />
      </div>

      <h2 style={{ fontSize: 16, margin: '18px 0 10px' }}>Derniers 30 jours</h2>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr>
              {['Jour', 'Events', 'Page views', 'PDF ok', 'PDF ko', 'Emails ok', 'Emails ko'].map((h) => (
                <th key={h} style={{ textAlign: 'left', padding: '10px 8px', borderBottom: '1px solid #eee' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {metrics.map((d) => (
              <tr key={d.day}>
                <td style={{ padding: '10px 8px', borderBottom: '1px solid #f3f3f3' }}>{d.day}</td>
                <td style={{ padding: '10px 8px', borderBottom: '1px solid #f3f3f3' }}>{d.total_events}</td>
                <td style={{ padding: '10px 8px', borderBottom: '1px solid #f3f3f3' }}>{d.page_views}</td>
                <td style={{ padding: '10px 8px', borderBottom: '1px solid #f3f3f3' }}>{d.pdf_generated}</td>
                <td style={{ padding: '10px 8px', borderBottom: '1px solid #f3f3f3' }}>{d.pdf_failed}</td>
                <td style={{ padding: '10px 8px', borderBottom: '1px solid #f3f3f3' }}>{d.email_sent}</td>
                <td style={{ padding: '10px 8px', borderBottom: '1px solid #f3f3f3' }}>{d.email_failed}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p style={{ marginTop: 14, opacity: 0.7, fontSize: 13 }}>
        Note: ce dashboard dépend des events collectés. Pour l’instant on tracke au minimum les page views (landing) + on peut
        brancher les events côté API (PDF/email) ensuite.
      </p>
    </div>
  )
}

function Kpi({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ border: '1px solid #eee', borderRadius: 12, padding: 12 }}>
      <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700 }}>{value}</div>
    </div>
  )
}
