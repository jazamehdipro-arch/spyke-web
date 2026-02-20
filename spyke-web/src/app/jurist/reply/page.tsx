'use client'

import { useEffect, useMemo, useState } from 'react'

type Msg = { id: string; role: string; content: string; created_at: string }

export default function JuristReplyPage() {
  const params = useMemo(() => {
    if (typeof window === 'undefined') return new URLSearchParams('')
    return new URLSearchParams(window.location.search || '')
  }, [])

  const id = params.get('id') || ''
  const token = params.get('token') || ''

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [question, setQuestion] = useState<any>(null)
  const [messages, setMessages] = useState<Msg[]>([])
  const [content, setContent] = useState('')
  const [sending, setSending] = useState(false)
  const [sentOk, setSentOk] = useState(false)

  async function loadThread() {
    try {
      setError('')
      setLoading(true)
      const qs = new URLSearchParams({ id, token }).toString()
      const res = await fetch(`/api/legal-question/jurist/thread?${qs}`)
      const json = await res.json().catch(() => null)
      if (!res.ok) throw new Error(json?.error || `Erreur (${res.status})`)
      setQuestion(json?.question || null)
      setMessages((json?.messages || []) as any)
    } catch (e: any) {
      setError(e?.message || 'Erreur')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadThread()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function sendReply() {
    try {
      const text = content.trim()
      if (!text) return
      setSending(true)
      setSentOk(false)

      const res = await fetch('/api/legal-question/jurist/reply', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id, token, content: text }),
      })
      const json = await res.json().catch(() => null)
      if (!res.ok) throw new Error(json?.error || `Erreur (${res.status})`)

      setContent('')
      setSentOk(true)
      await loadThread()
    } catch (e: any) {
      setError(e?.message || 'Erreur')
    } finally {
      setSending(false)
    }
  }

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Arial', padding: 18, maxWidth: 900, margin: '0 auto' }}>
      <h1 style={{ fontSize: 22, marginBottom: 6 }}>Répondre à une question juriste</h1>
      <p style={{ color: 'rgba(0,0,0,0.65)', marginTop: 0 }}>
        Ce lien est réservé au juriste. La réponse sera enregistrée dans Spyke et envoyée à l’utilisateur.
      </p>

      {!id || !token ? <div style={{ color: '#b91c1c' }}>Lien incomplet.</div> : null}

      {error ? <div style={{ marginTop: 12, color: '#b91c1c' }}>{error}</div> : null}

      {loading ? (
        <div style={{ marginTop: 18 }}>Chargement…</div>
      ) : (
        <>
          <div style={{ marginTop: 16, padding: 14, borderRadius: 12, border: '1px solid rgba(0,0,0,0.12)', background: '#fff' }}>
            <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.6)' }}>Question</div>
            <div style={{ whiteSpace: 'pre-wrap', marginTop: 6 }}>{String(question?.question || '').trim()}</div>
          </div>

          <div style={{ marginTop: 18 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(0,0,0,0.7)', textTransform: 'uppercase', letterSpacing: 1 }}>
              Historique
            </div>

            {messages.length === 0 ? (
              <div style={{ marginTop: 10, color: 'rgba(0,0,0,0.6)' }}>Aucun message.</div>
            ) : (
              <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {messages.map((m) => (
                  <div
                    key={m.id}
                    style={{
                      padding: 12,
                      borderRadius: 12,
                      border: '1px solid rgba(0,0,0,0.10)',
                      background: m.role === 'jurist' ? '#f0f9ff' : '#fff',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                      <div style={{ fontSize: 12, fontWeight: 700 }}>{m.role === 'jurist' ? 'Juriste' : m.role}</div>
                      <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.55)' }}>{new Date(m.created_at).toLocaleString('fr-FR')}</div>
                    </div>
                    <div style={{ marginTop: 6, whiteSpace: 'pre-wrap' }}>{String(m.content || '')}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ marginTop: 18, padding: 14, borderRadius: 12, border: '1px solid rgba(0,0,0,0.12)', background: '#fff' }}>
            <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.6)' }}>Votre réponse</div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Écrivez la réponse…"
              style={{ width: '100%', minHeight: 160, marginTop: 8, padding: 12, borderRadius: 10, border: '1px solid rgba(0,0,0,0.12)' }}
            />
            <div style={{ display: 'flex', gap: 10, marginTop: 10, justifyContent: 'flex-end' }}>
              <button type="button" onClick={loadThread} disabled={sending} style={{ padding: '10px 14px' }}>
                Rafraîchir
              </button>
              <button type="button" onClick={sendReply} disabled={sending || content.trim().length < 2} style={{ padding: '10px 14px', fontWeight: 700 }}>
                {sending ? 'Envoi…' : 'Envoyer la réponse'}
              </button>
            </div>
            {sentOk ? <div style={{ marginTop: 10, color: '#166534' }}>Réponse envoyée ✅</div> : null}
          </div>
        </>
      )}
    </div>
  )
}
