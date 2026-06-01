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

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const supabase = getSupabaseAdmin()

  const [userRes, profileRes, invoicesRes, quotesRes, clientsRes, contractsRes] = await Promise.all([
    supabase.auth.admin.getUserById(id),
    supabase.from('profiles').select('*').eq('id', id).single(),
    supabase.from('invoices').select('id, number, created_at, total_ttc, status, buyer_snapshot').eq('user_id', id).order('created_at', { ascending: false }).limit(50),
    supabase.from('quotes').select('id, number, created_at, total_ttc, status, buyer_snapshot').eq('user_id', id).order('created_at', { ascending: false }).limit(50),
    supabase.from('clients').select('id, name, created_at').eq('user_id', id).order('created_at', { ascending: false }).limit(50),
    supabase.from('contracts').select('id, title, created_at, status').eq('user_id', id).order('created_at', { ascending: false }).limit(50).then(r => r).catch(() => ({ data: [] })),
  ])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const clientName = (snapshot: any) => snapshot?.name ?? snapshot?.company_name ?? snapshot?.company ?? null

  return NextResponse.json({
    user: userRes.data.user,
    profile: profileRes.data,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    factures: (invoicesRes.data ?? []).map((inv: any) => ({
      id: inv.id,
      numero: inv.number,
      created_at: inv.created_at,
      montant_ttc: inv.total_ttc,
      statut: inv.status,
      client_nom: clientName(inv.buyer_snapshot),
    })),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    devis: (quotesRes.data ?? []).map((q: any) => ({
      id: q.id,
      numero: q.number,
      created_at: q.created_at,
      montant_ttc: q.total_ttc,
      statut: q.status,
      client_nom: clientName(q.buyer_snapshot),
    })),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    clients: (clientsRes.data ?? []).map((c: any) => ({
      id: c.id,
      nom: c.name,
      created_at: c.created_at,
    })),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    contrats: ((contractsRes as { data: any[] | null }).data ?? []).map((c: any) => ({
      id: c.id,
      titre: c.title,
      created_at: c.created_at,
      statut: c.status,
    })),
  })
}
