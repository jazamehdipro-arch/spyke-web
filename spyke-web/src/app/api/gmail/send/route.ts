import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'
import { OAuth2Client } from 'google-auth-library'

export const runtime = 'nodejs'

const HeaderSchema = z.object({
  authorization: z.string().min(1),
})

const BodySchema = z.object({
  to: z.string().min(3),
  subject: z.string().min(1),
  text: z.string().min(1),
  // Optional attachment (signed URL already)
  attachmentUrl: z.string().url().optional(),
  attachmentFilename: z.string().min(1).optional(),
})

function requireEnv(name: string): string {
  const v = process.env[name]
  if (!v) throw new Error(`Missing env: ${name}`)
  return v
}

function encodeMessage(raw: string) {
  return Buffer.from(raw)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')
}

export async function POST(req: Request) {
  try {
    const supabaseUrl = requireEnv('NEXT_PUBLIC_SUPABASE_URL')
    const supabaseAnonKey = requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
    const serviceRoleKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY')

    const headers = HeaderSchema.parse({
      authorization: req.headers.get('authorization') || '',
    })

    const m = headers.authorization.match(/^Bearer\s+(.+)$/i)
    const token = m?.[1]
    if (!token) return NextResponse.json({ error: 'Missing bearer token' }, { status: 401 })

    const body = BodySchema.parse(await req.json().catch(() => ({})))

    // Identify user
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const { data: userData, error: userError } = await supabaseAuth.auth.getUser()
    if (userError || !userData.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const { data: tokenRow, error: tokenError } = await supabaseAdmin
      .from('google_gmail_tokens')
      .select('refresh_token')
      .eq('user_id', userData.user.id)
      .maybeSingle()

    if (tokenError) throw tokenError
    if (!tokenRow?.refresh_token) {
      return NextResponse.json({ error: 'Gmail non connecté. Connectez Gmail dans votre profil.' }, { status: 400 })
    }

    const googleClientId = requireEnv('GOOGLE_CLIENT_ID')
    const googleClientSecret = requireEnv('GOOGLE_CLIENT_SECRET')
    const gmailRedirectUri = requireEnv('GMAIL_REDIRECT_URI')

    const oauth2 = new OAuth2Client({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
      redirectUri: gmailRedirectUri,
    })

    oauth2.setCredentials({ refresh_token: tokenRow.refresh_token })

    // Build MIME message
    let raw: string
    if (body.attachmentUrl) {
      const res = await fetch(body.attachmentUrl)
      if (!res.ok) throw new Error(`Attachment fetch failed (${res.status})`)
      const buf = Buffer.from(await res.arrayBuffer())
      const boundary = `spyke_${Math.random().toString(16).slice(2)}`
      const filename = body.attachmentFilename || 'document.pdf'
      const attachmentB64 = buf.toString('base64')

      raw = [
        `To: ${body.to}`,
        `Subject: ${body.subject}`,
        'MIME-Version: 1.0',
        `Content-Type: multipart/mixed; boundary="${boundary}"`,
        '',
        `--${boundary}`,
        'Content-Type: text/plain; charset="UTF-8"',
        'Content-Transfer-Encoding: 7bit',
        '',
        body.text,
        '',
        `--${boundary}`,
        'Content-Type: application/pdf',
        `Content-Disposition: attachment; filename="${filename}"`,
        'Content-Transfer-Encoding: base64',
        '',
        attachmentB64,
        '',
        `--${boundary}--`,
        '',
      ].join('\r\n')
    } else {
      raw = [`To: ${body.to}`, `Subject: ${body.subject}`, '', body.text].join('\r\n')
    }

    const accessToken = await oauth2.getAccessToken()
    const at = accessToken?.token
    if (!at) throw new Error('Failed to obtain Google access token')

    // Gmail API send (simple REST)
    const gmailRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${at}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw: encodeMessage(raw) }),
    })

    const gmailJson = await gmailRes.json().catch(() => null)
    if (!gmailRes.ok) {
      return NextResponse.json(
        { error: gmailJson?.error?.message || `Gmail send failed (${gmailRes.status})` },
        { status: 400 }
      )
    }

    return NextResponse.json({ ok: true, id: gmailJson?.id || null })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error' }, { status: 400 })
  }
}
