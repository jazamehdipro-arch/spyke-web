import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

const QuerySchema = z.object({
  token: z.string().min(10),
})

function requireEnv(name: string): string {
  const v = process.env[name]
  if (!v) throw new Error(`Missing env: ${name}`)
  return v
}

export async function GET(req: Request) {
  try {
    const supabaseUrl = requireEnv('NEXT_PUBLIC_SUPABASE_URL')
    const serviceRoleKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY')

    const url = new URL(req.url)
    const parsed = QuerySchema.safeParse({ token: url.searchParams.get('token') || '' })
    if (!parsed.success) {
      return NextResponse.json({ error: 'Lien de signature invalide' }, { status: 400 })
    }
    const { token } = parsed.data

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const { data: link, error } = await supabaseAdmin
      .from('contract_sign_links')
      .select('id,contract_id,token,pdf_url,expires_at,signed_at,signed_pdf_path,buyer_name')
      .eq('token', token)
      .maybeSingle()
    if (error) throw error
    if (!link) return NextResponse.json({ error: 'Lien introuvable' }, { status: 404 })

    const now = Date.now()
    const exp = new Date(String((link as any).expires_at || '')).getTime()
    if (!Number.isNaN(exp) && now > exp && !(link as any).signed_at) {
      return NextResponse.json({ error: 'Lien expiré' }, { status: 410 })
    }

    const bucket = 'signed_contracts'
    const unsignedPath = String((link as any).pdf_url || '')
    const signedPath = String((link as any).signed_pdf_path || '')
    const isSigned = Boolean((link as any).signed_at)

    const path = isSigned && signedPath ? signedPath : unsignedPath
    const { data: signed } = await supabaseAdmin.storage.from(bucket).createSignedUrl(path, 60 * 10)
    const pdfSignedUrl = String((signed as any)?.signedUrl || '')
    if (!pdfSignedUrl) return NextResponse.json({ error: 'PDF indisponible' }, { status: 500 })

    return NextResponse.json({
      ok: true,
      token,
      expiresAt: (link as any).expires_at,
      signedAt: (link as any).signed_at,
      buyerName: String((link as any).buyer_name || ''),
      pdfUrl: pdfSignedUrl,
      isSigned,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error' }, { status: 400 })
  }
}
