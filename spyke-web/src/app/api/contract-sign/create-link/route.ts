import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'
import crypto from 'node:crypto'
import { renderContractPdfReact } from '@/lib/renderContractPdfReact'

export const runtime = 'nodejs'

const HeaderSchema = z.object({
  authorization: z.string().min(1),
})

const BodySchema = z.object({
  contractId: z.string().min(1),
  expiresInDays: z.number().int().min(1).max(60).default(14),
})

function requireEnv(name: string): string {
  const v = process.env[name]
  if (!v) throw new Error(`Missing env: ${name}`)
  return v
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
    const supabaseAnonKey = requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
    const serviceRoleKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY')

    const headers = HeaderSchema.parse({ authorization: req.headers.get('authorization') || '' })
    const m = headers.authorization.match(/^Bearer\s+(.+)$/i)
    const token = m?.[1]
    if (!token) return NextResponse.json({ error: 'Missing bearer token' }, { status: 401 })

    const body = BodySchema.parse(await req.json().catch(() => ({})))

    // Identify user
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    })
    const { data: userData, error: userError } = await supabaseAuth.auth.getUser()
    if (userError || !userData.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = userData.user.id
    const contractId = String(body.contractId)

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    // Load contract (owner-only)
    const { data: contract, error: cErr } = await supabaseAdmin
      .from('contracts')
      .select('id,user_id,number,client_id,title,status,contract_text,mission_start,mission_end,amount_ht,tva_regime,buyer_snapshot,seller_snapshot,created_at')
      .eq('id', contractId)
      .maybeSingle()
    if (cErr) throw cErr
    if (!contract) return NextResponse.json({ error: 'Contrat introuvable' }, { status: 404 })
    if (String((contract as any).user_id) !== userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // Load profile (seller snapshot fallback)
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('full_name,company_name,address,postal_code,city,country,siret,job')
      .eq('id', userId)
      .maybeSingle()

    const sellerSnap: any = (contract as any).seller_snapshot || null
    const buyerSnap: any = (contract as any).buyer_snapshot || null

    const sellerName = String(sellerSnap?.name || (profile as any)?.company_name || (profile as any)?.full_name || 'Prestataire')
    const sellerSiret = String(sellerSnap?.siret || (profile as any)?.siret || '')
    const sellerAddress = String(
      sellerSnap?.address ||
        [
          (profile as any)?.address,
          [(profile as any)?.postal_code, (profile as any)?.city].filter(Boolean).join(' '),
          (profile as any)?.country,
        ]
          .filter(Boolean)
          .join(', ')
    )
    const sellerActivity = String(sellerSnap?.activity || (profile as any)?.job || '')
    const sellerEmail = String(sellerSnap?.email || userData.user.email || '')

    const buyerName = String(buyerSnap?.name || '')
    const buyerSiret = String(buyerSnap?.siret || '')
    const buyerRepresentant = String(buyerSnap?.representant || '')
    const buyerAddress = String(buyerSnap?.address || '')
    const buyerEmail = String(buyerSnap?.email || '')

    const contractNumber = String((contract as any).number || '')
    const dateStr = formatDateFr(String((contract as any).created_at || '').slice(0, 10))

    // Build PDF using the same React-PDF renderer as Spyke (matches the contract the user sees)
    const filled = await renderContractPdfReact({
      title: 'Contrat de prestation de services',
      date: dateStr,
      contractNumber,
      contractText: String((contract as any)?.contract_text || ''),
      seller: {
        name: sellerName,
        siret: sellerSiret,
        address: sellerAddress,
        activity: sellerActivity,
        email: sellerEmail,
      },
      buyer: {
        name: buyerName,
        siret: buyerSiret,
        representant: buyerRepresentant,
        address: buyerAddress,
        email: buyerEmail,
      },
      includeSignature: false,
    })

    // Create signing link
    const tokenStr = crypto.randomBytes(24).toString('hex')
    const expiresAt = new Date(Date.now() + Number(body.expiresInDays) * 24 * 60 * 60 * 1000)

    const unsignedPath = `unsigned/${contractId}/${tokenStr}.pdf`
    const { error: upErr } = await supabaseAdmin.storage
      .from('signed_contracts')
      .upload(unsignedPath, filled as any, { contentType: 'application/pdf', upsert: true })
    if (upErr) {
      const msg = String((upErr as any)?.message || upErr)
      if (msg.toLowerCase().includes('bucket') && msg.toLowerCase().includes('not found')) {
        throw new Error("Bucket Supabase manquant. Applique la migration SQL (contract_sign_links + buckets) sur Supabase.")
      }
      throw upErr
    }

    const { data: row, error: insErr } = await supabaseAdmin
      .from('contract_sign_links')
      .insert({
        contract_id: contractId,
        token: tokenStr,
        pdf_url: unsignedPath,
        buyer_name: buyerName,
        buyer_email: buyerEmail,
        expires_at: expiresAt.toISOString(),
      } as any)
      .select('token,expires_at')
      .single()
    if (insErr) throw insErr

    const origin = req.headers.get('origin') || ''
    const signUrl = `${origin}/sign/contract/${encodeURIComponent(tokenStr)}`

    return NextResponse.json({ ok: true, token: row.token, expiresAt: row.expires_at, signUrl })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error' }, { status: 400 })
  }
}
