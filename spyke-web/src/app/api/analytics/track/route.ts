import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const BOT_UA_PATTERN = /bot|crawl|spider|slurp|scrape|fetch|monitor|headless|lighthouse|pingdom|uptime|curl|wget|python-requests|axios|node-fetch|go-http-client|java\/|okhttp|phantom|selenium|playwright|puppeteer|gptbot|claudebot|anthropic|openai|perplexity|bingpreview|facebookexternalhit|whatsapp|telegrambot|discordbot|slackbot|linkedinbot|twitterbot|pinterest|semrush|ahrefs|mj12|dotbot|petalbot|bytespider|yandex|baidu|duckduck|applebot/i

export async function POST(req: Request) {
  try {
    const { eventName, props } = (await req.json()) as {
      eventName?: string
      props?: Record<string, unknown>
    }

    if (!eventName || typeof eventName !== 'string' || eventName.length > 100) {
      return NextResponse.json({ ok: false, error: 'invalid_event' }, { status: 400 })
    }

    // Anti-bot: skip known crawlers/automation tools (empty UA is suspicious too)
    const userAgent = req.headers.get('user-agent') ?? ''
    if (!userAgent || BOT_UA_PATTERN.test(userAgent)) {
      return NextResponse.json({ ok: true, skipped: 'bot' })
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
      properties: { ...(props ?? {}), ua: userAgent.slice(0, 300) },
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 200 })
  }
}
