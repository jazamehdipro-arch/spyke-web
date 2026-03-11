"use client"

import { useEffect, useMemo, useRef, useState } from 'react'
import { getSupabase } from '@/lib/supabaseClient'

function ModalShell({
  open,
  title,
  onClose,
  children,
  footer,
}: {
  open: boolean
  title: string
  onClose: () => void
  children: any
  footer?: any
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.55)',
        zIndex: 500,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 16,
          width: 'min(1100px, 96vw)',
          height: 'min(86vh, 900px)',
          overflow: 'hidden',
          boxShadow: '0 30px 90px rgba(0,0,0,0.35)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            padding: '12px 14px',
            borderBottom: '1px solid rgba(0,0,0,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 700, color: 'rgba(0,0,0,0.85)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {title}
          </div>
          <button className="btn btn-secondary" type="button" onClick={onClose}>
            Fermer
          </button>
        </div>

        <div style={{ flex: 1, background: '#f8fafc' }}>{children}</div>

        {footer ? (
          <div style={{ padding: 12, borderTop: '1px solid rgba(0,0,0,0.08)', background: '#fff' }}>{footer}</div>
        ) : null}
      </div>
    </div>
  )
}

function usePdfMailModals() {
  const [pdfPreview, setPdfPreview] = useState<null | {
    url: string
    filename: string
    actions?: {
      kind: 'devis' | 'facture' | 'contrat'
      contractId?: string
      to: string
      subject: string
      text: string
      getBlob: () => Promise<{ blob: Blob; token: string }>
      getSignedBlob?: (opts: { signedAt: string; signedPlace: string }) => Promise<{ blob: Blob; token: string }>
      filename: string
      getSignaturePreview?: () => Promise<{ signaturePath: string; url?: string }>
    }
  }>(null)
  const [mailCompose, setMailCompose] = useState<null | {
    to: string
    subject: string
    text: string
    token: string
    attachmentUrl?: string
    attachmentFilename?: string
    previewUrl?: string
  }>(null)
  const [mailSending, setMailSending] = useState(false)
  const [signatureFrame, setSignatureFrame] = useState<null | { url: string; title?: string }>(null)

  const [manualSignModal, setManualSignModal] = useState<null | {
    kind: 'devis' | 'facture' | 'contrat'
    signedAt: string
    signedPlace: string
    signaturePath: string
    signaturePreviewUrl?: string
  }>(null)

  useEffect(() => {
    return () => {
      if (pdfPreview?.url?.startsWith('blob:')) {
        try {
          URL.revokeObjectURL(pdfPreview.url)
        } catch {}
      }
    }
  }, [pdfPreview])

  function openPdfPreviewFromBlob(
    blob: Blob,
    filename: string,
    actions?: {
      kind: 'devis' | 'facture' | 'contrat'
      contractId?: string
      to: string
      subject: string
      text: string
      getBlob: () => Promise<{ blob: Blob; token: string }>
      getSignedBlob?: (opts: { signedAt: string; signedPlace: string }) => Promise<{ blob: Blob; token: string }>
      filename: string
      getSignaturePreview?: () => Promise<{ signaturePath: string; url?: string }>
    }
  ) {
    const url = URL.createObjectURL(blob)
    setPdfPreview({ url, filename, actions })
  }

  async function openMailComposeWithAttachment(opts: {
    kind: 'devis' | 'contrat' | 'facture'
    to: string
    subject: string
    text: string
    getBlob: () => Promise<{ blob: Blob; token: string }>
    filename: string
  }) {
    const { blob, token } = await opts.getBlob()

    const fd = new FormData()
    fd.set('type', opts.kind)
    fd.set('file', new File([blob], opts.filename, { type: 'application/pdf' }))

    const up = await fetch('/api/share-upload', {
      method: 'POST',
      headers: { authorization: 'Bearer ' + token },
      body: fd,
    })
    const json = await up.json().catch(() => null)
    if (!up.ok) throw new Error((json as any)?.error || 'Upload échoué')
    const url = String((json as any)?.url || '')
    if (!url) throw new Error('Lien de partage vide')

    setMailCompose({
      to: opts.to,
      subject: opts.subject,
      text: opts.text,
      attachmentUrl: url,
      attachmentFilename: opts.filename,
      token,
      previewUrl: url,
    })
  }

  function openMailComposePlain(opts: { to: string; subject: string; text: string; token: string }) {
    setMailCompose({ to: opts.to, subject: opts.subject, text: opts.text, token: opts.token })
  }

  async function sendMailNow() {
    if (!mailCompose) return
    try {
      setMailSending(true)
      const res = await fetch('/api/gmail/send', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: 'Bearer ' + mailCompose.token,
        },
        body: JSON.stringify({
          to: mailCompose.to,
          subject: mailCompose.subject,
          text: mailCompose.text,
          attachmentUrl: mailCompose.attachmentUrl,
          attachmentFilename: mailCompose.attachmentFilename,
        }),
      })
      const json = await res.json().catch(() => null)
      if (!res.ok) throw new Error((json as any)?.error || 'Envoi Gmail échoué')
      alert('Email envoyé')
      setMailCompose(null)
    } catch (e: any) {
      alert(e?.message || 'Erreur envoi Gmail')
    } finally {
      setMailSending(false)
    }
  }

  const modals = (
    <>
      <ModalShell
        open={!!signatureFrame}
        title={signatureFrame?.title || 'Signature électronique'}
        onClose={() => setSignatureFrame(null)}
        footer={
          signatureFrame ? (
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button className="btn btn-primary" type="button" onClick={() => setSignatureFrame(null)}>
                Fermer
              </button>
            </div>
          ) : null
        }
      >
        {signatureFrame ? (
          <iframe title="yousign-sign" src={signatureFrame.url} style={{ width: '100%', height: '100%', border: 0 }} />
        ) : null}
      </ModalShell>

      {manualSignModal ? (
        <div
          role="dialog"
          aria-label="Signature"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(0,0,0,0.35)',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            padding: 18,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setManualSignModal(null)
          }}
        >
          <div
            style={{
              width: 'min(420px, 100%)',
              marginTop: 40,
              background: '#fff',
              borderRadius: 16,
              border: '1px solid rgba(0,0,0,0.08)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
              overflow: 'hidden',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', borderBottom: '1px solid var(--gray-200)' }}>
              <div style={{ fontWeight: 800 }}>Signer</div>
              <button className="btn btn-secondary" type="button" onClick={() => setManualSignModal(null)} style={{ padding: '8px 10px', fontSize: 12 }}>
                Fermer
              </button>
            </div>

            <div style={{ padding: 14, display: 'grid', gap: 12 }}>
              {manualSignModal.signaturePath ? (
                <div>
                  <div style={{ fontSize: 12, color: 'var(--gray-600)', marginBottom: 6 }}>Aperçu de la signature</div>
                  <div style={{ border: '1px solid var(--gray-200)', borderRadius: 12, padding: 10, background: '#fff', display: 'flex', justifyContent: 'center' }}>
                    {manualSignModal.signaturePreviewUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={manualSignModal.signaturePreviewUrl} alt="signature" style={{ maxWidth: '100%', maxHeight: 70, objectFit: 'contain' }} />
                    ) : (
                      <div style={{ color: 'var(--gray-500)' }}>Signature enregistrée</div>
                    )}
                  </div>
                </div>
              ) : (
                <div style={{ padding: 12, borderRadius: 12, background: 'var(--gray-50)', border: '1px solid var(--gray-200)' }}>
                  <div style={{ fontWeight: 800, marginBottom: 6 }}>Aucune signature enregistrée</div>
                  <div style={{ color: 'var(--gray-600)', fontSize: 13 }}>Ajoute une signature dans Paramètres → Signature.</div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--gray-600)' }}>Signé le</label>
                  <input className="input" type="date" value={manualSignModal.signedAt} onChange={(e) => setManualSignModal((p) => (p ? { ...p, signedAt: e.target.value } : p))} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--gray-600)' }}>À</label>
                  <input className="input" placeholder="Ville" value={manualSignModal.signedPlace} onChange={(e) => setManualSignModal((p) => (p ? { ...p, signedPlace: e.target.value } : p))} />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: 14, borderTop: '1px solid var(--gray-200)' }}>
              <button className="btn btn-secondary" type="button" onClick={() => setManualSignModal(null)} style={{ flex: 1 }}>
                Annuler
              </button>

              {manualSignModal.signaturePath ? (
                <button
                  className="btn btn-primary"
                  type="button"
                  style={{ flex: 1 }}
                  onClick={async () => {
                    try {
                      const a = pdfPreview?.actions
                      if (!a?.getSignedBlob) throw new Error('Signature indisponible')

                      const { blob } = await a.getSignedBlob({
                        signedAt: String(manualSignModal.signedAt || ''),
                        signedPlace: String(manualSignModal.signedPlace || ''),
                      })
                      const nextUrl = URL.createObjectURL(blob)

                      setPdfPreview((prev) => {
                        if (prev?.url?.startsWith('blob:')) {
                          try {
                            URL.revokeObjectURL(prev.url)
                          } catch {}
                        }
                        return prev ? { ...prev, url: nextUrl } : null
                      })

                      setManualSignModal(null)
                      alert('Signature ajoutée ✅')
                    } catch (e: any) {
                      alert(e?.message || 'Erreur signature')
                    }
                  }}
                >
                  Valider
                </button>
              ) : (
                <button
                  className="btn btn-primary"
                  type="button"
                  style={{ flex: 1 }}
                  onClick={() => {
                    setManualSignModal(null)
                    try {
                      window.dispatchEvent(new CustomEvent('spyke:goToSignatureSettings'))
                    } catch {
                      alert('Va dans Paramètres > Signature, puis reviens signer le document.')
                    }
                  }}
                >
                  Ajouter signature
                </button>
              )}
            </div>
          </div>
        </div>
      ) : null}

      <ModalShell
        open={!!pdfPreview}
        title={pdfPreview?.filename || 'Aperçu PDF'}
        onClose={() =>
          setPdfPreview((prev) => {
            if (prev?.url?.startsWith('blob:')) {
              try {
                URL.revokeObjectURL(prev.url)
              } catch {}
            }
            return null
          })
        }
        footer={
          pdfPreview ? (
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {pdfPreview.actions?.getSignedBlob ? (
                  <button
                    className="btn btn-secondary"
                    type="button"
                    onClick={async () => {
                      try {
                        const a = pdfPreview.actions
                        if (!a?.getSignedBlob) return

                        const todayStr = new Date().toISOString().slice(0, 10)
                        let signaturePath = ''
                        let signaturePreviewUrl = ''
                        try {
                          const prev = await a.getSignaturePreview?.()
                          signaturePath = String(prev?.signaturePath || '')
                          signaturePreviewUrl = String(prev?.url || '')
                        } catch {}

                        setManualSignModal({
                          kind: a.kind,
                          signedAt: todayStr,
                          signedPlace: '',
                          signaturePath,
                          signaturePreviewUrl: signaturePreviewUrl || undefined,
                        })
                      } catch (e: any) {
                        alert(e?.message || 'Erreur signature')
                      }
                    }}
                  >
                    Signer
                  </button>
                ) : null}

                {pdfPreview.actions ? (
                  <button
                    className="btn btn-secondary"
                    type="button"
                    onClick={async () => {
                      try {
                        const a = pdfPreview.actions
                        if (!a) return
                        // Close preview first for UX
                        setPdfPreview(null)
                        await openMailComposeWithAttachment({
                          kind: a.kind,
                          to: a.to,
                          subject: a.subject,
                          text: a.text,
                          getBlob: a.getBlob,
                          filename: a.filename,
                        })
                      } catch (e: any) {
                        alert(e?.message || 'Erreur envoi mail')
                      }
                    }}
                  >
                    Envoyer par mail
                  </button>
                ) : null}

                {pdfPreview.actions?.kind === 'contrat' ? (
                  <button
                    className="btn btn-secondary"
                    type="button"
                    disabled={!pdfPreview.actions?.contractId}
                    onClick={async () => {
                      try {
                        const cid = String(pdfPreview.actions?.contractId || '')
                        if (!cid) {
                          alert('Contrat non enregistré (id manquant). Ferme le PDF et clique “Enregistrer brouillon” puis régénère le PDF.')
                          return
                        }
                        await (window as any).__spyke_send_contract_for_signature?.(cid)
                      } catch (e: any) {
                        alert(e?.message || 'Erreur envoi pour signature')
                      }
                    }}
                    title={
                      pdfPreview.actions?.contractId
                        ? 'Envoie un lien au client (valable 14 jours) pour signer en ligne'
                        : 'Le contrat doit être enregistré avant envoi pour signature'
                    }
                  >
                    Envoyer pour signature
                  </button>
                ) : null}

                <a className="btn btn-secondary" href={pdfPreview.url} download={pdfPreview.filename}>
                  Télécharger
                </a>
              </div>

              <button className="btn btn-primary" type="button" onClick={() => setPdfPreview(null)}>
                Fermer
              </button>
            </div>
          ) : null
        }
      >
        {pdfPreview ? (
          <iframe title="pdf-preview" src={pdfPreview.url} style={{ width: '100%', height: '100%', border: 0 }} />
        ) : null}
      </ModalShell>

      <ModalShell
        open={!!mailCompose}
        title={mailCompose ? `Envoyer par email` : 'Envoyer par email'}
        onClose={() => setMailCompose(null)}
        footer={
          mailCompose ? (
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button className="btn btn-secondary" type="button" onClick={() => setMailCompose(null)} disabled={mailSending}>
                Annuler
              </button>
              <button className="btn btn-primary" type="button" onClick={sendMailNow} disabled={mailSending}>
                {mailSending ? 'Envoi…' : 'Envoyer'}
              </button>
            </div>
          ) : null
        }
      >
        {mailCompose ? (
          <div className="mail-compose-grid">
            <div className="mail-compose-form">
              <label style={{ fontSize: 12, color: 'rgba(0,0,0,0.7)' }}>
                À
                <input
                  value={mailCompose.to}
                  onChange={(e) => setMailCompose({ ...mailCompose, to: e.target.value })}
                  style={{ width: '100%', marginTop: 6, padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.12)' }}
                />
              </label>
              <label style={{ fontSize: 12, color: 'rgba(0,0,0,0.7)' }}>
                Objet
                <input
                  value={mailCompose.subject}
                  onChange={(e) => setMailCompose({ ...mailCompose, subject: e.target.value })}
                  style={{ width: '100%', marginTop: 6, padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.12)' }}
                />
              </label>
              <label style={{ fontSize: 12, color: 'rgba(0,0,0,0.7)', flex: 1, display: 'flex', flexDirection: 'column' }}>
                Message
                <textarea
                  value={mailCompose.text}
                  onChange={(e) => setMailCompose({ ...mailCompose, text: e.target.value })}
                  style={{ width: '100%', marginTop: 6, padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.12)', resize: 'none', flex: 1 }}
                />
              </label>
              {mailCompose.attachmentUrl ? (
                <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.6)' }}>
                  Pièce jointe : <b>{mailCompose.attachmentFilename || 'document.pdf'}</b>
                </div>
              ) : (
                <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.6)' }}>Pas de pièce jointe</div>
              )}
            </div>

            {mailCompose.attachmentUrl ? (
              <div className="mail-compose-preview">
                <div className="mail-compose-preview-title">Aperçu du PDF</div>
                <iframe title="pdf-attachment-preview" src={mailCompose.previewUrl || mailCompose.attachmentUrl} className="mail-compose-preview-iframe" />
              </div>
            ) : null}
          </div>
        ) : null}
      </ModalShell>

      {/* Feedback modal */}
      <ModalShell
        open={false}
        title="Feedback"
        onClose={() => {}}
        footer={null}
      >
        {null}
      </ModalShell>
    </>
  )

  function openSignatureFrame(url: string, title?: string) {
    setSignatureFrame({ url, title })
  }

  return {
    openPdfPreviewFromBlob,
    openMailComposeWithAttachment,
    openMailComposePlain,
    openSignatureFrame,
    modals,
  }
}

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

