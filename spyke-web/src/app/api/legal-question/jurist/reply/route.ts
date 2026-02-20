import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

const BodySchema = z.object({
  id: z.string().min(1),
  token: z.string().min(10),
  content: z.string().min(2).max(8000),
})

function requireEnv(name: string): string {
  const v = process.env[name]
  if (!v) throw new Error(`Missing env: ${name}`)
  return v
}

function getAdminClient() {
  const url = requireEnv('NEXT_PUBLIC_SUPABASE_URL')
  const serviceKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY')
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

async function sendNotificationEmail(opts: {
  to: string
  subject: string
  text: string
}) {
  const resendKey = process.env.RESEND_API_KEY
  const resendFrom = process.env.RESEND_FROM_EMAIL
  if (!resendKey || !resendFrom) return { ok: false as const, error: 'Resend not configured' }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: resendFrom,
      to: [opts.to],
      subject: opts.subject,
      text: opts.text,
    }),
  })

  if (!res.ok) {
    const j = await res.json().catch(() => null)
    return { ok: false as const, error: j?.message || `Resend failed (${res.status})` }
  }
  return { ok: true as const }
}

export async function POST(req: Request) {
  try {
    const body = BodySchema.parse(await req.json().catch(() => ({})))
    const supabase = getAdminClient()

    const { data: q, error: qErr } = await supabase
      .from('legal_questions')
      .select('id,user_id,question,user_email,status')
      .eq('id', body.id)
      .eq('jurist_token', body.token)
      .maybeSingle()

    if (qErr) throw qErr
    if (!q) return NextResponse.json({ error: 'Lien invalide' }, { status: 404 })

    // Store jurist message
    const nowIso = new Date().toISOString()
    const { error: insErr } = await supabase.from('legal_question_messages').insert({
      legal_question_id: body.id,
      role: 'jurist',
      content: body.content.trim(),
      created_at: nowIso,
    } as any)
    if (insErr) throw insErr

    // Pick destination: gmail_email if connected, else user_email
    const userId = String((q as any).user_id || '')
    let to = String((q as any).user_email || '').trim()

    if (userId) {
      const { data: tokenRow } = await supabase
        .from('google_gmail_tokens')
        .select('gmail_email')
        .eq('user_id', userId)
        .maybeSingle()
      const gmailEmail = String((tokenRow as any)?.gmail_email || '').trim()
      if (gmailEmail) to = gmailEmail
    }

    // Email with context
    if (to) {
      const subject = 'Réponse à votre question juriste (Spyke)'
      const text = [
        'Vous avez reçu une réponse à votre question juriste.',
        '',
        'Question :',
        String((q as any).question || '').trim(),
        '',
        'Réponse :',
        body.content.trim(),
        '',
        '— Spyke',
      ].join('\n')

      await sendNotificationEmail({ to, subject, text })
    }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error' }, { status: 400 })
  }
}
