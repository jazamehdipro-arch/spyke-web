import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import nodemailer from 'nodemailer'

export const runtime = 'nodejs'

const ADMIN_EMAIL = 'Jazamehdi.pro@gmail.com'
const FROM_EMAIL = 'contact@spykeapp.fr'
const FROM_NAME = 'Mehdi de Spyke'
const BATCH_SIZE = 20
const TEST_OVERRIDE_EMAIL = 'jazamehdi.pro@gmail.com' // TODO: remove before real send

function requireEnv(name: string): string {
  const v = process.env[name]
  if (!v) throw new Error(`Missing env: ${name}`)
  return v
}

const RELANCE_TEXT = `Bonjour,

Je me permets de revenir vers vous suite a mon message concernant une collaboration avec Spyke.

Avez-vous eu l'occasion d'en prendre connaissance ?

Mehdi, Fondateur de Spyke
spykeapp.fr`

const RELANCE_HTML = `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 20px">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08)">
        <tr>
          <td style="background:#0a0a0a;padding:32px 40px;text-align:center">
            <span style="color:#ffffff;font-size:26px;font-weight:700;letter-spacing:-0.5px">&#9889; Spyke</span>
          </td>
        </tr>
        <tr>
          <td style="padding:40px 40px 32px">
            <p style="margin:0 0 20px;font-size:16px;color:#333;line-height:1.6">Bonjour,</p>
            <p style="margin:0 0 16px;font-size:16px;color:#333;line-height:1.6">
              Je me permets de revenir vers vous suite a mon message concernant une collaboration avec Spyke.
            </p>
            <p style="margin:0 0 32px;font-size:16px;color:#333;line-height:1.6">
              Avez-vous eu l'occasion d'en prendre connaissance ?
            </p>
            <p style="margin:0;font-size:15px;color:#333;line-height:1.6">
              <strong>Mehdi</strong><br>
              <span style="color:#888;font-size:14px">Fondateur de Spyke — <a href="https://spykeapp.fr" style="color:#888">spykeapp.fr</a></span>
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#f9f9f9;padding:20px 40px;border-top:1px solid #eee">
            <p style="margin:0;font-size:12px;color:#999;text-align:center;line-height:1.5">
              Pour ne plus recevoir de messages de notre part, repondez simplement "desinscription".
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

export async function POST(req: Request) {
  try {
    const supabaseUrl = requireEnv('NEXT_PUBLIC_SUPABASE_URL')
    const supabaseAnonKey = requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
    const serviceRoleKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY')

    const authHeader = req.headers.get('authorization') || ''
    const token = authHeader.match(/^Bearer\s+(.+)$/i)?.[1]
    if (!token) return NextResponse.json({ error: 'Non autorise' }, { status: 401 })

    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const { data: userData, error: userError } = await supabaseAuth.auth.getUser()
    if (userError || !userData.user) return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
    if (userData.user.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase())
      return NextResponse.json({ error: 'Acces reserve admin' }, { status: 403 })

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const transporter = nodemailer.createTransport({
      host: 'mail.infomaniak.com',
      port: 465,
      secure: true,
      auth: {
        user: requireEnv('INFOMANIAK_SMTP_USER'),
        pass: requireEnv('INFOMANIAK_SMTP_PASSWORD'),
      },
    })

    const { data: contacts, error: fetchError } = await supabaseAdmin
      .from('influencer_contacts')
      .select('id, email, name')
      .eq('status', 'sent')
      .order('sent_at', { ascending: true })
      .limit(BATCH_SIZE)

    if (fetchError) throw fetchError
    if (!contacts || contacts.length === 0)
      return NextResponse.json({ ok: true, sent: 0, message: 'Aucun contact a relancer' })

    const results = { sent: 0, errors: 0 }

    for (const contact of contacts) {
      try {
        await transporter.sendMail({
          from: `${FROM_NAME} <${FROM_EMAIL}>`,
          to: TEST_OVERRIDE_EMAIL,
          subject: 'Re: Demande de collaboration — Spyke',
          text: RELANCE_TEXT,
          html: RELANCE_HTML,
        })

        await supabaseAdmin
          .from('influencer_contacts')
          .update({ status: 'relanced', relanced_at: new Date().toISOString(), error_msg: null })
          .eq('id', contact.id)

        results.sent++
      } catch (sendErr: unknown) {
        const errMsg = sendErr instanceof Error ? sendErr.message : 'SMTP error'
        await supabaseAdmin
          .from('influencer_contacts')
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
