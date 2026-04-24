import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  try {
    const { eventName, props } = (await req.json()) as {
      eventName?: string
      props?: Record<string, unknown>
    }

    if (!eventName || typeof eventName !== 'string' || eventName.length > 100) {
      return NextResponse.json({ ok: false, error: 'invalid_event' }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ ok: false, error: 'server_not_configured' }, { status: 500 })
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const url = new URL(req.url)
    const rawPath = (props && typeof props.path === 'string' && props.path) || url.searchParams.get('path') || null
    const path = rawPath ? String(rawPath).split('?')[0] : null

    await supabaseAdmin.from('analytics_events').insert({
      event_name: eventName,
      path,
      properties: props ?? {},
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 200 })
  }
}
