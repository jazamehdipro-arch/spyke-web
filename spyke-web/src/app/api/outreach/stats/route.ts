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
    if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const { data: userData, error: userError } = await supabaseAuth.auth.getUser()
    if (userError || !userData.user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    if (userData.user.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase())
      return NextResponse.json({ error: 'Accès réservé admin' }, { status: 403 })

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const [{ count: total }, { count: pending }, { count: sent }, { count: error }] = await Promise.all([
      supabaseAdmin.from('outreach_contacts').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('outreach_contacts').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabaseAdmin.from('outreach_contacts').select('id', { count: 'exact', head: true }).eq('status', 'sent'),
      supabaseAdmin.from('outreach_contacts').select('id', { count: 'exact', head: true }).eq('status', 'error'),
    ])

    // Last 50 contacts
    const { data: recent } = await supabaseAdmin
      .from('outreach_contacts')
      .select('id, email, name, job_title, status, sent_at, created_at')
      .order('created_at', { ascending: false })
      .limit(50)

    return NextResponse.json({ total, pending, sent, error, recent: recent ?? [] })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Erreur interne'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
