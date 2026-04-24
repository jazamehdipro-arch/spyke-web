'use client'

import { useEffect, useMemo, useState } from 'react'
import { getSupabase } from '@/lib/supabaseClient'

const ADMIN_EMAIL = 'Jazamehdi.pro@gmail.com'

type GroupedRow = {
  day: string
  page_group: 'blog' | 'seo_devis' | 'seo_facture' | 'seo_contrat' | 'other'
  page_views: number
}

type TopPageRow = {
  path: string
  page_views: number
}

const groupLabel: Record<GroupedRow['page_group'], string> = {
  blog: 'BLOG',
  seo_devis: 'SEO — Devis',
  seo_facture: 'SEO — Facture',
  seo_contrat: 'SEO — Contrat',
  other: 'Autres',
}

export default function AdminDashboardPage() {
  const supabase = useMemo(() => getSupabase(), [])
  const [status, setStatus] = useState<'loading' | 'forbidden' | 'ready'>('loading')
  const [grouped, setGrouped] = useState<GroupedRow[]>([])
  const [topPages, setTopPages] = useState<TopPageRow[]>([])

  useEffect(() => {
    ;(async () => {
      const { data } = await supabase.auth.getUser()
      const email = data.user?.email

      if (!email || email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
        setStatus('forbidden')
        return
      }

      const { data: groupedRows } = await supabase
        .from('analytics_page_views_daily_grouped')
        .select('day,page_group,page_views')
        .limit(1200)

      const { data: topRows } = await supabase.from('analytics_top_pages_7d').select('path,page_views').limit(50)

      setGrouped((groupedRows ?? []) as GroupedRow[])
      setTopPages((topRows ?? []) as TopPageRow[])
      setStatus('ready')
    })()
  }, [supabase])

  if (status === 'loading') return <div style={{ padding: 24 }}>Chargement…</div>

  if (status === 'forbidden') {
    return (
      <div style={{ padding: 24 }}>
        <h1 style={{ fontSize: 18, marginBottom: 8 }}>Accès refusé</h1>
        <p style={{ opacity: 0.75 }}>Connecte-toi avec {ADMIN_EMAIL}.</p>
      </div>
    )
  }

  // Compute totals for the last 7 days based on grouped view
  const now = new Date()
  const sevenDaysAgo = new Date(now)
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const totals7d = grouped.reduce(
    (acc, r) => {
      const d = new Date(r.day)
      if (Number.isNaN(d.getTime()) || d < sevenDaysAgo) return acc
      acc[r.page_group] = (acc[r.page_group] || 0) + (r.page_views || 0)
      return acc
    },
    {} as Record<GroupedRow['page_group'], number>
  )

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>
      <h1 style={{ fontSize: 22, marginBottom: 16 }}>Dashboard</h1>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 12,
          marginBottom: 20,
        }}
      >
        {(['blog', 'seo_devis', 'seo_facture', 'seo_contrat', 'other'] as GroupedRow['page_group'][]).map((g) => (
          <Kpi key={g} label={`${groupLabel[g]} (7j)`} value={totals7d[g] || 0} />
        ))}
      </div>

      <h2 style={{ fontSize: 16, margin: '18px 0 10px' }}>Top pages (7 jours)</h2>
      <div style={{ overflowX: 'auto', marginBottom: 20 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '10px 8px', borderBottom: '1px solid #eee' }}>Page</th>
              <th style={{ textAlign: 'right', padding: '10px 8px', borderBottom: '1px solid #eee' }}>Vues</th>
            </tr>
          </thead>
          <tbody>
            {topPages.map((p) => (
              <tr key={p.path}>
                <td style={{ padding: '10px 8px', borderBottom: '1px solid #f3f3f3' }}>{p.path}</td>
                <td style={{ padding: '10px 8px', borderBottom: '1px solid #f3f3f3', textAlign: 'right' }}>
                  {p.page_views}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 style={{ fontSize: 16, margin: '18px 0 10px' }}>Vues par jour (groupées)</h2>
      <p style={{ marginTop: 0, marginBottom: 10, opacity: 0.7, fontSize: 13 }}>
        Chaque ligne = 1 jour + le nombre de vues pour BLOG / Devis / Facture / Contrat.
      </p>

      <DailyGroupedTable rows={grouped} />
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

function DailyGroupedTable({ rows }: { rows: GroupedRow[] }) {
  const byDay = new Map<
    string,
    {
      blog: number
      seo_devis: number
      seo_facture: number
      seo_contrat: number
      other: number
    }
  >()

  for (const r of rows) {
    const day = r.day
    if (!day) continue

    const current = byDay.get(day) || { blog: 0, seo_devis: 0, seo_facture: 0, seo_contrat: 0, other: 0 }
    current[r.page_group] = (current[r.page_group] || 0) + (r.page_views || 0)
    byDay.set(day, current)
  }

  const days = Array.from(byDay.keys()).sort((a, b) => (a < b ? 1 : -1)).slice(0, 30)

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
        <thead>
          <tr>
            {['Jour', 'BLOG', 'Devis', 'Facture', 'Contrat', 'Autres'].map((h) => (
              <th key={h} style={{ textAlign: 'left', padding: '10px 8px', borderBottom: '1px solid #eee' }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {days.map((day) => {
            const v = byDay.get(day)!
            return (
              <tr key={day}>
                <td style={{ padding: '10px 8px', borderBottom: '1px solid #f3f3f3' }}>{day}</td>
                <td style={{ padding: '10px 8px', borderBottom: '1px solid #f3f3f3' }}>{v.blog}</td>
                <td style={{ padding: '10px 8px', borderBottom: '1px solid #f3f3f3' }}>{v.seo_devis}</td>
                <td style={{ padding: '10px 8px', borderBottom: '1px solid #f3f3f3' }}>{v.seo_facture}</td>
                <td style={{ padding: '10px 8px', borderBottom: '1px solid #f3f3f3' }}>{v.seo_contrat}</td>
                <td style={{ padding: '10px 8px', borderBottom: '1px solid #f3f3f3' }}>{v.other}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
