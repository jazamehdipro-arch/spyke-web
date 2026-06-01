import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

const ADMIN_EMAIL = 'Jazamehdi.pro@gmail.com'

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

async function verifyAdmin(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return false
  const supabase = getSupabaseAdmin()
  const { data } = await supabase.auth.getUser(token)
  return data.user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()
}

export async function GET(req: NextRequest) {
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const supabase = getSupabaseAdmin()

  const { data: users, error } = await supabase.auth.admin.listUsers({ perPage: 1000 })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const ids = users.users.map((u) => u.id)

  const [profilesRes, invoicesRes, quotesRes, clientsRes, contractsRes] = await Promise.all([
    supabase.from('profiles').select('id, plan, affiliate_ref, full_name').in('id', ids),
    supabase.from('invoices').select('user_id').in('user_id', ids),
    supabase.from('quotes').select('user_id').in('user_id', ids),
    supabase.from('clients').select('user_id').in('user_id', ids),
    supabase.from('contracts').select('user_id').in('user_id', ids).then(r => r).catch(() => ({ data: [] })),
  ])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const profiles = new Map((profilesRes.data ?? []).map((p: any) => [p.id, p]))

  const countBy = (rows: { user_id: string }[] | null) => {
    const m = new Map<string, number>()
    for (const r of rows ?? []) m.set(r.user_id, (m.get(r.user_id) ?? 0) + 1)
    return m
  }

  const factureCounts = countBy(invoicesRes.data)
  const devisCounts = countBy(quotesRes.data)
  const clientCounts = countBy(clientsRes.data)
  const contratCounts = countBy((contractsRes as { data: { user_id: string }[] | null }).data)

  const result = users.users
    .map((u) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const p = profiles.get(u.id) as any
      return {
        id: u.id,
        email: u.email ?? '',
        created_at: u.created_at,
        last_sign_in: u.last_sign_in_at ?? null,
        full_name: (p?.full_name as string | null) ?? null,
        plan: (p?.plan as string) ?? 'free',
        affiliate_ref: (p?.affiliate_ref as string | null) ?? null,
        nb_factures: factureCounts.get(u.id) ?? 0,
        nb_devis: devisCounts.get(u.id) ?? 0,
        nb_clients: clientCounts.get(u.id) ?? 0,
        nb_contrats: contratCounts.get(u.id) ?? 0,
      }
    })
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  return NextResponse.json({ users: result })
}
