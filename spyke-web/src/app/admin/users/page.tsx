'use client'

import { CSSProperties, Fragment, useEffect, useMemo, useState } from 'react'
import { getSupabase } from '@/lib/supabaseClient'

const ADMIN_EMAIL = 'Jazamehdi.pro@gmail.com'

type UserRow = {
  id: string
  email: string
  created_at: string
  last_sign_in: string | null
  full_name: string | null
  plan: string
  affiliate_ref: string | null
  nb_factures: number
  nb_devis: number
  nb_clients: number
  nb_contrats: number
}

type UserDetail = {
  user: { email: string; created_at: string; last_sign_in_at: string | null } | null
  profile: Record<string, unknown> | null
  factures: { id: string; numero?: string; created_at: string; montant_ttc?: number; statut?: string; client_nom?: string }[]
  devis: { id: string; numero?: string; created_at: string; montant_ttc?: number; statut?: string; client_nom?: string }[]
  clients: { id: string; nom?: string; created_at: string }[]
  contrats: { id: string; titre?: string; created_at: string; statut?: string }[]
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `il y a ${mins} min`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `il y a ${hrs}h`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `il y a ${days}j`
  return new Date(dateStr).toLocaleDateString('fr-FR')
}

function fmtDate(dateStr: string) {
  return new Date(dateStr).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
}

function fmtEur(n?: number) {
  if (n == null) return '—'
  return n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
}

const S = {
  page: { minHeight: '100vh', background: '#0f0f13', color: '#e8e8f0', fontFamily: 'system-ui, sans-serif', padding: '0 0 80px' } as CSSProperties,
  nav: { background: '#0a0a0a', borderBottom: '1px solid #1e1e2e', padding: '14px 28px', display: 'flex', alignItems: 'center', gap: 20 } as CSSProperties,
  navLogo: { color: '#facc15', fontWeight: 800, fontSize: 18, textDecoration: 'none' } as CSSProperties,
  navLink: { color: '#6b7280', fontSize: 13, textDecoration: 'none' } as CSSProperties,
  header: { padding: '28px 28px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' as const, gap: 12 } as CSSProperties,
  title: { fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: -0.5 } as CSSProperties,
  badge: (color: string): CSSProperties => ({ background: color === 'pro' ? 'rgba(250,204,21,.15)' : 'rgba(255,255,255,.05)', color: color === 'pro' ? '#facc15' : '#6b7280', border: `1px solid ${color === 'pro' ? 'rgba(250,204,21,.25)' : 'rgba(255,255,255,.08)'}`, borderRadius: 6, fontSize: 10, fontWeight: 700, padding: '2px 7px', textTransform: 'uppercase', letterSpacing: .5 }),
  search: { background: '#161622', border: '1px solid #1e1e2e', borderRadius: 10, padding: '9px 14px', color: '#e8e8f0', fontSize: 14, outline: 'none', width: 280 } as CSSProperties,
  table: { width: '100%', borderCollapse: 'collapse' as const },
  th: { padding: '10px 16px', fontSize: 11, fontWeight: 700, color: '#4b5563', textTransform: 'uppercase' as const, letterSpacing: .5, textAlign: 'left' as const, borderBottom: '1px solid #1e1e2e' } as CSSProperties,
  tr: (selected: boolean, hover: boolean): CSSProperties => ({ background: selected ? 'rgba(250,204,21,.06)' : hover ? '#161622' : 'transparent', cursor: 'pointer', borderBottom: '1px solid #0f0f13', transition: 'background .1s' }),
  td: { padding: '12px 16px', fontSize: 13, verticalAlign: 'middle' } as CSSProperties,
  email: { color: '#facc15', fontWeight: 600, fontSize: 13 } as CSSProperties,
  stat: { fontWeight: 700, color: '#e8e8f0' } as CSSProperties,
  muted: { color: '#4b5563', fontSize: 12 } as CSSProperties,
  // Detail panel
  panel: { background: '#161622', border: '1px solid #1e1e2e', borderRadius: 14, margin: '0 28px', padding: 24 } as CSSProperties,
  panelTitle: { fontSize: 16, fontWeight: 800, color: '#fff', marginBottom: 16 } as CSSProperties,
  tabs: { display: 'flex', gap: 4, marginBottom: 20, background: '#0f0f13', borderRadius: 10, padding: 4 } as CSSProperties,
  tab: (active: boolean): CSSProperties => ({ flex: 1, padding: '8px 12px', border: 'none', borderRadius: 8, background: active ? '#facc15' : 'transparent', color: active ? '#0a0a0a' : '#6b7280', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }),
  docRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#0f0f13', borderRadius: 8, marginBottom: 6 } as CSSProperties,
  docLeft: { display: 'flex', flexDirection: 'column' as const, gap: 2 } as CSSProperties,
  empty: { textAlign: 'center' as const, color: '#4b5563', padding: 24, fontSize: 13 } as CSSProperties,
  statGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20 } as CSSProperties,
  statCard: { background: '#0f0f13', borderRadius: 10, padding: '14px 16px' } as CSSProperties,
  statCardLabel: { fontSize: 10, fontWeight: 700, color: '#4b5563', textTransform: 'uppercase' as const, letterSpacing: .5, marginBottom: 4 } as CSSProperties,
  statCardValue: { fontSize: 22, fontWeight: 900, color: '#facc15' } as CSSProperties,
}

