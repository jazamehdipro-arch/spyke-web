import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

function requireEnv(name: string): string {
  const v = process.env[name]
  if (!v) throw new Error(`Missing env: ${name}`)
  return v
}

const FormSchema = z.object({
  token: z.string().min(10),
  signedAt: z.string().optional().default(''),
  signedPlace: z.string().optional().default(''),
})

function capitalizePlace(raw: string) {
  const s = String(raw || '').trim()
  if (!s) return ''
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function formatDateFr(dateStr: string) {
  if (!dateStr) return ''
  const s = String(dateStr)
  const d = new Date(s.length === 10 ? s + 'T00:00:00' : s)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export async function POST(req: Request) {
  try {
    const supabaseUrl = requireEnv('NEXT_PUBLIC_SUPABASE_URL')
    const serviceRoleKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY')

    const form = await req.formData()
    const parsed = FormSchema.parse({
      token: form.get('token') || '',
      signedAt: form.get('signedAt') || '',
      signedPlace: form.get('signedPlace') || '',
    })

    const file = form.get('signature')
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Signature manquante' }, { status: 400 })
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const { data: link, error } = await supabaseAdmin
      .from('contract_sign_links')
      .select('*')
      .eq('token', parsed.token)
      .maybeSingle()
    if (error) throw error
    if (!link) return NextResponse.json({ error: 'Lien introuvable' }, { status: 404 })

    const exp = new Date(String((link as any).expires_at || '')).getTime()
    if (!Number.isNaN(exp) && Date.now() > exp && !(link as any).signed_at) {
      return NextResponse.json({ error: 'Lien expiré' }, { status: 410 })
    }
    if ((link as any).signed_at) {
      return NextResponse.json({ error: 'Déjà signé' }, { status: 409 })
    }

    const contractId = String((link as any).contract_id || '')
    if (!contractId) return NextResponse.json({ error: 'Contrat invalide' }, { status: 400 })

    // Upload signature image
    const sigBytes = new Uint8Array(await file.arrayBuffer())
    const sigPath = `client/${contractId}/${parsed.token}.png`
    const upSig = await supabaseAdmin.storage.from('contract_signatures').upload(sigPath, sigBytes as any, {
      contentType: file.type || 'image/png',
      upsert: true,
    })
    if (upSig.error) throw upSig.error

    // Build signed PDF via the same React-PDF renderer.
    // This guarantees signature placement identical to the freelancer signature.
    const { renderContractPdfReact } = await import('@/lib/renderContractPdfReact')

    // Load contract + seller/buyer snapshots
    const { data: contract, error: cErr } = await supabaseAdmin
      .from('contracts')
      .select('id,user_id,number,contract_text,buyer_snapshot,seller_snapshot,created_at')
      .eq('id', contractId)
      .maybeSingle()
    if (cErr) throw cErr

    const sellerSnap: any = (contract as any)?.seller_snapshot || {}
    const buyerSnap: any = (contract as any)?.buyer_snapshot || {}

    // freelancer signature (if any)
    let freelancerSigDataUrl = ''
    try {
      const { data: profile } = await supabaseAdmin.from('profiles').select('signature_path').eq('id', String((contract as any)?.user_id || '')).maybeSingle()
      const sp = String((profile as any)?.signature_path || '').trim()
      if (sp) {
        const { data: signed } = await supabaseAdmin.storage.from('signatures').createSignedUrl(sp, 60 * 10)
        const signedUrl = String((signed as any)?.signedUrl || '')
        if (signedUrl) {
          const r = await fetch(signedUrl)
          const ct = String(r.headers.get('content-type') || 'image/png')
          const ab = await r.arrayBuffer()
          freelancerSigDataUrl = `data:${ct};base64,${Buffer.from(ab).toString('base64')}`
        }
      }
    } catch {
      freelancerSigDataUrl = ''
    }

    // client signature -> data URL
    const imgRes = await supabaseAdmin.storage.from('contract_signatures').download(sigPath)
    if (imgRes.error) throw imgRes.error
    const imgBytes = new Uint8Array(await imgRes.data.arrayBuffer())
    const clientSigDataUrl = `data:${file.type || 'image/png'};base64,${Buffer.from(imgBytes).toString('base64')}`

    const signedBytes = await renderContractPdfReact({
      title: 'Contrat de prestation de services',
      date: String((contract as any)?.created_at || '').slice(0, 10),
      contractNumber: String((contract as any)?.number || ''),
      contractText: String((contract as any)?.contract_text || ''),
      seller: {
        name: String(sellerSnap?.name || ''),
        siret: String(sellerSnap?.siret || ''),
        address: String(sellerSnap?.address || ''),
        activity: String(sellerSnap?.activity || ''),
        email: String(sellerSnap?.email || ''),
      },
      buyer: {
        name: String(buyerSnap?.name || ''),
        siret: String(buyerSnap?.siret || ''),
        representant: String(buyerSnap?.representant || ''),
        address: String(buyerSnap?.address || ''),
        email: String(buyerSnap?.email || ''),
      },
      includeSignature: Boolean(freelancerSigDataUrl),
      signatureDataUrl: freelancerSigDataUrl,
      clientSignatureDataUrl: clientSigDataUrl,
      clientSignedAt: formatDateFr(parsed.signedAt) || parsed.signedAt,
      clientSignedPlace: capitalizePlace(parsed.signedPlace),
    })

    const signedPath = `signed/${contractId}/${parsed.token}.pdf`
    const upPdf = await supabaseAdmin.storage.from('signed_contracts').upload(signedPath, signedBytes as any, {
      contentType: 'application/pdf',
      upsert: true,
    })
    if (upPdf.error) throw upPdf.error

    const ip = String(req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '')
    const ua = String(req.headers.get('user-agent') || '')

    const signedAtIso = new Date().toISOString()

    await supabaseAdmin
      .from('contract_sign_links')
      .update({
        signed_at: signedAtIso,
        signed_place: String(parsed.signedPlace || ''),
        signature_path: sigPath,
        signed_pdf_path: signedPath,
        signer_ip: ip,
        signer_user_agent: ua,
      } as any)
      .eq('token', parsed.token)

    // Update contract status + store signed PDF path (best-effort)
    try {
      await supabaseAdmin
        .from('contracts')
        .update({ status: 'signed', signed_pdf_path: signedPath, signed_at: signedAtIso } as any)
        .eq('id', contractId)
    } catch {
      // ignore (column may not exist)
    }

    const { data: signedUrlData } = await supabaseAdmin.storage.from('signed_contracts').createSignedUrl(signedPath, 60 * 10)
    const pdfUrl = String((signedUrlData as any)?.signedUrl || '')

    return NextResponse.json({ ok: true, signedAt: signedAtIso, pdfUrl })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error' }, { status: 400 })
  }
}
