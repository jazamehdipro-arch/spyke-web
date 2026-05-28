import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import nodemailer from 'nodemailer'

export const runtime = 'nodejs'

const ADMIN_EMAIL = 'Jazamehdi.pro@gmail.com'
const FROM_EMAIL = 'contact@spykeapp.fr'
const FROM_NAME = 'Mehdi de Spyke'

function requireEnv(name: string): string {
  const v = process.env[name]
  if (!v) throw new Error(`Missing env: ${name}`)
  return v
}

function buildInviteHtml(name: string, inviteLink: string, affiliateLink: string): string {
  const firstName = name.split(' ')[0] || name
  return `<!DOCTYPE html>
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
            <p style="margin:0 0 16px;font-size:16px;color:#333;line-height:1.6">Bonjour ${firstName},</p>

            <p style="margin:0 0 16px;font-size:16px;color:#333;line-height:1.6">
              Suite a notre echange, je t'ai prepare un <strong>acces Pro complet a Spyke</strong> — offert, pour que tu puisses tester l'outil librement avant d'en parler a ta communaute.
            </p>

            <p style="margin:0 0 8px;font-size:16px;color:#333;line-height:1.6">
              Clique ci-dessous pour creer ton compte (acces Pro active immediatement) :
            </p>

            <table cellpadding="0" cellspacing="0" style="margin:0 auto 32px">
              <tr>
                <td align="center" style="background:#0a0a0a;border-radius:8px;padding:14px 32px">
                  <a href="${inviteLink}" style="color:#ffffff;font-size:16px;font-weight:700;text-decoration:none">Creer mon compte Pro &#8594;</a>
                </td>
              </tr>
            </table>

            <p style="margin:0 0 8px;font-size:15px;color:#333;line-height:1.6">
              <strong>Ton lien d'affiliation</strong> (a mettre dans ta bio) :
            </p>
            <p style="margin:0 0 24px;font-size:14px;color:#0a0a0a;background:#f3f4f6;padding:12px 16px;border-radius:8px;word-break:break-all">
              <a href="${affiliateLink}" style="color:#0a0a0a;text-decoration:none;font-weight:700">${affiliateLink}</a>
            </p>

            <table cellpadding="0" cellspacing="0" style="margin:0 0 24px;background:#f9f9f9;border-radius:10px;padding:20px 24px;width:100%">
              <tr><td style="padding:4px 0;font-size:14px;color:#333">&#128181; <strong>19,90 EUR</strong> par abonnement genere via ton lien</td></tr>
              <tr><td style="padding:4px 0;font-size:14px;color:#333">&#128201; <strong>25% de commission recurrente pendant 6 mois</strong> sur chaque abonne actif</td></tr>
            </table>

            <p style="margin:0;font-size:15px;color:#333;line-height:1.6">
              N'hesite pas a me contacter si tu as des questions.<br><br>
              <strong>Mehdi</strong><br>
              <span style="color:#888;font-size:14px">Fondateur de Spyke — <a href="https://spykeapp.fr" style="color:#888">spykeapp.fr</a></span>
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#f9f9f9;padding:20px 40px;border-top:1px solid #eee">
            <p style="margin:0;font-size:12px;color:#999;text-align:center;line-height:1.5">
              Ce lien d'invitation est valable 24h.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

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

    const body = await req.json()
    const email: string = (body.email || '').trim().toLowerCase()
    const name: string = (body.name || '').trim()
    const affiliateCode: string = (body.affiliateCode || '').trim()

    if (!email || !name || !affiliateCode)
      return NextResponse.json({ error: 'email, name et affiliateCode requis' }, { status: 400 })

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const appBaseUrl = process.env.APP_BASE_URL || 'https://spykeapp.fr'

    // Generate invite link (creates user if not exists)
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'invite',
      email,
      options: { redirectTo: `${appBaseUrl}/app.html` },
    })

    if (linkError) throw linkError

    const inviteLink = linkData.properties.action_link
    const userId = linkData.user.id

    // Set profile to Pro immediately
    await supabaseAdmin
      .from('profiles')
      .upsert({ id: userId, plan: 'pro', first_name: name } as any, { onConflict: 'id' })

    const affiliateLink = `${appBaseUrl}?ref=${affiliateCode}`

    // Send custom email
    const transporter = nodemailer.createTransport({
      host: 'mail.infomaniak.com',
      port: 465,
      secure: true,
      auth: {
        user: requireEnv('INFOMANIAK_SMTP_USER'),
        pass: requireEnv('INFOMANIAK_SMTP_PASSWORD'),
      },
    })

    await transporter.sendMail({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: email,
      subject: 'Ton acces Pro Spyke + ton lien d\'affiliation',
      html: buildInviteHtml(name, inviteLink, affiliateLink),
      text: `Bonjour ${name},\n\nSuite a notre echange, voici ton acces Pro Spyke offert.\n\nCree ton compte ici (valable 24h) :\n${inviteLink}\n\nTon lien d'affiliation :\n${affiliateLink}\n\n19,90 EUR par abonnement + 25% de commission recurrente pendant 6 mois.\n\nMehdi\nFondateur de Spyke — spykeapp.fr`,
    })

    return NextResponse.json({ ok: true, affiliateLink })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Erreur interne'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
