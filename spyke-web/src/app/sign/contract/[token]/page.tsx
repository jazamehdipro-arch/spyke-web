"use client"

import { useEffect, useMemo, useRef, useState } from 'react'

type SignInfo = {
  ok: boolean
  token: string
  expiresAt: string
  signedAt?: string
  buyerName?: string
  pdfUrl: string
  isSigned: boolean
}

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

export default function ContractSignPage({ params }: { params: { token: string } }) {
  const token = params.token

  const [info, setInfo] = useState<SignInfo | null>(null)
  const [error, setError] = useState<string>('')
  const [loading, setLoading] = useState(true)

  const [signedAt, setSignedAt] = useState(todayIso())
  const [signedPlace, setSignedPlace] = useState('')

  const [mode, setMode] = useState<'draw' | 'upload'>('draw')
  const [uploadFile, setUploadFile] = useState<File | null>(null)

  const [busy, setBusy] = useState(false)

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const drawing = useRef(false)
  const last = useRef<{ x: number; y: number } | null>(null)

  const pdfUrl = info?.pdfUrl || ''

  async function load() {
    try {
      setLoading(true)
      setError('')
      const res = await fetch(`/api/contract-sign/get?token=${encodeURIComponent(token)}`)
      const json = await res.json().catch(() => null)
      if (!res.ok) throw new Error(json?.error || `Erreur (${res.status})`)
      setInfo(json)
    } catch (e: any) {
      setError(e?.message || 'Erreur')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  useEffect(() => {
    const c = canvasRef.current
    if (!c) return
    const ctx = c.getContext('2d')
    if (!ctx) return

    // retina
    const dpr = window.devicePixelRatio || 1
    const rect = c.getBoundingClientRect()
    c.width = Math.floor(rect.width * dpr)
    c.height = Math.floor(rect.height * dpr)
    ctx.scale(dpr, dpr)

    ctx.lineWidth = 2.2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = '#111827'
  }, [mode])

  const canSign = useMemo(() => {
    if (busy) return false
    if (!info) return false
    if (info.isSigned) return false
    if (!signedAt) return false
    if (!signedPlace.trim()) return false
    if (mode === 'upload') return !!uploadFile
    return true
  }, [busy, info, signedAt, signedPlace, mode, uploadFile])

  function clearCanvas() {
    const c = canvasRef.current
    if (!c) return
    const ctx = c.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, c.width, c.height)
  }

  function pointerPos(e: any) {
    const c = canvasRef.current
    if (!c) return null
    const rect = c.getBoundingClientRect()
    const x = ('clientX' in e ? e.clientX : e.touches?.[0]?.clientX) - rect.left
    const y = ('clientY' in e ? e.clientY : e.touches?.[0]?.clientY) - rect.top
    return { x, y }
  }

  function onDown(e: any) {
    if (mode !== 'draw') return
    drawing.current = true
    last.current = pointerPos(e)
  }

  function onUp() {
    drawing.current = false
    last.current = null
  }

  function onMove(e: any) {
    if (mode !== 'draw') return
    if (!drawing.current) return
    const c = canvasRef.current
    if (!c) return
    const ctx = c.getContext('2d')
    if (!ctx) return

    const p = pointerPos(e)
    const l = last.current
    if (!p || !l) return

    ctx.beginPath()
    ctx.moveTo(l.x, l.y)
    ctx.lineTo(p.x, p.y)
    ctx.stroke()
    last.current = p
  }

  async function canvasToFile(): Promise<File> {
    const c = canvasRef.current
    if (!c) throw new Error('Canvas signature introuvable')
    const blob: Blob | null = await new Promise((resolve) => c.toBlob((b) => resolve(b), 'image/png'))
    if (!blob) throw new Error('Signature invalide')
    return new File([blob], 'signature.png', { type: 'image/png' })
  }

  async function submit() {
    try {
      if (!info) return
      setBusy(true)
      setError('')

      const fd = new FormData()
      fd.set('token', token)
      fd.set('signedAt', signedAt)
      fd.set('signedPlace', signedPlace)
      const sigFile = mode === 'upload' ? uploadFile : await canvasToFile()
      if (!sigFile) throw new Error('Signature manquante')
      fd.set('signature', sigFile)

      const res = await fetch('/api/contract-sign/submit', { method: 'POST', body: fd })
      const json = await res.json().catch(() => null)
      if (!res.ok) throw new Error(json?.error || `Erreur (${res.status})`)

      await load()
    } catch (e: any) {
      setError(e?.message || 'Erreur')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0b0f19' }}>
      <div style={{ maxWidth: 980, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <div style={{ color: 'white' }}>
            <div style={{ fontSize: 20, fontWeight: 800 }}>Signature du contrat</div>
            {info?.buyerName ? <div style={{ opacity: 0.8, fontSize: 13 }}>Pour {info.buyerName}</div> : null}
          </div>
          {info?.isSigned ? (
            <a href={pdfUrl} style={{ color: 'white', textDecoration: 'none', fontWeight: 700 }} download>
              Télécharger le PDF signé
            </a>
          ) : null}
        </div>

        <div style={{ background: 'white', borderRadius: 14, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ padding: 12, borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ fontSize: 13, color: '#374151' }}>
              {loading
                ? 'Chargement…'
                : error
                  ? 'Lien invalide'
                  : info?.isSigned
                    ? `Signé ✅`
                    : info?.expiresAt
                      ? `Lien valable jusqu’au ${new Date(info.expiresAt).toLocaleDateString('fr-FR')}`
                      : 'Lien de signature'}
            </div>
            {error ? <div style={{ fontSize: 13, color: '#b91c1c' }}>{error}</div> : null}
          </div>

          <div style={{ height: '72vh', background: '#f8fafc' }}>
            {pdfUrl ? <iframe title="contrat" src={pdfUrl} style={{ width: '100%', height: '100%', border: 0 }} /> : null}
          </div>

          {!info?.isSigned ? (
            <div style={{ padding: 14, display: 'grid', gap: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, color: '#6b7280' }}>Signé le</label>
                  <input value={signedAt} onChange={(e) => setSignedAt(e.target.value)} type="date" style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: 10 }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: '#6b7280' }}>À</label>
                  <input value={signedPlace} onChange={(e) => setSignedPlace(e.target.value)} placeholder="Ville" style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: 10 }} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button type="button" onClick={() => setMode('draw')} style={{ padding: '10px 12px', borderRadius: 999, border: mode === 'draw' ? '2px solid #111827' : '1px solid #e5e7eb', background: 'white', fontWeight: 800 }}>
                  Dessiner
                </button>
                <button type="button" onClick={() => setMode('upload')} style={{ padding: '10px 12px', borderRadius: 999, border: mode === 'upload' ? '2px solid #111827' : '1px solid #e5e7eb', background: 'white', fontWeight: 800 }}>
                  Uploader
                </button>
              </div>

              {mode === 'draw' ? (
                <div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 6 }}>Signature</div>
                  <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden', background: 'white' }}>
                    <canvas
                      ref={canvasRef}
                      style={{ width: '100%', height: 160, touchAction: 'none', display: 'block' }}
                      onMouseDown={onDown}
                      onMouseUp={onUp}
                      onMouseLeave={onUp}
                      onMouseMove={onMove}
                      onTouchStart={onDown}
                      onTouchEnd={onUp}
                      onTouchMove={onMove}
                    />
                  </div>
                  <button type="button" onClick={clearCanvas} style={{ marginTop: 8, padding: '10px 12px', borderRadius: 10, border: '1px solid #e5e7eb', background: 'white', fontWeight: 800 }}>
                    Effacer
                  </button>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 6 }}>Image de signature (PNG/JPG)</div>
                  <input
                    type="file"
                    accept="image/png,image/jpeg"
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  />
                </div>
              )}

              <button
                type="button"
                disabled={!canSign}
                onClick={submit}
                style={{
                  padding: '12px 14px',
                  borderRadius: 12,
                  border: 'none',
                  background: canSign ? '#111827' : '#9ca3af',
                  color: 'white',
                  fontWeight: 900,
                  cursor: canSign ? 'pointer' : 'not-allowed',
                }}
              >
                {busy ? 'Signature…' : 'Signer'}
              </button>
            </div>
          ) : (
            <div style={{ padding: 14, display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
              <div style={{ fontSize: 13, color: '#374151' }}>Merci, le contrat est signé.</div>
              <a href={pdfUrl} style={{ fontWeight: 800, color: '#111827' }} download>
                Télécharger le PDF signé
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
