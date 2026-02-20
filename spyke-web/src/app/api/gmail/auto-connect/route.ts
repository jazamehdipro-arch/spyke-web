import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

const HeaderSchema = z.object({
  authorization: z.string().min(1),
})

const BodySchema = z.object({
  refresh_token: z.string().min(10),
  gmail_email: z.string().email().optional(),
})

function requireEnv(name: string): string {
  const v = process.env[name]
  if (!v) throw new Error(`Missing env: ${name}`)
  return v
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
    const email = (body.gmail_email || userData.user.email || '').trim()

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const { error: upErr } = await supabaseAdmin.from('google_gmail_tokens').upsert(
      {
        user_id: userId,
        refresh_token: body.refresh_token,
        gmail_email: email || null,
        updated_at: new Date().toISOString(),
      } as any,
      { onConflict: 'user_id' }
    )

    if (upErr) throw upErr

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error' }, { status: 400 })
  }
}
