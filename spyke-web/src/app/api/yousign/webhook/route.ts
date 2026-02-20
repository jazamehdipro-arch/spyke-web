import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { yousignFetch } from '@/lib/yousign'

export const runtime = 'nodejs'

function extractSignatureRequestId(payload: any): string {
  const direct = payload?.signature_request_id || payload?.signatureRequestId || payload?.signature_request?.id
  if (direct) return String(direct)

  const d = payload?.data
  const nested = d?.signature_request_id || d?.signatureRequestId || d?.signature_request?.id || d?.signature_request?.signature_request_id
  if (nested) return String(nested)

  // Try common keys
  for (const k of ['signature_request', 'signatureRequest', 'signature_request_id']) {
    const v = payload?.[k]
    if (v?.id) return String(v.id)
    if (typeof v === 'string') return v
  }
  return ''
}

function extractEventName(payload: any): string {
  return String(payload?.event_name || payload?.eventName || payload?.name || payload?.type || '')
}

export async function POST(req: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: 'Supabase env missing' }, { status: 500 })
    }

    const payload = await req.json().catch(() => ({}))
    const eventName = extractEventName(payload)
    const providerRequestId = extractSignatureRequestId(payload)

    if (!providerRequestId) {
      return NextResponse.json({ ok: true, ignored: true, reason: 'Missing signature_request id' })
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const { data: sr, error: srErr } = await supabaseAdmin
      .from('signature_requests')
      .select('id,user_id,contract_id,provider_request_id,status')
      .eq('provider', 'yousign')
      .eq('provider_request_id', providerRequestId)
      .maybeSingle()

    if (srErr) throw srErr
    if (!sr) return NextResponse.json({ ok: true, ignored: true, reason: 'Not found' })

    // Update status best-effort
    let newStatus = (sr as any).status
    if (eventName.startsWith('signature_request.')) {
      newStatus = eventName.replace('signature_request.', '')
    }

    let signedPdfPath: string | null = null

    // On completion, download signed PDF and store it
    if (eventName === 'signature_request.done') {
      try {
        const pdfRes = await yousignFetch(`signature_requests/${providerRequestId}/documents/download`, { method: 'GET' })
        const bytes = new Uint8Array(await pdfRes.arrayBuffer())

        const bucket = 'signed-documents'
        const contractId = String((sr as any).contract_id || 'contract')
        const filePath = `${(sr as any).user_id}/contracts/${contractId}/signed-${providerRequestId}.pdf`

        const { error: upErr } = await supabaseAdmin.storage
          .from(bucket)
          .upload(filePath, new Blob([bytes], { type: 'application/pdf' }), { upsert: true, contentType: 'application/pdf' } as any)

        if (!upErr) signedPdfPath = filePath
      } catch {
        // ignore download/upload errors
      }
    }

    const update: any = {
      status: newStatus,
      last_event_name: eventName || null,
      last_event_payload: payload || null,
      last_webhook_at: new Date().toISOString(),
    }
    if (signedPdfPath) update.signed_pdf_path = signedPdfPath

    await supabaseAdmin.from('signature_requests').update(update).eq('id', (sr as any).id)

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error' }, { status: 400 })
  }
}
