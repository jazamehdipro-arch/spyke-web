import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { OAuth2Client } from 'google-auth-library'

export const runtime = 'nodejs'

const ADMIN_EMAIL = 'Jazamehdi.pro@gmail.com'
const BATCH_SIZE = 20

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

function buildEmailHtml(name: string | null): string {
  const firstName = name?.split(' ')[0] || 'vous'
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 20px">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08)">
        <tr>
          <td style="background:#1a1a2e;padding:32px 40px;text-align:center">
            <span style="color:#ffffff;font-size:26px;font-weight:700;letter-spacing:-0.5px">⚡ Spyke</span>
          </td>
        </tr>
        <tr>
          <td style="padding:40px 40px 32px">
            <p style="margin:0 0 20px;font-size:16px;color:#333;line-height:1.6">Bonjour ${firstName},</p>
            <p style="margin:0 0 20px;font-size:16px;color:#333;line-height:1.6">
              Je me permets de vous contacter car je pense que <strong>Spyke</strong> peut vraiment vous simplifier la vie en tant que freelance.
            </p>
            <p style="margin:0 0 20px;font-size:16px;color:#333;line-height:1.6">
              Spyke, c'est la plateforme tout-en-un qui vous permet de :
            </p>
            <table cellpadding="0" cellspacing="0" style="margin:0 0 24px">
              <tr><td style="padding:6px 0;font-size:15px;color:#333">✅ &nbsp;Créer vos <strong>devis et factures</strong> en 30 secondes</td></tr>
              <tr><td style="padding:6px 0;font-size:15px;color:#333">✅ &nbsp;Générer des <strong>contrats professionnels</strong> adaptés à votre activité</td></tr>
              <tr><td style="padding:6px 0;font-size:15px;color:#333">✅ &nbsp;Obtenir des <strong>conseils juridiques</strong> personnalisés</td></tr>
              <tr><td style="padding:6px 0;font-size:15px;color:#333">✅ &nbsp;Gérer toute votre <strong>admin freelance</strong> au même endroit</td></tr>
            </table>
            <p style="margin:0 0 32px;font-size:16px;color:#333;line-height:1.6">
              Des centaines de freelances l'utilisent déjà pour gagner du temps et se concentrer sur leur vrai travail.
            </p>
            <table cellpadding="0" cellspacing="0" style="margin:0 auto 32px">
              <tr>
                <td align="center" style="background:#1a1a2e;border-radius:8px;padding:14px 32px">
                  <a href="https://spyke.fr" style="color:#ffffff;font-size:16px;font-weight:700;text-decoration:none">Essayer Spyke gratuitement →</a>
                </td>
              </tr>
            </table>
            <p style="margin:0;font-size:15px;color:#666;line-height:1.6">
              À très bientôt,<br>
              <strong>Mehdi</strong> — Fondateur de Spyke
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#f9f9f9;padding:20px 40px;border-top:1px solid #eee">
            <p style="margin:0;font-size:12px;color:#999;text-align:center;line-height:1.5">
              Vous recevez cet email car votre profil freelance est public.<br>
              Pour ne plus recevoir de messages de notre part, répondez simplement "désinscription".
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function buildMime(to: string, subject: string, html: string, fromName: string): string {
  const boundary = `spyke_${Math.random().toString(16).slice(2)}`
  return [
    `From: ${fromName} <${ADMIN_EMAIL}>`,
    `To: ${to}`,
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    '',
    'Bonjour,\n\nJe vous contacte au sujet de Spyke, la plateforme tout-en-un pour freelances.\n\nEssayez Spyke gratuitement sur https://spyke.fr\n\nCordialement,\nMehdi — Fondateur de Spyke',
    '',
    `--${boundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    '',
    html,
    '',
    `--${boundary}--`,
    '',
  ].join('\r\n')
}

export async function POST(req: Request) {
  try {
    const supabaseUrl = requireEnv('NEXT_PUBLIC_SUPABASE_URL')
    const supabaseAnonKey = requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
    const serviceRoleKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY')

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
      return NextResponse.json({ error: 'Accès réservé admin' }, { status: 403 })

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    // Get admin's Gmail token
    const { data: tokenRow, error: tokenError } = await supabaseAdmin
      .from('google_gmail_tokens')
      .select('refresh_token')
      .eq('user_id', userData.user.id)
      .maybeSingle()

    if (tokenError) throw tokenError
    if (!tokenRow?.refresh_token)
      return NextResponse.json({ error: 'Gmail non connecté. Connectez Gmail dans votre profil.' }, { status: 400 })

    const oauth2 = new OAuth2Client({
      clientId: requireEnv('GOOGLE_CLIENT_ID'),
      clientSecret: requireEnv('GOOGLE_CLIENT_SECRET'),
      redirectUri: requireEnv('GMAIL_REDIRECT_URI'),
    })
    oauth2.setCredentials({ refresh_token: tokenRow.refresh_token })
    const { token: accessToken } = await oauth2.getAccessToken()
    if (!accessToken) throw new Error('Impossible d\'obtenir le token Google')

    // Fetch next BATCH_SIZE pending contacts
    const { data: contacts, error: fetchError } = await supabaseAdmin
      .from('outreach_contacts')
      .select('id, email, name')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(BATCH_SIZE)

    if (fetchError) throw fetchError
    if (!contacts || contacts.length === 0)
      return NextResponse.json({ ok: true, sent: 0, message: 'Aucun contact en attente' })

    const results = { sent: 0, errors: 0 }

    for (const contact of contacts) {
      const html = buildEmailHtml(contact.name)
      const mime = buildMime(contact.email, '⚡ Simplifiez votre admin freelance avec Spyke', html, 'Mehdi de Spyke')

      const gmailRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ raw: encodeMessage(mime) }),
      })

      if (gmailRes.ok) {
        await supabaseAdmin
          .from('outreach_contacts')
          .update({ status: 'sent', sent_at: new Date().toISOString(), error_msg: null })
          .eq('id', contact.id)
        results.sent++
      } else {
        const errJson = await gmailRes.json().catch(() => null)
        const errMsg = errJson?.error?.message || `Gmail error ${gmailRes.status}`
        await supabaseAdmin
          .from('outreach_contacts')
          .update({ status: 'error', error_msg: errMsg })
          .eq('id', contact.id)
        results.errors++
      }
    }

    return NextResponse.json({ ok: true, ...results })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Erreur interne'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
