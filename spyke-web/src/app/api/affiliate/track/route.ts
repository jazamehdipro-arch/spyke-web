import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !supabaseAnon || !serviceKey)
      return NextResponse.json({ error: 'Env missing' }, { status: 500 })

    const authHeader = req.headers.get('authorization') || ''
    const token = authHeader.match(/^Bearer\s+(.+)$/i)?.[1]
    if (!token) return NextResponse.json({ error: 'Non autorise' }, { status: 401 })

    const supabaseAuth = createClient(supabaseUrl, supabaseAnon, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    })
    const { data, error } = await supabaseAuth.auth.getUser()
    if (error || !data.user) return NextResponse.json({ error: 'Non autorise' }, { status: 401 })

    const body = await req.json()
    const ref = String(body.ref || '').trim().toLowerCase()
    if (!ref) return NextResponse.json({ error: 'ref requis' }, { status: 400 })

    const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    // Only set if not already set
    await supabaseAdmin
      .from('profiles')
      .update({ affiliate_ref: ref } as any)
      .eq('id', data.user.id)
      .is('affiliate_ref', null)

    return NextResponse.json({ ok: true })
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Erreur' }, { status: 500 })
  }
}
