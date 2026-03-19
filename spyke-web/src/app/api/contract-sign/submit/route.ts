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

    // Download unsigned PDF
    const unsignedPath = String((link as any).pdf_url || '')
    const dl = await supabaseAdmin.storage.from('signed_contracts').download(unsignedPath)
    if (dl.error) throw dl.error
    const unsignedBuf = new Uint8Array(await dl.data.arrayBuffer())

    // Create signed PDF: embed the client signature into the contract signature block (last page).
    // This avoids adding an extra page and ensures the signature appears in the expected place.
    const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib')
    const doc = await PDFDocument.load(unsignedBuf)
    const helvetica = await doc.embedFont(StandardFonts.Helvetica)

    const imgRes = await supabaseAdmin.storage.from('contract_signatures').download(sigPath)
    if (imgRes.error) throw imgRes.error
    const imgBytes = new Uint8Array(await imgRes.data.arrayBuffer())

    // Support PNG/JPG
    let embedded: any
    try {
      embedded = await doc.embedPng(imgBytes)
    } catch {
      embedded = await doc.embedJpg(imgBytes)
    }

    const pages = doc.getPages()
    const lastPage = pages[pages.length - 1]

    // Coordinates tuned for Spyke's React-PDF contract layout (A4).
    // Bottom signature area: two columns.
    const pageW = lastPage.getWidth()
    // const pageH = lastPage.getHeight()

    const marginX = 44
    const gutter = 10
    const colW = (pageW - marginX * 2 - gutter) / 2

    // Client column is on the right.
    const x0 = marginX + colW + gutter
    const y0 = 88 // bottom box baseline

    // Signature box size
    const boxW = colW
    const boxH = 90

    // Draw a light signature box (so it looks intentional)
    lastPage.drawRectangle({ x: x0, y: y0, width: boxW, height: boxH, borderWidth: 1, borderColor: rgb(0.9, 0.9, 0.92) })

    // Place signature image inside
    const pad = 10
    const imgW = boxW - pad * 2
    const imgH = boxH - pad * 2
    lastPage.drawImage(embedded, { x: x0 + pad, y: y0 + pad, width: imgW, height: imgH })

    // Add date/place near the box (small)
    const dateLine = parsed.signedAt ? `Signé le : ${formatDateFr(parsed.signedAt) || parsed.signedAt}` : ''
    const placeLine = parsed.signedPlace ? `À : ${capitalizePlace(parsed.signedPlace)}` : ''
    if (dateLine) lastPage.drawText(dateLine, { x: x0, y: y0 + boxH + 18, size: 9.5, font: helvetica, color: rgb(0.1, 0.1, 0.1) })
    if (placeLine) lastPage.drawText(placeLine, { x: x0, y: y0 + boxH + 6, size: 9.5, font: helvetica, color: rgb(0.1, 0.1, 0.1) })

    const signedBytes = new Uint8Array((await doc.save()) as any)

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

    // Update contract status (best-effort)
    try {
      await supabaseAdmin.from('contracts').update({ status: 'signed' } as any).eq('id', contractId)
    } catch {
      // ignore
    }

    const { data: signedUrlData } = await supabaseAdmin.storage.from('signed_contracts').createSignedUrl(signedPath, 60 * 10)
    const pdfUrl = String((signedUrlData as any)?.signedUrl || '')

    return NextResponse.json({ ok: true, signedAt: signedAtIso, pdfUrl })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error' }, { status: 400 })
  }
}
