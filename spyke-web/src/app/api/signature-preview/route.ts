import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

const HeaderSchema = z.object({
  authorization: z.string().min(1),
})

function requireEnv(name: string): string {
  const v = process.env[name]
  if (!v) throw new Error(`Missing env: ${name}`)
  return v
}

export async function GET(req: Request) {
  try {
    const url = requireEnv('NEXT_PUBLIC_SUPABASE_URL')
    const anonKey = requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
    const serviceRoleKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY')

    const headers = HeaderSchema.parse({ authorization: req.headers.get('authorization') || '' })
    const m = headers.authorization.match(/^Bearer\s+(.+)$/i)
    const token = m?.[1]
    if (!token) return NextResponse.json({ error: 'Missing bearer token' }, { status: 401 })

    const supabaseAuth = createClient(url, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const { data: userData, error: userErr } = await supabaseAuth.auth.getUser()
    if (userErr || !userData.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const supabaseAdmin = createClient(url, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('signature_path')
      .eq('id', userData.user.id)
      .maybeSingle()

    const signaturePath = String((profile as any)?.signature_path || '')
    if (!signaturePath) return NextResponse.json({ signaturePath: '', url: '' })

    const { data: signed } = await supabaseAdmin.storage.from('signatures').createSignedUrl(signaturePath, 60 * 10)
    const signedUrl = String((signed as any)?.signedUrl || '')

    return NextResponse.json({ signaturePath, url: signedUrl })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error' }, { status: 400 })
  }
}