export default function AdminUsersPage() {
  const supabase = useMemo(() => getSupabase(), [])
  const [status, setStatus] = useState<'loading' | 'forbidden' | 'ready'>('loading')
  const [token, setToken] = useState<string | null>(null)
  const [users, setUsers] = useState<UserRow[]>([])
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<UserRow | null>(null)
  const [detail, setDetail] = useState<UserDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'factures' | 'devis' | 'clients' | 'contrats'>('factures')
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [loadingUsers, setLoadingUsers] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    supabase.auth.getSession().then(async ({ data: { session } }: any) => {
      if (!session || session.user.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
        setStatus('forbidden')
        return
      }
      setToken(session.access_token)
      setStatus('ready')
    })
  }, [supabase])

  useEffect(() => {
    if (status !== 'ready' || !token) return
    setLoadingUsers(true)
    fetch('/api/admin/users', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => setUsers(d.users ?? []))
      .finally(() => setLoadingUsers(false))
  }, [status, token])

  async function selectUser(user: UserRow) {
    if (selected?.id === user.id) {
      setSelected(null)
      setDetail(null)
      return
    }
    setSelected(user)
    setDetail(null)
    setDetailLoading(true)
    setActiveTab('factures')
    const res = await fetch(`/api/admin/users/${user.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const d = await res.json()
    setDetail(d)
    setDetailLoading(false)
  }

  const filtered = users.filter(
    (u) =>
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.full_name ?? '').toLowerCase().includes(search.toLowerCase())
  )

  if (status === 'loading') return <div style={{ ...S.page, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}>Chargement…</div>
  if (status === 'forbidden') return <div style={{ ...S.page, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>Accès refusé</div>

  const totalPro = users.filter((u) => u.plan === 'pro').length

  return (
    <div style={S.page}>
      <nav style={S.nav}>
        <a href="/admin/dashboard" style={S.navLogo}>⚡ Spyke Admin</a>
        <a href="/admin/dashboard" style={S.navLink}>Dashboard</a>
        <a href="/admin/users" style={{ ...S.navLink, color: '#facc15' }}>Utilisateurs</a>
        <a href="/admin/influencer" style={S.navLink}>Influenceurs</a>
      </nav>

      <div style={S.header}>
        <div>
          <div style={S.title}>Utilisateurs</div>
          <div style={{ color: '#4b5563', fontSize: 13, marginTop: 4 }}>
            {users.length} comptes · {totalPro} Pro
          </div>
        </div>
        <input
          style={S.search}
          placeholder="Rechercher un email ou un nom…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loadingUsers ? (
        <div style={S.empty}>Chargement des comptes…</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>Email</th>
                <th style={S.th}>Nom</th>
                <th style={S.th}>Plan</th>
                <th style={S.th}>Inscription</th>
                <th style={S.th}>Dernière connexion</th>
                <th style={S.th}>Factures</th>
                <th style={S.th}>Devis</th>
                <th style={S.th}>Clients</th>
                <th style={S.th}>Affiliation</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <Fragment key={u.id}>
                  <tr
                    style={S.tr(selected?.id === u.id, hoveredId === u.id)}
                    onClick={() => selectUser(u)}
                    onMouseEnter={() => setHoveredId(u.id)}
                    onMouseLeave={() => setHoveredId(null)}
                  >
                    <td style={S.td}><span style={S.email}>{u.email}</span></td>
                    <td style={S.td}><span style={{ color: '#9ca3af', fontSize: 13 }}>{u.full_name ?? '—'}</span></td>
                    <td style={S.td}><span style={S.badge(u.plan)}>{u.plan}</span></td>
                    <td style={S.td}><span style={S.muted}>{timeAgo(u.created_at)}</span></td>
                    <td style={S.td}><span style={S.muted}>{u.last_sign_in ? timeAgo(u.last_sign_in) : '—'}</span></td>
                    <td style={S.td}><span style={u.nb_factures > 0 ? S.stat : S.muted}>{u.nb_factures}</span></td>
                    <td style={S.td}><span style={u.nb_devis > 0 ? S.stat : S.muted}>{u.nb_devis}</span></td>
                    <td style={S.td}><span style={u.nb_clients > 0 ? S.stat : S.muted}>{u.nb_clients}</span></td>
                    <td style={S.td}><span style={{ color: u.affiliate_ref ? '#a78bfa' : '#4b5563', fontSize: 12 }}>{u.affiliate_ref ?? '—'}</span></td>
                  </tr>

                  {selected?.id === u.id && (
                    <tr>
                      <td colSpan={9} style={{ padding: '0 0 16px' }}>
                        {detailLoading ? (
                          <div style={{ ...S.panel, color: '#6b7280', textAlign: 'center' }}>Chargement de l&apos;activité…</div>
                        ) : detail ? (
                          <div style={S.panel}>
                            <div style={S.panelTitle}>Activité de {u.email}</div>

                            {/* Stats rapides */}
                            <div style={S.statGrid}>
                              <div style={S.statCard}>
                                <div style={S.statCardLabel}>Factures</div>
                                <div style={S.statCardValue}>{detail.factures.length}</div>
                              </div>
                              <div style={S.statCard}>
                                <div style={S.statCardLabel}>Devis</div>
                                <div style={S.statCardValue}>{detail.devis.length}</div>
                              </div>
                              <div style={S.statCard}>
                                <div style={S.statCardLabel}>Clients</div>
                                <div style={S.statCardValue}>{detail.clients.length}</div>
                              </div>
                              <div style={S.statCard}>
                                <div style={S.statCardLabel}>Contrats</div>
                                <div style={S.statCardValue}>{detail.contrats.length}</div>
                              </div>
                            </div>

                            {/* Tabs */}
                            <div style={S.tabs}>
                              {(['factures', 'devis', 'clients', 'contrats'] as const).map((tab) => (
                                <button key={tab} style={S.tab(activeTab === tab)} onClick={() => setActiveTab(tab)}>
                                  {tab.charAt(0).toUpperCase() + tab.slice(1)} ({detail[tab].length})
                                </button>
                              ))}
                            </div>

                            {/* Content */}
                            {activeTab === 'factures' && (
                              detail.factures.length === 0 ? <div style={S.empty}>Aucune facture</div> :
                              detail.factures.map((f) => (
                                <div key={f.id} style={S.docRow}>
                                  <div style={S.docLeft}>
                                    <span style={{ fontWeight: 700, fontSize: 13, color: '#e8e8f0' }}>{f.numero ?? f.id.slice(0, 8)} · {f.client_nom ?? '—'}</span>
                                    <span style={{ fontSize: 11, color: '#4b5563' }}>{fmtDate(f.created_at)}</span>
                                  </div>
                                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                                    <span style={{ fontWeight: 700, color: '#facc15', fontSize: 13 }}>{fmtEur(f.montant_ttc)}</span>
                                    {f.statut && <span style={{ fontSize: 11, color: '#6b7280', background: '#0f0f13', padding: '2px 8px', borderRadius: 4 }}>{f.statut}</span>}
                                  </div>
                                </div>
                              ))
                            )}

                            {activeTab === 'devis' && (
                              detail.devis.length === 0 ? <div style={S.empty}>Aucun devis</div> :
                              detail.devis.map((d) => (
                                <div key={d.id} style={S.docRow}>
                                  <div style={S.docLeft}>
                                    <span style={{ fontWeight: 700, fontSize: 13, color: '#e8e8f0' }}>{d.numero ?? d.id.slice(0, 8)} · {d.client_nom ?? '—'}</span>
                                    <span style={{ fontSize: 11, color: '#4b5563' }}>{fmtDate(d.created_at)}</span>
                                  </div>
                                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                                    <span style={{ fontWeight: 700, color: '#facc15', fontSize: 13 }}>{fmtEur(d.montant_ttc)}</span>
                                    {d.statut && <span style={{ fontSize: 11, color: '#6b7280', background: '#0f0f13', padding: '2px 8px', borderRadius: 4 }}>{d.statut}</span>}
                                  </div>
                                </div>
                              ))
                            )}

                            {activeTab === 'clients' && (
                              detail.clients.length === 0 ? <div style={S.empty}>Aucun client</div> :
                              detail.clients.map((c) => (
                                <div key={c.id} style={S.docRow}>
                                  <span style={{ fontWeight: 600, fontSize: 13, color: '#e8e8f0' }}>{c.nom ?? '—'}</span>
                                  <span style={{ fontSize: 11, color: '#4b5563' }}>{fmtDate(c.created_at)}</span>
                                </div>
                              ))
                            )}

                            {activeTab === 'contrats' && (
                              detail.contrats.length === 0 ? <div style={S.empty}>Aucun contrat</div> :
                              detail.contrats.map((c) => (
                                <div key={c.id} style={S.docRow}>
                                  <div style={S.docLeft}>
                                    <span style={{ fontWeight: 700, fontSize: 13, color: '#e8e8f0' }}>{c.titre ?? c.id.slice(0, 8)}</span>
                                    <span style={{ fontSize: 11, color: '#4b5563' }}>{fmtDate(c.created_at)}</span>
                                  </div>
                                  {c.statut && <span style={{ fontSize: 11, color: '#6b7280', background: '#0f0f13', padding: '2px 8px', borderRadius: 4 }}>{c.statut}</span>}
                                </div>
                              ))
                            )}
                          </div>
                        ) : null}
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>

          {filtered.length === 0 && !loadingUsers && (
            <div style={S.empty}>Aucun utilisateur trouvé</div>
          )}
        </div>
      )}
    </div>
  )
}
