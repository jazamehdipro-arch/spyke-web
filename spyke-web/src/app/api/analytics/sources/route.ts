import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

const ADMIN_EMAIL = 'Jazamehdi.pro@gmail.com'

function categorize(referrer: string | null, utmSource: string | null): string {
  if (utmSource) {
    const s = utmSource.toLowerCase()
    if (s.includes('google')) return 'Google (campagne)'
    if (s.includes('facebook') || s.includes('fb') || s.includes('instagram')) return 'Meta (campagne)'
    if (s.includes('linkedin')) return 'LinkedIn (campagne)'
    if (s.includes('twitter') || s.includes('x.com')) return 'Twitter / X (campagne)'
    return `Campagne : ${utmSource}`
  }
  if (!referrer) return 'Direct / inconnu'
  try {
    const host = new URL(referrer).hostname.replace('www.', '')
    if (host.includes('google.')) return 'Google (organique)'
    if (host.includes('bing.')) return 'Bing'
    if (host.includes('yahoo.')) return 'Yahoo'
    if (host.includes('facebook.') || host.includes('instagram.')) return 'Meta (social)'
    if (host.includes('linkedin.')) return 'LinkedIn'
    if (host.includes('twitter.') || host === 'x.com' || host === 't.co') return 'Twitter / X'
    if (host.includes('tiktok.')) return 'TikTok'
    if (host.includes('reddit.')) return 'Reddit'
    if (host.includes('spykeapp.fr')) return 'Interne'
    return host
  } catch {
    return 'Direct / inconnu'
  }
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

    const url = new URL(req.url)
    const days = Number(url.searchParams.get('days') || 30)
    const since = new Date()
    since.setDate(since.getDate() - days)

    const db = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const { data } = await db
      .from('analytics_events')
      .select('properties')
      .eq('event_name', 'page_view')
      .gte('created_at', since.toISOString())
      .limit(5000)

    const counts: Record<string, number> = {}
    for (const row of (data ?? []) as { properties: Record<string, unknown> }[]) {
      const referrer = (row.properties?.referrer as string | null) || null
      const utmSource = (row.properties?.utm_source as string | null) || null
      const source = categorize(referrer, utmSource)
      counts[source] = (counts[source] || 0) + 1
    }

    const sources = Object.entries(counts)
      .map(([source, views]) => ({ source, views }))
      .sort((a, b) => b.views - a.views)

    return NextResponse.json({ sources, total: (data ?? []).length })
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Erreur' }, { status: 500 })
  }
}
