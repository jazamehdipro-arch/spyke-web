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

  const [userRes, profileRes, facturesRes, devisRes, clientsRes, contratsRes] = await Promise.all([
    supabase.auth.admin.getUserById(id),
    supabase.from('profiles').select('*').eq('id', id).single(),
    supabase.from('factures').select('id, numero, created_at, montant_ttc, statut, client_nom').eq('user_id', id).order('created_at', { ascending: false }).limit(50),
    supabase.from('devis').select('id, numero, created_at, montant_ttc, statut, client_nom').eq('user_id', id).order('created_at', { ascending: false }).limit(50),
    supabase.from('clients').select('id, nom, created_at').eq('user_id', id).order('created_at', { ascending: false }).limit(50),
    supabase.from('contrats').select('id, titre, created_at, statut').eq('user_id', id).order('created_at', { ascending: false }).limit(50).then(r => r).catch(() => ({ data: [] })),
  ])

  return NextResponse.json({
    user: userRes.data.user,
    profile: profileRes.data,
    factures: facturesRes.data ?? [],
    devis: devisRes.data ?? [],
    clients: clientsRes.data ?? [],
    contrats: (contratsRes as { data: unknown[] }).data ?? [],
  })
}
