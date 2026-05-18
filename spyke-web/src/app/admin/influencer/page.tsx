'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { getSupabase } from '@/lib/supabaseClient'

const ADMIN_EMAIL = 'Jazamehdi.pro@gmail.com'

type Contact = {
  id: string
  email: string
  name: string | null
  platform: string | null
  followers: string | null
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

export default function InfluencerPage() {
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
    const res = await fetch('/api/influencer/stats', {
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
      const res = await fetch('/api/influencer/import', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setMessage({ type: 'success', text: `${json.imported} contacts lus, importés avec succès.` })
      await loadStats()
    } catch (err: unknown) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Erreur import' })
    } finally {
      setImporting(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer ce contact ?')) return
    const { error } = await supabase.from('influencer_contacts').delete().eq('id', id)
    if (error) {
      setMessage({ type: 'error', text: 'Erreur suppression : ' + error.message })
    } else {
      await loadStats()
    }
  }

  async function handleSendBatch() {
    setSending(true)
    setMessage(null)
    try {
      const res = await fetch('/api/influencer/send-batch', {
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

  if (pageStatus === 'loading') return <div style={styles.center}>Chargement…</div>
  if (pageStatus === 'forbidden') return <div style={styles.center}>Accès refusé.</div>

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Outreach Influenceurs</h1>
          <p style={styles.subtitle}>Campagne de collaboration affiliée — 19,90€ + 25% récurrent</p>
        </div>
        <a href="/admin/dashboard" style={styles.backBtn}>← Dashboard</a>
      </div>

      {stats && (
        <div style={styles.statsRow}>
          <StatCard label="Total" value={stats.total} color="#1a1a2e" />
          <StatCard label="En attente" value={stats.pending} color="#f59e0b" />
          <StatCard label="Envoyés" value={stats.sent} color="#10b981" />
          <StatCard label="Erreurs" value={stats.error} color="#ef4444" />
        </div>
      )}

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

      <div style={styles.infoBox}>
        <strong>Colonnes acceptées dans le fichier :</strong> email (obligatoire), nom/prénom, plateforme (YouTube/Instagram/TikTok…), abonnés/followers
      </div>

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

      {stats && stats.recent.length > 0 && (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                {['Nom', 'Email', 'Plateforme', 'Abonnés', 'Statut', 'Envoyé le', ''].map(h => (
                  <th key={h} style={styles.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stats.recent.map(c => (
                <tr key={c.id}>
                  <td style={styles.td}>{c.name || '—'}</td>
                  <td style={styles.td}>{c.email}</td>
                  <td style={styles.td}>{c.platform || '—'}</td>
                  <td style={styles.td}>{c.followers || '—'}</td>
                  <td style={styles.td}>
                    <span style={{ ...styles.badge, ...badgeColor(c.status) }}>{c.status}</span>
                  </td>
                  <td style={styles.td}>{c.sent_at ? new Date(c.sent_at).toLocaleDateString('fr-FR') : '—'}</td>
                  <td style={styles.td}>
                    <button onClick={() => handleDelete(c.id)} style={styles.deleteBtn}>✕</button>
                  </td>
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
  page: { maxWidth: 1000, margin: '0 auto', padding: '40px 24px', fontFamily: 'Arial, sans-serif' },
  center: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', fontSize: 18 },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32, flexWrap: 'wrap', gap: 12 },
  title: { fontSize: 28, fontWeight: 700, color: '#1a1a2e', margin: '0 0 4px' },
  subtitle: { fontSize: 14, color: '#666', margin: 0 },
  backBtn: { fontSize: 13, color: '#666', textDecoration: 'none', padding: '8px 14px', border: '1px solid #e5e7eb', borderRadius: 8, alignSelf: 'center' },
  statsRow: { display: 'flex', gap: 16, marginBottom: 32, flexWrap: 'wrap' },
  card: { background: '#fff', borderRadius: 10, padding: '20px 24px', minWidth: 140, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', textAlign: 'center' },
  actionsRow: { display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' },
  btn: { color: '#fff', border: 'none', borderRadius: 8, padding: '12px 22px', fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  infoBox: { background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 8, padding: '10px 16px', fontSize: 13, color: '#0369a1', marginBottom: 20 },
  message: { borderRadius: 8, padding: '12px 16px', marginBottom: 24, fontSize: 14, fontWeight: 500 },
  tableWrap: { overflowX: 'auto', background: '#fff', borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '12px 16px', fontSize: 12, fontWeight: 700, color: '#666', textTransform: 'uppercase', borderBottom: '1px solid #eee', background: '#fafafa' },
  td: { padding: '12px 16px', fontSize: 14, color: '#333', borderBottom: '1px solid #f3f3f3' },
  badge: { display: 'inline-block', borderRadius: 6, padding: '2px 10px', fontSize: 12, fontWeight: 600 },
  deleteBtn: { background: 'none', border: 'none', color: '#ef4444', fontSize: 16, cursor: 'pointer', padding: '2px 6px', borderRadius: 4 },
}