function formatStatusFr(status?: string | null) {
  const s = String(status || '').toLowerCase().trim()
  if (!s || s === 'draft') return 'Brouillon'
  if (s === 'paid') return 'Payé'
  if (s === 'sent') return 'Envoyé'
  if (s === 'overdue') return 'En retard'
  if (s === 'canceled' || s === 'cancelled') return 'Annulé'
  if (s === 'signed') return 'Signé'
  return status || ''
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
  planCode,
}: {
  userFullName: string
  userJob: string
  userId: string | null
  planCode: 'free' | 'pro'
}) {
  const supabase = useMemo(() => {
    try {
      return getSupabase()
    } catch {
      return null
    }
  }, [])

  const { openPdfPreviewFromBlob, openMailComposeWithAttachment, openSignatureFrame, modals } = usePdfMailModals()

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
  const [currentQuoteId, setCurrentQuoteId] = useState<string>('')

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

  // Catalogue prestations (service_items)
  const [showCatalog, setShowCatalog] = useState(false)
  const [catalogSearch, setCatalogSearch] = useState('')
  const [catalogItems, setCatalogItems] = useState<any[]>([])

  // Templates (quote_templates)
  const [showTemplates, setShowTemplates] = useState(false)
  const [templates, setTemplates] = useState<any[]>([])
  const [templateSearch, setTemplateSearch] = useState('')

  // AI line assistant
  const [aiLineBusyId, setAiLineBusyId] = useState<string>('')

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
        supabase.from('quotes').select('id,number,title,status,total_ttc,created_at,date_issue,validity_until').order('created_at', { ascending: false }).limit(30),
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

  function daysUntil(dateStr: string) {
    if (!dateStr) return null as null | number
    const now = new Date()
    const start = new Date(now.toISOString().slice(0, 10) + 'T00:00:00').getTime()
    const target = new Date(String(dateStr).slice(0, 10) + 'T00:00:00').getTime()
    if (Number.isNaN(start) || Number.isNaN(target)) return null
    return Math.round((target - start) / (1000 * 60 * 60 * 24))
  }

  async function duplicateQuote(id: string) {
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

      // Copy values
      setTitle(String((q as any).title || ''))
      setNotes(String((q as any).notes || ''))

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

      // Reset identity fields for a new quote
      setCurrentQuoteId('')
      const t = new Date().toISOString().slice(0, 10)
      setDateIssue(t)
      setQuoteNumber(genQuoteNumber(t, 1))
      setQuoteNumberDirty(false)

      // Keep validity days if we can infer it
      const di = String((q as any).date_issue || '')
      const vu = String((q as any).validity_until || '')
      if (di && vu) {
        const a = new Date(di + 'T00:00:00').getTime()
        const b = new Date(vu + 'T00:00:00').getTime()
        if (!Number.isNaN(a) && !Number.isNaN(b) && b >= a) {
          const days = Math.round((b - a) / (1000 * 60 * 60 * 24))
          if (days > 0 && days < 366) setValidityDays(days)
        }
      }

      setMode('create')
    } catch {
      // ignore
    }
  }

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

      setCurrentQuoteId(id)
      setMode('create')
    } catch {
      // ignore
    }
  }

  async function deleteQuote(id: string) {
    try {
      if (!supabase || !userId || !id) return
      const q = quotes.find((x) => String(x.id) === String(id))
      const ok = confirm(`Supprimer le devis ${String((q as any)?.number || '')} ?`)
      if (!ok) return

      const { error: delLinesErr } = await supabase.from('quote_lines').delete().eq('quote_id', id)
      if (delLinesErr) throw delLinesErr

      const { error: delQuoteErr } = await supabase.from('quotes').delete().eq('id', id)
      if (delQuoteErr) throw delQuoteErr

      // Refresh list
      const { data: quotesData } = await supabase
        .from('quotes')
        .select('id,number,title,status,total_ttc,created_at,date_issue,validity_until')
        .order('created_at', { ascending: false })
        .limit(30)

      setQuotes(quotesData || [])
      if (currentQuoteId === id) setCurrentQuoteId('')
    } catch (e: any) {
      alert(e?.message || 'Erreur suppression devis')
    }
  }

  function resetNewQuote() {
    setMode('create')
    setCurrentQuoteId('')
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

  async function refreshCatalog() {
    try {
      if (!supabase || !userId) return
      const { data, error } = await supabase
        .from('service_items')
        .select('id,name,description,unit,unit_price_ht,vat_rate,created_at')
        .order('created_at', { ascending: false })
        .limit(200)
      if (error) throw error
      setCatalogItems(data || [])
    } catch (e: any) {
      // If table is missing, silently show empty + let UI explain.
      setCatalogItems([])
    }
  }

  async function refreshTemplates() {
    try {
      if (!supabase || !userId) return
      const { data, error } = await supabase
        .from('quote_templates')
        .select('id,name,validity_days,deposit_percent,payment_delay_days,notes,created_at')
        .order('created_at', { ascending: false })
        .limit(200)
      if (error) throw error
      setTemplates(data || [])
    } catch {
      setTemplates([])
    }
  }

  async function addLineFromCatalog(item: any) {
    try {
      const nextId = String(Date.now())
      setLines((prev) => [
        ...prev,
        {
          id: nextId,
          label: String(item?.name || ''),
          description: String(item?.description || ''),
          qty: 1,
          unitPriceHt: Number(item?.unit_price_ht || 0) || 0,
          vatRate: Number(item?.vat_rate || 0) || 0,
        },
      ])
      setShowCatalog(false)
    } catch {
      // ignore
    }
  }

  async function saveCurrentAsTemplate() {
    try {
      if (!supabase || !userId) return
      const name = prompt('Nom du template ?')
      if (!name) return

      const { data: tRow, error: tErr } = await supabase
        .from('quote_templates')
        .insert({
          user_id: userId,
          name,
          validity_days: validityDays,
          deposit_percent: depositPercent,
          payment_delay_days: paymentDelayDays,
          notes: notes || '',
        } as any)
        .select('id')
        .single()
      if (tErr) throw tErr
      const templateId = String((tRow as any)?.id || '')
      if (!templateId) return

      if (lines.length) {
        const { error: lErr } = await supabase.from('quote_template_lines').insert(
          lines.map((l, idx) => ({
            template_id: templateId,
            position: idx,
            label: l.label,
            description: l.description,
            qty: l.qty,
            unit_price_ht: l.unitPriceHt,
            vat_rate: l.vatRate,
          })) as any
        )
        if (lErr) throw lErr
      }

      alert('Template enregistré')
      await refreshTemplates()
    } catch (e: any) {
      alert(e?.message || 'Erreur template')
    }
  }

  async function applyTemplate(templateId: string) {
    try {
      if (!supabase || !templateId) return
      const { data: tpl, error: tErr } = await supabase
        .from('quote_templates')
        .select('id,name,validity_days,deposit_percent,payment_delay_days,notes')
        .eq('id', templateId)
        .maybeSingle()
      if (tErr) throw tErr
      if (!tpl) return

      const { data: tLines, error: lErr } = await supabase
        .from('quote_template_lines')
        .select('label,description,qty,unit_price_ht,vat_rate,position')
        .eq('template_id', templateId)
        .order('position', { ascending: true })
      if (lErr) throw lErr

      setValidityDays(Number((tpl as any).validity_days || 30) || 30)
      setDepositPercent(Number((tpl as any).deposit_percent || 0) || 0)
      setPaymentDelayDays(Number((tpl as any).payment_delay_days || 30) || 30)
      setNotes(String((tpl as any).notes || ''))

      if (Array.isArray(tLines) && tLines.length) {
        setLines(
          tLines.map((l: any, idx: number) => ({
            id: String(Date.now()) + '-' + String(idx),
            label: String(l.label || ''),
            description: String(l.description || ''),
            qty: Number(l.qty || 0) || 0,
            unitPriceHt: Number(l.unit_price_ht || 0) || 0,
            vatRate: Number(l.vat_rate || 0) || 0,
          }))
        )
      }

      setShowTemplates(false)
    } catch (e: any) {
      alert(e?.message || 'Erreur template')
    }
  }

  async function aiGenerateLineDescription(lineId: string) {
    try {
      const line = lines.find((x) => x.id === lineId)
      if (!line) return
      if (!line.label.trim()) {
        alert('Ajoute un libellé de prestation avant de générer la description')
        return
      }
      setAiLineBusyId(lineId)

      const prompt = `Tu es un assistant pour freelances.
Rédige une description courte et professionnelle (1 à 3 phrases) pour une ligne de devis.
Contexte:
- Prestation: ${line.label}
- Détails actuels: ${line.description || '(vide)'}
- Quantité: ${line.qty}
- Prix unitaire HT: ${line.unitPriceHt}
Contraintes:
- Français
- Ton clair et pro
- Ne pas inventer des mentions légales
- Pas de puces si possible

Réponds uniquement par le texte de la description.`

      const res = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ prompt }),
      })
      const json = await res.json().catch(() => null)
      if (!res.ok) throw new Error(json?.error || 'Erreur IA')
      const text = String(json?.text || '').trim()
      if (!text) return

      updateLine(lineId, { description: text })
    } catch (e: any) {
      alert(e?.message || 'Erreur IA')
    } finally {
      setAiLineBusyId('')
    }
  }

  const previewClientLabel = useMemo(() => {
    if (clientChoice.mode === 'existing') {
      const c = clients.find((x) => x.id === clientChoice.id)
      return c?.name || 'Client'
    }
    if (clientChoice.mode === 'new') return clientChoice.name || 'Nouveau client'
    return 'Aucun client sélectionné'
  }, [clientChoice, clients])

  async function checkFreePdfQuotaOrThrow(kind: 'devis' | 'facture' | 'contrat') {
    if (planCode === 'pro') return
    if (!supabase || !userId) throw new Error('Session manquante')

    const start = new Date()
    start.setDate(1)
    start.setHours(0, 0, 0, 0)
    const startStr = start.toISOString()

    const { count, error } = await supabase
      .from('pdf_generations')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', startStr)

    if (error) throw error
    if (Number(count || 0) >= 3) {
      throw new Error('Limite du plan Free atteinte : 3 documents / mois. Passe Pro pour illimité.')
    }

    // reserve a slot (best-effort)
    try {
      await supabase.from('pdf_generations').insert({ user_id: userId, kind })
    } catch {
      // ignore
    }
  }

  async function generateDevisPdfBlob(opts?: { includeSignature?: boolean; signedAt?: string; signedPlace?: string }) {
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
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('first_name,last_name,job,address,postal_code,city,country,siret,vat_number,iban,bic,logo_path')
          .eq('id', userId)
          .maybeSingle()

        const fullName = [String((profile as any)?.first_name || ''), String((profile as any)?.last_name || '')]
          .filter(Boolean)
          .join(' ')
        const companyName = fullName || userFullName || seller.name

        const addressLines: string[] = []
        const addr = (profile as any)?.address
        const pc = (profile as any)?.postal_code
        const city = (profile as any)?.city
        const country = (profile as any)?.country
        if (addr) addressLines.push(String(addr))
        const cityLine = [pc, city].filter(Boolean).join(' ')
        if (cityLine) addressLines.push(cityLine)
        if (country) addressLines.push(String(country))

        seller = {
          ...seller,
          name: companyName,
          addressLines,
          siret: String((profile as any)?.siret || ''),
          vatNumber: String((profile as any)?.vat_number || ''),
          iban: String((profile as any)?.iban || ''),
          bic: String((profile as any)?.bic || ''),
        }
      } catch {
        // ignore
      }
    }

    // Buyer info from selected client
    const buyerName = (() => {
      if (clientChoice.mode === 'existing') {
        const c: any = clients.find((x) => x.id === clientChoice.id)
        return String(c?.name || '')
      }
      if (clientChoice.mode === 'new') return String((clientChoice as any)?.name || '')
      return ''
    })()

    if (!buyerName) throw new Error('Sélectionnez un client')

    const buyer: any = (() => {
      if (clientChoice.mode === 'existing') {
        const c: any = clients.find((x) => x.id === clientChoice.id)
        const addressLines: string[] = []
        const addr = c?.address
        const pc = c?.postal_code
        const city = c?.city
        const country = c?.country
        if (addr) addressLines.push(String(addr))
        const cityLine = [pc, city].filter(Boolean).join(' ')
        if (cityLine) addressLines.push(cityLine)
        if (country) addressLines.push(String(country))
        return {
          name: String(c?.name || buyerName),
          addressLines,
          siret: String(c?.siret || ''),
        }
      }

      // new client (best effort)
      const cc: any = clientChoice as any
      const addressLines: string[] = []
      if (cc?.address) addressLines.push(String(cc.address))
      const cityLine = [cc?.postalCode, cc?.city].filter(Boolean).join(' ')
      if (cityLine) addressLines.push(cityLine)
      if (cc?.country) addressLines.push(String(cc.country))
      return {
        name: buyerName,
        addressLines,
        siret: String(cc?.siret || ''),
      }
    })()

    // best-effort logo
    let logoUrl = ''
    if (userId) {
      try {
        const { data: profile } = await supabase.from('profiles').select('logo_path').eq('id', userId).maybeSingle()
        const logoPath = String((profile as any)?.logo_path || '')
        if (logoPath) {
          const pub = supabase.storage.from('logos').getPublicUrl(logoPath)
          logoUrl = String(pub?.data?.publicUrl || '')
        }
      } catch {}
    }

    // signature handled server-side (signed URL). We only indicate whether it should be included.
    const includeSignature = !!opts?.includeSignature

    const payload: any = {
      quoteNumber: String(quoteNumber || ''),
      title: String(title || ''),
      dateIssue: String(dateIssue || ''),
      validityUntil: String(validityUntil || ''),
      logoUrl,
      includeSignature,
      signedAt: String(opts?.signedAt || ''),
      signedPlace: String(opts?.signedPlace || ''),
      seller,
      buyer,
      lines,
      notes,
      totals: {
        totalHt: Number(totals.totalHt || 0),
        totalTva: Number(totals.totalTva || 0),
        totalTtc: Number(totals.totalTtc || 0),
      },
    }

    const res = await fetch('/api/devis-pdf', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: 'Bearer ' + token,
      },
      body: JSON.stringify(payload),
    })
    const blob = await res.blob()
    if (!res.ok) throw new Error((await blob.text()) || 'Erreur PDF')
    return { blob, token }
  }

  async function sendDevisByEmail() {
    try {
      let to = ''
      try {
        if (clientChoice.mode === 'existing') {
          const c: any = clients.find((x) => x.id === clientChoice.id)
          to = String(c?.email || '')
        } else if (clientChoice.mode === 'new') {
          to = String((clientChoice as any)?.email || '')
        }
      } catch {}

      await openMailComposeWithAttachment({
        kind: 'devis',
        to,
        subject: `Devis ${String(quoteNumber || '').trim() || 'Spyke'}`,
        text: `Bonjour,\n\nVeuillez trouver ci-joint votre devis.\n\nCordialement,\n${userFullName || ''}`.trim(),
        getBlob: () => generateDevisPdfBlob({ includeSignature: true }),
        filename: 'Devis-' + String(quoteNumber || 'Spyke') + '.pdf',
      })
    } catch (e: any) {
      alert(e?.message || 'Erreur envoi mail')
    }
  }

  async function generatePdf() {
    try {
      await checkFreePdfQuotaOrThrow('devis')
    } catch (e: any) {
      alert(e?.message || 'Limite atteinte')
      return
    }
    try {
      if (!supabase) throw new Error('Supabase non initialisé')

      // Free quota (per month): 3 devis
      if (planCode !== 'pro' && userId) {
        const now = new Date()
        const start = new Date(now.getFullYear(), now.getMonth(), 1)
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 1)
        const startStr = start.toISOString()
        const endStr = end.toISOString()

        const { count, error } = await supabase
          .from('quotes')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .gte('created_at', startStr)
          .lt('created_at', endStr)
        if (error) throw error
        if (Number(count || 0) >= 3) {
          alert('Limite du plan Free atteinte : 3 devis / mois. Passe Pro pour illimité.')
          return
        }
      }

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
          // Find client_id when possible (avoid empty-string which breaks uuid casting)
          const client_id = clientChoice.mode === 'existing' && clientChoice.id ? clientChoice.id : null

          // Enforce unique quote number per user (no duplicates)
          const { data: existing, error: existingErr } = await supabase
            .from('quotes')
            .select('id')
            .eq('user_id', userId)
            .eq('number', quoteNumber)
            .maybeSingle()
          if (existingErr) throw existingErr

          if (existing?.id && String(existing.id) !== String(currentQuoteId || '')) {
            throw new Error('Numéro de devis déjà utilisé')
          }

          const row = {
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
          } as any

          let quoteId: string | null = currentQuoteId || null

          if (quoteId) {
            const { error: updErr } = await supabase.from('quotes').update(row).eq('id', quoteId)
            if (updErr) throw updErr
          } else {
            const { data: qRow, error: insErr } = await supabase.from('quotes').insert(row).select('id').single()
            if (insErr) throw insErr
            if (qRow?.id) quoteId = String(qRow.id)
          }

          if (quoteId) {
            setCurrentQuoteId(String(quoteId))
            // Save for chain navigation
            try {
              localStorage.setItem('spyke_last_quote_id', String(quoteId))
            } catch {}

            // Replace lines
            const { error: delErr } = await supabase.from('quote_lines').delete().eq('quote_id', quoteId)
            if (delErr) {
              try {
                console.error('Persist quote lines delete error', delErr)
              } catch {}
              alert(`PDF généré, mais lignes devis non sauvegardées: ${delErr.message}`)
            }

            if (lines.length) {
              const { error: insErr } = await supabase.from('quote_lines').insert(
                lines.map((l, idx) => ({
                  quote_id: quoteId,
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
              .select('id,number,title,status,total_ttc,created_at,date_issue,validity_until')
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

      openPdfPreviewFromBlob(blob, `Devis-${quoteNumber}.pdf`, {
        kind: 'devis',
        to: (() => {
          try {
            if (clientChoice.mode === 'existing') {
              const c: any = clients.find((x) => x.id === clientChoice.id)
              return String(c?.email || '')
            }
            if (clientChoice.mode === 'new') return String((clientChoice as any)?.email || '')
          } catch {}
          return ''
        })(),
        subject: `Devis ${String(quoteNumber || '').trim() || 'Spyke'}`,
        text: `Bonjour,\n\nVeuillez trouver ci-joint votre devis.\n\nCordialement,\n${userFullName || ''}`.trim(),
        getBlob: () => generateDevisPdfBlob({ includeSignature: false }),
        filename: 'Devis-' + String(quoteNumber || 'Spyke') + '.pdf',
      })
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

        .info-box {
          background: var(--blue-light);
          border-radius: 10px;
          padding: 14px 16px;
          display: flex;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 20px;
        }

        .info-box svg {
          width: 20px;
          height: 20px;
          stroke: var(--blue);
          flex-shrink: 0;
          margin-top: 2px;
        }

        .info-box p {
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

        /* Only style the main action buttons in the Devis editor (avoid overriding list/table buttons) */
        .devis-v4 .btn-group .btn {
          flex: 1;
          padding: 14px 20px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          font-family: inherit;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .devis-v4 .btn-group .btn-primary {
          background: var(--black);
          color: var(--white);
          border: none;
        }

        .devis-v4 .btn-group .btn-secondary {
          background: var(--white);
          color: var(--gray-700);
          border: 2px solid var(--gray-200);
        }

        .devis-v4 .btn-group .btn-secondary:hover {
          border-color: var(--gray-300);
          background: var(--gray-50);
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
          .devis-v4 .card {
            padding: 18px;
          }
          .devis-v4 .prestation-item {
            padding: 14px;
          }
          .devis-v4 .prestation-row {
            grid-template-columns: 1fr;
          }
          .devis-v4 .form-row {
            grid-template-columns: 1fr;
          }
          .devis-v4 .btn-group {
            flex-direction: column;
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
                <p>Créez votre premier devis en cliquant sur "Nouveau devis".</p>
              </div>
            ) : (
              <>
                {/* Desktop table */}
                <div className="only-desktop" style={{ overflowX: 'auto' }}>
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
                          <td style={{ padding: '12px 8px', borderBottom: '1px solid var(--gray-100)' }}>{q.title || '-'}</td>
                          <td style={{ padding: '12px 8px', borderBottom: '1px solid var(--gray-100)' }}>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                              <span>{formatStatusFr(q.status)}</span>
                              {(() => {
                                const d = daysUntil(String((q as any).validity_until || ''))
                                if (d === null) return null
                                if (d < 0) {
                                  return (
                                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--red)', background: 'rgba(239, 68, 68, 0.10)', padding: '3px 8px', borderRadius: 999, border: '1px solid rgba(239, 68, 68, 0.18)' }}>
                                      Expiré
                                    </span>
                                  )
                                }
                                if (d <= 7) {
                                  return (
                                    <span style={{ fontSize: 12, fontWeight: 700, color: '#b45309', background: 'rgba(250, 204, 21, 0.18)', padding: '3px 8px', borderRadius: 999, border: '1px solid rgba(250, 204, 21, 0.28)' }}>
                                      Expire dans {d}j
                                    </span>
                                  )
                                }
                                return null
                              })()}
                            </div>
                          </td>
                          <td style={{ padding: '12px 8px', borderBottom: '1px solid var(--gray-100)', textAlign: 'right', fontWeight: 700 }}>{formatMoney(Number(q.total_ttc || 0))}</td>
                          <td style={{ padding: '12px 8px', borderBottom: '1px solid var(--gray-100)', textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                              <button className="btn btn-secondary" type="button" onClick={() => openQuote(String(q.id))}>
                                Ouvrir
                              </button>
                              <button className="btn btn-secondary" type="button" onClick={() => duplicateQuote(String(q.id))}>
                                Dupliquer
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
                              <button className="btn btn-secondary" type="button" onClick={() => deleteQuote(String(q.id))}>
                                Supprimer
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                <div className="only-mobile mobile-cards">
                  {quotes.map((q) => {
                    const d = daysUntil(String((q as any).validity_until || ''))
                    const expiryBadge = d == null ? null : d < 0
                      ? { label: 'Expiré', tone: 'red' as const }
                      : d <= 7
                        ? { label: `Expire dans ${d}j`, tone: 'yellow' as const }
                        : null

                    return (
                      <div key={q.id} className="mobile-card">
                        <div className="mobile-card-top">
                          <div>
                            <div className="mobile-card-title">{q.number}</div>
                            <div className="mobile-card-sub">{q.title || '-'}</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div className="mobile-card-amount">{formatMoney(Number(q.total_ttc || 0))}</div>
                            <div className="mobile-badges">
                              <span className="badge badge-gray">{formatStatusFr(q.status)}</span>
                              {expiryBadge ? (
                                <span className={`badge ${expiryBadge.tone === 'red' ? 'badge-red' : 'badge-yellow'}`}>
                                  {expiryBadge.label}
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </div>
                        <div className="mobile-card-actions">
                          <button className="btn btn-secondary" type="button" onClick={() => openQuote(String(q.id))}>Ouvrir</button>
                          <button className="btn btn-secondary" type="button" onClick={() => duplicateQuote(String(q.id))}>Dupliquer</button>
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
                          <button className="btn btn-secondary" type="button" onClick={() => deleteQuote(String(q.id))}>
                            Supprimer
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        </>
      ) : (
        <>
          <div className="page-header" style={{ marginBottom: 16 }}>
            <div>
              <h1 className="page-title">{currentQuoteId ? `Devis ${String(quoteNumber || '').trim() || ''}` : 'Nouveau devis'}</h1>
              <p className="page-subtitle">Créez et exportez un devis PDF</p>
            </div>
            <div className="header-actions" style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button className="btn btn-secondary" type="button" onClick={() => setMode('list')}>
                ← Retour aux devis
              </button>
              {currentQuoteId ? (
                <button className="btn btn-secondary" type="button" onClick={() => deleteQuote(String(currentQuoteId))}>
                  Supprimer
                </button>
              ) : null}
            </div>
          </div>

          <div className="devis-container">
        <div className="form-wrapper">
          <div className="card">
            <div className="import-toolbar">
              <button
                className="btn import-btn"
                type="button"
                onClick={() => {
                  try {
                    const input = document.getElementById('import-devis-pdf') as HTMLInputElement | null
                    input?.click()
                  } catch {}
                }}
              >
                Importer PDF
              </button>

              {/* Desktop tooltip */}
              <span
                className="tooltip only-desktop"
                data-tip="Analyse un PDF (avec du texte) pour pré-remplir le devis. Si le PDF est scanné, l'import OCR arrive bientôt."
              >
                ?
              </span>

              {/* Mobile help text */}
              <span className="import-help-text only-mobile">
                Analyse un PDF pour pré-remplir le devis
              </span>

              <input
                id="import-devis-pdf"
                type="file"
                accept="application/pdf"
                style={{ display: 'none' }}
                onChange={async (e) => {
                  const f = e.target.files?.[0]
                  e.target.value = ''
                  if (!f) return
                  try {
                    if (!supabase) throw new Error('Supabase non initialisé')
                    const { data: s } = await supabase.auth.getSession()
                    const token = s.session?.access_token
                    if (!token) throw new Error('Non connecté')

                    const fd = new FormData()
                    fd.set('type', 'devis')
                    fd.set('file', f)

                    const res = await fetch('/api/import-document', {
                      method: 'POST',
                      headers: { authorization: `Bearer ${token}` },
                      body: fd,
                    })
                    const json = await res.json()
                    if (!res.ok) throw new Error(json?.error || 'Import échoué')
                    const d = json?.data || {}

                    if (d.title) setTitle(String(d.title))
                    if (d.dateIssue) setDateIssue(String(d.dateIssue))
                    if (typeof d.validityDays === 'number') setValidityDays(Number(d.validityDays))
                    if (d.client?.name) {
                      setClientChoice({
                        mode: 'new',
                        name: String(d.client.name || ''),
                        siret: String(d.client.siret || ''),
                        address: String(d.client.address || ''),
                        postalCode: String(d.client.postalCode || ''),
                        city: String(d.client.city || ''),
                      })
                    }
                    if (Array.isArray(d.lines) && d.lines.length) {
                      setLines(
                        d.lines.map((l: any, idx: number) => ({
                          id: String(idx),
                          label: String(l.label || ''),
                          description: String(l.description || ''),
                          qty: Number(l.qty ?? 1),
                          unitPriceHt: Number(l.unitPriceHt ?? 0),
                          vatRate: Number(l.vatRate ?? 0),
                        }))
                      )
                    }
                    if (typeof d.notes === 'string') setNotes(d.notes)

                    if (Array.isArray(d.warnings) && d.warnings.length) {
                      alert('Import terminé. Points à vérifier:\n- ' + d.warnings.join('\n- '))
                    }
                  } catch (err: any) {
                    alert(err?.message || 'Import échoué')
                  }
                }}
              />
              {/* import photo removed */}
            </div>

            <div className="info-box">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4M12 8h.01" />
              </svg>
              <p>
                Vos informations (nom, adresse, SIRET) sont automatiquement récupérées depuis votre profil.
              </p>
            </div>

            <details className="mobile-accordion" open>
              <summary className="mobile-accordion-summary">Informations du devis</summary>
              <div className="mobile-accordion-body">
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
            </details>

            <details className="mobile-accordion" open>
              <summary className="mobile-accordion-summary">Client</summary>
              <div className="mobile-accordion-body">
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
                    <option value="new">✍️ Remplir à la main</option>
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
                        <div><b>Email</b> : {c?.email || '-'}</div>
                        <div><b>SIRET</b> : {c?.siret || '-'}</div>
                        <div><b>Adresse</b> : {addressLine || '-'}</div>
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
            </details>

            <details className="mobile-accordion" open>
              <summary className="mobile-accordion-summary">Prestations</summary>
              <div className="mobile-accordion-body">

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
                <button
                  className="btn btn-secondary"
                  type="button"
                  onClick={async () => {
                    setShowCatalog(true)
                    await refreshCatalog()
                  }}
                >
                  + Depuis le catalogue
                </button>
                <button
                  className="btn btn-secondary"
                  type="button"
                  onClick={async () => {
                    setShowTemplates(true)
                    await refreshTemplates()
                  }}
                >
                  Charger un template
                </button>
                <button className="btn btn-secondary" type="button" onClick={saveCurrentAsTemplate}>
                  Enregistrer comme template
                </button>
              </div>

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
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                          <label className="form-label">Description (optionnel)</label>
                          <button
                            className="btn btn-secondary"
                            type="button"
                            disabled={aiLineBusyId === l.id}
                            onClick={() => aiGenerateLineDescription(l.id)}
                            style={{ padding: '8px 10px', fontSize: 12 }}
                            title="Générer une description avec l'IA"
                          >
                            {aiLineBusyId === l.id ? 'IA…' : '✨ IA'}
                          </button>
                        </div>
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
            </details>

            <details className="mobile-accordion" open>
              <summary className="mobile-accordion-summary">Options</summary>
              <div className="mobile-accordion-body">
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
            </details>
          </div>
        </div>

        <details className="mobile-preview" open>
          <summary className="mobile-accordion-summary">Récapitulatif</summary>
          <div className="mobile-accordion-body">
            <div className="preview-card card" style={{ marginTop: 0 }}>
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

          <div className="btn-group devis-actions">
            <button className="btn btn-secondary" type="button" onClick={() => alert('Brouillon: à connecter')}>
              Enregistrer brouillon
            </button>
            <button className="btn btn-primary" type="button" onClick={generatePdf}>
              Générer PDF
            </button>
          </div>

          <div style={{ marginTop: 16, fontSize: 12, color: 'var(--gray-500)' }}>
            Généré pour {userFullName || 'Utilisateur'} {userJob ? `· ${userJob}` : ''}
          </div>
          </div>
        </div>
      </details>

      </div>
        </>
      )}

      {/* Catalogue modal (Devis) */}
      {showCatalog ? (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowCatalog(false)
          }}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 16,
              width: 'min(920px, 96vw)',
              maxHeight: '86vh',
              overflow: 'auto',
              padding: 18,
              border: '1px solid var(--gray-200)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontWeight: 800 }}>Catalogue de prestations</div>
              <button className="btn btn-secondary" type="button" onClick={() => setShowCatalog(false)}>
                Fermer
              </button>
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
              <input
                className="form-input"
                value={catalogSearch}
                onChange={(e) => setCatalogSearch(e.target.value)}
                placeholder="Rechercher…"
                style={{ flex: 1, minWidth: 240 }}
              />
              <button className="btn btn-secondary" type="button" onClick={refreshCatalog}>
                Rafraîchir
              </button>
            </div>

            {catalogItems.length === 0 ? (
              <div style={{ color: 'var(--gray-600)', fontSize: 13, lineHeight: 1.6 }}>
                <b>Aucune prestation trouvée.</b>
                <div style={{ marginTop: 6 }}>
                  Si c'est la première fois : exécute le SQL dans <code>spyke-web/docs/supabase-devis-extensions.sql</code> (table{' '}
                  <code>service_items</code>).
                </div>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 8 }}>
                {catalogItems
                  .filter((it) => {
                    const q = catalogSearch.trim().toLowerCase()
                    if (!q) return true
                    return String(it?.name || '').toLowerCase().includes(q) || String(it?.description || '').toLowerCase().includes(q)
                  })
                  .slice(0, 200)
                  .map((it) => (
                    <button
                      key={it.id}
                      type="button"
                      className="btn btn-secondary"
                      style={{ justifyContent: 'space-between', width: '100%', textAlign: 'left' }}
                      onClick={() => addLineFromCatalog(it)}
                    >
                      <span>
                        <b>{it.name}</b>
                        <span style={{ display: 'block', fontSize: 12, color: 'var(--gray-500)', marginTop: 3, whiteSpace: 'normal' }}>
                          {it.description || '-'}
                        </span>
                      </span>
                      <span style={{ fontSize: 12, color: 'var(--gray-600)' }}>
                        {formatMoney(Number(it.unit_price_ht || 0))} · TVA {Number(it.vat_rate || 0).toLocaleString('fr-FR', { maximumFractionDigits: 2 })}%
                      </span>
                    </button>
                  ))}
              </div>
            )}
          </div>
        </div>
      ) : null}

      {/* Templates modal (Devis) */}
      {showTemplates ? (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 210,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowTemplates(false)
          }}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 16,
              width: 'min(920px, 96vw)',
              maxHeight: '86vh',
              overflow: 'auto',
              padding: 18,
              border: '1px solid var(--gray-200)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontWeight: 800 }}>Templates de devis</div>
              <button className="btn btn-secondary" type="button" onClick={() => setShowTemplates(false)}>
                Fermer
              </button>
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
              <input
                className="form-input"
                value={templateSearch}
                onChange={(e) => setTemplateSearch(e.target.value)}
                placeholder="Rechercher…"
                style={{ flex: 1, minWidth: 240 }}
              />
              <button className="btn btn-secondary" type="button" onClick={refreshTemplates}>
                Rafraîchir
              </button>
            </div>

            {templates.length === 0 ? (
              <div style={{ color: 'var(--gray-600)', fontSize: 13, lineHeight: 1.6 }}>
                <b>Aucun template.</b>
                <div style={{ marginTop: 6 }}>
                  Si c'est la première fois : exécute le SQL dans <code>spyke-web/docs/supabase-devis-extensions.sql</code> (tables{' '}
                  <code>quote_templates</code> / <code>quote_template_lines</code>).
                </div>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 8 }}>
                {templates
                  .filter((t) => {
                    const q = templateSearch.trim().toLowerCase()
                    if (!q) return true
                    return String(t?.name || '').toLowerCase().includes(q)
                  })
                  .slice(0, 200)
                  .map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      className="btn btn-secondary"
                      style={{ justifyContent: 'space-between', width: '100%', textAlign: 'left' }}
                      onClick={() => applyTemplate(String(t.id))}
                    >
                      <span>
                        <b>{t.name}</b>
                        <span style={{ display: 'block', fontSize: 12, color: 'var(--gray-500)', marginTop: 3 }}>
                          Validité {Number(t.validity_days || 30)}j · Acompte {Number(t.deposit_percent || 0)}% · Paiement {Number(t.payment_delay_days || 30)}j
                        </span>
                      </span>
                      <span style={{ fontSize: 12, color: 'var(--gray-600)' }}>Appliquer</span>
                    </button>
                  ))}
              </div>
            )}
          </div>
        </div>
      ) : null}
    {modals}
    </div>
  )
}

function genInvoiceNumber(dateStr: string, sequence = 1) {
  const d = new Date((dateStr || '').slice(0, 10) + 'T00:00:00')
  const year = !Number.isNaN(d.getTime()) ? d.getFullYear() : new Date().getFullYear()
  return `${year}-${String(sequence).padStart(3, '0')}`
}

function genContractNumber(dateStr: string, sequence = 1) {
  const d = new Date((dateStr || '').slice(0, 10) + 'T00:00:00')
  const year = !Number.isNaN(d.getTime()) ? d.getFullYear() : new Date().getFullYear()
  const month = String((!Number.isNaN(d.getTime()) ? d.getMonth() + 1 : new Date().getMonth() + 1)).padStart(2, '0')
  return `C${year}${month}-${String(sequence).padStart(3, '0')}`
}

function ContratsV1({
  clients,
  userId,
  userFullName,
  userJob,
  planCode,
}: {
  clients: Array<{ id: string; name: string; email: string | null }>
  userId: string | null
  userFullName: string
  userJob: string
  planCode: 'free' | 'pro'
}) {
  const supabase = useMemo(() => {
    try {
      return getSupabase()
    } catch {
      return null
    }
  }, [])

  const { openPdfPreviewFromBlob, openMailComposeWithAttachment, openMailComposePlain, openSignatureFrame, modals } = usePdfMailModals()

  const [signatureMissing, setSignatureMissing] = useState(false)
  useEffect(() => {
    ;(async () => {
      try {
        if (!supabase || !userId) return
        const { data: profile } = await supabase.from('profiles').select('signature_path').eq('id', userId).maybeSingle()
        const sp = String((profile as any)?.signature_path || '')
        setSignatureMissing(!sp)
      } catch {
        setSignatureMissing(false)
      }
    })()
  }, [supabase, userId])

  const today = useMemo(() => {
    const d = new Date()
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    return `${yyyy}-${mm}-${dd}`
  }, [])

  const [prestaName, setPrestaName] = useState(userFullName || '')
  const [prestaSiret, setPrestaSiret] = useState('')

  const [contractNumber, setContractNumber] = useState(() => genContractNumber(today, 1))
  const [contractNumberDirty, setContractNumberDirty] = useState(false)

  const [prestaAddress, setPrestaAddress] = useState('')
  const [prestaActivity, setPrestaActivity] = useState(userJob || '')
  const [prestaEmail, setPrestaEmail] = useState('')

  const [contractFromQuoteId, setContractFromQuoteId] = useState<string>('')
  const [quotes, setQuotes] = useState<any[]>([])

  const [mode, setMode] = useState<'list' | 'create'>('list')
  const [showContracts, setShowContracts] = useState(false)
  const [contracts, setContracts] = useState<any[]>([])
  const [selectedContractId, setSelectedContractId] = useState<string>('')
  const selectedContractIdRef = useRef<string>('')

  useEffect(() => {
    selectedContractIdRef.current = String(selectedContractId || '')
  }, [selectedContractId])

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
        .select('first_name,last_name,full_name,company_name,job,address,postal_code,city,country,siret,email')
        .eq('id', userId)
        .maybeSingle()

      const fullName = [
        String((profile as any)?.first_name || ''),
        String((profile as any)?.last_name || ''),
      ]
        .join(' ')
        .trim()

      const companyName = (profile as any)?.company_name || (profile as any)?.full_name || fullName || userFullName
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
      setPrestaActivity(String((profile as any)?.job || userJob || ''))
      setPrestaSiret(String((profile as any)?.siret || ''))
      setPrestaAddress(addressLines.join(', '))

      // profiles.email may not exist depending on DB schema; fall back to auth email
      const profileEmail = String((profile as any)?.email || '')
      let authEmail = ''
      try {
        const { data: u } = await supabase.auth.getUser()
        authEmail = String(u?.user?.email || '')
      } catch {}
      setPrestaEmail(profileEmail || authEmail)
    })()
  }, [supabase, userId, userFullName])

  // Auto-number: CYYYYMM-001 (per user, per month)
  useEffect(() => {
    ;(async () => {
      try {
        if (!supabase || !userId) return
        if (contractNumberDirty) return

        const d = new Date((today || '').slice(0, 10) + 'T00:00:00')
        const year = !Number.isNaN(d.getTime()) ? d.getFullYear() : new Date().getFullYear()
        const month = String((!Number.isNaN(d.getTime()) ? d.getMonth() + 1 : new Date().getMonth() + 1)).padStart(2, '0')
        const prefix = `C${year}${month}-`

        const { data } = await supabase
          .from('contracts')
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

        setContractNumber(genContractNumber(today, max + 1))
      } catch {
        // ignore
      }
    })()
  }, [supabase, userId, today, contractNumberDirty])

  useEffect(() => {
    ;(async () => {
      try {
        if (!supabase) return
        const [{ data, error }, { data: cData, error: cErr }] = await Promise.all([
          supabase
            .from('quotes')
            .select('id,number,title,total_ttc,created_at')
            .order('created_at', { ascending: false })
            .limit(50),
          supabase
            .from('contracts')
            .select('id,number,title,status,amount_ht,created_at,client_id,quote_id')
            .order('created_at', { ascending: false })
            .limit(50),
        ])
        if (error) throw error
        if (cErr) throw cErr
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
        const extra = l.description ? ` - ${l.description}` : ''
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
    // Keep a synchronous reference to avoid race conditions in generateContractPdf()
    selectedContractIdRef.current = String(id || '')
    setSelectedContractId(id)
    if (!supabase || !id) return

    const { data: c } = await supabase
      .from('contracts')
      .select('id,number,client_id,quote_id,title,status,contract_text,mission_start,mission_end,amount_ht,tva_regime,buyer_snapshot,seller_snapshot')
      .eq('id', id)
      .maybeSingle()
    if (!c) return

    if ((c as any).number) {
      setContractNumber(String((c as any).number || ''))
      setContractNumberDirty(true)
    }

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

  async function duplicateContract(id: string) {
    try {
      if (!supabase || !id) return
      await openContract(id)
      // Reset identity for a new contract
      setSelectedContractId('')
      setContractNumberDirty(false)
      setContractNumber(genContractNumber(today, 1))
      setMode('create')
    } catch {
      // ignore
    }
  }

  async function deleteContract(id: string) {
    try {
      if (!supabase || !id) return
      const ok = confirm('Supprimer ce contrat ?')
      if (!ok) return
      const { error } = await supabase.from('contracts').delete().eq('id', id)
      if (error) throw error

      const { data: cData } = await supabase
        .from('contracts')
        .select('id,number,title,status,amount_ht,created_at,client_id,quote_id')
        .order('created_at', { ascending: false })
        .limit(50)
      setContracts((cData || []) as any[])
    } catch (e: any) {
      alert(e?.message || 'Erreur suppression contrat')
    }
  }

  useEffect(() => {
    ;(window as any).__spyke_send_contract_for_signature = (id: string) => sendContractForSignature(id)
    return () => {
      try {
        delete (window as any).__spyke_send_contract_for_signature
      } catch {}
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, userFullName])

  async function sendContractForSignature(contractId: string) {
    try {
      if (!supabase || !contractId) return

      const ok = confirm('Envoyer un lien de signature au client ? (Le lien expire dans 14 jours)')
      if (!ok) return

      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData?.session?.access_token
      if (!token) throw new Error('Non connecté')

      // 1) Create manual signing link (public)
      const linkRes = await fetch('/api/contract-sign/create-link', {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify({ contractId, expiresInDays: 14 }),
      })
      const linkJson = await linkRes.json().catch(() => ({}))
      if (!linkRes.ok) throw new Error(String((linkJson as any)?.error || 'Erreur création lien'))
      const signUrl = String((linkJson as any)?.signUrl || '')
      if (!signUrl) throw new Error('Lien de signature indisponible')

      // 2) Resolve client email + contract number from DB (works from list view too)
      let to = ''
      let contractNo = ''
      try {
        const { data: c } = await supabase
          .from('contracts')
          .select('number,buyer_snapshot')
          .eq('id', contractId)
          .maybeSingle()
        contractNo = String((c as any)?.number || '')
        const buyerSnap: any = (c as any)?.buyer_snapshot || null
        to = String(buyerSnap?.email || '')
      } catch {
        // ignore
      }

      if (!to) throw new Error('Email client manquant (renseigne-le dans le client / contrat)')

      const subject = `Signature du contrat ${contractNo || ''}`.trim() || 'Signature du contrat'
      const text = [
        'Bonjour,',
        '',
        'Voici le lien pour consulter et signer le contrat :',
        signUrl,
        '',
        'Ce lien est valable 14 jours.',
        '',
        'Cordialement,',
        String(userFullName || '').trim(),
      ]
        .filter(Boolean)
        .join('\n')

      // Open the same email composer UI as “Envoyer par mail”, with the signing link included + PDF attached.
      await openMailComposeWithAttachment({
        kind: 'contrat',
        to,
        subject,
        text,
        getBlob: async () => {
          // Generate PDF from DB snapshot so it works even when sending from list view.
          const { data: c } = await supabase
            .from('contracts')
            .select('number,contract_text,mission_start,mission_end,amount_ht,tva_regime,buyer_snapshot,seller_snapshot')
            .eq('id', contractId)
            .maybeSingle()

          const buyer: any = (c as any)?.buyer_snapshot || {}
          const seller: any = (c as any)?.seller_snapshot || {}

          // best-effort logo
          let logoUrl = ''
          try {
            if (userId) {
              const { data: profile } = await supabase.from('profiles').select('logo_path').eq('id', userId).maybeSingle()
              const logoPath = String((profile as any)?.logo_path || '')
              if (logoPath) {
                const pub = supabase.storage.from('logos').getPublicUrl(logoPath)
                logoUrl = String(pub?.data?.publicUrl || '')
              }
            }
          } catch {}

          const payload: any = {
            title: 'Contrat de prestation de service',
            date: new Date().toISOString().slice(0, 10),
            logoUrl,
            includeSignature: false,
            signedAt: '',
            signedPlace: '',
            contractText: String((c as any)?.contract_text || contractText || buildContractText()),
            parties: { sellerName: String(seller?.name || ''), buyerName: String(buyer?.name || '') },

            contractNumber: String((c as any)?.number || contractNo || ''),
            seller: {
              name: String(seller?.name || ''),
              siret: String(seller?.siret || ''),
              address: String((seller?.addressLines || []).join(', ')),
              activity: '',
              email: String(seller?.email || ''),
            },
            buyer: {
              name: String(buyer?.name || ''),
              siret: String(buyer?.siret || ''),
              representant: String(buyer?.representant || ''),
              address: String((buyer?.addressLines || []).join(', ')),
              email: String(buyer?.email || ''),
            },
            mission: {
              startDate: formatDateFr(String((c as any)?.mission_start || '')),
              endDate: formatDateFr(String((c as any)?.mission_end || '')),
              location: '',
              revisions: '',
              description: '',
              deliverables: '',
            },
            pricing: {
              type: 'FORFAIT',
              amount: `${Number((c as any)?.amount_ht || 0).toFixed(2)} € HT`,
            },
            vatRegime: String((c as any)?.tva_regime || 'franchise') === 'franchise' ? 'FRANCHISE EN BASE' : 'ASSUJETTI',
            paymentSchedule: '',
            paymentDelay: '',
            ipClause: '',
            confidentiality: '',
            termination: '',
          }

          const res = await fetch('/api/contrat-pdf', {
            method: 'POST',
            headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
            body: JSON.stringify(payload),
          })
          const blob = await res.blob()
          if (!res.ok) throw new Error((await blob.text()) || 'Erreur PDF')
          return { blob, token }
        },
        filename: 'Contrat-' + String(contractNo || 'Spyke') + '.pdf',
      })
    } catch (e: any) {
      alert(e?.message || 'Erreur envoi pour signature')
    }
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
    lines.push(`${prestaName || 'Le Prestataire'}, ${prestaActivity || 'Prestataire de services'}, immatriculé sous le SIRET ${prestaSiret || '-'}, dont le siège est situé au ${prestaAddress || '-'}, ci-après dénommé « le Prestataire ».
`)
    lines.push(`${clientName || 'Le Client'}, immatriculé sous le SIRET ${clientSiret || '-'}, dont le siège est situé au ${clientAddress || '-'}, représenté par ${clientRepresentant || '-'}, ci-après dénommé « le Client ».
`)

    lines.push('Article 1 - Objet du contrat')
    lines.push(missionDescription || 'Prestation de service.')
    lines.push('')

    lines.push('Article 2 - Livrables')
    lines.push(missionLivrables || 'Livrables à définir.')
    lines.push(`Le Client dispose de ${revMap[missionRevisions]} révisions incluses dans le prix convenu.`)
    lines.push('')

    lines.push('Article 3 - Durée et lieu d\'exécution')
    lines.push(`La mission débute le ${startDate} et se termine le ${endDate}. Elle sera exécutée ${lieuMap[missionLieu]}.`)
    lines.push('')

    lines.push('Article 4 - Rémunération')
    lines.push(pricingText)
    lines.push(tvaText)
    lines.push(`Le paiement sera effectué selon l'échéancier suivant : ${scheduleMap[paymentSchedule]}. Chaque paiement est exigible ${delayMap[paymentDelay]}.`)
    lines.push('')

    lines.push('Article 5 - Propriété intellectuelle')
    lines.push(ipMap[ipClause])
    lines.push('')

    if (confidentialityClause === 'oui') {
      lines.push('Article 6 - Confidentialité')
      lines.push("Chacune des Parties s'engage à considérer comme confidentielles et à ne pas divulguer les informations de l'autre Partie dont elle pourrait avoir connaissance à l'occasion de l'exécution du présent contrat. Cette obligation reste en vigueur pendant 2 ans après la fin du contrat.")
      lines.push('')
    }

    if (nonCompeteClause !== 'non') {
      const duration = nonCompeteClause === '6mois' ? '6 mois' : '12 mois'
      lines.push('Article 7 - Non-concurrence')
      lines.push(`Le Prestataire s'engage, pendant une durée de ${duration} à compter de la fin du présent contrat, à ne pas fournir de services similaires à un concurrent direct du Client, identifié d'un commun accord entre les Parties.`)
      lines.push('')
    }

    lines.push('Article 8 - Résiliation')
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

  async function generateContractPdfBlob(opts?: { includeSignature?: boolean; signedAt?: string; signedPlace?: string }) {
    if (!supabase) throw new Error('Supabase non initialisé')

    const { data: sessionData } = await supabase.auth.getSession()
    const token = sessionData?.session?.access_token
    if (!token) throw new Error('Non connecté')

    // best-effort logo
    let logoUrl = ''
    if (userId) {
      try {
        const { data: profile } = await supabase.from('profiles').select('logo_path').eq('id', userId).maybeSingle()
        const logoPath = String((profile as any)?.logo_path || '')
        if (logoPath) {
          const pub = supabase.storage.from('logos').getPublicUrl(logoPath)
          logoUrl = String(pub?.data?.publicUrl || '')
        }
      } catch {}
    }

    // signature handled server-side (signed URL). We only indicate whether it should be included.
    const includeSignature = !!opts?.includeSignature

    const payload: any = {
      title: 'Contrat de prestation de service',
      date: today,
      logoUrl,
      includeSignature,
      signedAt: String(opts?.signedAt || ''),
      signedPlace: String(opts?.signedPlace || ''),
      contractText: contractText || buildContractText(),
      parties: { sellerName: prestaName, buyerName: clientName },

      contractNumber,
      seller: {
        name: prestaName,
        siret: prestaSiret,
        address: prestaAddress,
        activity: prestaActivity,
        email: prestaEmail,
      },
      buyer: {
        name: clientName,
        siret: clientSiret,
        representant: clientRepresentant,
        address: clientAddress,
        email: clientEmail,
      },
      mission: {
        startDate: formatDateFr(missionStart) || missionStart || '',
        endDate: formatDateFr(missionEnd) || missionEnd || '',
        location: missionLieu === 'distance' ? 'À DISTANCE' : missionLieu === 'client' ? 'SUR SITE' : 'MIXTE',
        revisions: missionRevisions === 'illimite' ? 'ILLIMITÉES' : String(missionRevisions || ''),
        description: missionDescription,
        deliverables: missionLivrables,
      },
      pricing: {
        type: pricingType === 'forfait' ? 'FORFAIT' : pricingType === 'tjm' ? 'TJM' : 'TAUX HORAIRE',
        amount: (() => {
          const amount = Number(pricingAmount || 0)
          if (pricingType === 'forfait') return amount.toFixed(2) + ' € HT'
          if (pricingType === 'tjm') return amount.toFixed(2) + ' € HT / jour'
          return amount.toFixed(2) + ' € HT / heure'
        })(),
      },
      vatRegime: tvaRegime === 'franchise' ? 'FRANCHISE EN BASE' : 'ASSUJETTI',
      paymentSchedule:
        paymentSchedule === '30' ? '30/70' : paymentSchedule === '50' ? '50/50' : paymentSchedule === 'fin' ? '100% FIN' : 'PERSONNALISÉ',
      paymentDelay: (() => {
        const d = String(paymentDelay || '')
        if (d === '30') return '30 JOURS'
        if (d === '45') return '45 JOURS'
        if (d === '60') return '60 JOURS'
        if (d === '15') return '15 JOURS'
        if (d === 'reception') return 'À RÉCEPTION'
        return ''
      })(),
      ipClause: ipClause === 'cession' ? 'CESSION APRÈS PAIEMENT' : ipClause === 'licence' ? "LICENCE D'UTILISATION" : 'CESSION TOTALE',
      confidentiality: confidentialityClause === 'oui' ? 'OUI' : 'NON',
      termination: terminationClause === '15' ? 'PRÉAVIS 15 JOURS' : terminationClause === '30' ? 'PRÉAVIS 30 JOURS' : 'SANS PRÉAVIS',
    }

    const res = await fetch('/api/contrat-pdf', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: 'Bearer ' + token,
      },
      body: JSON.stringify(payload),
    })
    const blob = await res.blob()
    if (!res.ok) throw new Error((await blob.text()) || 'Erreur PDF')

    return { blob, token }
  }

  async function sendContractByEmail() {
    try {
      const to = String(clientEmail || '')
      await openMailComposeWithAttachment({
        kind: 'contrat',
        to,
        subject: `Contrat ${String(contractNumber || '').trim() || 'Spyke'}`,
        text: `Bonjour,\n\nVeuillez trouver ci-joint le contrat.\n\nCordialement,\n${userFullName || ''}`.trim(),
        // default: send without signature (user can click "Signer" in the preview first)
        getBlob: () => generateContractPdfBlob({ includeSignature: false }),
        filename: 'Contrat-' + String(contractNumber || 'Spyke') + '.pdf',
      })
    } catch (e: any) {
      alert(e?.message || 'Erreur envoi mail')
    }
  }

  async function generateContractPdf() {
    try {
      if (!supabase) throw new Error('Supabase non initialisé')

      // Free quota (per month): 3 contrats
      if (planCode !== 'pro' && userId) {
        const now = new Date()
        const start = new Date(now.getFullYear(), now.getMonth(), 1)
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 1)
        const startStr = start.toISOString()
        const endStr = end.toISOString()

        const { count, error } = await supabase
          .from('contracts')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .gte('created_at', startStr)
          .lt('created_at', endStr)
        if (error) throw error
        if (Number(count || 0) >= 3) {
          alert('Limite du plan Free atteinte : 3 contrats / mois. Passe Pro pour illimité.')
          return
        }
      }

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

          // Uniqueness check: number must be unique per user
          const { data: existing, error: existingErr } = await supabase
            .from('contracts')
            .select('id')
            .eq('user_id', userId)
            .eq('number', contractNumber)
            .maybeSingle()
          if (existingErr) throw existingErr

          const currentId = String(selectedContractIdRef.current || selectedContractId || '')
          if (existing?.id && String(existing.id) !== currentId) {
            throw new Error('Numéro de contrat déjà utilisé')
          }

          const row = {
            user_id: userId,
            client_id: clientId || null,
            quote_id: contractFromQuoteId || null,
            number: contractNumber,
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
            const { error: updErr } = await supabase.from('contracts').update(row).eq('id', existing.id)
            if (updErr) throw updErr
          } else {
            const { data: insData, error: insErr } = await supabase.from('contracts').insert(row).select('id').single()
            if (insErr) throw insErr
            const newId = String((insData as any)?.id || '')
            if (newId) {
              selectedContractIdRef.current = newId
              setSelectedContractId(newId)
            }
          }

          // Refresh list so it appears immediately in the UI/dashboard
          try {
            const { data: cData } = await supabase
              .from('contracts')
              .select('id,number,title,status,amount_ht,created_at,client_id,quote_id')
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

      const pricingAmountLabel = (() => {
        const amount = Number(pricingAmount || 0)
        if (pricingType === 'forfait') return `${amount.toFixed(2)} € HT`
        if (pricingType === 'tjm') return `${amount.toFixed(2)} € HT / jour`
        return `${amount.toFixed(2)} € HT / heure`
      })()

      // best-effort signature
      let signatureUrl = ''
      try {
        if (userId) {
          const { data: profile } = await supabase.from('profiles').select('signature_path').eq('id', userId).maybeSingle()
          const signaturePath = String((profile as any)?.signature_path || '')
          if (signaturePath) {
            const pub = supabase.storage.from('signatures').getPublicUrl(signaturePath)
            signatureUrl = String(pub?.data?.publicUrl || '')
          }
        }
      } catch {}

      const payload = {
        title: 'Contrat de prestation de service',
        date: today,
        logoUrl,
        signatureUrl,
        contractText: finalText,
        parties: {
          sellerName: prestaName,
          buyerName: clientName,
        },

        contractNumber,
        seller: {
          name: prestaName,
          siret: prestaSiret,
          address: prestaAddress,
          activity: prestaActivity,
          email: prestaEmail,
        },
        buyer: {
          name: clientName,
          siret: clientSiret,
          representant: clientRepresentant,
          address: clientAddress,
          email: clientEmail,
        },
        mission: {
          startDate: formatDateFr(missionStart) || missionStart || '',
          endDate: formatDateFr(missionEnd) || missionEnd || '',
          location: missionLieu === 'distance' ? 'À DISTANCE' : missionLieu === 'client' ? 'SUR SITE' : 'MIXTE',
          revisions: missionRevisions === 'illimite' ? 'ILLIMITÉES' : String(missionRevisions || ''),
          description: missionDescription,
          deliverables: missionLivrables,
        },
        pricing: {
          type: pricingType === 'forfait' ? 'FORFAIT' : pricingType === 'tjm' ? 'TJM' : 'TAUX HORAIRE',
          amount: pricingAmountLabel,
        },
        vatRegime: tvaRegime === 'franchise' ? 'FRANCHISE EN BASE' : 'ASSUJETTI',
        paymentSchedule:
          paymentSchedule === '30'
            ? '30/70'
            : paymentSchedule === '50'
              ? '50/50'
              : paymentSchedule === 'fin'
                ? '100% FIN'
                : 'PERSONNALISÉ',
        paymentDelay: (() => {
          const d = String(paymentDelay || '')
          if (d === '30') return '30 JOURS'
          if (d === '45') return '45 JOURS'
          if (d === '60') return '60 JOURS'
          // existing UI options
          if (d === '15') return '15 JOURS'
          if (d === 'reception') return 'À RÉCEPTION'
          return ''
        })(),
        ipClause: ipClause === 'cession' ? 'CESSION APRÈS PAIEMENT' : ipClause === 'licence' ? "LICENCE D'UTILISATION" : 'CESSION TOTALE',
        confidentiality: confidentialityClause === 'oui' ? 'OUI' : 'NON',
        termination:
          terminationClause === '15' ? 'PRÉAVIS 15 JOURS' : terminationClause === '30' ? 'PRÉAVIS 30 JOURS' : 'SANS PRÉAVIS',
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

      openPdfPreviewFromBlob(blob, `Contrat-${new Date().toISOString().slice(0, 10)}.pdf`, {
        kind: 'contrat',
        contractId: String(selectedContractIdRef.current || ''),
        to: String(clientEmail || ''),
        subject: `Contrat ${String(contractNumber || '').trim() || 'Spyke'}`,
        text: `Bonjour,\n\nVeuillez trouver ci-joint le contrat.\n\nCordialement,\n${userFullName || ''}`.trim(),
        getBlob: () => generateContractPdfBlob({ includeSignature: false }),
        getSignedBlob: (opts) => generateContractPdfBlob({ includeSignature: true, signedAt: opts.signedAt, signedPlace: opts.signedPlace }),
        getSignaturePreview: async () => {
          if (!supabase) return { signaturePath: '' }
          const { data: sessionData } = await supabase.auth.getSession()
          const token = sessionData?.session?.access_token
          if (!token) return { signaturePath: '' }
          try {
            const res = await fetch('/api/signature-preview', {
              method: 'GET',
              headers: { authorization: `Bearer ${token}` },
            })
            const json = await res.json().catch(() => ({}))
            if (!res.ok) return { signaturePath: '' }
            return { signaturePath: String((json as any)?.signaturePath || ''), url: String((json as any)?.url || '') }
          } catch {
            return { signaturePath: '' }
          }
        },
        filename: 'Contrat-' + String(contractNumber || 'Spyke') + '.pdf',
      })
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
              <p>Créez votre premier contrat en cliquant sur "Nouveau contrat".</p>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="only-desktop" style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ textAlign: 'left', fontSize: 12, color: 'var(--gray-500)' }}>
                      <th style={{ padding: '10px 8px', borderBottom: '1px solid var(--gray-200)' }}>N°</th>
                      <th style={{ padding: '10px 8px', borderBottom: '1px solid var(--gray-200)' }}>Titre</th>
                      <th style={{ padding: '10px 8px', borderBottom: '1px solid var(--gray-200)' }}>Statut</th>
                      <th style={{ padding: '10px 8px', borderBottom: '1px solid var(--gray-200)', textAlign: 'right' }}>Montant</th>
                      <th style={{ padding: '10px 8px', borderBottom: '1px solid var(--gray-200)', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contracts.map((c) => (
                      <tr key={c.id}>
                        <td style={{ padding: '12px 8px', borderBottom: '1px solid var(--gray-100)' }}>{(c as any).number || '-'}</td>
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
                            <button className="btn btn-secondary" type="button" onClick={() => duplicateContract(String(c.id))}>
                              Dupliquer
                            </button>
                            {/* Envoi pour signature disponible dans le pop-up PDF */}
                            <button
                              className="btn btn-secondary"
                              type="button"
                              onClick={async () => {
                                try {
                                  await openContract(String(c.id))
                                  setMode('create')
                                  // give React a tick to apply loaded state
                                  await new Promise((r) => setTimeout(r, 200))
                                  await generateContractPdf()
                                } catch (e: any) {
                                  alert(e?.message || 'Erreur génération PDF')
                                }
                              }}
                            >
                              PDF
                            </button>
                            <button className="btn btn-secondary" type="button" onClick={() => deleteContract(String(c.id))}>
                              Supprimer
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="only-mobile mobile-cards">
                {contracts.map((c) => (
                  <div key={c.id} className="mobile-card">
                    <div className="mobile-card-top">
                      <div>
                        <div className="mobile-card-title">{(c as any).number || '-'}</div>
                        <div className="mobile-card-sub">{c.title || 'Contrat'}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div className="mobile-card-amount">{formatMoney(Number(c.amount_ht || 0))}</div>
                        <div className="mobile-badges">
                          <span className="badge badge-gray">{c.status || 'draft'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="mobile-card-actions">
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
                      <button className="btn btn-secondary" type="button" onClick={() => duplicateContract(String(c.id))}>
                        Dupliquer
                      </button>
                      {/* Envoi pour signature disponible dans le pop-up PDF */}
                      <button
                        className="btn btn-secondary"
                        type="button"
                        onClick={async () => {
                          try {
                            await openContract(String(c.id))
                            setMode('create')
                            await new Promise((r) => setTimeout(r, 200))
                            await generateContractPdf()
                          } catch (e: any) {
                            alert(e?.message || 'Erreur génération PDF')
                          }
                        }}
                      >
                        PDF
                      </button>
                      <button className="btn btn-secondary" type="button" onClick={() => deleteContract(String(c.id))}>
                        Supprimer
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      ) : (
        <>
          <button className="btn btn-secondary" type="button" onClick={() => setMode('list')} style={{ marginBottom: 16 }}>
            ← Retour aux contrats
          </button>

          <div className="page-header">
            <div>
              <h1 className="page-title">{selectedContractId ? `Contrat ${String(contractNumber || '').trim() || ''}` : 'Nouveau contrat'}</h1>
              <p className="page-subtitle">Créez un contrat (UI) - la sauvegarde viendra ensuite</p>
            </div>
            <div className="header-actions" style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {selectedContractId ? (
                <button className="btn btn-secondary" type="button" onClick={() => deleteContract(String(selectedContractId))}>
                  Supprimer
                </button>
              ) : null}
            </div>
          </div>

          {signatureMissing ? (
            <div className="info-box" style={{ marginTop: 12 }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4M12 8h.01" />
              </svg>
              <p>
                Signature non enregistrée : vos contrats seront générés <b>sans signature</b>. Allez dans <b>Paramètres → Signature</b> pour l'ajouter.
              </p>
            </div>
          ) : null}

          <div className="import-toolbar">
            <button
              className="btn import-btn"
              type="button"
              onClick={() => {
                try {
                  const input = document.getElementById('import-contrat-pdf') as HTMLInputElement | null
                  input?.click()
                } catch {}
              }}
            >
              Importer PDF
            </button>

            {/* Desktop tooltip */}
            <span
              className="tooltip only-desktop"
              data-tip="Analyse un PDF (avec du texte) pour pré-remplir le contrat (client, dates, mission, prix...)."
            >
              ?
            </span>

            {/* Mobile help text */}
            <span className="import-help-text only-mobile">
              Analyse un PDF pour pré-remplir le contrat
            </span>

            <input
              id="import-contrat-pdf"
              type="file"
              accept="application/pdf"
              style={{ display: 'none' }}
              onChange={async (e) => {
                const f = e.target.files?.[0]
                e.target.value = ''
                if (!f) return
                try {
                  if (!supabase) throw new Error('Supabase non initialisé')
                  const { data: s } = await supabase.auth.getSession()
                  const token = s.session?.access_token
                  if (!token) throw new Error('Non connecté')

                  const fd = new FormData()
                  fd.set('type', 'contrat')
                  fd.set('file', f)

                  const res = await fetch('/api/import-document', {
                    method: 'POST',
                    headers: { authorization: `Bearer ${token}` },
                    body: fd,
                  })
                  const json = await res.json()
                  if (!res.ok) throw new Error(json?.error || 'Import échoué')
                  const d = json?.data || {}

                  if (d.title) {
                    // contract title is currently hardcoded in PDF payload, but we can use it as a hint in mission description
                    setMissionDescription((prev) => (prev ? prev : String(d.title)))
                  }
                  if (d.startDate) setMissionStart(String(d.startDate))
                  if (d.endDate) setMissionEnd(String(d.endDate))
                  if (d.client?.name) setClientName(String(d.client.name || ''))
                  if (d.client?.siret) setClientSiret(String(d.client.siret || ''))
                  if (d.client?.address || d.client?.postalCode || d.client?.city) {
                    const addr = [d.client.address, [d.client.postalCode, d.client.city].filter(Boolean).join(' ')].filter(Boolean).join(', ')
                    setClientAddress(String(addr))
                  }
                  if (d.scope) {
                    setMissionDescription(String(d.scope))
                  }
                  if (d.price?.mode) {
                    if (d.price.mode === 'tjm') setPricingType('tjm')
                    else if (d.price.mode === 'horaire') setPricingType('horaire')
                    else setPricingType('forfait')
                  }
                  if (typeof d.price?.amount === 'number') {
                    setPricingAmount(Number(d.price.amount || 0))
                  }
                  if (d.notes) {
                    // keep as extra context
                    setContractText((prev) => prev || String(d.notes))
                  }

                  if (Array.isArray(d.warnings) && d.warnings.length) {
                    alert('Import terminé. Points à vérifier:\n- ' + d.warnings.join('\n- '))
                  }
                } catch (err: any) {
                  alert(err?.message || 'Import échoué')
                }
              }}
            />
            {/* import photo removed */}
          </div>

          <div className="card contrats-form">
            <details className="mobile-accordion" open>
              <summary className="mobile-accordion-summary">Informations du contrat</summary>
              <div className="mobile-accordion-body">
                <div className="form-row">
            <div className="form-group">
              <label className="form-label">Numéro du contrat</label>
              <input
                type="text"
                className="form-input"
                value={contractNumber}
                onChange={(e) => {
                  setContractNumber(e.target.value)
                  setContractNumberDirty(true)
                }}
                placeholder="C202602-001"
              />
              <div style={{ marginTop: 6, fontSize: 12, color: 'var(--gray-500)' }}>
                Format conseillé : CYYYYMM-001 (auto). Vous pouvez modifier si besoin.
              </div>
            </div>
          </div>
              </div>
            </details>

            <details className="mobile-accordion" open>
              <summary className="mobile-accordion-summary">Importer depuis un devis</summary>
              <div className="mobile-accordion-body">
                <div className="form-row">
            <div className="form-group">
              <label className="form-label">Choisir un devis</label>
              <select className="form-select" value={contractFromQuoteId} onChange={(e) => importFromQuote(e.target.value)}>
                <option value="">-</option>
                {quotes.map((q) => (
                  <option key={q.id} value={q.id}>
                    {q.number}{q.title ? ` - ${q.title}` : ''}{q.total_ttc != null ? ` (${formatMoney(Number(q.total_ttc) || 0)})` : ''}
                  </option>
                ))}
              </select>
              <div style={{ marginTop: 6, fontSize: 12, color: 'var(--gray-500)' }}>
                Astuce : génère un devis en PDF pour qu'il apparaisse ici.
              </div>
            </div>
          </div>
              </div>
            </details>

            <div className="info-box">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4M12 8h.01" />
              </svg>
              <p>Vos informations (nom, adresse, SIRET) sont automatiquement récupérées depuis votre profil.</p>
            </div>

            <details className="mobile-accordion" open>
              <summary className="mobile-accordion-summary">Client</summary>
              <div className="mobile-accordion-body">
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
              <input
                className="form-input"
                inputMode="numeric"
                placeholder="14 chiffres"
                value={clientSiret}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, '').slice(0, 14)
                  setClientSiret(v)
                }}
              />
              {clientSiret && clientSiret.replace(/\D/g, '').length !== 14 ? (
                <div style={{ marginTop: 6, fontSize: 12, color: 'var(--red)' }}>Le SIRET doit contenir 14 chiffres.</div>
              ) : null}
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
            </details>

            <details className="mobile-accordion" open>
              <summary className="mobile-accordion-summary">Mission</summary>
              <div className="mobile-accordion-body">
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
            </details>

            <details className="mobile-accordion" open>
              <summary className="mobile-accordion-summary">Conditions financières</summary>
              <div className="mobile-accordion-body">
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
            </details>

            <div className="btn-group contrats-actions" style={{ marginTop: 18 }}>
              <button className="btn btn-secondary" type="button" onClick={() => alert('Brouillon: à connecter')}>
                Enregistrer brouillon
              </button>

              <button className="btn btn-primary" type="button" onClick={generateContractPdf}>
                Générer PDF
              </button>

              {/* Bouton “Envoyer pour signature” supprimé ici : disponible dans le pop-up PDF */}
            </div>

        {contractText ? (
          <details className="mobile-preview" open>
            <summary className="mobile-accordion-summary">Aperçu du contrat</summary>
            <div className="mobile-accordion-body">
              <div className="output-box" style={{ whiteSpace: 'pre-wrap', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>
                {contractText}
              </div>
            </div>
          </details>
        ) : null}
      </div>
        </>
      )}
    {modals}
    </div>
  )
}

function FacturesV1({
  clients,
  userId,
  userFullName,
  planCode,
}: {
  clients: Array<{ id: string; name: string; email: string | null }>
  userId: string | null
  userFullName: string
  planCode: 'free' | 'pro'
}) {
  const supabase = useMemo(() => {
    try {
      return getSupabase()
    } catch {
      return null
    }
  }, [])

  const { openPdfPreviewFromBlob, openMailComposeWithAttachment, openSignatureFrame, modals } = usePdfMailModals()

  const [signatureMissing, setSignatureMissing] = useState(false)
  useEffect(() => {
    ;(async () => {
      try {
        if (!supabase || !userId) return
        const { data: profile } = await supabase.from('profiles').select('signature_path').eq('id', userId).maybeSingle()
        const sp = String((profile as any)?.signature_path || '')
        setSignatureMissing(!sp)
      } catch {
        setSignatureMissing(false)
      }
    })()
  }, [supabase, userId])

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
  const [invoiceNumberDirty, setInvoiceNumberDirty] = useState(false)

  const [buyer, setBuyer] = useState<any>({ name: '', email: '', siret: '', addressLines: [] })
  const [clientId, setClientId] = useState('')
  const [lines, setLines] = useState<InvoiceLine[]>(() => [
    { id: '0', description: '', qty: 1, unitPrice: 0 },
  ])

  const totals = useMemo(() => computeInvoiceTotals(lines), [lines])

  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), [])

  const invoiceStats = useMemo(() => {
    let total = 0
    let paid = 0
    let pending = 0
    let late = 0

    for (const inv of invoices || []) {
      const amount = Number((inv as any)?.total_ttc || 0) || 0
      total += amount

      const paidAt = (inv as any)?.paid_at
      const due = String((inv as any)?.due_date || '')

      if (paidAt) {
        paid += amount
        continue
      }

      if (due && due < todayStr) {
        late += amount
      } else {
        pending += amount
      }
    }

    return { total, paid, pending, late }
  }, [invoices, todayStr])

  useEffect(() => {
    setDueDate(addDays(invoiceDate, paymentDelayDays || 0))

    ;(async () => {
      try {
        if (!supabase) return
        if (invoiceNumberDirty) return
        // Auto-number: YYYY-001 (per user, per year)
        const d = new Date(String(invoiceDate || '').slice(0, 10) + 'T00:00:00')
        const year = !Number.isNaN(d.getTime()) ? d.getFullYear() : new Date().getFullYear()
        const prefix = `${year}-`

        const { data } = await supabase
          .from('invoices')
          .select('number')
          .like('number', `${prefix}%`)
          .order('created_at', { ascending: false })
          .limit(200)

        let max = 0
        for (const r of (data || []) as any[]) {
          const n = String((r as any).number || '')
          if (!n.startsWith(prefix)) continue
          const tail = n.slice(prefix.length)
          const seq = Number(tail)
          if (!Number.isNaN(seq)) max = Math.max(max, seq)
        }

        setInvoiceNumber(genInvoiceNumber(String(invoiceDate || ''), max + 1))
      } catch {
        // fallback
        try {
          if (!invoiceNumberDirty) setInvoiceNumber(genInvoiceNumber(invoiceDate, 1))
        } catch {}
      }
    })()
  }, [invoiceDate, paymentDelayDays, supabase, invoiceNumberDirty])

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
            .select('id,number,status,paid_at,date_issue,due_date,total_ttc,client_id,created_at')
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
      .select('name,email,siret,address,postal_code,city,country')
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
      siret: String((c as any)?.siret || ''),
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
        siret: String(buyerSnap.siret || ''),
        addressLines: Array.isArray(buyerSnap.addressLines) ? buyerSnap.addressLines : [],
      })
    }

    const imported = (qLines || []).map((l: any, idx: number) => ({
      id: String(Date.now() + idx),
      description: l.label ? `${l.label}${l.description ? ` - ${l.description}` : ''}` : String(l.description || ''),
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
      .select('id,number,status,paid_at,date_issue,due_date,payment_terms_days,total_ttc,buyer_snapshot,client_id')
      .eq('id', id)
      .maybeSingle()
    if (!inv) return

    setInvoiceNumber(String((inv as any).number || ''))
    setInvoiceNumberDirty(true)
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

  async function duplicateInvoice(id: string) {
    try {
      if (!supabase || !id) return
      await openInvoice(id)
      setSelectedInvoiceId('')
      setInvoiceNumberDirty(false)
      setInvoiceDate(today)
      setMode('create')
    } catch {
      // ignore
    }
  }

  async function deleteInvoice(id: string) {
    try {
      if (!supabase || !id) return
      const inv = invoices.find((x) => String((x as any).id) === String(id))
      const ok = confirm(`Supprimer la facture ${String((inv as any)?.number || '')} ?`)
      if (!ok) return

      const { error: delLinesErr } = await supabase.from('invoice_lines').delete().eq('invoice_id', id)
      if (delLinesErr) throw delLinesErr

      const { error: delInvErr } = await supabase.from('invoices').delete().eq('id', id)
      if (delInvErr) throw delInvErr

      // refresh list
      const { data: invData } = await supabase
        .from('invoices')
        .select('id,number,status,paid_at,date_issue,due_date,total_ttc,client_id,created_at')
        .order('created_at', { ascending: false })
        .limit(50)
      setInvoices((invData || []) as any[])

      if (selectedInvoiceId === id) setSelectedInvoiceId('')
    } catch (e: any) {
      alert(e?.message || 'Erreur suppression facture')
    }
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

  // invoice-from-contract shortcut removed

  async function generateInvoicePdfBlob(opts?: { includeSignature?: boolean; signedAt?: string; signedPlace?: string }) {
    if (!supabase) throw new Error('Supabase non initialisé')

    const { data: sessionData } = await supabase.auth.getSession()
    const token = sessionData?.session?.access_token
    if (!token) throw new Error('Non connecté')

    // Seller info from profile (best-effort) - same as generateInvoicePdf
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
        .select('full_name,company_name,logo_path,signature_path,address,postal_code,city,country,siret,iban,bic,bank_name,bank_account')
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

    const totals = computeInvoiceTotals(lines)

    // signature handled server-side (signed URL). We only indicate whether it should be included.
    const includeSignature = !!opts?.includeSignature

    const payload: any = {
      invoiceNumber,
      dateIssue: invoiceDate,
      dueDate,
      seller,
      buyer,
      lines,
      totals,
      notes: '',
      includeSignature,
      signedAt: String(opts?.signedAt || ''),
      signedPlace: String(opts?.signedPlace || ''),
    }

    const res = await fetch('/api/facture-pdf', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: 'Bearer ' + token,
      },
      body: JSON.stringify(payload),
    })

    const blob = await res.blob()
    if (!res.ok) throw new Error((await blob.text()) || 'Erreur PDF')
    return { blob, token }
  }

  async function sendInvoiceByEmail() {
    try {
      const to = String((buyer as any)?.email || '')
      await openMailComposeWithAttachment({
        kind: 'facture',
        to,
        subject: `Facture ${String(invoiceNumber || '').trim() || 'Spyke'}`,
        text: `Bonjour,\n\nVeuillez trouver ci-joint votre facture.\n\nCordialement,\n${userFullName || ''}`.trim(),
        getBlob: () => generateInvoicePdfBlob({ includeSignature: true }),
        filename: 'Facture-' + String(invoiceNumber || 'Spyke') + '.pdf',
      })
    } catch (e: any) {
      alert(e?.message || 'Erreur envoi mail')
    }
  }

  async function generateInvoicePdf() {
    try {
      if (!supabase) throw new Error('Supabase non initialisé')

      // Free quota (per month): 3 factures
      if (planCode !== 'pro' && userId) {
        const now = new Date()
        const start = new Date(now.getFullYear(), now.getMonth(), 1)
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 1)
        const startStr = start.toISOString()
        const endStr = end.toISOString()

        const { count, error } = await supabase
          .from('invoices')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .gte('created_at', startStr)
          .lt('created_at', endStr)
        if (error) throw error
        if (Number(count || 0) >= 3) {
          alert('Limite du plan Free atteinte : 3 factures / mois. Passe Pro pour illimité.')
          return
        }
      }

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

      let signatureUrl = ''

      if (userId) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name,company_name,logo_path,signature_path,address,postal_code,city,country,siret,iban,bic,bank_name,bank_account')
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

        try {
          const signaturePath = String((profile as any)?.signature_path || '')
          if (signaturePath) {
            const pub = supabase.storage.from('signatures').getPublicUrl(signaturePath)
            signatureUrl = String(pub?.data?.publicUrl || '')
          }
        } catch {}

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
        signatureUrl,
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

          const { data: existing, error: existingErr } = await supabase
            .from('invoices')
            .select('id')
            .eq('user_id', userId)
            .eq('number', invoiceNumber)
            .maybeSingle()
          if (existingErr) throw existingErr

          // If another invoice already uses this number, block creation
          if (existing?.id && String(existing.id) !== String(selectedInvoiceId || '')) {
            throw new Error('Numéro de facture déjà utilisé')
          }

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
            const { error: updErr } = await supabase.from('invoices').update(row).eq('id', existing.id)
            if (updErr) throw updErr
            invoiceId = String(existing.id)
          } else {
            const { data: inv, error: invErr } = await supabase.from('invoices').insert(row).select('id').single()
            if (invErr) throw invErr
            if (inv?.id) invoiceId = String(inv.id)
          }

          if (invoiceId) {
            const { error: delErr } = await supabase.from('invoice_lines').delete().eq('invoice_id', invoiceId)
            if (delErr) throw delErr
            if (lines.length) {
              const { error: insErr } = await supabase.from('invoice_lines').insert(
                lines.map((l, idx) => ({
                  invoice_id: invoiceId,
                  position: idx,
                  description: l.description,
                  qty: l.qty,
                  unit_price: l.unitPrice,
                })) as any
              )
              if (insErr) throw insErr
            }
          }

          // Refresh list so it appears immediately in the UI/dashboard
          try {
            const { data: invData } = await supabase
              .from('invoices')
              .select('id,number,status,paid_at,date_issue,due_date,total_ttc,client_id,created_at')
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

      openPdfPreviewFromBlob(blob, `Facture-${invoiceNumber}.pdf`, {
        kind: 'facture',
        to: String((buyer as any)?.email || ''),
        subject: `Facture ${String(invoiceNumber || '').trim() || 'Spyke'}`,
        text: `Bonjour,\n\nVeuillez trouver ci-joint la facture.\n\nCordialement,\n${userFullName || ''}`.trim(),
        getBlob: () => generateInvoicePdfBlob({ includeSignature: false }),
        getSignedBlob: (opts) => generateInvoicePdfBlob({ includeSignature: true, signedAt: opts.signedAt, signedPlace: opts.signedPlace }),
        getSignaturePreview: async () => {
          if (!supabase) return { signaturePath: '' }
          const { data: sessionData } = await supabase.auth.getSession()
          const token = sessionData?.session?.access_token
          if (!token) return { signaturePath: '' }
          try {
            const res = await fetch('/api/signature-preview', {
              method: 'GET',
              headers: { authorization: `Bearer ${token}` },
            })
            const json = await res.json().catch(() => ({}))
            if (!res.ok) return { signaturePath: '' }
            return { signaturePath: String((json as any)?.signaturePath || ''), url: String((json as any)?.url || '') }
          } catch {
            return { signaturePath: '' }
          }
        },
        filename: 'Facture-' + String(invoiceNumber || 'Spyke') + '.pdf',
      })
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
              <div className="stat-value">{formatMoney(invoiceStats.total)}</div>
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
              <div className="stat-value">{formatMoney(invoiceStats.paid)}</div>
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
              <div className="stat-value">{formatMoney(invoiceStats.pending)}</div>
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
              <div className="stat-value">{formatMoney(invoiceStats.late)}</div>
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
                <p>Créez votre première facture en cliquant sur "Nouvelle facture".</p>
              </div>
            ) : (
              <>
                {/* Desktop table */}
                <div className="only-desktop" style={{ overflowX: 'auto' }}>
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
                            {clients.find((c) => c.id === inv.client_id)?.name || '-'}
                          </td>
                          <td style={{ padding: '12px 8px', borderBottom: '1px solid var(--gray-100)' }}>
                            {(() => {
                              const paidAt = (inv as any)?.paid_at
                              const due = String((inv as any)?.due_date || '')
                              if (paidAt) return 'Payée'
                              if (due && due < todayStr) return 'En retard'
                              return 'Non payée'
                            })()}
                          </td>
                          <td style={{ padding: '12px 8px', borderBottom: '1px solid var(--gray-100)' }}>{inv.date_issue ? formatDateFr(String(inv.date_issue)) : '-'}</td>
                          <td style={{ padding: '12px 8px', borderBottom: '1px solid var(--gray-100)' }}>{inv.due_date ? formatDateFr(String(inv.due_date)) : '-'}</td>
                          <td style={{ padding: '12px 8px', borderBottom: '1px solid var(--gray-100)', textAlign: 'right', fontWeight: 700 }}>{formatMoney(Number(inv.total_ttc || 0))}</td>
                          <td style={{ padding: '12px 8px', borderBottom: '1px solid var(--gray-100)', textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                              <button className="btn btn-secondary" type="button" onClick={() => openInvoice(String(inv.id))}>
                                Ouvrir
                              </button>
                              <button className="btn btn-secondary" type="button" onClick={() => duplicateInvoice(String(inv.id))}>
                                Dupliquer
                              </button>
                              {!(inv as any)?.paid_at ? (
                                <button
                                  className="btn btn-secondary"
                                  type="button"
                                  onClick={async () => {
                                    try {
                                      if (!supabase) return
                                      const { error } = await supabase
                                        .from('invoices')
                                        .update({ paid_at: new Date().toISOString(), status: 'paid' } as any)
                                        .eq('id', String(inv.id))
                                      if (error) throw error

                                      const { data: invData } = await supabase
                                        .from('invoices')
                                        .select('id,number,status,paid_at,date_issue,due_date,total_ttc,client_id,created_at')
                                        .order('created_at', { ascending: false })
                                        .limit(50)
                                      setInvoices((invData || []) as any[])
                                    } catch (e: any) {
                                      alert(e?.message || 'Erreur mise à jour facture')
                                    }
                                  }}
                                >
                                  Marquer payé
                                </button>
                              ) : (
                                <button
                                  className="btn btn-secondary"
                                  type="button"
                                  onClick={async () => {
                                    try {
                                      if (!supabase) return
                                      const { error } = await supabase
                                        .from('invoices')
                                        .update({ paid_at: null, status: 'pending' } as any)
                                        .eq('id', String(inv.id))
                                      if (error) throw error

                                      const { data: invData } = await supabase
                                        .from('invoices')
                                        .select('id,number,status,paid_at,date_issue,due_date,total_ttc,client_id,created_at')
                                        .order('created_at', { ascending: false })
                                        .limit(50)
                                      setInvoices((invData || []) as any[])
                                    } catch (e: any) {
                                      alert(e?.message || 'Erreur mise à jour facture')
                                    }
                                  }}
                                >
                                  Démarquer payé
                                </button>
                              )}

                              <button
                                className="btn btn-secondary"
                                type="button"
                                onClick={async () => {
                                  try {
                                    if (!supabase) return
                                    const ok = confirm(`Supprimer la facture ${String((inv as any)?.number || '')} ?`)
                                    if (!ok) return

                                    const id = String(inv.id)
                                    const { error: delLinesErr } = await supabase.from('invoice_lines').delete().eq('invoice_id', id)
                                    if (delLinesErr) throw delLinesErr

                                    const { error: delInvErr } = await supabase.from('invoices').delete().eq('id', id)
                                    if (delInvErr) throw delInvErr

                                    const { data: invData } = await supabase
                                      .from('invoices')
                                      .select('id,number,status,paid_at,date_issue,due_date,total_ttc,client_id,created_at')
                                      .order('created_at', { ascending: false })
                                      .limit(50)
                                    setInvoices((invData || []) as any[])
                                  } catch (e: any) {
                                    alert(e?.message || 'Erreur suppression facture')
                                  }
                                }}
                              >
                                Supprimer
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                <div className="only-mobile mobile-cards">
                  {invoices.map((inv) => {
                    const clientName = clients.find((c) => c.id === inv.client_id)?.name || '-'
                    const paidAt = (inv as any)?.paid_at
                    const due = String((inv as any)?.due_date || '')
                    const statusLabel = paidAt ? 'Payée' : due && due < todayStr ? 'En retard' : 'Non payée'
                    const statusTone = paidAt ? 'green' : due && due < todayStr ? 'red' : 'gray'

                    return (
                      <div key={inv.id} className="mobile-card">
                        <div className="mobile-card-top">
                          <div>
                            <div className="mobile-card-title">{inv.number}</div>
                            <div className="mobile-card-sub">{clientName}</div>
                            <div className="mobile-card-meta">
                              <span>Émise: {inv.date_issue ? formatDateFr(String(inv.date_issue)) : '-'}</span>
                              <span style={{ marginLeft: 10 }}>Échéance: {inv.due_date ? formatDateFr(String(inv.due_date)) : '-'}</span>
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div className="mobile-card-amount">{formatMoney(Number(inv.total_ttc || 0))}</div>
                            <div className="mobile-badges">
                              <span className={`badge ${statusTone === 'green' ? 'badge-green' : statusTone === 'red' ? 'badge-red' : 'badge-gray'}`}>{statusLabel}</span>
                            </div>
                          </div>
                        </div>
                        <div className="mobile-card-actions">
                          <button className="btn btn-secondary" type="button" onClick={() => openInvoice(String(inv.id))}>Ouvrir</button>
                          <button className="btn btn-secondary" type="button" onClick={() => duplicateInvoice(String(inv.id))}>Dupliquer</button>
                          {!paidAt ? (
                            <button
                              className="btn btn-secondary"
                              type="button"
                              onClick={async () => {
                                try {
                                  if (!supabase) return
                                  const { error } = await supabase
                                    .from('invoices')
                                    .update({ paid_at: new Date().toISOString(), status: 'paid' } as any)
                                    .eq('id', String(inv.id))
                                  if (error) throw error

                                  const { data: invData } = await supabase
                                    .from('invoices')
                                    .select('id,number,status,paid_at,date_issue,due_date,total_ttc,client_id,created_at')
                                    .order('created_at', { ascending: false })
                                    .limit(50)
                                  setInvoices((invData || []) as any[])
                                } catch (e: any) {
                                  alert(e?.message || 'Erreur mise à jour facture')
                                }
                              }}
                            >
                              Marquer payé
                            </button>
                          ) : (
                            <button
                              className="btn btn-secondary"
                              type="button"
                              onClick={async () => {
                                try {
                                  if (!supabase) return
                                  const { error } = await supabase
                                    .from('invoices')
                                    .update({ paid_at: null, status: 'pending' } as any)
                                    .eq('id', String(inv.id))
                                  if (error) throw error

                                  const { data: invData } = await supabase
                                    .from('invoices')
                                    .select('id,number,status,paid_at,date_issue,due_date,total_ttc,client_id,created_at')
                                    .order('created_at', { ascending: false })
                                    .limit(50)
                                  setInvoices((invData || []) as any[])
                                } catch (e: any) {
                                  alert(e?.message || 'Erreur mise à jour facture')
                                }
                              }}
                            >
                              Démarquer payé
                            </button>
                          )}
                          <button
                            className="btn btn-secondary"
                            type="button"
                            onClick={async () => {
                              try {
                                if (!supabase) return
                                const ok = confirm(`Supprimer la facture ${String((inv as any)?.number || '')} ?`)
                                if (!ok) return

                                const id = String(inv.id)
                                const { error: delLinesErr } = await supabase.from('invoice_lines').delete().eq('invoice_id', id)
                                if (delLinesErr) throw delLinesErr

                                const { error: delInvErr } = await supabase.from('invoices').delete().eq('id', id)
                                if (delInvErr) throw delInvErr

                                const { data: invData } = await supabase
                                  .from('invoices')
                                  .select('id,number,status,paid_at,date_issue,due_date,total_ttc,client_id,created_at')
                                  .order('created_at', { ascending: false })
                                  .limit(50)
                                setInvoices((invData || []) as any[])
                              } catch (e: any) {
                                alert(e?.message || 'Erreur suppression facture')
                              }
                            }}
                          >
                            Supprimer
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
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
              <h1 className="page-title">{selectedInvoiceId ? `Facture ${String(invoiceNumber || '').trim() || ''}` : 'Nouvelle facture'}</h1>
              <p className="page-subtitle">Créez une facture (UI) — la sauvegarde viendra ensuite</p>
            </div>
            <div className="header-actions" style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {selectedInvoiceId ? (
                <button className="btn btn-secondary" type="button" onClick={() => deleteInvoice(String(selectedInvoiceId))}>
                  Supprimer
                </button>
              ) : null}
            </div>
          </div>

          {signatureMissing ? (
            <div className="info-box" style={{ marginTop: 12 }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4M12 8h.01" />
              </svg>
              <p>
                Signature non enregistrée : vos factures seront générées <b>sans signature</b>. Allez dans <b>Paramètres → Signature</b> pour l'ajouter.
              </p>
            </div>
          ) : null}

          <div className="import-toolbar">
            <button
              className="btn import-btn"
              type="button"
              onClick={() => {
                try {
                  const input = document.getElementById('import-facture-pdf') as HTMLInputElement | null
                  input?.click()
                } catch {}
              }}
            >
              Importer PDF
            </button>

            {/* Desktop tooltip */}
            <span
              className="tooltip only-desktop"
              data-tip="Analyse un PDF (avec du texte) pour pré-remplir la facture."
            >
              ?
            </span>

            {/* Mobile help text */}
            <span className="import-help-text only-mobile">
              Analyse un PDF pour pré-remplir la facture
            </span>

            <input
              id="import-facture-pdf"
              type="file"
              accept="application/pdf"
              style={{ display: 'none' }}
              onChange={async (e) => {
                const f = e.target.files?.[0]
                e.target.value = ''
                if (!f) return
                try {
                  if (!supabase) throw new Error('Supabase non initialisé')
                  const { data: s } = await supabase.auth.getSession()
                  const token = s.session?.access_token
                  if (!token) throw new Error('Non connecté')

                  const fd = new FormData()
                  fd.set('type', 'facture')
                  fd.set('file', f)

                  const res = await fetch('/api/import-document', {
                    method: 'POST',
                    headers: { authorization: `Bearer ${token}` },
                    body: fd,
                  })
                  const json = await res.json()
                  if (!res.ok) throw new Error(json?.error || 'Import échoué')
                  const d = json?.data || {}

                  if (d.invoiceNumber) setInvoiceNumber(String(d.invoiceNumber))
                  if (d.dateIssue) setInvoiceDate(String(d.dateIssue))
                  if (d.client?.name) {
                    const addr = [d.client.address, [d.client.postalCode, d.client.city].filter(Boolean).join(' ')].filter(Boolean).join(', ')
                    setBuyer({ ...buyer, name: String(d.client.name || ''), addressLines: addr ? String(addr).split(',').map((x) => x.trim()).filter(Boolean) : [] })
                  }
                  if (Array.isArray(d.lines) && d.lines.length) {
                    setLines(
                      d.lines.map((l: any, idx: number) => ({
                        id: String(idx),
                        description: String(l.description || ''),
                        qty: Number(l.qty ?? 1),
                        unitPrice: Number(l.unitPrice ?? 0),
                      }))
                    )
                  }

                  if (Array.isArray(d.warnings) && d.warnings.length) {
                    alert('Import terminé. Points à vérifier:\n- ' + d.warnings.join('\n- '))
                  }
                } catch (err: any) {
                  alert(err?.message || 'Import échoué')
                }
              }}
            />
            {/* import photo removed */}
          </div>

          <div className="info-box">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4M12 8h.01" />
            </svg>
            <p>Vos informations (nom, adresse, SIRET) sont automatiquement récupérées depuis votre profil.</p>
          </div>

          <div className="card factures-form">
            <details className="mobile-accordion" open>
              <summary className="mobile-accordion-summary">Client & références</summary>
              <div className="mobile-accordion-body">
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
                      {q.number}{q.title ? ` - ${q.title}` : ''}{q.total_ttc != null ? ` (${formatMoney(Number(q.total_ttc) || 0)})` : ''}
                    </option>
                  ))}
                </select>
                <div style={{ marginTop: 6, fontSize: 12, color: 'var(--gray-500)' }}>
                  Astuce : génère au moins un devis en PDF pour qu'il apparaisse ici.
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
                <input className="form-input" value={invoiceNumber} onChange={(e) => { setInvoiceNumber(e.target.value); setInvoiceNumberDirty(true) }} />
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
                <label className="form-label">SIRET client (optionnel)</label>
                <input
                  className="form-input"
                  inputMode="numeric"
                  placeholder="14 chiffres"
                  value={buyer?.siret || ''}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, '').slice(0, 14)
                    setBuyer({ ...buyer, siret: v })
                  }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email (optionnel)</label>
                <input className="form-input" value={buyer?.email || ''} onChange={(e) => setBuyer({ ...buyer, email: e.target.value })} />
              </div>
            </div>

            <div className="form-row single">
              <div className="form-group">
                <label className="form-label">Adresse du client</label>
                <textarea
                  className="form-textarea"
                  placeholder="Adresse (une ligne par champ)"
                  value={(buyer?.addressLines || []).join('\n')}
                  onChange={(e) => setBuyer({ ...buyer, addressLines: e.target.value.split('\n').map((x) => x.trim()).filter(Boolean) })}
                />
              </div>
            </div>
              </div>
            </details>

            <details className="mobile-accordion" open>
              <summary className="mobile-accordion-summary">Prestations</summary>
              <div className="mobile-accordion-body">
                <div className="form-group">
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
              </div>
            </details>

            <details className="mobile-accordion" open>
              <summary className="mobile-accordion-summary">Totaux & PDF</summary>
              <div className="mobile-accordion-body">
                <div className="preview-card" style={{ marginTop: 0 }}>
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

            <div className="btn-group factures-actions" style={{ marginTop: 18 }}>
              <button className="btn btn-secondary" type="button" onClick={() => alert('Brouillon: à connecter')}>
                Enregistrer brouillon
              </button>
              <button className="btn btn-primary" type="button" onClick={generateInvoicePdf}>
                Générer PDF
              </button>
            </div>
              </div>
            </details>
          </div>
        </>
      )}
    {modals}

    {/* Feedback modal: handled in AppHtmlPage */}
    </div>
  )
}

type Tab = 'dashboard' | 'clients' | 'assistant' | 'devis' | 'factures' | 'contrats' | 'analyseur' | 'juriste' | 'settings'

type ModalName = 'newClient' | 'editClient' | 'newDevis'

type Tone = 'pro' | 'chaleureux' | 'formel'

type Template =
  | 'Réponse'
  | 'Relance'
  | 'Relance devis'
  | 'Négociation'
  | 'Refus poli'
  | 'Facture'
  | 'Remerciement'
  | 'Présentation / Prospection'

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

  // Toasts (replace browser alerts)
  const [toast, setToast] = useState<null | { type: 'success' | 'error' | 'info'; title?: string; message: string }>(null)
  const toastTimerRef = useRef<number | null>(null)

  function notify(message: string, type: 'success' | 'error' | 'info' = 'info', title?: string) {
    try {
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current)
    } catch {}
    setToast({ type, title, message })
    try {
      toastTimerRef.current = window.setTimeout(() => setToast(null), type === 'error' ? 6000 : 3500) as any
    } catch {}
  }

  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const goTab = (t: Tab) => {
    setTab(t)
    setMobileNavOpen(false)
  }

  // Allow nested modals/components (e.g. PDF preview) to redirect user to signature settings.
  useEffect(() => {
    const handler = () => {
      try {
        setTab('settings')
        try {
          setSettingsTab('signature')
        } catch {}
        // open signature pad if available
        try {
          // @ts-ignore
          setSignatureEditOpen(true)
        } catch {}
        try {
          setTimeout(() => {
            const el = document.getElementById('signature-settings')
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }, 50)
        } catch {}
      } catch {}
    }
    try {
      window.addEventListener('spyke:goToSignatureSettings', handler as any)
      return () => window.removeEventListener('spyke:goToSignatureSettings', handler as any)
    } catch {
      return
    }
  }, [])

  const [modal, setModal] = useState<ModalName | null>(null)
  const [tone, setTone] = useState<Tone>('pro')
  const [template, setTemplate] = useState<Template>('Réponse')

  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [gmailConnected, setGmailConnected] = useState<boolean>(false)
  const [gmailEmail, setGmailEmail] = useState<string>('')

  const supabase = useMemo(() => {
    try {
      return getSupabase()
    } catch {
      return null
    }
  }, [])

  const [userFullName, setUserFullName] = useState<string>('')
  const [planCode, setPlanCode] = useState<'free' | 'pro'>('free')
  const [userPlan, setUserPlan] = useState<string>('Compte gratuit')
  const [stripeSubStatus, setStripeSubStatus] = useState<string>('')
  const [stripePeriodEnd, setStripePeriodEnd] = useState<string>('')
  const [stripeCancelAtPeriodEnd, setStripeCancelAtPeriodEnd] = useState<boolean>(false)
  const [stripeCancelAt, setStripeCancelAt] = useState<string>('')

  // Feedback survey after 10 generations
  const [feedbackSurveyOpen, setFeedbackSurveyOpen] = useState(false)
  const [feedbackSurveyRatings, setFeedbackSurveyRatings] = useState<Record<string, number>>({
    devis: 0,
    facture: 0,
    contrat: 0,
    assistant: 0,
    juriste: 0,
  })
  const [feedbackSurveyComments, setFeedbackSurveyComments] = useState<Record<string, string>>({
    devis: '',
    facture: '',
    contrat: '',
    assistant: '',
    juriste: '',
  })
  const [feedbackSurveySending, setFeedbackSurveySending] = useState(false)
  const [feedbackSurveyCompletedAt, setFeedbackSurveyCompletedAt] = useState<string>('')
  const [userJob, setUserJob] = useState<string>('')
  const [userDefaultTone, setUserDefaultTone] = useState<string>('')

  // Settings fields (profile)
  const [settingsFirstName, setSettingsFirstName] = useState<string>('')
  const [settingsLastName, setSettingsLastName] = useState<string>('')
  const [settingsJob, setSettingsJob] = useState<string>('')
  const [settingsEmailTone, setSettingsEmailTone] = useState<string>('')
  const [settingsCompanyName, setSettingsCompanyName] = useState<string>('')
  const [settingsExperienceYears, setSettingsExperienceYears] = useState<string>('')
  const [settingsSkills, setSettingsSkills] = useState<string>('')
  const [settingsAddress, setSettingsAddress] = useState<string>('')
  const [settingsPostalCode, setSettingsPostalCode] = useState<string>('')
  const [settingsCity, setSettingsCity] = useState<string>('')
  const [settingsCountry, setSettingsCountry] = useState<string>('')
  const [settingsSiret, setSettingsSiret] = useState<string>('')
  const [settingsVatNumber, setSettingsVatNumber] = useState<string>('')
  const [settingsIban, setSettingsIban] = useState<string>('')
  const [settingsBic, setSettingsBic] = useState<string>('')

  // Signature (freelance)
  const signatureCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const signatureDrawingRef = useRef(false)
  const signatureHasInkRef = useRef(false)
  const signatureLastPointRef = useRef<{ x: number; y: number } | null>(null)
  const [signatureSaving, setSignatureSaving] = useState(false)
  const [signatureError, setSignatureError] = useState('')
  const [signaturePath, setSignaturePath] = useState<string>('')
  const [signaturePreviewUrl, setSignaturePreviewUrl] = useState<string>('')
  const [signatureEditOpen, setSignatureEditOpen] = useState(false)
  const [signaturePreviewBuster, setSignaturePreviewBuster] = useState<number>(0)

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
  const [assistantTo, setAssistantTo] = useState<string>('')
  const [assistantSubject, setAssistantSubject] = useState<string>('')
  const [assistantSubjectDirty, setAssistantSubjectDirty] = useState<boolean>(false)
  const [assistantOutput, setAssistantOutput] = useState<string>('')
  const [assistantSending, setAssistantSending] = useState<boolean>(false)
  const [assistantSendPreviewOpen, setAssistantSendPreviewOpen] = useState<boolean>(false)

  const [assistantHistory, setAssistantHistory] = useState<
    Array<{ id: string; createdAt: string; template: Template; tone: Tone; clientId: string; to: string; subject: string; text: string }>
  >([])

  const [assistantClientInsights, setAssistantClientInsights] = useState<
    null | {
      clientName: string
      unpaidInvoices: Array<{ number: string; total_ttc: number; due_date?: string | null; created_at?: string | null }>
      pendingQuotes: Array<{ number: string; total_ttc: number; created_at?: string | null }>
      activeContracts: Array<{ number: string; title: string; created_at?: string | null }>
    }
  >(null)

  // Assistant IA: history + client insights
  useEffect(() => {
    try {
      const raw = localStorage.getItem('spyke_assistant_history_v1')
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) setAssistantHistory(parsed.slice(0, 30))
      }
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem('spyke_assistant_history_v1', JSON.stringify(assistantHistory.slice(0, 30)))
    } catch {
      // ignore
    }
  }, [assistantHistory])

  useEffect(() => {
    ;(async () => {
      try {
        if (!supabase || !userId || !selectedClientId) {
          setAssistantClientInsights(null)
          return
        }
        const client = clients.find((c) => c.id === selectedClientId)
        const clientName = String(client?.name || '').trim()

        const [{ data: invData }, { data: quoteData }, { data: contractData }] = await Promise.all([
          supabase
            .from('invoices')
            .select('number,total_ttc,due_date,created_at,status')
            .eq('user_id', userId)
            .eq('client_id', selectedClientId)
            .order('created_at', { ascending: false })
            .limit(10),
          supabase
            .from('quotes')
            .select('number,total_ttc,created_at,status')
            .eq('user_id', userId)
            .eq('client_id', selectedClientId)
            .order('created_at', { ascending: false })
            .limit(10),
          supabase
            .from('contracts')
            .select('number,title,created_at,status')
            .eq('user_id', userId)
            .eq('client_id', selectedClientId)
            .order('created_at', { ascending: false })
            .limit(10),
        ])

        const unpaidInvoices = (invData || [])
          .filter((x: any) => {
            const s = String(x.status || '').toLowerCase()
            return s && !['paid', 'payee', 'payé', 'paye'].includes(s)
          })
          .map((x: any) => ({
            number: String(x.number || ''),
            total_ttc: Number(x.total_ttc || 0),
            due_date: x.due_date || null,
            created_at: x.created_at || null,
          }))

        const pendingQuotes = (quoteData || [])
          .filter((x: any) => {
            const s = String(x.status || '').toLowerCase()
            return s && ['sent', 'envoye', 'envoyé', 'pending', 'attente', 'awaiting'].some((k) => s.includes(k))
          })
          .map((x: any) => ({
            number: String(x.number || ''),
            total_ttc: Number(x.total_ttc || 0),
            created_at: x.created_at || null,
          }))

        const activeContracts = (contractData || [])
          .filter((x: any) => {
            const s = String(x.status || '').toLowerCase()
            return !s || ['draft', 'sent', 'active', 'ongoing'].some((k) => s.includes(k))
          })
          .map((x: any) => ({
            number: String(x.number || ''),
            title: String(x.title || 'Contrat'),
            created_at: x.created_at || null,
          }))

        setAssistantClientInsights({ clientName, unpaidInvoices, pendingQuotes, activeContracts })
      } catch {
        setAssistantClientInsights(null)
      }
    })()
  }, [supabase, userId, selectedClientId, clients])

  // Help chat widget (persistent)
  const [helpOpen, setHelpOpen] = useState<boolean>(false)
  const [helpMessages, setHelpMessages] = useState<Array<{ id: string; role: 'user' | 'assistant'; content: string; created_at: string }>>([])
  const [helpInput, setHelpInput] = useState<string>('')
  const [helpLoading, setHelpLoading] = useState<boolean>(false)
  const [helpError, setHelpError] = useState<string>('')

  // Feedback
  const [feedbackOpen, setFeedbackOpen] = useState<boolean>(false)
  const [feedbackText, setFeedbackText] = useState<string>('')
  const [feedbackSending, setFeedbackSending] = useState<boolean>(false)
  const [feedbackSent, setFeedbackSent] = useState<boolean>(false)

  // Product tour (simple overlay)
  const [tourOpen, setTourOpen] = useState<boolean>(false)
  const [tourStep, setTourStep] = useState<number>(0)
  const [tourSpot, setTourSpot] = useState<{ top: number; left: number; width: number; height: number } | null>(null)

  // Settings UI
  const [settingsTab, setSettingsTab] = useState<'abonnement' | 'profil' | 'gmail' | 'signature' | 'feedback' | 'compte'>('profil')

  const tourSteps = useMemo(
    () =>
      [
        {
          tab: 'dashboard' as Tab,
          target: 'dashboard',
          title: 'Dashboard',
          body: "Vue d'ensemble : CA du mois, activité, raccourcis.",
        },
        {
          tab: 'clients' as Tab,
          target: 'clients',
          title: 'Clients',
          body: 'Ajoute et retrouve tes clients. Tout le reste se base dessus.',
        },
        {
          tab: 'assistant' as Tab,
          target: 'assistant',
          title: 'Assistant IA',
          body: 'Génère des emails pro (réponse, relance, négociation…) à partir du contexte.',
        },
        {
          tab: 'devis' as Tab,
          target: 'devis',
          title: 'Devis',
          body: 'Crée un devis, exporte en PDF, puis envoie-le par email.',
        },
        {
          tab: 'factures' as Tab,
          target: 'factures',
          title: 'Factures',
          body: 'Génère des factures propres et envoie-les facilement.',
        },
        {
          tab: 'contrats' as Tab,
          target: 'contrats',
          title: 'Contrats',
          body: 'Génère un contrat PDF + lance une demande de signature électronique.',
        },
        {
          tab: 'analyseur' as Tab,
          target: 'analyseur',
          title: 'Analyseur de projet',
          body: 'Colle un brief : analyse rapide + recommandation selon ton profil.',
        },
        {
          tab: 'juriste' as Tab,
          target: 'juriste',
          title: 'Question juriste',
          body: 'Pose une question (Pro). Facturation à la question.',
        },
        {
          tab: 'settings' as Tab,
          target: 'settings',
          title: 'Paramètres',
          body: 'Abonnement, connexion Gmail, signature, et feedback.',
        },
        {
          tab: 'dashboard' as Tab,
          target: 'help-fab',
          title: 'Aide (chat)',
          body: "Besoin d'un rappel ? Utilise le chat d'aide à tout moment.",
          openHelp: true,
        },
      ] as Array<{ tab: Tab; target: string; title: string; body: string; openHelp?: boolean }>,
    []
  )

  useEffect(() => {
    if (!tourOpen) {
      setTourSpot(null)
      return
    }

    const s = tourSteps[Math.min(Math.max(tourStep, 0), tourSteps.length - 1)]

    // On mobile: open the sidebar when the step points to a sidebar element
    try {
      const isMobile = window.innerWidth <= 768
      const sidebarTargets = new Set(['dashboard', 'clients', 'devis', 'factures', 'contrats', 'analyseur', 'assistant', 'juriste', 'help', 'settings'])
      if (isMobile) {
        if (sidebarTargets.has(String(s.target))) setMobileNavOpen(true)
      }
    } catch {
      // ignore
    }

    // navigate
    if (tab !== s.tab) {
      setTab(s.tab)
    }

    if (s.openHelp) {
      setHelpOpen(true)
    }

    const updateSpot = () => {
      const el = document.querySelector(`[data-tour="${s.target}"]`) as HTMLElement | null
      if (!el) {
        setTourSpot(null)
        return
      }
      const r = el.getBoundingClientRect()
      setTourSpot({ top: r.top, left: r.left, width: r.width, height: r.height })
    }

    const t = window.setTimeout(updateSpot, 60)
    window.addEventListener('resize', updateSpot)
    window.addEventListener('scroll', updateSpot, true)

    return () => {
      window.clearTimeout(t)
      window.removeEventListener('resize', updateSpot)
      window.removeEventListener('scroll', updateSpot, true)
    }
  }, [tourOpen, tourStep, tab, tourSteps])

  // Question juriste (Pro-only + paiement 5€)
  const [legalQuestion, setLegalQuestion] = useState<string>('')
  const [legalTopic, setLegalTopic] = useState<string>('Contrat')
  const [legalPhone, setLegalPhone] = useState<string>('')
  const [legalBusy, setLegalBusy] = useState<boolean>(false)
  const [legalError, setLegalError] = useState<string>('')
  const [legalItems, setLegalItems] = useState<any[]>([])
  const [legalThreads, setLegalThreads] = useState<Record<string, { open: boolean; loading: boolean; error?: string; messages: any[] }>>({})

  // Analyseur de brief
  const [briefText, setBriefText] = useState<string>('')
  const [briefBudget, setBriefBudget] = useState<string>('')
  const [briefDelay, setBriefDelay] = useState<string>('')
  const [briefOutput, setBriefOutput] = useState<string>('')
  const [briefLoading, setBriefLoading] = useState<boolean>(false)
  const [briefError, setBriefError] = useState<string>('')

  // Dashboard data
  const [dashboardQuotes, setDashboardQuotes] = useState<any[]>([])
  const [dashboardInvoices, setDashboardInvoices] = useState<any[]>([])
  const [dashboardContracts, setDashboardContracts] = useState<any[]>([])
  const [dashboardCaMonth, setDashboardCaMonth] = useState<number>(0)
  const [dashboardActiveClients, setDashboardActiveClients] = useState<number>(0)
  const [dashboardPendingQuotes, setDashboardPendingQuotes] = useState<number>(0)
  const [dashboardPaidInvoices, setDashboardPaidInvoices] = useState<number>(0)

  // Allow sub-components to navigate tabs
  useEffect(() => {
    ;(window as any).__spyke_setTab = (t: Tab) => setTab(t)
    return () => {
      try {
        delete (window as any).__spyke_setTab
      } catch {}
    }
  }, [])

  // Read tab from query string (best-effort)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search || '')
      const t = String(params.get('tab') || '') as Tab
      const allowed: Tab[] = ['dashboard', 'clients', 'assistant', 'devis', 'factures', 'contrats', 'analyseur', 'juriste', 'settings']
      if (allowed.includes(t)) setTab(t)
    } catch {
      // ignore
    }
  }, [])

  // Gmail connection status
  useEffect(() => {
    ;(async () => {
      if (!supabase || !userId) {
        setGmailConnected(false)
        return
      }
      const { data, error } = await supabase
        .from('google_gmail_tokens')
        .select('user_id,gmail_email')
        .eq('user_id', userId)
        .maybeSingle()

      if (error) {
        // Don't block the app if schema isn't ready; just consider Gmail not connected.
        setGmailConnected(false)
        setGmailEmail('')
        return
      }

      const connected = Boolean((data as any)?.user_id)
      setGmailConnected(connected)
      setGmailEmail(connected ? String((data as any)?.gmail_email || '') : '')
    })()
  }, [supabase, userId])

  // Help chat: load history when opened
  useEffect(() => {
    if (!helpOpen) return
    loadHelpHistory()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [helpOpen])

  // Question juriste: load history when tab is opened + auto-refresh
  useEffect(() => {
    if (tab !== 'juriste') return
    refreshLegalQuestions()
    const t = window.setInterval(() => {
      refreshLegalQuestions()
    }, 20000)
    return () => window.clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab])

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

  async function loadHelpHistory() {
    try {
      setHelpError('')
      if (!supabase) return
      const { data: s } = await supabase.auth.getSession()
      const token = s.session?.access_token
      if (!token) return

      const res = await fetch('/api/help-chat', {
        method: 'GET',
        headers: { authorization: `Bearer ${token}` },
      })
      const json = await res.json().catch(() => null)
      if (!res.ok) throw new Error(json?.error || `Erreur historique (${res.status})`)
      setHelpMessages((json?.messages || []) as any[])
    } catch (e: any) {
      setHelpError(e?.message || 'Erreur historique')
    }
  }

  async function sendHelpMessage() {
    try {
      const content = helpInput.trim()
      if (!content) return
      setHelpInput('')
      setHelpError('')
      setHelpLoading(true)

      if (!supabase) throw new Error('Supabase non initialisé')
      const { data: s } = await supabase.auth.getSession()
      const token = s.session?.access_token
      if (!token) throw new Error('Non connecté')

      // optimistic append
      const tmpId = `tmp_${Date.now()}`
      const nowIso = new Date().toISOString()
      setHelpMessages((prev) => [...prev, { id: tmpId, role: 'user', content, created_at: nowIso } as any])

      const res = await fetch('/api/help-chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: content }),
      })
      const json = await res.json().catch(() => null)
      if (!res.ok) throw new Error(json?.error || `Erreur chat (${res.status})`)
      setHelpMessages((json?.messages || []) as any[])
    } catch (e: any) {
      setHelpError(e?.message || 'Erreur chat')
    } finally {
      setHelpLoading(false)
    }
  }

  async function refreshLegalQuestions() {
    try {
      setLegalError('')
      if (!supabase) return
      const { data: s } = await supabase.auth.getSession()
      const token = s.session?.access_token
      if (!token) return

      const res = await fetch('/api/legal-question/list', {
        method: 'GET',
        headers: { authorization: `Bearer ${token}` },
      })
      const json = await res.json().catch(() => null)
      if (!res.ok) throw new Error(json?.error || `Erreur questions (${res.status})`)
      setLegalItems((json?.items || []) as any[])
    } catch (e: any) {
      setLegalError(e?.message || 'Erreur questions')
    }
  }

  async function loadLegalThread(id: string) {
    try {
      if (!id) return
      setLegalThreads((prev) => ({
        ...prev,
        [id]: { ...(prev[id] || { open: true, loading: true, messages: [] }), open: true, loading: true, error: '' },
      }))

      if (!supabase) throw new Error('Supabase non initialisé')
      const { data: s } = await supabase.auth.getSession()
      const token = s.session?.access_token
      if (!token) throw new Error('Non connecté')

      const res = await fetch(`/api/legal-question/thread?id=${encodeURIComponent(id)}`, {
        method: 'GET',
        headers: { authorization: `Bearer ${token}` },
      })
      const json = await res.json().catch(() => null)
      if (!res.ok) throw new Error(json?.error || `Erreur thread (${res.status})`)

      setLegalThreads((prev) => ({
        ...prev,
        [id]: { open: true, loading: false, error: '', messages: (json?.messages || []) as any[] },
      }))
    } catch (e: any) {
      setLegalThreads((prev) => ({
        ...prev,
        [id]: { open: true, loading: false, error: e?.message || 'Erreur', messages: [] },
      }))
    }
  }

  function toggleLegalThread(id: string) {
    setLegalThreads((prev) => {
      const cur = prev[id]
      const open = !cur?.open
      return { ...prev, [id]: { ...(cur || { loading: false, messages: [] }), open } }
    })
  }

  async function analyzeBrief() {
    try {
      const brief = briefText.trim()
      if (!brief) return
      setBriefError('')
      setBriefLoading(true)

      if (!supabase) throw new Error('Supabase non initialisé')

      const profileContext = (() => {
        const fullName = userFullName || 'Freelance'
        const job = settingsJob || userJob || ''
        const exp = settingsExperienceYears
        const skills = settingsSkills
        const parts = [
          `Profil freelance: ${fullName}${job ? ` (${job})` : ''}`,
          exp ? `Expérience: ${exp} années` : '',
          skills ? `Compétences: ${skills}` : '',
        ].filter(Boolean)
        return parts.join('\n')
      })()

      const userPrompt = [
        "Tu es un expert freelance (gestion de mission + cadrage + estimation).",
        "Ta mission: analyser un brief client et donner une recommandation actionnable.",
        "",
        "IMPORTANT: adapte TOUTE l'analyse au profil freelance ci-dessous (expérience, compétences, métier).",
        "- Si le profil est junior: propose un scope plus simple, plus de marge, plus de questions, plus de temps.",
        "- Si le profil est senior: propose un scope plus ambitieux si pertinent, mais reste réaliste (risques/dépendances).",
        "- Si des compétences manquent: recommande de sous-traiter ou de négocier (ou refuser) en l'expliquant.",
        "",
        profileContext ? profileContext : '',
        "",
        `Brief client:\n${brief}`,
        briefBudget.trim() ? `Budget annoncé: ${briefBudget.trim()}` : '',
        briefDelay.trim() ? `Délai demandé: ${briefDelay.trim()}` : '',
        "",
        "Format attendu (en français):",
        "0) Une phrase d'intro: 'En tant que [profil], voici ma recommandation...'",
        "1) Résumé (3 lignes)",
        "2) Faisabilité (OK / Risqué / Non recommandé) + pourquoi (lié à ton profil)",
        "3) Zones floues / questions à poser (liste)",
        "4) Estimation réaliste (ordre de grandeur) et hypothèses (lié à ton profil)",
        "5) Risques + mitigations",
        "6) Recommandation: accepter / négocier / refuser + message suggéré au client (court, prêt à copier)",
      ]
        .filter(Boolean)
        .join('\n')

      const res = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ prompt: userPrompt }),
      })
      const json = await res.json().catch(() => null)
      if (!res.ok) throw new Error(json?.error || `Erreur analyse (${res.status})`)
      setBriefOutput(String(json?.text || '').trim())
    } catch (e: any) {
      setBriefError(e?.message || 'Erreur analyse')
    } finally {
      setBriefLoading(false)
    }
  }

  function formatLegalStatus(raw: any): { label: string; key: 'pending' | 'replied' | 'closed' } {
    const s = String(raw || '').toLowerCase().trim()
    if (!s || s === 'draft' || s === 'pending' || s === 'open') return { label: 'En attente de réponse', key: 'pending' }
    if (['replied', 'answered', 'repondu', 'répondu'].includes(s)) return { label: 'Répondu', key: 'replied' }
    if (['closed', 'ferme', 'fermé', 'done', 'resolved'].includes(s)) return { label: 'Fermé', key: 'closed' }
    // Fallback: prefer French labels
    return { label: 'En attente de réponse', key: 'pending' }
  }

  function formatFrDateSmart(iso: any): string {
    const d = new Date(String(iso || ''))
    if (Number.isNaN(d.getTime())) return ''
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    if (diffDays === 0) return "Aujourd'hui"
    if (diffDays === 1) return 'Il y a 1 jour'
    if (diffDays > 1 && diffDays <= 7) return `Il y a ${diffDays} jours`
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  function extractTopicFromQuestion(text: string): { topic?: string; body: string } {
    const t = String(text || '').trim()
    const m = t.match(/^Thème:\s*(.+)\n\n([\s\S]*)$/i)
    if (!m) return { body: t }
    return { topic: String(m[1] || '').trim(), body: String(m[2] || '').trim() }
  }

  async function submitLegalQuestion() {
    try {
      const q = legalQuestion.trim()
      if (!q) return
      setLegalError('')
      setLegalBusy(true)

      if (!supabase) throw new Error('Supabase non initialisé')
      const { data: s } = await supabase.auth.getSession()
      const token = s.session?.access_token
      if (!token) throw new Error('Non connecté')

      const payloadQuestion = `${legalTopic ? `Thème: ${legalTopic}\n\n` : ''}${q}`

      const res = await fetch('/api/legal-question/checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify({ question: payloadQuestion, phone: legalPhone.trim() }),
      })
      const json = await res.json().catch(() => null)
      if (!res.ok) throw new Error(json?.error || `Erreur paiement (${res.status})`)

      const url = String(json?.url || '')
      if (!url) throw new Error('URL Stripe manquante')

      // optimistic: refresh list (draft)
      refreshLegalQuestions()

      window.location.href = url
    } catch (e: any) {
      setLegalError(e?.message || 'Erreur paiement')
    } finally {
      setLegalBusy(false)
    }
  }

  // Load profile + clients
  useEffect(() => {
    ;(async () => {
      if (!supabase || !userId) return
      try {
        setLoading(true)

        // Some deployments may not have experience_years/skills columns yet.
        // Try full select, then fallback without those columns.
        let profile: any = null
        {
          const { data, error } = await supabase
            .from('profiles')
            .select('first_name,last_name,job,experience_years,skills,email_tone,plan,company_name,address,postal_code,city,country,siret,vat_number,iban,bic,signature_path,onboarding_completed,stripe_subscription_status,stripe_current_period_end,stripe_cancel_at_period_end,stripe_cancel_at,welcome_sent_at,feedback_survey_completed_at')
            .eq('id', userId)
            .maybeSingle()
          if (error) {
            const msg = String((error as any)?.message || '')
            if (msg.includes('experience_years') || msg.includes('skills')) {
              const { data: data2, error: error2 } = await supabase
                .from('profiles')
                .select('first_name,last_name,job,email_tone,plan,company_name,address,postal_code,city,country,siret,vat_number,iban,bic,signature_path,onboarding_completed,stripe_subscription_status,stripe_current_period_end,stripe_cancel_at_period_end,stripe_cancel_at,welcome_sent_at,feedback_survey_completed_at')
                .eq('id', userId)
                .maybeSingle()
              if (error2) throw error2
              profile = data2
            } else {
              throw error
            }
          } else {
            profile = data
          }
        }

        const firstName = String((profile as any)?.first_name || '')
        const lastName = String((profile as any)?.last_name || '')
        const full = [firstName, lastName].filter(Boolean).join(' ').trim()
        setUserFullName(full || 'Utilisateur')

        const job = String((profile as any)?.job || '')
        setUserJob(job)

        const emailTone = String((profile as any)?.email_tone || '')
        setUserDefaultTone(emailTone)

        // Init settings form
        setSettingsFirstName(firstName)
        setSettingsLastName(lastName)
        setSettingsJob(job)
        setSettingsEmailTone(emailTone)
        setSettingsCompanyName(String((profile as any)?.company_name || ''))
        setSettingsExperienceYears(String((profile as any)?.experience_years ?? ''))
        setSettingsSkills(Array.isArray((profile as any)?.skills) ? ((profile as any).skills as any[]).join(', ') : String((profile as any)?.skills || ''))
        setSettingsAddress(String((profile as any)?.address || ''))
        setSettingsPostalCode(String((profile as any)?.postal_code || ''))
        setSettingsCity(String((profile as any)?.city || ''))
        setSettingsCountry(String((profile as any)?.country || ''))
        setSettingsSiret(String((profile as any)?.siret || ''))
        setSettingsVatNumber(String((profile as any)?.vat_number || ''))
        setSettingsIban(String((profile as any)?.iban || ''))
        setSettingsBic(String((profile as any)?.bic || ''))

        // Signature
        const sp = String((profile as any)?.signature_path || '')
        setSignaturePath(sp)
        setSignatureEditOpen(!sp)
        try {
          if (sp) {
            const pub = supabase.storage.from('signatures').getPublicUrl(sp)
            const base = String(pub?.data?.publicUrl || '')
            setSignaturePreviewUrl(base ? `${base}${base.includes('?') ? '&' : '?'}v=${Date.now()}` : '')
            setSignaturePreviewBuster(Date.now())
          } else {
            setSignaturePreviewUrl('')
          }
        } catch {
          setSignaturePreviewUrl('')
        }

        const plan = String((profile as any)?.plan || 'free') === 'pro' ? 'pro' : 'free'
        setPlanCode(plan)
        setUserPlan(plan === 'pro' ? 'Compte Pro' : 'Compte gratuit')

        setStripeSubStatus(String((profile as any)?.stripe_subscription_status || ''))
        setStripePeriodEnd(String((profile as any)?.stripe_current_period_end || ''))
        setStripeCancelAtPeriodEnd(Boolean((profile as any)?.stripe_cancel_at_period_end))
        setStripeCancelAt(String((profile as any)?.stripe_cancel_at || ''))

        // Welcome email (best-effort): send once per user
        try {
          const welcomeSent = Boolean((profile as any)?.welcome_sent_at)
          if (!welcomeSent) {
            const { data: s } = await supabase.auth.getSession()
            const token = s.session?.access_token
            if (token) {
              fetch('/api/welcome', { method: 'POST', headers: { authorization: `Bearer ${token}` } }).catch(() => null)
            }
          }
        } catch {
          // ignore
        }

        // Feedback survey flag
        setFeedbackSurveyCompletedAt(String((profile as any)?.feedback_survey_completed_at || ''))

        // Auto-popup feedback survey after 10 generations (best-effort)
        try {
          const completed = Boolean((profile as any)?.feedback_survey_completed_at)
          if (!completed && supabase && userId) {
            const startSurvey = async () => {
              const start = new Date()
              start.setDate(1)
              start.setHours(0, 0, 0, 0)
              const startStr = start.toISOString()

              const queries = [
                supabase.from('assistant_generations').select('id', { count: 'exact', head: true }).eq('user_id', userId).gte('created_at', startStr),
                supabase.from('pdf_generations').select('id', { count: 'exact', head: true }).eq('user_id', userId).gte('created_at', startStr),
                supabase.from('quotes').select('id', { count: 'exact', head: true }).eq('user_id', userId).gte('created_at', startStr),
                supabase.from('invoices').select('id', { count: 'exact', head: true }).eq('user_id', userId).gte('created_at', startStr),
                supabase.from('contracts').select('id', { count: 'exact', head: true }).eq('user_id', userId).gte('created_at', startStr),
                supabase.from('legal_questions').select('id', { count: 'exact', head: true }).eq('user_id', userId).gte('created_at', startStr),
              ]

              const res = await Promise.all(queries)
              const total = res.reduce((acc, r: any) => acc + Number(r?.count || 0), 0)

              if (total >= 10) {
                setFeedbackSurveyOpen(true)
              }
            }

            // don't block UI
            setTimeout(() => {
              startSurvey().catch(() => null)
            }, 400)
          }
        } catch {
          // ignore
        }

        // Product tour: show once after onboarding is completed
        try {
          const done = Boolean((profile as any)?.onboarding_completed)
          const already = localStorage.getItem('spyke_tour_v1_done')

          const url = new URL(window.location.href)
          const force = url.searchParams.get('tour') === '1'

          if (done && (force || !already)) {
            // mark as done to avoid re-trigger loops
            localStorage.setItem('spyke_tour_v1_done', '1')

            // clean URL (best-effort)
            try {
              url.searchParams.delete('tour')
              window.history.replaceState({}, '', url.toString())
            } catch {}

            setTourOpen(true)
            setTourStep(0)
          }
        } catch {
          // ignore
        }

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

  function signatureClear() {
    setSignatureError('')
    const canvas = signatureCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    signatureHasInkRef.current = false
    signatureLastPointRef.current = null
  }

  function signatureEnsureCanvasSize() {
    const canvas = signatureCanvasRef.current
    if (!canvas) return

    const dpr = Math.max(1, window.devicePixelRatio || 1)
    const rect = canvas.getBoundingClientRect()
    const w = Math.max(1, Math.round(rect.width * dpr))
    const h = Math.max(1, Math.round(rect.height * dpr))

    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.setTransform(1, 0, 0, 1, 0, 0)
        ctx.scale(dpr, dpr)
        // background white
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, rect.width, rect.height)
        // stroke style
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.strokeStyle = '#0a0a0a'
        ctx.lineWidth = 2.2
      }
    }
  }

  function signaturePointFromEvent(e: any) {
    const canvas = signatureCanvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    const clientX = e?.clientX ?? (e?.touches?.[0]?.clientX ?? 0)
    const clientY = e?.clientY ?? (e?.touches?.[0]?.clientY ?? 0)
    return { x: clientX - rect.left, y: clientY - rect.top }
  }

  function signatureStart(e: any) {
    setSignatureError('')
    signatureEnsureCanvasSize()
    signatureDrawingRef.current = true
    signatureLastPointRef.current = signaturePointFromEvent(e)
  }

  function signatureMove(e: any) {
    if (!signatureDrawingRef.current) return
    const canvas = signatureCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const p = signaturePointFromEvent(e)
    const last = signatureLastPointRef.current
    if (!p || !last) return

    ctx.beginPath()
    ctx.moveTo(last.x, last.y)
    ctx.lineTo(p.x, p.y)
    ctx.stroke()

    signatureLastPointRef.current = p
    signatureHasInkRef.current = true
  }

  function signatureEnd() {
    signatureDrawingRef.current = false
    signatureLastPointRef.current = null
  }

  async function saveSignatureNow() {
    try {
      setSignatureError('')
      if (!signatureHasInkRef.current) {
        setSignatureError("Signe dans la zone avant d'enregistrer.")
        return
      }
      if (!supabase) throw new Error('Supabase non initialisé')
      const { data: s } = await supabase.auth.getSession()
      const token = s.session?.access_token
      if (!token) throw new Error('Non connecté')

      const canvas = signatureCanvasRef.current
      if (!canvas) throw new Error('Canvas signature introuvable')

      setSignatureSaving(true)

      // Export PNG + auto-crop (remove white margins)
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Contexte canvas indisponible')

      const w = canvas.width
      const h = canvas.height
      const img = ctx.getImageData(0, 0, w, h)
      const data = img.data

      // Detect bounds of non-white pixels
      let minX = w
      let minY = h
      let maxX = 0
      let maxY = 0
      let found = false

      // threshold: consider pixel "ink" if not near white
      const thr = 245

      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const i = (y * w + x) * 4
          const r = data[i]
          const g = data[i + 1]
          const b = data[i + 2]
          const a = data[i + 3]
          if (a < 10) continue
          if (r > thr && g > thr && b > thr) continue
          found = true
          if (x < minX) minX = x
          if (y < minY) minY = y
          if (x > maxX) maxX = x
          if (y > maxY) maxY = y
        }
      }

      if (!found) {
        setSignatureError('Signature vide. Réessaie.')
        return
      }

      // Add margin and clamp
      const margin = Math.round(Math.min(w, h) * 0.04) // ~4%
      minX = Math.max(0, minX - margin)
      minY = Math.max(0, minY - margin)
      maxX = Math.min(w - 1, maxX + margin)
      maxY = Math.min(h - 1, maxY + margin)

      const cropW = Math.max(1, maxX - minX + 1)
      const cropH = Math.max(1, maxY - minY + 1)

      // Create cropped canvas (limit final size for consistent rendering)
      const outMaxW = 900
      const scale = cropW > outMaxW ? outMaxW / cropW : 1
      const outW = Math.max(1, Math.round(cropW * scale))
      const outH = Math.max(1, Math.round(cropH * scale))

      const out = document.createElement('canvas')
      out.width = outW
      out.height = outH
      const octx = out.getContext('2d')
      if (!octx) throw new Error('Contexte canvas (crop) indisponible')
      octx.fillStyle = '#ffffff'
      octx.fillRect(0, 0, outW, outH)
      octx.drawImage(canvas, minX, minY, cropW, cropH, 0, 0, outW, outH)

      const blob: Blob = await new Promise((resolve, reject) => {
        out.toBlob(
          (b) => {
            if (!b) reject(new Error('Export image échoué'))
            else resolve(b)
          },
          'image/png',
          1
        )
      })

      const fd = new FormData()
      fd.set('file', new File([blob], 'signature.png', { type: 'image/png' }))

      const res = await fetch('/api/upload-signature', {
        method: 'POST',
        headers: { authorization: `Bearer ${token}` },
        body: fd,
      })
      const json = await res.json().catch(() => null)
      if (!res.ok) throw new Error(json?.error || `Upload signature échoué (${res.status})`)

      const path = String(json?.path || '')
      setSignaturePath(path)
      try {
        if (path) {
          const pub = supabase.storage.from('signatures').getPublicUrl(path)
          const base = String(pub?.data?.publicUrl || '')
          setSignaturePreviewUrl(base ? `${base}${base.includes('?') ? '&' : '?'}v=${Date.now()}` : '')
          setSignaturePreviewBuster(Date.now())
        }
      } catch {}

      // reset pad after save + close editor
      signatureClear()
      setSignatureEditOpen(false)
    } catch (e: any) {
      setSignatureError(e?.message || 'Erreur signature')
    } finally {
      setSignatureSaving(false)
    }
  }

  // init signature canvas
  useEffect(() => {
    try {
      signatureEnsureCanvasSize()
      const onResize = () => signatureEnsureCanvasSize()
      window.addEventListener('resize', onResize)
      return () => window.removeEventListener('resize', onResize)
    } catch {
      return
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab])

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
    const ok = confirm(`Supprimer le client "${c?.name || ''}" ?`)
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

      const [{ data: q }, { data: inv }, { data: ctr }, { data: invMonth }, { count: clientsCount }, { count: pendingQuotesCount }, { count: paidInvoicesCount }] = await Promise.all([
        supabase.from('quotes').select('id,number,title,status,total_ttc,created_at,date_issue,validity_until').order('created_at', { ascending: false }).limit(5),
        supabase
          .from('invoices')
          .select('id,number,status,paid_at,total_ttc,created_at,due_date,client_id')
          .order('created_at', { ascending: false })
          .limit(5),
        supabase.from('contracts').select('id,title,status,amount_ht,created_at,client_id').order('created_at', { ascending: false }).limit(5),
        supabase
          .from('invoices')
          .select('total_ttc,date_issue')
          .gte('date_issue', startStr)
          .lt('date_issue', endStr),
        supabase.from('clients').select('id', { count: 'exact', head: true }),
        supabase
          .from('quotes')
          .select('id', { count: 'exact', head: true })
          .not('status', 'in', '("accepted","rejected","cancelled")'),
        supabase
          .from('invoices')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'paid'),
      ])

      setDashboardQuotes(q || [])
      setDashboardInvoices(inv || [])
      setDashboardContracts(ctr || [])
      setDashboardActiveClients(Number(clientsCount || 0))

      let ca = 0
      for (const r of (invMonth || []) as any[]) ca += Number(r.total_ttc || 0)
      setDashboardCaMonth(ca)

      setDashboardPendingQuotes(Number(pendingQuotesCount || 0))
      setDashboardPaidInvoices(Number(paidInvoicesCount || 0))
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
        if (!map[id]) map[id] = { quotes: 0, invoices: 0, contracts: 0, totalInvoiced: 0, lastStatus: '-', lastAt: 0 }
        map[id].quotes += 1
      }

      for (const c of (cData || []) as any[]) {
        const id = String(c.client_id)
        if (!map[id]) map[id] = { quotes: 0, invoices: 0, contracts: 0, totalInvoiced: 0, lastStatus: '-', lastAt: 0 }
        map[id].contracts += 1
      }

      for (const inv of (iData || []) as any[]) {
        const id = String(inv.client_id)
        if (!map[id]) map[id] = { quotes: 0, invoices: 0, contracts: 0, totalInvoiced: 0, lastStatus: '-', lastAt: 0 }
        map[id].invoices += 1
        map[id].totalInvoiced += Number(inv.total_ttc || 0)
        const t = inv.created_at ? new Date(inv.created_at).getTime() : 0
        if (t >= map[id].lastAt) {
          map[id].lastAt = t
          map[id].lastStatus = String(inv.status || '-')
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

  async function sendAssistantEmailNow() {
    try {
      if (!assistantOutput) {
        alert('Générez un email avant de l\'envoyer')
        return
      }
      if (!assistantSubject.trim()) {
        alert("Objet obligatoire")
        return
      }
      if (!supabase) {
        alert('Supabase non initialisé')
        return
      }

      const client = clients.find((c) => c.id === selectedClientId)
      const to = String(assistantTo || client?.email || '').trim()
      if (!to) {
        alert('Email destinataire manquant')
        return
      }

      const subject = assistantSubject.trim()

      setAssistantSending(true)

      const { data: s } = await supabase.auth.getSession()
      const token = s.session?.access_token
      if (!token) throw new Error('Non connecté')

      const res = await fetch('/api/gmail/send', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          to,
          subject,
          text: assistantOutput,
        }),
      })
      const json = await res.json().catch(() => null)
      if (!res.ok) throw new Error(json?.error || `Erreur envoi (${res.status})`)

      alert('Email envoyé ✅')

      // Close preview modal if open
      try {
        setAssistantSendPreviewOpen(false)
      } catch {}
    } catch (e: any) {
      alert(e?.message || 'Erreur envoi')
    } finally {
      setAssistantSending(false)
    }
  }

  async function generateAssistantEmail() {
    try {
      // Free quota: 10 emails / month
      if (planCode !== 'pro') {
        if (!supabase || !userId) {
          alert('Session manquante')
          return
        }

        const start = new Date()
        start.setDate(1)
        start.setHours(0, 0, 0, 0)
        const startStr = start.toISOString()

        const { count, error } = await supabase
          .from('assistant_generations')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .gte('created_at', startStr)

        if (error) throw error
        if (Number(count || 0) >= 10) {
          alert('Limite du plan Free atteinte : 10 emails IA / mois. Passe Pro pour illimité.')
          return
        }
      }

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
- Ne signe jamais "Spyke" ou "Spyke assistance IA". La signature doit être celle du freelance.

LONGUEUR : Adapte la longueur au contexte.
- Relance / message simple → court (4-6 lignes)
- Réponse détaillée / négociation / explication → plus long si nécessaire

CONTEXTE UTILISATEUR :
- Prénom : ${prenom}
- Métier : ${metier}
- Ton préféré par défaut : ${tonPrefere}`

      const autoContext = (() => {
        if (assistantContext && assistantContext.trim()) return assistantContext.trim()
        if (!assistantClientInsights) return ''

        const ins = assistantClientInsights
        const inv = ins.unpaidInvoices?.[0]
        const quote = ins.pendingQuotes?.[0]
        const c = ins.activeContracts?.[0]

        if (template === 'Relance' && inv) {
          return `Je souhaite relancer ${ins.clientName || 'le client'} pour une facture impayée (n° ${inv.number || '-'}, montant ${formatMoney(Number(inv.total_ttc || 0))}${inv.due_date ? `, échéance ${formatDateFr(String(inv.due_date).slice(0, 10))}` : ''}).`
        }
        if (template === 'Facture' && inv) {
          return `Je veux envoyer une relance de paiement concernant la facture n° ${inv.number || '-'} (${formatMoney(Number(inv.total_ttc || 0))}).`
        }
        if (template === 'Relance devis' && quote) {
          return `Je souhaite relancer ${ins.clientName || 'le client'} suite à l'envoi du devis n° ${quote.number || '-'} (${formatMoney(Number(quote.total_ttc || 0))}).`
        }
        if (template === 'Réponse' && c) {
          return `Répondre au client au sujet du contrat ${c.number || ''} (${c.title || 'Contrat'}).`
        }
        return ''
      })()

      const prompt = [
        `Type d'email: ${template}`,
        `Ton: ${toneLabel}`,
        client ? `Client: ${client.name}${client.email ? ` (${client.email})` : ''}` : '',
        `Contexte: ${autoContext || '(vide)'}`,
        '',
        "Rédige l'email final.",
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

      const out = String(json?.text || '').trim()
      setAssistantOutput(out)

      // Save in local history (best-effort)
      try {
        const id = `asst_${Date.now()}_${Math.random().toString(16).slice(2)}`
        const clientId = String(selectedClientId || '')
        const to = String(assistantTo || client?.email || '').trim()
        const subject = assistantSubjectDirty ? assistantSubject.trim() : ''
        setAssistantHistory((prev) => [
          { id, createdAt: new Date().toISOString(), template, tone, clientId, to, subject, text: out },
          ...(prev || []),
        ].slice(0, 30))
      } catch {
        // ignore
      }

      // Default subject (editable). Only set if user hasn't edited it.
      if (!assistantSubjectDirty) {
        const clientName = client?.name ? ` - ${client.name}` : ''
        setAssistantSubject(`${template}${clientName}`)
      }

      // If user hasn't edited subject yet, update latest history subject in-place
      // (so history shows something usable)
      try {
        if (!assistantSubjectDirty) {
          const clientName = client?.name ? ` - ${client.name}` : ''
          const subj = `${template}${clientName}`
          setAssistantHistory((prev) => {
            const first = prev?.[0]
            if (!first) return prev
            if (first.subject) return prev
            const updated = [{ ...first, subject: subj }, ...(prev.slice(1) || [])]
            return updated
          })
        }
      } catch {
        // ignore
      }

      // Track usage (best-effort)
      try {
        if (supabase && userId && out) {
          await supabase.from('assistant_generations').insert({ user_id: userId, kind: template })
        }
      } catch {
        // ignore
      }
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
          transition: transform 0.25s ease;
          z-index: 60;
        }

        .mobile-topbar {
          display: none;
          align-items: center;
          gap: 12px;
          margin: -12px -12px 18px;
          padding: 12px;
          background: rgba(250, 250, 250, 0.9);
          border: 1px solid var(--gray-200);
          border-radius: 16px;
          position: sticky;
          top: 12px;
          backdrop-filter: blur(8px);
          z-index: 40;
        }

        .mobile-menu-btn {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          border: 2px solid var(--gray-200);
          background: var(--white);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .mobile-menu-btn:hover {
          background: var(--gray-50);
          border-color: var(--gray-300);
        }

        .mobile-menu-btn svg {
          width: 20px;
          height: 20px;
          stroke: var(--gray-800);
          fill: none;
          stroke-width: 2;
        }

        .mobile-topbar-title {
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          letter-spacing: -0.2px;
          color: var(--black);
          font-size: 16px;
        }

        .sidebar-overlay {
          display: none;
          position: fixed;
          left: 0;
          top: 0;
          right: 0;
          bottom: 0;
          background: rgba(10, 10, 10, 0.45);
          z-index: 55;
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
          min-height: 0; /* allow scrolling inside fixed-height sidebar */
          display: flex;
          flex-direction: column;
          gap: 4px;
          overflow-y: auto;
          padding-bottom: 10px;
        }

        .sidebar-nav::-webkit-scrollbar {
          width: 8px;
        }
        .sidebar-nav::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.12);
          border-radius: 999px;
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
          padding-bottom: max(16px, env(safe-area-inset-bottom));
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

        .btn-danger {
          background: #ef4444;
          color: white;
        }

        .btn-danger:hover {
          background: #dc2626;
          transform: translateY(-2px);
        }

        .btn svg {
          width: 18px;
          height: 18px;
        }

        /* ===== MAIL COMPOSE MODAL (responsive) ===== */
        .mail-compose-grid {
          display: grid;
          grid-template-columns: 420px 1fr;
          gap: 12px;
          height: 100%;
          padding: 12px;
        }

        .mail-compose-form {
          display: flex;
          flex-direction: column;
          gap: 10px;
          min-width: 0;
        }

        .mail-compose-preview {
          background: #fff;
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid rgba(0, 0, 0, 0.08);
          min-width: 0;
        }

        .mail-compose-preview-title {
          padding: 10px;
          font-size: 12px;
          border-bottom: 1px solid rgba(0, 0, 0, 0.08);
          background: #f8fafc;
        }

        .mail-compose-preview-iframe {
          width: 100%;
          height: calc(100% - 42px);
          border: 0;
        }

        @media (max-width: 768px) {
          .mail-compose-grid {
            grid-template-columns: 1fr;
            padding: 10px;
          }

          .mail-compose-preview {
            height: 38vh;
          }

          .mail-compose-preview-iframe {
            height: calc(38vh - 42px);
          }
        }

        /* ===== HELP CHAT WIDGET ===== */
        .help-fab {
          position: fixed;
          right: 18px;
          bottom: 18px;
          z-index: 200;
          height: 46px;
          padding: 0 14px;
          border-radius: 999px;
          border: 2px solid rgba(0, 0, 0, 0.12);
          background: var(--yellow);
          color: var(--black);
          font-weight: 900;
          font-size: 14px;
          box-shadow: 0 12px 26px rgba(0, 0, 0, 0.18);
          display: inline-flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
        }

        .help-fab-label {
          font-weight: 900;
          letter-spacing: 0.2px;
        }

        .help-drawer {
          position: fixed;
          right: 18px;
          bottom: 74px;
          z-index: 201;
          width: 360px;
          max-width: calc(100vw - 36px);
          height: 520px;
          max-height: calc(100vh - 120px);
          background: #fff;
          border: 1px solid rgba(0, 0, 0, 0.12);
          border-radius: 16px;
          box-shadow: 0 24px 60px rgba(0, 0, 0, 0.25);
          overflow: hidden;
          display: none;
        }

        .help-drawer.open {
          display: flex;
          flex-direction: column;
        }

        .help-drawer-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 12px;
          border-bottom: 1px solid rgba(0, 0, 0, 0.08);
          background: #fff;
          gap: 10px;
        }

        .help-drawer-title {
          font-weight: 800;
        }

        .help-drawer-subtitle {
          font-size: 12px;
          color: rgba(0, 0, 0, 0.55);
          margin-top: 2px;
        }

        .help-drawer-body {
          flex: 1;
          padding: 12px;
          overflow: auto;
          background: #fafafa;
        }

        .help-drawer-footer {
          display: flex;
          gap: 10px;
          padding: 12px;
          border-top: 1px solid rgba(0, 0, 0, 0.08);
          background: #fff;
        }

        .help-msg {
          display: flex;
          margin-bottom: 10px;
        }

        .help-msg.user {
          justify-content: flex-end;
        }

        .help-bubble {
          max-width: 92%;
          padding: 10px 12px;
          border-radius: 14px;
          border: 1px solid rgba(0, 0, 0, 0.08);
          background: #fff;
          white-space: pre-wrap;
          font-size: 14px;
          line-height: 1.35;
        }

        .help-msg.user .help-bubble {
          background: rgba(250, 204, 21, 0.25);
          border-color: rgba(250, 204, 21, 0.4);
        }

        .help-empty {
          color: rgba(0, 0, 0, 0.55);
          font-size: 13px;
          padding: 8px;
        }

        .help-error {
          color: #b91c1c;
          background: #fee2e2;
          border: 1px solid #fecaca;
          padding: 10px 12px;
          border-radius: 12px;
          font-size: 13px;
          margin-bottom: 12px;
        }

        @media (max-width: 768px) {
          .help-drawer {
            left: 0;
            right: 0;
            bottom: 0;
            width: 100vw;
            height: 100vh;
            max-height: 100vh;
            border-radius: 0;
          }
          .help-fab {
            right: 14px;
            bottom: 14px;
          }
          .help-fab-label {
            display: none;
          }
        }

        /* ===== IMPORT TOOLBAR (PDF / PHOTO) ===== */
        .import-toolbar {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-bottom: 12px;
          align-items: center;
        }

        .import-btn {
          padding: 10px 16px;
          border-radius: 12px;
          border: 2px solid rgba(0, 0, 0, 0.12);
          background: var(--yellow);
          color: var(--black);
          font-weight: 700;
          box-shadow: 0 2px 0 rgba(0, 0, 0, 0.06);
        }

        .import-btn:hover {
          background: var(--yellow-dark);
          transform: translateY(-1px);
          border-color: rgba(0, 0, 0, 0.18);
        }

        .import-btn-disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        .tooltip {
          position: relative;
          width: 24px;
          height: 24px;
          border-radius: 999px;
          border: 2px solid var(--gray-300);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-weight: 900;
          font-size: 14px;
          line-height: 1;
          color: var(--gray-800);
          background: var(--gray-100);
          cursor: help;
          user-select: none;

          /* Fix baseline/line-box oddities that can visually shift the badge */
          vertical-align: middle;
          flex: 0 0 auto;
          margin: 0;
          padding: 0;
        }

        .tooltip::after {
          content: attr(data-tip);
          position: absolute;
          left: 50%;
          top: calc(100% + 10px);
          transform: translateX(-50%);
          min-width: 240px;
          max-width: 340px;
          white-space: normal;
          z-index: 50;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.15s ease, transform 0.15s ease;
          padding: 10px 12px;
          border-radius: 12px;
          background: rgba(10, 10, 10, 0.92);
          color: #fff;
          font-weight: 600;
          font-size: 12.5px;
          line-height: 1.35;
          box-shadow: 0 18px 40px rgba(0, 0, 0, 0.18);
        }

        .tooltip::before {
          content: '';
          position: absolute;
          left: 50%;
          top: calc(100% + 4px);
          transform: translateX(-50%);
          width: 10px;
          height: 10px;
          background: rgba(10, 10, 10, 0.92);
          rotate: 45deg;
          opacity: 0;
          transition: opacity 0.15s ease;
          pointer-events: none;
          z-index: 49;
        }

        .tooltip:hover::after {
          opacity: 1;
          transform: translateX(-50%) translateY(0);
        }

        .tooltip:hover::before {
          opacity: 1;
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

        /* Avoid empty space when the grid has an odd number of cards */
        .cards-grid > .card:last-child:nth-child(odd) {
          grid-column: 1 / -1;
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
          display: block;
        }

        .assistant-hero-icon {
          width: 44px;
          height: 44px;
          border-radius: 14px;
          background: linear-gradient(135deg, var(--yellow-light), #fff);
          border: 1px solid rgba(250, 204, 21, 0.45);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .assistant-hero-bolt {
          font-size: 20px;
          display: inline-block;
          animation: assistantPulse 1.6s ease-in-out infinite;
        }

        @keyframes assistantPulse {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.12);
            opacity: 0.85;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        .template-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .template-chip {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 12px;
          border-radius: 999px;
          border: 2px solid var(--gray-200);
          background: var(--white);
          font-size: 14px;
          font-weight: 600;
          color: var(--gray-700);
          cursor: pointer;
          transition: all 0.15s ease;
          user-select: none;
        }

        .template-chip:hover {
          border-color: var(--gray-300);
          background: var(--gray-50);
        }

        .template-chip.active {
          background: var(--yellow-light);
          border-color: var(--yellow);
          color: var(--black);
        }

        .template-chip-icon {
          font-size: 16px;
        }

        .assistant-examples {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 8px;
        }

        .assistant-example-chip {
          border: 1px solid var(--gray-200);
          background: var(--gray-50);
          color: var(--gray-700);
          font-size: 13px;
          padding: 8px 10px;
          border-radius: 999px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .assistant-example-chip:hover {
          background: var(--white);
          border-color: var(--gray-300);
        }

        .assistant-empty-output {
          border: 2px dashed var(--gray-200);
          border-radius: 14px;
          padding: 22px;
          text-align: center;
          background: linear-gradient(180deg, #ffffff, #fafafa);
        }

        .assistant-empty-illu {
          font-size: 28px;
          margin-bottom: 10px;
        }

        .assistant-empty-title {
          font-size: 15px;
          font-weight: 800;
          color: var(--gray-800);
          margin-bottom: 4px;
        }

        .assistant-empty-sub {
          font-size: 13px;
          color: var(--gray-500);
          margin-bottom: 12px;
        }

        .assistant-history {
          border: 1px solid var(--gray-200);
          background: var(--white);
          border-radius: 16px;
          padding: 16px;
          margin-bottom: 16px;
        }

        .assistant-history-title {
          font-size: 13px;
          font-weight: 800;
          color: var(--gray-700);
          margin-bottom: 10px;
        }

        .assistant-history-list {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
        }

        .assistant-history-item {
          text-align: left;
          border: 1px solid var(--gray-200);
          background: var(--gray-50);
          padding: 12px;
          border-radius: 12px;
          cursor: pointer;
        }

        .assistant-history-item:hover {
          background: var(--white);
        }

        .assistant-history-item-top {
          display: flex;
          justify-content: space-between;
          gap: 8px;
          margin-bottom: 6px;
        }

        .assistant-history-item-kind {
          font-size: 12px;
          font-weight: 800;
          color: var(--gray-700);
        }

        .assistant-history-item-date {
          font-size: 11px;
          color: var(--gray-400);
        }

        .assistant-history-item-subject {
          font-size: 13px;
          color: var(--gray-700);
          font-weight: 600;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        @media (max-width: 900px) {
          .assistant-history-list {
            grid-template-columns: 1fr;
          }
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

        .output-box .analysis-title {
          font-weight: 900;
          color: var(--gray-900);
          margin: 14px 0 8px;
        }

        .output-box .analysis-title:first-child {
          margin-top: 0;
        }

        .output-box .analysis-output p {
          margin: 0 0 10px;
          color: var(--gray-800);
          line-height: 1.7;
        }

        .output-box .analysis-output ul,
        .output-box .analysis-output ol {
          margin: 8px 0 12px 18px;
          padding-left: 18px;
          color: var(--gray-800);
        }

        .output-box .analysis-output li {
          margin: 6px 0;
          line-height: 1.6;
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

        /* ===== ANALYSEUR TAB ===== */
        .analyseur-container {
          display: grid;
          grid-template-columns: 1fr;
          gap: 24px;
        }

        .analyseur-container .devis-preview {
          max-width: 100%;
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
          /* Mobile: each line becomes a vertical stack (much easier to edit on phone) */
          .factures-v1 .invoice-line {
            display: flex;
            flex-direction: column;
            gap: 10px;
            padding: 12px 4px;
          }
          .factures-v1 .invoice-remove {
            align-self: flex-end;
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

        /* ===== MOBILE LISTS (Cards) ===== */
        .only-mobile { display: none; }
        .only-desktop { display: block; }

        .mobile-cards {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .mobile-card {
          background: var(--white);
          border: 1px solid var(--gray-200);
          border-radius: 16px;
          padding: 14px;
        }

        .mobile-card-top {
          display: flex;
          justify-content: space-between;
          gap: 12px;
        }

        .mobile-card-title {
          font-weight: 900;
          font-size: 14px;
          color: var(--black);
        }

        .mobile-card-sub {
          color: var(--gray-500);
          font-size: 13px;
          margin-top: 2px;
        }

        .mobile-card-meta {
          margin-top: 8px;
          font-size: 12px;
          color: var(--gray-500);
        }

        .mobile-card-amount {
          font-weight: 900;
          color: var(--black);
          font-size: 14px;
        }

        .mobile-badges {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          justify-content: flex-end;
          margin-top: 6px;
        }

        .badge {
          font-size: 12px;
          font-weight: 800;
          padding: 3px 8px;
          border-radius: 999px;
          border: 1px solid var(--gray-200);
          background: var(--gray-50);
          color: var(--gray-600);
        }

        .badge-red {
          color: var(--red);
          background: rgba(239, 68, 68, 0.10);
          border-color: rgba(239, 68, 68, 0.18);
        }

        .badge-yellow {
          color: #b45309;
          background: rgba(250, 204, 21, 0.18);
          border-color: rgba(250, 204, 21, 0.28);
        }

        .badge-green {
          color: #15803d;
          background: rgba(34, 197, 94, 0.12);
          border-color: rgba(34, 197, 94, 0.22);
        }

        .badge-gray {
          color: var(--gray-600);
          background: var(--gray-50);
          border-color: var(--gray-200);
        }

        /* Default (desktop): hide mobile-only blocks */
        .only-mobile { display: none; }
        .only-desktop { display: block; }

        .mobile-card-actions {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-top: 12px;
        }

        /* ===== MOBILE ACCORDIONS (Create forms) ===== */
        .mobile-accordion,
        .mobile-preview {
          border: 1px solid var(--gray-200);
          border-radius: 16px;
          background: var(--white);
          overflow: hidden;
          margin-top: 12px;
        }

        .mobile-accordion-body {
          padding: 14px;
        }

        .mobile-accordion-summary {
          list-style: none;
          cursor: pointer;
          user-select: none;
          padding: 14px;
          font-weight: 900;
          color: var(--black);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          border-bottom: 1px solid var(--gray-200);
          background: var(--gray-50);
        }

        .mobile-accordion-summary::-webkit-details-marker {
          display: none;
        }

        .mobile-accordion-summary::after {
          content: '▾';
          font-weight: 900;
          color: var(--gray-500);
          display: inline-block;
          transition: transform 0.15s ease;
        }

        details[open] > .mobile-accordion-summary::after {
          transform: rotate(180deg);
        }

        /* Desktop: keep forms unchanged */
        @media (min-width: 769px) {
          .mobile-accordion,
          .mobile-preview {
            border: none;
            border-radius: 0;
            background: transparent;
            margin-top: 0;
          }

          .mobile-accordion-summary {
            display: none;
          }

          .mobile-accordion-body {
            padding: 0;
          }
        }

        @media (max-width: 768px) {
          .only-mobile { display: block; }
          .only-desktop { display: none; }

          .page-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }

          .header-actions {
            width: 100%;
            justify-content: flex-start;
            gap: 10px;
          }

          .header-actions .btn {
            width: 100%;
            justify-content: center;
          }

          .btn-group {
            display: grid;
            grid-template-columns: 1fr;
            gap: 10px;
          }

          /* Contracts: keep main actions reachable */
          .contrats-v1 .contrats-actions {
            position: sticky;
            bottom: 12px;
            padding: 12px;
            background: rgba(255, 255, 255, 0.92);
            backdrop-filter: blur(10px);
            border: 1px solid var(--gray-200);
            border-radius: 16px;
            z-index: 5;
          }

          .factures-v1 .factures-actions {
            position: sticky;
            bottom: 12px;
            padding: 12px;
            background: rgba(255, 255, 255, 0.92);
            backdrop-filter: blur(10px);
            border: 1px solid var(--gray-200);
            border-radius: 16px;
            z-index: 5;
          }

          .devis-v4 .devis-actions {
            position: sticky;
            bottom: 12px;
            padding: 12px;
            background: rgba(255, 255, 255, 0.92);
            backdrop-filter: blur(10px);
            border: 1px solid var(--gray-200);
            border-radius: 16px;
            z-index: 5;
          }

          .import-toolbar {
            display: grid;
            grid-template-columns: 1fr;
            gap: 10px;
            align-items: stretch;
          }

          .import-toolbar .import-btn,
          .import-toolbar .btn {
            width: 100%;
            justify-content: center;
          }

          /* tooltips are hard to use on mobile (hover). keep them visible but not blocking layout */
          .tooltip {
            width: 100%;
            height: auto;
            border-radius: 12px;
            padding: 10px 12px;
            justify-content: flex-start;
          }
          .tooltip::after,
          .tooltip::before {
            display: none;
          }

          .mobile-card-actions .btn {
            width: 100%;
            justify-content: center;
          }
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
          .mobile-topbar {
            display: flex;
          }

          .sidebar {
            transform: translateX(-100%);
          }

          .sidebar.mobile-open {
            transform: translateX(0);
          }

          .sidebar-overlay.show {
            display: block;
          }

          .main-content {
            margin-left: 0;
            padding: 18px 16px;
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

      {/* Mobile overlay (click to close) */}
      <div
        className={`sidebar-overlay ${mobileNavOpen ? 'show' : ''}`}
        onClick={() => setMobileNavOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`sidebar ${mobileNavOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <svg viewBox="0 0 24 24">
              <path d="M13 3L4 14h7l-2 7 9-11h-7l2-7z" />
            </svg>
          </div>
          <span className="sidebar-logo-text">Spyke</span>
        </div>

        <nav className="sidebar-nav">
          <button data-tour="dashboard" className={`nav-item ${tab === 'dashboard' ? 'active' : ''}`} onClick={() => goTab('dashboard')}>
            <svg viewBox="0 0 24 24">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            Dashboard
          </button>

          <button data-tour="clients" className={`nav-item ${tab === 'clients' ? 'active' : ''}`} onClick={() => goTab('clients')}>
            <svg viewBox="0 0 24 24">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 00-3-3.87" />
              <path d="M16 3.13a4 4 0 010 7.75" />
            </svg>
            Clients
          </button>

          <button data-tour="assistant" className={`nav-item ${tab === 'assistant' ? 'active' : ''}`} onClick={() => goTab('assistant')}>
            <svg viewBox="0 0 24 24">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            </svg>
            Assistant IA
          </button>

          <button data-tour="devis" className={`nav-item ${tab === 'devis' ? 'active' : ''}`} onClick={() => goTab('devis')}>
            <svg viewBox="0 0 24 24">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            Devis
          </button>

          <button data-tour="factures" className={`nav-item ${tab === 'factures' ? 'active' : ''}`} onClick={() => goTab('factures')}>
            <svg viewBox="0 0 24 24">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
            Factures
          </button>

          <button data-tour="contrats" className={`nav-item ${tab === 'contrats' ? 'active' : ''}`} onClick={() => goTab('contrats')}>
            <svg viewBox="0 0 24 24">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <path d="M8 13h8" />
              <path d="M8 17h8" />
            </svg>
            Contrats
          </button>

          <span className="nav-section-title">Outils</span>

          <button data-tour="analyseur" className={`nav-item ${tab === 'analyseur' ? 'active' : ''}`} onClick={() => goTab('analyseur')}>
            <svg viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            Analyseur de projet
          </button>

          <button
            data-tour="juriste"
            className={`nav-item ${tab === 'juriste' ? 'active' : ''}`}
            onClick={() => {
              if (planCode !== 'pro') {
                notify('Question juriste : réservé au plan Pro.', 'info')
                goTab('settings')
                return
              }
              goTab('juriste')
            }}
          >
            <svg viewBox="0 0 24 24">
              <path d="M9 11l3 3L22 4" />
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
            Question juriste
            {planCode !== 'pro' ? <span className="badge badge-yellow" style={{ marginLeft: 'auto' }}>Pro</span> : null}
          </button>

          <button
            data-tour="help"
            className="nav-item"
            onClick={() => {
              setHelpOpen(true)
              setMobileNavOpen(false)
            }}
          >
            <svg viewBox="0 0 24 24">
              <path d="M21 15a2 2 0 01-2 2H8l-5 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              <path d="M12 7a3 3 0 013 3c0 2-3 2-3 4" />
              <path d="M12 17h.01" />
            </svg>
            Aide (chat)
          </button>
        </nav>

        <div className="sidebar-footer">
          <button data-tour="settings" className="user-profile" onClick={() => goTab('settings')}>
            <div className="user-avatar">{initials}</div>
            <div className="user-info">
              <h4>{userFullName}</h4>
              <p>{userPlan}</p>
            </div>
          </button>
        </div>
      </aside>

      {/* Help chat floating button */}
      <button
        data-tour="help-fab"
        className="help-fab"
        type="button"
        onClick={() => setHelpOpen(true)}
        aria-label="Ouvrir le chat d'aide"
        title="Aide (chat)"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20" aria-hidden="true">
          <path d="M21 15a2 2 0 01-2 2H8l-5 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
          <path d="M8 9h8" />
          <path d="M8 13h6" />
        </svg>
        <span className="help-fab-label">Aide</span>
      </button>

      {/* Help chat drawer */}
      <div className={`help-drawer ${helpOpen ? 'open' : ''}`}>
        <div className="help-drawer-header">
          <div>
            <div className="help-drawer-title">Aide Spyke</div>
            <div className="help-drawer-subtitle">Pose une question sur l'outil (réponses générales)</div>
          </div>
          <button className="btn btn-secondary" type="button" onClick={() => setHelpOpen(false)}>
            Fermer
          </button>
        </div>

        <div className="help-drawer-body" id="help-drawer-body">
          {helpError ? <div className="help-error">{helpError}</div> : null}

          {helpMessages.length === 0 ? (
            <div className="help-empty">Ex: "Comment envoyer un devis ?", "Quelles mentions sur une facture ?"</div>
          ) : (
            helpMessages.map((m) => (
              <div key={m.id} className={`help-msg ${m.role === 'user' ? 'user' : 'assistant'}`}>
                <div className="help-bubble">{m.content}</div>
              </div>
            ))
          )}

          {helpLoading ? (
            <div className="help-msg assistant">
              <div className="help-bubble">…</div>
            </div>
          ) : null}
        </div>

        <form
          className="help-drawer-footer"
          onSubmit={(e) => {
            e.preventDefault()
            sendHelpMessage()
          }}
        >
          <input
            className="form-input"
            placeholder="Écris ta question…"
            value={helpInput}
            onChange={(e) => setHelpInput(e.target.value)}
          />
          <button className="btn btn-primary" type="submit" disabled={helpLoading || !helpInput.trim()}>
            Envoyer
          </button>
        </form>
      </div>

      {/* Main Content */}
      <main className="main-content">
        {tourOpen ? (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9999,
              pointerEvents: 'auto',
            }}
          >
            {/* dark overlay */}
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)' }} />

            {/* spotlight */}
            {tourSpot ? (
              <div
                style={{
                  position: 'absolute',
                  top: Math.max(8, tourSpot.top - 6),
                  left: Math.max(8, tourSpot.left - 6),
                  width: Math.max(18, tourSpot.width + 12),
                  height: Math.max(18, tourSpot.height + 12),
                  borderRadius: 14,
                  boxShadow: '0 0 0 9999px rgba(0,0,0,0.55)',
                  border: '2px solid rgba(255,255,255,0.9)',
                  background: 'transparent',
                }}
              />
            ) : null}

            {/* tooltip */}
            {(() => {
              const s = tourSteps[Math.min(Math.max(tourStep, 0), tourSteps.length - 1)]
              const spot = tourSpot
              const tooltipWidth = 340
              const left = spot ? Math.min(Math.max(12, spot.left), window.innerWidth - tooltipWidth - 12) : 12
              const top = spot ? Math.min(window.innerHeight - 220, spot.top + spot.height + 14) : 12

              return (
                <div
                  style={{
                    position: 'absolute',
                    left,
                    top,
                    width: tooltipWidth,
                    background: 'white',
                    borderRadius: 14,
                    padding: 14,
                    boxShadow: '0 20px 50px rgba(0,0,0,0.25)',
                  }}
                >
                  <div style={{ fontWeight: 900, marginBottom: 6 }}>{s.title}</div>
                  <div style={{ fontSize: 13, color: 'rgba(0,0,0,0.72)', lineHeight: 1.5 }}>{s.body}</div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                    <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.5)' }}>
                      Étape {Math.min(tourStep + 1, tourSteps.length)} / {tourSteps.length}
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => {
                          try {
                            localStorage.setItem('spyke_tour_v1_done', '1')
                          } catch {}
                          setTourOpen(false)
                        }}
                      >
                        Passer
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        disabled={tourStep <= 0}
                        onClick={() => setTourStep((v) => Math.max(0, v - 1))}
                      >
                        Précédent
                      </button>
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => {
                          if (tourStep >= tourSteps.length - 1) {
                            try {
                              localStorage.setItem('spyke_tour_v1_done', '1')
                            } catch {}
                            setTourOpen(false)
                            return
                          }
                          setTourStep((v) => Math.min(tourSteps.length - 1, v + 1))
                        }}
                      >
                        {tourStep >= tourSteps.length - 1 ? 'Terminer' : 'Suivant'}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })()}
          </div>
        ) : null}
        <div className="mobile-topbar">
          <button className="mobile-menu-btn" type="button" onClick={() => setMobileNavOpen(true)} aria-label="Ouvrir le menu">
            <svg viewBox="0 0 24 24">
              <path d="M4 6h16" />
              <path d="M4 12h16" />
              <path d="M4 18h16" />
            </svg>
          </button>
          <div className="mobile-topbar-title">Spyke</div>
        </div>
        {/* Dashboard */}
        <div id="tab-dashboard" className={`tab-content ${tab === 'dashboard' ? 'active' : ''}`}>
          <div className="page-header">
            <div>
              <h1 className="page-title">Dashboard</h1>
              <p className="page-subtitle">Bienvenue, {userFullName.split(' ')[0] || userFullName} 👋</p>
            </div>
            {/* header actions removed */}
          </div>

          <div className="stats-grid">
            {/* 1) CA ce mois */}
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

            {/* 2) Clients actifs */}
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

            {/* 3) Devis en attente */}
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

            {/* 4) Factures envoyées */}
            <div className="stat-card">
              <div className="stat-header">
                <div className="stat-icon green">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </div>
              </div>
              <div className="stat-value">{dashboardPaidInvoices}</div>
              <div className="stat-label">Factures payées</div>
            </div>
          </div>

          <div className="cards-grid">
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">⚡ Actions rapides</h3>
              </div>
              <div className="quick-actions">
                <div className="quick-action" onClick={() => goTab('devis')}>
                  <div className="quick-action-icon">📄</div>
                  <div className="quick-action-text">
                    <h4>Nouveau devis</h4>
                    <p>Créer en 2 min</p>
                  </div>
                </div>

                <div className="quick-action" onClick={() => goTab('factures')}>
                  <div className="quick-action-icon">💰</div>
                  <div className="quick-action-text">
                    <h4>Nouvelle facture</h4>
                    <p>Importer un devis</p>
                  </div>
                </div>

                <div className="quick-action" onClick={() => goTab('contrats')}>
                  <div className="quick-action-icon">📝</div>
                  <div className="quick-action-text">
                    <h4>Nouveau contrat</h4>
                    <p>Générer un PDF</p>
                  </div>
                </div>

                <div className="quick-action" onClick={() => goTab('analyseur')}>
                  <div className="quick-action-icon">🔍</div>
                  <div className="quick-action-text">
                    <h4>Analyse projet</h4>
                    <p>Lire un brief</p>
                  </div>
                </div>

                <div className="quick-action" onClick={() => goTab('assistant')}>
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
                <>
                  {/* Desktop table */}
                  <div className="only-desktop" style={{ overflowX: 'auto' }}>
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
                            <td style={{ padding: '12px 8px', borderBottom: '1px solid var(--gray-100)' }}>{q.title || '-'}</td>
                            <td style={{ padding: '12px 8px', borderBottom: '1px solid var(--gray-100)' }}>{formatStatusFr(q.status)}</td>
                            <td style={{ padding: '12px 8px', borderBottom: '1px solid var(--gray-100)', textAlign: 'right', fontWeight: 700 }}>
                              {formatMoney(Number(q.total_ttc || 0))}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile cards */}
                  <div className="only-mobile mobile-cards">
                    {dashboardQuotes.map((q) => (
                      <div key={q.id} className="mobile-card">
                        <div className="mobile-card-top">
                          <div>
                            <div className="mobile-card-title">{q.number}</div>
                            <div className="mobile-card-sub">{q.title || '-'}</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div className="mobile-card-amount">{formatMoney(Number(q.total_ttc || 0))}</div>
                            <div className="mobile-badges">
                              <span className="badge badge-gray">{formatStatusFr(q.status)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="mobile-card-actions">
                          <button
                            className="btn btn-secondary"
                            type="button"
                            onClick={() => {
                              setTab('devis')
                            }}
                          >
                            Ouvrir
                          </button>
                          <button className="btn btn-secondary" type="button" onClick={() => setTab('devis')}>
                            Tout voir
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
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
                <>
                  {/* Desktop table */}
                  <div className="only-desktop" style={{ overflowX: 'auto' }}>
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
                            <td style={{ padding: '12px 8px', borderBottom: '1px solid var(--gray-100)' }}>{formatStatusFr(inv.status)}</td>
                            <td style={{ padding: '12px 8px', borderBottom: '1px solid var(--gray-100)' }}>
                              {inv.due_date ? formatDateFr(String(inv.due_date)) : '-'}
                            </td>
                            <td style={{ padding: '12px 8px', borderBottom: '1px solid var(--gray-100)', textAlign: 'right', fontWeight: 700 }}>
                              {formatMoney(Number(inv.total_ttc || 0))}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile cards */}
                  <div className="only-mobile mobile-cards">
                    {dashboardInvoices.map((inv) => {
                      const paidAt = (inv as any)?.paid_at
                      const due = String((inv as any)?.due_date || '')
                      const today = new Date().toISOString().slice(0, 10)
                      const statusLabel = paidAt ? 'Payée' : due && due < today ? 'En retard' : (inv.status || 'Non payée')
                      const statusTone = paidAt ? 'green' : due && due < today ? 'red' : 'gray'

                      return (
                        <div key={inv.id} className="mobile-card">
                          <div className="mobile-card-top">
                            <div>
                              <div className="mobile-card-title">{inv.number}</div>
                              <div className="mobile-card-sub">Échéance: {inv.due_date ? formatDateFr(String(inv.due_date)) : '-'}</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div className="mobile-card-amount">{formatMoney(Number(inv.total_ttc || 0))}</div>
                              <div className="mobile-badges">
                                <span className={`badge ${statusTone === 'green' ? 'badge-green' : statusTone === 'red' ? 'badge-red' : 'badge-gray'}`}>{statusLabel}</span>
                              </div>
                            </div>
                          </div>
                          <div className="mobile-card-actions">
                            <button
                              className="btn btn-secondary"
                              type="button"
                              onClick={() => {
                                setTab('factures')
                              }}
                            >
                              Ouvrir
                            </button>
                            <button className="btn btn-secondary" type="button" onClick={() => setTab('factures')}>
                              Voir tout
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </>
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
                <>
                  {/* Desktop table */}
                  <div className="only-desktop" style={{ overflowX: 'auto' }}>
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
                            <td style={{ padding: '12px 8px', borderBottom: '1px solid var(--gray-100)' }}>{formatStatusFr(c.status)}</td>
                            <td style={{ padding: '12px 8px', borderBottom: '1px solid var(--gray-100)', textAlign: 'right', fontWeight: 700 }}>
                              {formatMoney(Number(c.amount_ht || 0))}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile cards */}
                  <div className="only-mobile mobile-cards">
                    {dashboardContracts.map((c) => (
                      <div key={c.id} className="mobile-card">
                        <div className="mobile-card-top">
                          <div>
                            <div className="mobile-card-title">{c.title || 'Contrat'}</div>
                            <div className="mobile-card-sub">Statut: {formatStatusFr(c.status)}</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div className="mobile-card-amount">{formatMoney(Number(c.amount_ht || 0))}</div>
                            <div className="mobile-badges">
                              <span className="badge badge-gray">{formatStatusFr(c.status)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="mobile-card-actions">
                          <button className="btn btn-secondary" type="button" onClick={() => setTab('contrats')}>
                            Ouvrir
                          </button>
                          <button className="btn btn-secondary" type="button" onClick={() => setTab('contrats')}>
                            Voir tout
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
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
                      <div><b>Email:</b> {c.email || '-'}</div>
                      <div><b>Téléphone:</b> {c.phone || '-'}</div>
                      <div><b>SIRET:</b> {c.siret || '-'}</div>
                      <div style={{ marginTop: 8 }}>
                        <b>Adresse:</b> {[c.address, [c.postal_code, c.city].filter(Boolean).join(' '), c.country].filter(Boolean).join(', ') || '-'}
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

              {(() => {
                const q = clientSearch.trim().toLowerCase()
                const filtered = clients.filter((c) => {
                  if (!q) return true
                  return [c.name, c.email, c.phone, c.city, c.address]
                    .filter(Boolean)
                    .some((x) => String(x).toLowerCase().includes(q))
                })

                return (
                  <>
                    {/* Desktop table */}
                    <div className="only-desktop" style={{ marginTop: 12, overflowX: 'auto' }}>
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
                          {filtered.map((c) => {
                            const s = clientStats[c.id] || { quotes: 0, invoices: 0, contracts: 0, totalInvoiced: 0, lastStatus: '-' }
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
                                  <div style={{ fontSize: 13 }}>{c.email || '-'}</div>
                                  <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>{c.phone || ''}</div>
                                </td>
                                <td style={{ padding: '12px 8px', borderBottom: '1px solid var(--gray-100)' }}>{c.city || '-'}</td>
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
                                      Modifier
                                    </button>
                                    <button
                                      type="button"
                                      className="btn btn-secondary"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        deleteClient(c.id)
                                      }}
                                    >
                                      Supprimer
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>

                      {clients.length === 0 ? (
                        <div className="empty-state" style={{ padding: 24 }}>
                          <p>Aucun client</p>
                        </div>
                      ) : null}
                    </div>

                    {/* Mobile cards */}
                    <div className="only-mobile mobile-cards" style={{ marginTop: 12 }}>
                      {filtered.length === 0 ? (
                        <div className="empty-state" style={{ padding: 24 }}>
                          <p>Aucun client</p>
                        </div>
                      ) : (
                        filtered.map((c) => {
                          const s = clientStats[c.id] || { quotes: 0, invoices: 0, contracts: 0, totalInvoiced: 0, lastStatus: '-' }

                          return (
                            <div
                              key={c.id}
                              className="mobile-card"
                              style={{ cursor: 'pointer' }}
                              onClick={() => {
                                setViewClientId(c.id)
                                setClientsView('detail')
                              }}
                            >
                              <div className="mobile-card-top">
                                <div>
                                  <div className="mobile-card-title">{c.name}</div>
                                  <div className="mobile-card-sub">
                                    {(c.city || '-')}{c.email ? ` • ${c.email}` : ''}
                                  </div>
                                  {c.phone ? <div className="mobile-card-meta">{c.phone}</div> : null}
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                  <div className="mobile-card-amount">{formatMoney(Number(s.totalInvoiced || 0))}</div>
                                  <div className="mobile-badges">
                                    <span className="badge badge-gray">Devis {s.quotes}</span>
                                    <span className="badge badge-gray">Factures {s.invoices}</span>
                                    <span className="badge badge-gray">Contrats {s.contracts}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="mobile-card-meta">Dernier statut: {s.lastStatus}</div>

                              <div className="mobile-card-actions">
                                <button
                                  type="button"
                                  className="btn btn-secondary"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setEditingClientId(c.id)
                                    setModal('editClient')
                                  }}
                                >
                                  Modifier
                                </button>
                                {/* actions reduced: edit/delete only */}
                                <button
                                  type="button"
                                  className="btn btn-secondary"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    deleteClient(c.id)
                                  }}
                                >
                                  Supprimer
                                </button>
                              </div>
                            </div>
                          )
                        })
                      )}
                    </div>
                  </>
                )
              })()}
            </div>
          )}
        </div>

        {/* Assistant */}
        <div id="tab-assistant" className={`tab-content ${tab === 'assistant' ? 'active' : ''}`}>
          <div className="page-header" style={{ marginBottom: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div className="assistant-hero-icon" aria-hidden>
                <span className="assistant-hero-bolt">⚡</span>
              </div>
              <div>
                <h1 className="page-title" style={{ marginBottom: 4 }}>Assistant IA</h1>
                <p className="page-subtitle" style={{ marginTop: 0 }}>Votre copilote pour les emails clients</p>
              </div>
            </div>
          </div>

          {assistantHistory.length ? (
            <div className="assistant-history">
              <div className="assistant-history-title">Derniers emails</div>
              <div className="assistant-history-list">
                {assistantHistory.slice(0, 6).map((it) => (
                  <button
                    key={it.id}
                    type="button"
                    className="assistant-history-item"
                    onClick={() => {
                      setSelectedClientId(it.clientId || '')
                      setAssistantTo(it.to || '')
                      setTemplate(it.template)
                      setTone(it.tone)
                      setAssistantSubjectDirty(true)
                      setAssistantSubject(it.subject || it.template)
                      setAssistantOutput(it.text || '')
                    }}
                    title="Recharger cet email"
                  >
                    <div className="assistant-history-item-top">
                      <div className="assistant-history-item-kind">{it.template}</div>
                      <div className="assistant-history-item-date">{new Date(it.createdAt).toLocaleDateString('fr-FR')}</div>
                    </div>
                    <div className="assistant-history-item-subject">{it.subject || 'Sans objet'}</div>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="assistant-container">
            <div className="assistant-main">
              <form className="assistant-form" onSubmit={(e) => e.preventDefault()}>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Client</label>
                    <select
                      className="form-select"
                      value={selectedClientId}
                      onChange={(e) => {
                        const id = e.target.value
                        setSelectedClientId(id)
                        // Prefill recipient email from client when available
                        try {
                          const client = clients.find((c) => c.id === id)
                          setAssistantTo(String(client?.email || ''))
                        } catch {}
                      }}
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
                    <label className="form-label">Email</label>
                    <input
                      className="form-input"
                      placeholder="Email du destinataire"
                      value={assistantTo}
                      onChange={(e) => setAssistantTo(e.target.value)}
                    />
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
                  <div className="assistant-examples">
                    {[
                      'Le client n\'a pas répondu depuis 2 semaines',
                      'Je veux augmenter mon tarif de 15%',
                      'Le client demande du travail hors périmètre',
                      'Je veux demander un acompte avant de démarrer',
                    ].map((ex) => (
                      <button
                        key={ex}
                        type="button"
                        className="assistant-example-chip"
                        onClick={() => setAssistantContext(ex)}
                      >
                        {ex}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Type</label>
                  <div className="template-chips">
                    {([
                      ['💬', 'Réponse'],
                      ['✉️', 'Relance'],
                      ['💰', 'Relance devis'],
                      ['🤝', 'Négociation'],
                      ['🚫', 'Refus poli'],
                      ['🧾', 'Facture'],
                      ['🙏', 'Remerciement'],
                      ['🧲', 'Présentation / Prospection'],
                    ] as Array<[string, Template]>).map(([icon, label]) => (
                      <button
                        key={label}
                        type="button"
                        className={`template-chip ${template === label ? 'active' : ''}`}
                        onClick={() => setTemplate(label)}
                      >
                        <span className="template-chip-icon" aria-hidden>
                          {icon}
                        </span>
                        {label}
                      </button>
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
                  <label className="form-label">Objet</label>
                  <input
                    className="form-input"
                    placeholder="Objet de l'email (obligatoire)"
                    value={assistantSubject}
                    onChange={(e) => {
                      setAssistantSubjectDirty(true)
                      setAssistantSubject(e.target.value)
                    }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Résultat</label>
                  {assistantOutput ? (
                    <textarea
                      className="output-box"
                      value={assistantOutput}
                      onChange={(e) => setAssistantOutput(e.target.value)}
                      style={{ width: '100%', minHeight: 220, resize: 'vertical', whiteSpace: 'pre-wrap' }}
                    />
                  ) : (
                    <div className="assistant-empty-output">
                      <div className="assistant-empty-illu" aria-hidden>
                        🤖
                      </div>
                      <div className="assistant-empty-title">Décrivez votre situation</div>
                      <div className="assistant-empty-sub">et l'IA rédige votre email en ~5 secondes.</div>
                      <div className="assistant-examples" style={{ justifyContent: 'center' }}>
                        {[
                          'Relance polie après devis envoyé',
                          'Refus poli d\'un changement de périmètre',
                          'Négocier une hausse de tarif',
                        ].map((ex) => (
                          <button key={ex} type="button" className="assistant-example-chip" onClick={() => setAssistantContext(ex)}>
                            {ex}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

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

                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => setAssistantSendPreviewOpen(true)}
                      disabled={assistantSending || !assistantOutput}
                      title={!assistantOutput ? 'Génère un email avant' : 'Aperçu avant envoi'}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                        <path d="M4 4h16v16H4z" opacity="0" />
                        <path d="M4 4h16v16H4z" />
                        <path d="M22 6l-10 7L2 6" />
                      </svg>
                      {assistantSending ? 'Envoi…' : 'Envoyer par mail'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>

          <ModalShell
            open={assistantSendPreviewOpen}
            title={"Aperçu avant envoi"}
            onClose={() => setAssistantSendPreviewOpen(false)}
            footer={
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button className="btn btn-secondary" type="button" onClick={() => setAssistantSendPreviewOpen(false)} disabled={assistantSending}>
                  Annuler
                </button>
                <button
                  className="btn btn-primary"
                  type="button"
                  onClick={sendAssistantEmailNow}
                  disabled={assistantSending || !assistantOutput}
                >
                  {assistantSending ? 'Envoi…' : 'Envoyer'}
                </button>
              </div>
            }
          >
            <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 12, height: '100%' }}>
              <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.6)' }}>
                À : <b>{String(assistantTo || (clients.find((c) => c.id === selectedClientId)?.email || '')).trim() || '-'}</b>
              </div>
              <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.6)' }}>
                Objet : <b>{assistantSubject.trim() || '-'}</b>
              </div>
              <textarea
                value={assistantOutput || ''}
                onChange={(e) => setAssistantOutput(e.target.value)}
                style={{ width: '100%', flex: 1, resize: 'none', padding: '12px 14px', borderRadius: 12, border: '1px solid rgba(0,0,0,0.12)', fontFamily: 'inherit' }}
              />
              <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.55)' }}>
                Vérifie le contenu, puis clique sur "Envoyer".
              </div>
            </div>
          </ModalShell>
        </div>

        {/* Devis */}
        <div id="tab-devis" className={`tab-content ${tab === 'devis' ? 'active' : ''}`}>
          <DevisV4 userFullName={userFullName} userJob={userJob} userId={userId} planCode={planCode} />
        </div>

        {/* Factures */}
        <div id="tab-factures" className={`tab-content ${tab === 'factures' ? 'active' : ''}`}>
          <FacturesV1 clients={clients} userId={userId} userFullName={userFullName} planCode={planCode} />
        </div>

        {/* Contrats */}
        <div id="tab-contrats" className={`tab-content ${tab === 'contrats' ? 'active' : ''}`}>
          <ContratsV1 clients={clients} userId={userId} userFullName={userFullName} userJob={userJob} planCode={planCode} />
        </div>

{/* Analyseur */}
        <div id="tab-analyseur" className={`tab-content ${tab === 'analyseur' ? 'active' : ''}`}>
          <div className="page-header">
            <div>
              <h1 className="page-title">Analyseur de projet</h1>
              <p className="page-subtitle">Analysez un brief client pour évaluer sa faisabilité</p>
            </div>
          </div>

          <div className="analyseur-container">
            <div className="devis-form">
              <div className="form-group">
                <label className="form-label">Brief du client</label>
                <textarea
                  className="form-textarea"
                  style={{ minHeight: 250 }}
                  placeholder="Collez ici le brief ou la demande de votre client..."
                  value={briefText}
                  onChange={(e) => setBriefText(e.target.value)}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Budget annoncé (optionnel)</label>
                  <input type="text" className="form-input" placeholder="Ex: 3000€" value={briefBudget} onChange={(e) => setBriefBudget(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Délai demandé (optionnel)</label>
                  <input type="text" className="form-input" placeholder="Ex: 2 semaines" value={briefDelay} onChange={(e) => setBriefDelay(e.target.value)} />
                </div>
              </div>

              <button type="button" className="btn btn-yellow" style={{ width: '100%' }} onClick={analyzeBrief} disabled={briefLoading || !briefText.trim()}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-4.35-4.35" />
                </svg>
                {briefLoading ? 'Analyse…' : 'Analyser le projet'}
              </button>
            </div>

            <div className="devis-preview">
              <h3 className="preview-title">Résultat de l&apos;analyse</h3>

              {briefError ? <div style={{ color: '#b91c1c', fontSize: 13, marginBottom: 10 }}>{briefError}</div> : null}

              {briefOutput ? (
                <div className="output-box">
                  {(() => {
                    const raw = String(briefOutput || '')
                    const lines = raw.split(/\r?\n/)

                    const blocks: Array<
                      | { kind: 'p'; text: string }
                      | { kind: 'h'; text: string }
                      | { kind: 'ul'; items: string[] }
                      | { kind: 'ol'; items: string[] }
                    > = []

                    let i = 0
                    while (i < lines.length) {
                      // skip empty lines
                      while (i < lines.length && !String(lines[i] || '').trim()) i++
                      if (i >= lines.length) break

                      const line = String(lines[i] || '').trim()

                      // Heading style: "XXX:" or "### XXX"
                      const h = line.replace(/^#{2,4}\s*/, '')
                      if (/^#{2,4}\s*/.test(line) || /:$/.test(line)) {
                        blocks.push({ kind: 'h', text: h.replace(/:$/, '') })
                        i++
                        continue
                      }

                      // Ordered list "1) ..."
                      if (/^\d+\)\s+/.test(line)) {
                        const items: string[] = []
                        while (i < lines.length) {
                          const l = String(lines[i] || '').trim()
                          if (!l) break
                          const m = l.match(/^\d+\)\s+(.*)$/)
                          if (!m) break
                          items.push(String(m[1] || '').trim())
                          i++
                        }
                        blocks.push({ kind: 'ol', items })
                        continue
                      }

                      // Unordered list "- ..." or "• ..."
                      if (/^[-•]\s+/.test(line)) {
                        const items: string[] = []
                        while (i < lines.length) {
                          const l = String(lines[i] || '').trim()
                          if (!l) break
                          const m = l.match(/^[-•]\s+(.*)$/)
                          if (!m) break
                          items.push(String(m[1] || '').trim())
                          i++
                        }
                        blocks.push({ kind: 'ul', items })
                        continue
                      }

                      // Paragraph: group until blank line
                      const paras: string[] = []
                      while (i < lines.length) {
                        const l = String(lines[i] || '')
                        if (!l.trim()) break
                        paras.push(l.trim())
                        i++
                      }
                      blocks.push({ kind: 'p', text: paras.join(' ') })
                    }

                    return (
                      <div className="analysis-output">
                        {blocks.map((b, idx) => {
                          if (b.kind === 'h') return <div key={idx} className="analysis-title">{b.text}</div>
                          if (b.kind === 'ul')
                            return (
                              <ul key={idx}>
                                {b.items.map((it, j) => (
                                  <li key={j}>{it}</li>
                                ))}
                              </ul>
                            )
                          if (b.kind === 'ol')
                            return (
                              <ol key={idx}>
                                {b.items.map((it, j) => (
                                  <li key={j}>{it}</li>
                                ))}
                              </ol>
                            )
                          return <p key={idx}>{b.text}</p>
                        })}
                      </div>
                    )
                  })()}
                </div>
              ) : (
                <div className="empty-state" style={{ padding: '40px 20px' }}>
                  <div className="empty-state-icon">🔍</div>
                  <p>L&apos;analyse apparaîtra ici</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Question juriste */}
        <div id="tab-juriste" className={`tab-content ${tab === 'juriste' ? 'active' : ''}`}>
          <div className="page-header">
            <div>
              <h1 className="page-title">Question juriste</h1>
              <p className="page-subtitle">Posez une question et elle sera transmise à un juriste (réponse sous moins de 24h).</p>
            </div>
          </div>

          {planCode !== 'pro' ? (
            <div className="card">
              <p style={{ color: 'var(--gray-700)' }}>
                Cette fonctionnalité est réservée au <b>plan Pro</b>.
              </p>
              <p style={{ color: 'var(--gray-600)', marginTop: 8 }}>
                Passez Pro dans l'onglet Paramètres pour débloquer la question juriste.
              </p>
              <button className="btn btn-primary" type="button" onClick={() => goTab('settings')}>
                Voir les plans
              </button>
            </div>
          ) : (
            <div className="card">
              <div className="form-row">
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Thème</label>
                  <select className="form-input" value={legalTopic} onChange={(e) => setLegalTopic(e.target.value)}>
                    <option value="Contrat">Contrat</option>
                    <option value="Facturation">Facturation</option>
                    <option value="TVA / charges">TVA / charges</option>
                    <option value="Litige client">Litige client</option>
                    <option value="Statut juridique">Statut juridique</option>
                    <option value="Autre">Autre</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Votre question</label>
                  <textarea
                    className="form-textarea"
                    style={{ minHeight: 160 }}
                    placeholder="Décrivez votre situation et votre question. Ne partagez pas de données personnelles sensibles (numéro de sécurité sociale, coordonnées bancaires, etc.)."
                    value={legalQuestion}
                    onChange={(e) => setLegalQuestion(e.target.value)}
                  />
                  <div style={{ marginTop: 6, fontSize: 12, color: 'var(--gray-500)' }}>Minimum 10 caractères.</div>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Téléphone (optionnel)</label>
                  <input
                    type="tel"
                    className="form-input"
                    placeholder="Ex: +33 6 12 34 56 78"
                    value={legalPhone}
                    onChange={(e) => setLegalPhone(e.target.value)}
                  />
                  <div style={{ marginTop: 6, fontSize: 12, color: 'var(--gray-500)' }}>
                    Si besoin, le juriste pourra vous appeler.
                  </div>
                </div>
              </div>

              {legalError ? (
                <div style={{ marginTop: 10, color: '#b91c1c', fontSize: 13 }}>{legalError}</div>
              ) : null}

              <div style={{ display: 'flex', gap: 12, marginTop: 14, flexWrap: 'wrap', alignItems: 'center' }}>
                <button className="btn btn-primary" type="button" onClick={submitLegalQuestion} disabled={legalBusy || legalQuestion.trim().length < 10}>
                  {legalBusy ? 'Ouverture du paiement…' : 'Payer 5€ et envoyer'}
                </button>
                <button
                  className="btn btn-secondary"
                  type="button"
                  onClick={refreshLegalQuestions}
                  disabled={legalBusy}
                  style={{ padding: '10px 12px', fontSize: 13, opacity: 0.8 }}
                >
                  Actualiser
                </button>
              </div>

              <div style={{ marginTop: 18, fontSize: 13, color: 'var(--gray-600)' }}>
                Après paiement, la question est envoyée automatiquement aux juristes configurés.
              </div>

              <div style={{ marginTop: 22 }}>
                <div className="form-section-title">Historique</div>
                {legalItems.length === 0 ? (
                  <div className="empty-state" style={{ padding: 18 }}>
                    <p>Aucune question envoyée pour le moment</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {legalItems.map((it: any) => {
                      const createdAt = String(it.created_at || '')
                      const status = formatLegalStatus(it.status)
                      const { topic, body } = extractTopicFromQuestion(String(it.question || '').trim())
                      const due = (() => {
                        const d = new Date(createdAt)
                        if (Number.isNaN(d.getTime())) return ''
                        const dueD = new Date(d.getTime() + 24 * 60 * 60 * 1000)
                        return dueD.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
                      })()
                      const canViewReplies = status.key === 'replied'

                      return (
                        <div key={it.id} style={{ border: '1px solid var(--gray-200)', borderRadius: 12, padding: 12, background: '#fff' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                          <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>
                            <div>{formatFrDateSmart(createdAt)}</div>
                            {due ? <div style={{ marginTop: 2 }}>Réponse prévue avant le {due}</div> : null}
                          </div>
                          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                            <div style={{ fontSize: 12, fontWeight: 800 }}>{status.label}</div>
                            {topic ? (
                              <span className="badge badge-gray" style={{ fontSize: 12, fontWeight: 800 }}>
                                {topic}
                              </span>
                            ) : null}
                            {canViewReplies ? (
                              <button
                                className="btn btn-secondary"
                                type="button"
                                onClick={() => {
                                  const id = String(it.id)
                                  const cur = legalThreads[id]
                                  if (!cur || (!cur.messages?.length && !cur.loading && !cur.error)) {
                                    loadLegalThread(id)
                                  } else {
                                    toggleLegalThread(id)
                                  }
                                }}
                              >
                                {legalThreads[String(it.id)]?.open ? 'Masquer' : 'Voir réponse'}
                              </button>
                            ) : null}
                          </div>
                        </div>
                        <div style={{ marginTop: 8, whiteSpace: 'pre-wrap', color: 'var(--gray-800)' }}>{body}</div>

                        {legalThreads[String(it.id)]?.open ? (
                          <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px dashed var(--gray-200)' }}>
                            {legalThreads[String(it.id)]?.loading ? (
                              <div style={{ fontSize: 13, color: 'var(--gray-600)' }}>Chargement des réponses…</div>
                            ) : legalThreads[String(it.id)]?.error ? (
                              <div style={{ fontSize: 13, color: '#b91c1c' }}>{legalThreads[String(it.id)]?.error}</div>
                            ) : (legalThreads[String(it.id)]?.messages || []).length === 0 ? (
                              <div style={{ fontSize: 13, color: 'var(--gray-600)' }}>Pas de réponse pour le moment.</div>
                            ) : (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {(legalThreads[String(it.id)]?.messages || []).map((m: any) => (
                                  <div
                                    key={m.id}
                                    style={{
                                      border: '1px solid var(--gray-200)',
                                      borderRadius: 12,
                                      padding: 10,
                                      background: String(m.role) === 'jurist' ? '#f0f9ff' : '#fff',
                                    }}
                                  >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                                      <div style={{ fontSize: 12, fontWeight: 700 }}>{String(m.role) === 'jurist' ? 'Juriste' : String(m.role)}</div>
                                      <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>{formatFrDateSmart(String(m.created_at))}</div>
                                    </div>
                                    <div style={{ marginTop: 6, whiteSpace: 'pre-wrap', color: 'var(--gray-800)' }}>{String(m.content || '').trim()}</div>
                                  </div>
                                ))}
                              </div>
                            )}

                            <div style={{ marginTop: 10 }}>
                              <button className="btn btn-secondary" type="button" onClick={() => loadLegalThread(String(it.id))} style={{ padding: '10px 12px', fontSize: 13, opacity: 0.8 }}>
                                Actualiser les réponses
                              </button>
                            </div>
                          </div>
                        ) : null}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
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
            {/* Settings tabs */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', padding: '14px 14px 0' }}>
              {(
                [
                  { key: 'abonnement', label: 'Abonnement' },
                  { key: 'profil', label: 'Profil' },
                  { key: 'gmail', label: 'Gmail' },
                  { key: 'signature', label: 'Signature' },
                  { key: 'feedback', label: 'Feedback' },
                  { key: 'compte', label: 'Compte' },
                ] as Array<{ key: typeof settingsTab; label: string }>
              ).map((t) => (
                <button
                  key={t.key}
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setSettingsTab(t.key)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 999,
                    border: settingsTab === t.key ? '2px solid rgba(0,0,0,0.18)' : '2px solid rgba(0,0,0,0.12)',
                    background: settingsTab === t.key ? 'var(--gray-100)' : 'var(--white)',
                    fontWeight: 900,
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
            {settingsTab === 'abonnement' ? (
            <div className="form-section" style={{ marginTop: 14 }}>
              <div className="form-section-title">Abonnement</div>
              <p style={{ marginBottom: 10, color: 'var(--gray-600)' }}>
                Plan actuel : <b>{planCode === 'pro' ? 'Pro' : 'Free'}</b>
              </p>

              {planCode === 'pro' && stripeCancelAtPeriodEnd && stripePeriodEnd ? (
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 10px',
                    borderRadius: 12,
                    background: 'rgba(250, 204, 21, 0.18)',
                    color: 'var(--gray-800)',
                    fontSize: 13,
                    fontWeight: 800,
                    marginBottom: 12,
                  }}
                >
                  Abonnement annulé - Pro jusqu'au{' '}
                  {new Date(stripePeriodEnd).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                </div>
              ) : null}

              {planCode === 'free' && stripeSubStatus && stripePeriodEnd ? (
                <div style={{ marginBottom: 12, fontSize: 13, color: 'var(--gray-500)' }}>
                  Statut Stripe: <b>{stripeSubStatus}</b>
                  {stripeCancelAt ? (
                    <>
                      {' '}
                      · Fin:{' '}
                      {new Date(stripeCancelAt).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </>
                  ) : null}
                </div>
              ) : null}

              <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <button
                  className="btn btn-secondary"
                  type="button"
                  onClick={async () => {
                    try {
                      if (!supabase) throw new Error('Supabase non initialisé')
                      const { data: sessionData } = await supabase.auth.getSession()
                      const token = sessionData?.session?.access_token
                      if (!token) throw new Error('Non connecté')

                      const res = await fetch('/api/stripe/refresh-plan', {
                        method: 'POST',
                        headers: { authorization: `Bearer ${token}` },
                      })
                      const json = await res.json().catch(() => null)
                      if (!res.ok) throw new Error(json?.error || 'Erreur rafraîchissement')

                      // Refresh local profile state by reloading page (simple + reliable)
                      window.location.reload()
                    } catch (e: any) {
                      notify(e?.message || 'Erreur rafraîchissement', 'error')
                    }
                  }}
                >
                  Rafraîchir mon plan
                </button>

                {planCode !== 'pro' ? (
                  <button
                    className="btn btn-primary"
                    type="button"
                    onClick={async () => {
                      try {
                        if (!supabase) throw new Error('Supabase non initialisé')
                        const { data: sessionData } = await supabase.auth.getSession()
                        const token = sessionData?.session?.access_token
                        if (!token) throw new Error('Non connecté')

                        const res = await fetch('/api/stripe/checkout', {
                          method: 'POST',
                          headers: { authorization: `Bearer ${token}` },
                          body: JSON.stringify({ period: 'monthly' }),
                        })
                        const json = await res.json().catch(() => null)
                        if (!res.ok) throw new Error(json?.error || 'Erreur Stripe')
                        const url = String(json?.url || '')
                        if (!url) throw new Error('URL Stripe manquante')
                        window.location.href = url
                      } catch (e: any) {
                        notify(e?.message || 'Erreur abonnement', 'error')
                      }
                    }}
                  >
                    Passer Pro (14 jours offerts puis 19,90€/mois)
                  </button>
                ) : (
                  <>
                    <p style={{ color: 'var(--gray-600)', margin: 0 }}>Votre abonnement Pro est actif ✅</p>
                    <button
                      className="btn btn-secondary"
                      type="button"
                      onClick={async () => {
                        try {
                          if (!supabase) throw new Error('Supabase non initialisé')
                          const { data: sessionData } = await supabase.auth.getSession()
                          const token = sessionData?.session?.access_token
                          if (!token) throw new Error('Non connecté')

                          const res = await fetch('/api/stripe/portal', {
                            method: 'POST',
                            headers: { authorization: `Bearer ${token}` },
                          })
                          const json = await res.json().catch(() => null)
                          if (!res.ok) throw new Error(json?.error || 'Erreur portail Stripe')
                          const url = String(json?.url || '')
                          if (!url) throw new Error('URL portail Stripe manquante')
                          window.location.href = url
                        } catch (e: any) {
                          notify(e?.message || 'Erreur portail Stripe', 'error')
                        }
                      }}
                    >
                      Gérer / Résilier
                    </button>
                  </>
                )}
              </div>
              <div style={{ marginTop: 14, fontSize: 13, color: 'var(--gray-500)' }}>
                Free : 10 emails IA / mois, 3 devis / mois, 3 factures / mois, 3 contrats / mois, 3 clients max.
                <br />
                Pro : illimité.
              </div>
            </div>
            ) : null}

            {settingsTab === 'feedback' ? (
            <div className="form-section" style={{ marginTop: 14 }}>
              <div className="form-section-title">Feedback</div>
              <p style={{ marginBottom: 12, color: 'var(--gray-600)' }}>
                Une idée, un bug, une amélioration ? Dis-le nous.
              </p>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <button className="btn btn-secondary" type="button" onClick={() => { setFeedbackOpen(true); setFeedbackSent(false) }}>
                  Envoyer un feedback
                </button>
                <button
                  className="btn btn-secondary"
                  type="button"
                  onClick={() => {
                    try {
                      localStorage.removeItem('spyke_tour_v1_done')
                    } catch {}
                    setTourStep(0)
                    setTourOpen(true)
                  }}
                >
                  Revoir le guide
                </button>
              </div>
            </div>
            ) : null}

            {settingsTab === 'gmail' ? (
            <div className="form-section" style={{ marginTop: 14 }}>
              <div className="form-section-title">Connexion Gmail</div>
              <p style={{ marginBottom: 12, color: 'var(--gray-600)' }}>
                Connectez votre boîte Gmail pour pouvoir envoyer des devis/factures/contrats directement depuis Spyke.
              </p>
              {gmailConnected ? (
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ fontSize: 14, color: 'var(--gray-700)' }}>
                    Connecté{gmailEmail ? ` : ${gmailEmail}` : ''}
                  </div>

                  {!gmailEmail ? (
                    <button
                      className="btn btn-secondary"
                      type="button"
                      onClick={async () => {
                        try {
                          if (!supabase) throw new Error('Supabase non initialisé')
                          const { data } = await supabase.auth.getSession()
                          const token = data.session?.access_token
                          if (!token) throw new Error('Non connecté')

                          const returnTo = window.location.pathname + window.location.search + window.location.hash
                          const res = await fetch('/api/gmail/oauth-url', {
                            method: 'POST',
                            headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
                            body: JSON.stringify({ returnTo }),
                          })
                          const json = await res.json().catch(() => null)
                          if (!res.ok) throw new Error(json?.error || 'Erreur connexion Gmail')
                          const url = String(json?.url || '')
                          if (!url) throw new Error('URL Google manquante')
                          window.location.href = url
                        } catch (e: any) {
                          notify(e?.message || 'Erreur connexion Gmail', 'error')
                        }
                      }}
                    >
                      Afficher mon email
                    </button>
                  ) : null}

                  <button
                    className="btn btn-danger"
                    type="button"
                    onClick={async () => {
                      try {
                        if (!supabase) throw new Error('Supabase non initialisé')
                        const { data } = await supabase.auth.getSession()
                        const token = data.session?.access_token
                        if (!token) throw new Error('Non connecté')

                        const ok = confirm('Déconnecter Gmail ? Vous ne pourrez plus envoyer depuis Spyke tant que ce n\'est pas reconnecté.')
                        if (!ok) return

                        const res = await fetch('/api/gmail/disconnect', {
                          method: 'POST',
                          headers: { authorization: `Bearer ${token}` },
                        })
                        const json = await res.json().catch(() => null)
                        if (!res.ok) throw new Error(json?.error || 'Erreur déconnexion Gmail')

                        setGmailConnected(false)
                        setGmailEmail('')
                      } catch (e: any) {
                        notify(e?.message || 'Erreur déconnexion Gmail', 'error')
                      }
                    }}
                  >
                    Déconnecter
                  </button>
                </div>
              ) : (
                <button
                  className="btn btn-primary"
                  type="button"
                  onClick={async () => {
                    try {
                      if (!supabase) throw new Error('Supabase non initialisé')
                      const { data } = await supabase.auth.getSession()
                      const token = data.session?.access_token
                      if (!token) throw new Error('Non connecté')

                      const returnTo = window.location.pathname + window.location.search + window.location.hash
                      const res = await fetch('/api/gmail/oauth-url', {
                        method: 'POST',
                        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
                        body: JSON.stringify({ returnTo }),
                      })
                      const json = await res.json().catch(() => null)
                      if (!res.ok) throw new Error(json?.error || 'Erreur connexion Gmail')
                      const url = String(json?.url || '')
                      if (!url) throw new Error('URL Google manquante')
                      window.location.href = url
                    } catch (e: any) {
                      notify(e?.message || 'Erreur connexion Gmail', 'error')
                    }
                  }}
                >
                  Connecter Gmail
                </button>
              )}
            </div>
            ) : null}

            {settingsTab === 'signature' ? (
            <div id="signature-settings" className="form-section" style={{ marginTop: 14 }}>
              <div className="form-section-title">Signature (prestataire)</div>
              <p style={{ marginBottom: 12, color: 'var(--gray-600)' }}>
                Cette signature sera ajoutée automatiquement à vos <b>factures</b> et <b>contrats</b> (pas sur les devis).
              </p>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                <div>
                  {signaturePreviewUrl ? (
                    <>
                      <div style={{ fontSize: 12, color: 'var(--gray-500)', marginBottom: 6 }}>Signature enregistrée</div>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                        <div style={{ border: '1px solid var(--gray-200)', borderRadius: 12, padding: 8, background: '#fff', display: 'inline-block' }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={signaturePreviewUrl} alt="Signature" style={{ height: 42, width: 220, objectFit: 'contain', display: 'block' }} />
                        </div>
                        <button className="btn btn-secondary" type="button" onClick={() => setSignatureEditOpen(true)}>
                          Modifier
                        </button>
                      </div>
                    </>
                  ) : (
                    <div style={{ marginBottom: 12, fontSize: 13, color: 'var(--gray-600)' }}>Aucune signature enregistrée pour le moment.</div>
                  )}
                </div>
              </div>

              {signatureEditOpen ? (
                <div style={{ marginTop: 12, border: '1px solid var(--gray-200)', borderRadius: 12, background: '#fff', padding: 12 }}>
                  <div style={{ fontSize: 12, color: 'var(--gray-500)', marginBottom: 8 }}>Dessine ta signature</div>
                  <div style={{ width: '100%', height: 96, border: '1px solid rgba(0,0,0,0.10)', borderRadius: 10, overflow: 'hidden' }}>
                    <canvas
                      ref={signatureCanvasRef}
                      style={{ width: '100%', height: '100%', touchAction: 'none', display: 'block', background: '#fff' }}
                      onPointerDown={(e) => {
                        try {
                          ;(e.target as any)?.setPointerCapture?.(e.pointerId)
                        } catch {}
                        signatureStart(e)
                      }}
                      onPointerMove={(e) => signatureMove(e)}
                      onPointerUp={() => signatureEnd()}
                      onPointerCancel={() => signatureEnd()}
                      onPointerLeave={() => signatureEnd()}
                    />
                  </div>

                  {signatureError ? <div style={{ marginTop: 10, color: '#b91c1c', fontSize: 13 }}>{signatureError}</div> : null}

                  <div style={{ display: 'flex', gap: 12, marginTop: 12, flexWrap: 'wrap' }}>
                    <button className="btn btn-secondary" type="button" onClick={signatureClear} disabled={signatureSaving}>
                      Effacer
                    </button>
                    <button className="btn btn-primary" type="button" onClick={saveSignatureNow} disabled={signatureSaving}>
                      {signatureSaving ? 'Enregistrement…' : 'Enregistrer'}
                    </button>
                    {signaturePreviewUrl ? (
                      <button className="btn btn-secondary" type="button" onClick={() => setSignatureEditOpen(false)} disabled={signatureSaving}>
                        Annuler
                      </button>
                    ) : null}
                  </div>

                  <div style={{ marginTop: 10, fontSize: 12, color: 'var(--gray-500)' }}>
                    Astuce : sur mobile, signe avec le doigt. Sur desktop, signe à la souris.
                  </div>
                </div>
              ) : null}
            </div>
            ) : null}

            {settingsTab === 'compte' ? (
            <div className="form-section" style={{ marginTop: 14 }}>
              <div className="form-section-title">Compte</div>

              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <button
                  className="btn btn-secondary"
                  type="button"
                  onClick={async () => {
                    try {
                      if (!supabase) throw new Error('Supabase non initialisé')
                      await supabase.auth.signOut()
                      window.location.href = '/connexion.html'
                    } catch (e: any) {
                      alert(e?.message || 'Erreur déconnexion')
                    }
                  }}
                >
                  Se déconnecter
                </button>

                {planCode === 'pro' ? (
                  <button
                    className="btn btn-danger"
                    type="button"
                    onClick={async () => {
                      try {
                        if (!supabase) throw new Error('Supabase non initialisé')
                        const { data: sessionData } = await supabase.auth.getSession()
                        const token = sessionData?.session?.access_token
                        if (!token) throw new Error('Non connecté')

                        const res = await fetch('/api/stripe/portal', {
                          method: 'POST',
                          headers: { authorization: `Bearer ${token}` },
                        })
                        const json = await res.json().catch(() => null)
                        if (!res.ok) throw new Error(json?.error || 'Erreur portail Stripe')
                        const url = String(json?.url || '')
                        if (!url) throw new Error('URL portail Stripe manquante')
                        window.location.href = url
                      } catch (e: any) {
                        alert(e?.message || 'Erreur désabonnement')
                      }
                    }}
                  >
                    Se désabonner
                  </button>
                ) : null}
              </div>

              {planCode === 'pro' ? (
                <div style={{ marginTop: 10, fontSize: 13, color: 'var(--gray-500)' }}>
                  L'abonnement est annulable à tout moment depuis le portail Stripe.
                </div>
              ) : null}

              <div style={{ marginTop: 14, fontSize: 13, color: 'var(--gray-600)' }}>
                Besoin d'aide ? Contact : <a href="mailto:contact@spykeapp.fr">contact@spykeapp.fr</a>
              </div>
            </div>
            ) : null}

            {settingsTab === 'profil' ? (
            <div className="form-section" style={{ marginTop: 14 }}>
              <div className="form-section-title">Profil (utilisé dans Devis / Factures / Contrats)</div>
              <div style={{ marginTop: 6, fontSize: 13, color: 'var(--gray-500)' }}>
                Ces informations servent à pré-remplir automatiquement tes documents et personnaliser les recommandations.
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Prénom</label>
                  <input className="form-input" value={settingsFirstName} onChange={(e) => setSettingsFirstName(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Nom</label>
                  <input className="form-input" value={settingsLastName} onChange={(e) => setSettingsLastName(e.target.value)} />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Entreprise (optionnel)</label>
                  <input className="form-input" value={settingsCompanyName} onChange={(e) => setSettingsCompanyName(e.target.value)} placeholder="Nom de l'entreprise" />
                </div>
                <div className="form-group">
                  <label className="form-label">Métier</label>
                  <input className="form-input" value={settingsJob} onChange={(e) => setSettingsJob(e.target.value)} placeholder="Ex: Développeur" />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Expérience (années)</label>
                  <input className="form-input" value={settingsExperienceYears} onChange={(e) => setSettingsExperienceYears(e.target.value)} placeholder="Ex: 5" />
                </div>
                <div className="form-group">
                  <label className="form-label">Compétences</label>
                  <input className="form-input" value={settingsSkills} onChange={(e) => setSettingsSkills(e.target.value)} placeholder="Ex: React, Next.js, Stripe" />
                </div>
              </div>

              <div className="form-row single">
                <div className="form-group">
                  <label className="form-label">Adresse</label>
                  <input className="form-input" value={settingsAddress} onChange={(e) => setSettingsAddress(e.target.value)} placeholder="12 rue de la Paix" />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Code postal</label>
                  <input className="form-input" value={settingsPostalCode} onChange={(e) => setSettingsPostalCode(e.target.value)} placeholder="75000" />
                </div>
                <div className="form-group">
                  <label className="form-label">Ville</label>
                  <input className="form-input" value={settingsCity} onChange={(e) => setSettingsCity(e.target.value)} placeholder="Paris" />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Pays</label>
                  <input className="form-input" value={settingsCountry} onChange={(e) => setSettingsCountry(e.target.value)} placeholder="France" />
                </div>
                <div className="form-group">
                  <label className="form-label">SIRET</label>
                  <input className="form-input" value={settingsSiret} onChange={(e) => setSettingsSiret(e.target.value)} placeholder="" />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">N° TVA (optionnel)</label>
                  <input className="form-input" value={settingsVatNumber} onChange={(e) => setSettingsVatNumber(e.target.value)} placeholder="FR…" />
                </div>
                <div className="form-group">
                  <label className="form-label">Ton email par défaut</label>
                  <input className="form-input" value={settingsEmailTone} onChange={(e) => setSettingsEmailTone(e.target.value)} placeholder="professionnel / chaleureux / formel" />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">IBAN (optionnel)</label>
                  <input className="form-input" value={settingsIban} onChange={(e) => setSettingsIban(e.target.value)} placeholder="" />
                </div>
                <div className="form-group">
                  <label className="form-label">BIC (optionnel)</label>
                  <input className="form-input" value={settingsBic} onChange={(e) => setSettingsBic(e.target.value)} placeholder="" />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 12 }}>
                <button
                  className="btn btn-primary"
                  type="button"
                  onClick={async () => {
                    try {
                      if (!supabase || !userId) throw new Error('Session manquante')
                      setLoading(true)

                      const payload: any = {
                        first_name: settingsFirstName || null,
                        last_name: settingsLastName || null,
                        job: settingsJob || null,
                        email_tone: settingsEmailTone || null,
                        company_name: settingsCompanyName || null,
                        experience_years: (() => {
                          const n = Number(settingsExperienceYears || '')
                          return Number.isFinite(n) && n >= 0 ? n : null
                        })(),
                        skills: (() => {
                          const arr = String(settingsSkills || '')
                            .split(',')
                            .map((s) => s.trim())
                            .filter(Boolean)
                          return arr.length ? arr : null
                        })(),
                        address: settingsAddress || null,
                        postal_code: settingsPostalCode || null,
                        city: settingsCity || null,
                        country: settingsCountry || null,
                        siret: settingsSiret || null,
                        vat_number: settingsVatNumber || null,
                        iban: settingsIban || null,
                        bic: settingsBic || null,
                      }

                      let { error } = await supabase.from('profiles').update(payload).eq('id', userId)
                      if (error) {
                        const msg = String((error as any)?.message || '')
                        if (msg.includes('experience_years') || msg.includes('skills')) {
                          const fallback: any = { ...payload }
                          delete fallback.experience_years
                          delete fallback.skills
                          ;({ error } = await supabase.from('profiles').update(fallback).eq('id', userId))
                        }
                      }
                      if (error) throw error

                      // Refresh display fields
                      const full = [settingsFirstName, settingsLastName].filter(Boolean).join(' ').trim()
                      setUserFullName(full || 'Utilisateur')
                      setUserJob(settingsJob)
                      setUserDefaultTone(settingsEmailTone)

                      notify('Profil mis à jour', 'success')
                    } catch (e: any) {
                      notify(e?.message || 'Erreur mise à jour profil', 'error')
                    } finally {
                      setLoading(false)
                    }
                  }}
                >
                  Enregistrer
                </button>
              </div>
            </div>
            ) : null}
          </div>
        </div>
      </main>

      {/* Feedback survey modal */}
      {feedbackSurveyOpen ? (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 9998, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 18 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setFeedbackSurveyOpen(false)
          }}
        >
          <div style={{ width: 'min(820px, 100%)', background: 'white', borderRadius: 18, border: '1px solid rgba(0,0,0,0.08)', boxShadow: '0 20px 60px rgba(0,0,0,0.28)', overflow: 'hidden' }}>
            <div style={{ padding: '16px 18px', borderBottom: '1px solid rgba(0,0,0,0.08)', background: 'var(--gray-50)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div>
                <div style={{ fontWeight: 900, fontSize: 16 }}>Ton avis (1 minute)</div>
                <div style={{ marginTop: 3, fontSize: 13, color: 'var(--gray-600)' }}>Note chaque outil et laisse un commentaire rapide (optionnel).</div>
              </div>
              <button className="btn btn-secondary" type="button" onClick={() => setFeedbackSurveyOpen(false)}>
                Fermer
              </button>
            </div>

            <div style={{ padding: 18, display: 'grid', gridTemplateColumns: '1fr', gap: 12, maxHeight: '72vh', overflow: 'auto' }}>
              {(
                [
                  { key: 'devis', label: 'Devis' },
                  { key: 'facture', label: 'Factures' },
                  { key: 'contrat', label: 'Contrats' },
                  { key: 'assistant', label: 'Assistant IA' },
                  { key: 'juriste', label: 'Question juriste' },
                ] as const
              ).map((t) => (
                <div key={t.key} style={{ border: '1px solid rgba(0,0,0,0.08)', borderRadius: 16, padding: 14 }}>
                  <div style={{ fontWeight: 900, marginBottom: 8 }}>{t.label}</div>

                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                    {[1, 2, 3, 4, 5].map((n) => {
                      const active = (feedbackSurveyRatings[t.key] || 0) >= n
                      return (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setFeedbackSurveyRatings((prev) => ({ ...prev, [t.key]: n }))}
                          style={{
                            width: 38,
                            height: 38,
                            borderRadius: 12,
                            border: '1px solid rgba(0,0,0,0.12)',
                            background: active ? 'var(--yellow)' : 'white',
                            cursor: 'pointer',
                            fontSize: 18,
                            lineHeight: '38px',
                          }}
                          aria-label={`${t.label} ${n} étoiles`}
                          title={`${n}/5`}
                        >
                          ★
                        </button>
                      )
                    })}
                    <div style={{ marginLeft: 6, fontSize: 13, color: 'var(--gray-500)' }}>{feedbackSurveyRatings[t.key] || 0}/5</div>
                  </div>

                  <textarea
                    value={feedbackSurveyComments[t.key] || ''}
                    onChange={(e) => setFeedbackSurveyComments((prev) => ({ ...prev, [t.key]: e.target.value }))}
                    placeholder="Commentaire (optionnel)"
                    style={{ width: '100%', marginTop: 10, minHeight: 70, resize: 'vertical', padding: '10px 12px', borderRadius: 14, border: '1px solid rgba(0,0,0,0.12)', fontFamily: 'inherit' }}
                  />
                </div>
              ))}
            </div>

            <div style={{ padding: 18, borderTop: '1px solid rgba(0,0,0,0.08)', display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>0/5 = pas utilisé / pas d'avis.</div>
              <button
                className="btn btn-primary"
                type="button"
                disabled={
                  feedbackSurveySending ||
                  !Object.values(feedbackSurveyRatings || {}).some((v) => Number(v || 0) >= 1)
                }
                onClick={async () => {
                  try {
                    if (!Object.values(feedbackSurveyRatings || {}).some((v) => Number(v || 0) >= 1)) {
                      notify('Mets au moins 1 étoile sur un outil pour envoyer.', 'info')
                      return
                    }

                    if (!supabase) throw new Error('Supabase non initialisé')
                    const { data } = await supabase.auth.getSession()
                    const token = data.session?.access_token
                    if (!token) throw new Error('Non connecté')

                    setFeedbackSurveySending(true)
                    const res = await fetch('/api/feedback-survey', {
                      method: 'POST',
                      headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
                      body: JSON.stringify({ ratings: feedbackSurveyRatings, comments: feedbackSurveyComments }),
                    })
                    const json = await res.json().catch(() => null)
                    if (!res.ok) throw new Error(json?.error || `Erreur survey (${res.status})`)

                    setFeedbackSurveyOpen(false)
                    notify('Merci ! Ton feedback a bien été envoyé.', 'success')
                  } catch (e: any) {
                    notify(e?.message || 'Erreur envoi feedback', 'error')
                  } finally {
                    setFeedbackSurveySending(false)
                  }
                }}
              >
                {feedbackSurveySending ? 'Envoi…' : 'Envoyer'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Toast */}
      {toast ? (
        <div
          style={{
            position: 'fixed',
            left: 16,
            right: 16,
            bottom: 16,
            zIndex: 9999,
            display: 'flex',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              width: 'min(520px, 100%)',
              pointerEvents: 'auto',
              background: toast.type === 'error' ? 'rgba(17,17,17,0.96)' : 'rgba(17,17,17,0.92)',
              color: 'white',
              borderRadius: 16,
              padding: '12px 14px',
              border:
                toast.type === 'success'
                  ? '1px solid rgba(34,197,94,0.35)'
                  : toast.type === 'error'
                    ? '1px solid rgba(239,68,68,0.35)'
                    : '1px solid rgba(250,204,21,0.35)',
              boxShadow: '0 18px 50px rgba(0,0,0,0.35)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12,
            }}
          >
            <div style={{ marginTop: 2, flex: 1 }}>
              <div style={{ fontWeight: 900, fontSize: 13, letterSpacing: 0.2 }}>
                {toast.title || (toast.type === 'success' ? 'OK' : toast.type === 'error' ? 'Erreur' : 'Info')}
              </div>
              <div style={{ marginTop: 3, fontSize: 13, color: 'rgba(255,255,255,0.88)', lineHeight: 1.45, whiteSpace: 'pre-line' }}>
                {toast.message}
              </div>
            </div>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ padding: '8px 10px', borderRadius: 12, background: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.12)', color: 'white' }}
              onClick={() => setToast(null)}
            >
              Fermer
            </button>
          </div>
        </div>
      ) : null}

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

                  if (planCode !== 'pro' && (clients?.length || 0) >= 3) {
                    alert('Limite du plan Free atteinte : 3 clients maximum. Passe Pro pour illimité.')
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

      {/* Feedback modal */}
      <ModalShell
        open={feedbackOpen}
        title="Feedback"
        onClose={() => {
          setFeedbackOpen(false)
          setFeedbackText('')
        }}
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button
              className="btn btn-secondary"
              type="button"
              onClick={() => {
                setFeedbackOpen(false)
                setFeedbackText('')
              }}
              disabled={feedbackSending}
            >
              Fermer
            </button>
            <button
              className="btn btn-primary"
              type="button"
              disabled={feedbackSending || feedbackText.trim().length < 3}
              onClick={async () => {
                try {
                  if (!supabase) throw new Error('Supabase non initialisé')
                  const { data } = await supabase.auth.getSession()
                  const token = data.session?.access_token
                  if (!token) throw new Error('Non connecté')

                  setFeedbackSending(true)
                  setFeedbackSent(false)
                  const res = await fetch('/api/feedback', {
                    method: 'POST',
                    headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
                    body: JSON.stringify({ message: feedbackText.trim(), page: window.location.pathname + window.location.search }),
                  })
                  const json = await res.json().catch(() => null)
                  if (!res.ok) throw new Error(json?.error || `Erreur feedback (${res.status})`)
                  setFeedbackSent(true)
                  setFeedbackText('')
                } catch (e: any) {
                  notify(e?.message || 'Erreur feedback', 'error')
                } finally {
                  setFeedbackSending(false)
                }
              }}
            >
              {feedbackSending ? 'Envoi…' : 'Envoyer'}
            </button>
          </div>
        }
      >
        <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: 13, color: 'rgba(0,0,0,0.65)' }}>
            Décris le bug ou l'idée. Plus c'est précis, plus on corrige vite.
          </div>
          <textarea
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            placeholder="Ex: Sur mobile, le bouton X ne marche pas…"
            style={{ width: '100%', minHeight: 140, resize: 'vertical', padding: '12px 14px', borderRadius: 12, border: '1px solid rgba(0,0,0,0.12)', fontFamily: 'inherit' }}
          />
          {feedbackSent ? <div style={{ fontSize: 13, color: '#15803d' }}>Merci ! Feedback envoyé ✅</div> : null}
        </div>
      </ModalShell>
    </>
  )
}
