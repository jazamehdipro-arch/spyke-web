import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

const ADMIN_EMAIL = 'Jazamehdi.pro@gmail.com'

function requireEnv(name: string): string {
  const v = process.env[name]
  if (!v) throw new Error(`Missing env: ${name}`)
  return v
}

export async function GET(req: Request) {
  try {
    const supabaseUrl = requireEnv('NEXT_PUBLIC_SUPABASE_URL')
    const supabaseAnonKey = requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
    const serviceRoleKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY')

    const authHeader = req.headers.get('authorization') || ''
    const token = authHeader.match(/^Bearer\s+(.+)$/i)?.[1]
    if (!token) return NextResponse.json({ error: 'Non autorise' }, { status: 401 })

    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const { data: userData, error: userError } = await supabaseAuth.auth.getUser()
    if (userError || !userData.user) return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
    if (userData.user.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase())
      return NextResponse.json({ error: 'Acces reserve admin' }, { status: 403 })

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const { data: rows, error } = await supabaseAdmin
      .from('profiles')
      .select('affiliate_ref, plan, created_at')
      .not('affiliate_ref', 'is', null)

    if (error) throw error

    // Group by affiliate_ref
    const map: Record<string, { signups: number; pro: number; firstSignup: string | null }> = {}
    for (const row of rows ?? []) {
      const ref = row.affiliate_ref as string
      if (!map[ref]) map[ref] = { signups: 0, pro: 0, firstSignup: null }
      map[ref].signups++
      if (row.plan === 'pro') map[ref].pro++
      if (!map[ref].firstSignup || row.created_at < map[ref].firstSignup!) {
        map[ref].firstSignup = row.created_at
      }
    }

    const stats = Object.entries(map)
      .map(([code, v]) => ({
        code,
        signups: v.signups,
        pro: v.pro,
        commission: v.pro * 19.9,
        firstSignup: v.firstSignup,
      }))
      .sort((a, b) => b.signups - a.signups)

    return NextResponse.json({ stats })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Erreur interne'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
