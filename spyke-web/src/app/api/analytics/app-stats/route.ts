import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

const ADMIN_EMAIL = 'Jazamehdi.pro@gmail.com'

function periodRange(days: number, offset: number) {
  const now = new Date()
  const end = new Date(now)
  end.setDate(end.getDate() - days * offset)
  const start = new Date(end)
  start.setDate(start.getDate() - days)
  return { start: start.toISOString(), end: end.toISOString() }
}

export async function GET(req: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

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
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

    const db = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const days = 30
    const cur = periodRange(days, 0)
    const prev = periodRange(days, 1)
    const longStart = periodRange(days, 0).start

    async function countRange(table: string, range: { start: string; end: string }) {
      const { count } = await db
        .from(table)
        .select('*', { count: 'exact', head: true })
        .gte('created_at', range.start)
        .lt('created_at', range.end)
      return count ?? 0
    }

    async function dailyBreakdown(table: string) {
      const { data } = await db
        .from(table)
        .select('created_at')
        .gte('created_at', longStart)
        .order('created_at', { ascending: true })

      const byDay: Record<string, number> = {}
      for (const row of (data ?? []) as { created_at: string }[]) {
        const day = row.created_at.slice(0, 10)
        byDay[day] = (byDay[day] || 0) + 1
      }
      return Object.entries(byDay).map(([day, count]) => ({ day, count }))
    }

    const tables = ['profiles', 'quotes', 'invoices', 'contracts'] as const

    const [
      usersCur, usersPrev, usersDaily,
      quotesCur, quotesPrev, quotesDaily,
      invoicesCur, invoicesPrev, invoicesDaily,
      contractsCur, contractsPrev, contractsDaily,
    ] = await Promise.all([
      countRange('profiles', cur), countRange('profiles', prev), dailyBreakdown('profiles'),
      countRange('quotes', cur), countRange('quotes', prev), dailyBreakdown('quotes'),
      countRange('invoices', cur), countRange('invoices', prev), dailyBreakdown('invoices'),
      countRange('contracts', cur), countRange('contracts', prev), dailyBreakdown('contracts'),
    ])

    void tables

    return NextResponse.json({
      users: { cur: usersCur, prev: usersPrev, daily: usersDaily },
      quotes: { cur: quotesCur, prev: quotesPrev, daily: quotesDaily },
      invoices: { cur: invoicesCur, prev: invoicesPrev, daily: invoicesDaily },
      contracts: { cur: contractsCur, prev: contractsPrev, daily: contractsDaily },
    })
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Erreur' }, { status: 500 })
  }
}
