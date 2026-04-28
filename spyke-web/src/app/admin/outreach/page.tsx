'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { getSupabase } from '@/lib/supabaseClient'

const ADMIN_EMAIL = 'Jazamehdi.pro@gmail.com'

type Contact = {
  id: string
  email: string
  name: string | null
  job_title: string | null
  status: 'pending' | 'sent' | 'error'
  sent_at: string | null
  created_at: string
}

type Stats = {
  total: number
  pending: number
  sent: number
  error: number
  recent: Contact[]
}

export default function OutreachPage() {
  const supabase = useMemo(() => getSupabase(), [])
  const [pageStatus, setPageStatus] = useState<'loading' | 'forbidden' | 'ready'>('loading')
  const [token, setToken] = useState<string | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [importing, setImporting] = useState(false)
  const [sending, setSending] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    ;(async () => {
      const { data } = await supabase.auth.getSession()
      const email = data.session?.user?.email
      if (!email || email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
        setPageStatus('forbidden')
        return
      }
      setToken(data.session?.access_token ?? null)
      setPageStatus('ready')
    })()
  }, [supabase])

  useEffect(() => {
    if (pageStatus === 'ready' && token) loadStats()
  }, [pageStatus, token])

  async function loadStats() {
    const res = await fetch('/api/outreach/stats', {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.ok) setStats(await res.json())
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    setMessage(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/outreach/import', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setMessage({ type: 'success', text: `${json.imported} contacts lus, ${json.new} nouveaux ajoutés.` })
      await loadStats()
    } catch (err: unknown) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Erreur import' })
    } finally {
      setImporting(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleSendBatch() {
    setSending(true)
    setMessage(null)
    try {
      const res = await fetch('/api/outreach/send-batch', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      if (json.sent === 0) {
        setMessage({ type: 'success', text: 'Aucun contact en attente.' })
      } else {
        setMessage({
          type: 'success',
          text: `${json.sent} email(s) envoyé(s)${json.errors > 0 ? `, ${json.errors} erreur(s)` : ''}.`,
        })
      }
      await loadStats()
    } catch (err: unknown) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Erreur envoi' })
    } finally {
      setSending(false)
    }
  }

  if (pageStatus === 'loading') {
    return <div style={styles.center}>Chargement…</div>
  }

  if (pageStatus === 'forbidden') {
    return <div style={styles.center}>Accès refusé.</div>
  }

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Outreach Freelance</h1>

      {/* Stats */}
      {stats && (
        <div style={styles.statsRow}>
          <StatCard label="Total" value={stats.total} color="#1a1a2e" />
          <StatCard label="En attente" value={stats.pending} color="#f59e0b" />
          <StatCard label="Envoyés" value={stats.sent} color="#10b981" />
          <StatCard label="Erreurs" value={stats.error} color="#ef4444" />
        </div>
      )}

      {/* Actions */}
      <div style={styles.actionsRow}>
        <button
          style={{ ...styles.btn, background: '#1a1a2e' }}
          onClick={() => fileInputRef.current?.click()}
          disabled={importing}
        >
          {importing ? 'Import en cours…' : 'Importer Excel / CSV'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          style={{ display: 'none' }}
          onChange={handleImport}
        />

        <button
          style={{ ...styles.btn, background: stats?.pending === 0 ? '#aaa' : '#10b981' }}
          onClick={handleSendBatch}
          disabled={sending || stats?.pending === 0}
        >
          {sending ? 'Envoi en cours…' : `Envoyer 20 emails (${stats?.pending ?? '…'} en attente)`}
        </button>
      </div>

      {/* Feedback */}
      {message && (
        <div
          style={{
            ...styles.message,
            background: message.type === 'success' ? '#d1fae5' : '#fee2e2',
            color: message.type === 'success' ? '#065f46' : '#991b1b',
          }}
        >
          {message.text}
        </div>
      )}

      {/* Table */}
      {stats && stats.recent.length > 0 && (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                {['Nom', 'Email', 'Poste', 'Statut', 'Envoyé le'].map(h => (
                  <th key={h} style={styles.th}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stats.recent.map(c => (
                <tr key={c.id} style={styles.tr}>
                  <td style={styles.td}>{c.name || '—'}</td>
                  <td style={styles.td}>{c.email}</td>
                  <td style={styles.td}>{c.job_title || '—'}</td>
                  <td style={styles.td}>
                    <span style={{ ...styles.badge, ...badgeColor(c.status) }}>{c.status}</span>
                  </td>
                  <td style={styles.td}>{c.sent_at ? new Date(c.sent_at).toLocaleDateString('fr-FR') : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ ...styles.card, borderTop: `4px solid ${color}` }}>
      <div style={{ fontSize: 28, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: 13, color: '#666', marginTop: 4 }}>{label}</div>
    </div>
  )
}

function badgeColor(status: string): React.CSSProperties {
  if (status === 'sent') return { background: '#d1fae5', color: '#065f46' }
  if (status === 'error') return { background: '#fee2e2', color: '#991b1b' }
  return { background: '#fef3c7', color: '#92400e' }
}

const styles: Record<string, React.CSSProperties> = {
  page: { maxWidth: 960, margin: '0 auto', padding: '40px 24px', fontFamily: 'Arial, sans-serif' },
  center: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', fontSize: 18 },
  title: { fontSize: 28, fontWeight: 700, color: '#1a1a2e', marginBottom: 32 },
  statsRow: { display: 'flex', gap: 16, marginBottom: 32, flexWrap: 'wrap' },
  card: {
    background: '#fff',
    borderRadius: 10,
    padding: '20px 24px',
    minWidth: 140,
    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
    textAlign: 'center',
  },
  actionsRow: { display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' },
  btn: {
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    padding: '12px 22px',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    opacity: 1,
  },
  message: { borderRadius: 8, padding: '12px 16px', marginBottom: 24, fontSize: 14, fontWeight: 500 },
  tableWrap: { overflowX: 'auto', background: '#fff', borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: {
    textAlign: 'left',
    padding: '12px 16px',
    fontSize: 12,
    fontWeight: 700,
    color: '#666',
    textTransform: 'uppercase',
    borderBottom: '1px solid #eee',
    background: '#fafafa',
  },
  tr: {},
  td: { padding: '12px 16px', fontSize: 14, color: '#333', borderBottom: '1px solid #f3f3f3' },
  badge: { display: 'inline-block', borderRadius: 6, padding: '2px 10px', fontSize: 12, fontWeight: 600 },
}
