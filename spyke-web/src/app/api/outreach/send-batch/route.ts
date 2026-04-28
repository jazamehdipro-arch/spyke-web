import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import nodemailer from 'nodemailer'

export const runtime = 'nodejs'

const ADMIN_EMAIL = 'Jazamehdi.pro@gmail.com'
const FROM_EMAIL = 'contact@spykeapp.fr'
const FROM_NAME = 'Mehdi de Spyke'
const BATCH_SIZE = 20

function requireEnv(name: string): string {
  const v = process.env[name]
  if (!v) throw new Error(`Missing env: ${name}`)
  return v
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

    // SMTP Infomaniak
    const transporter = nodemailer.createTransport({
      host: 'mail.infomaniak.com',
      port: 465,
      secure: true,
      auth: {
        user: requireEnv('INFOMANIAK_SMTP_USER'),
        pass: requireEnv('INFOMANIAK_SMTP_PASSWORD'),
      },
    })

    // Fetch next BATCH_SIZE pending contacts
    const { data: contacts, error: fetchError } = await supabaseAdmin
      .from('outreach_contacts')
      .select('id, email, name')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(BATCH_SIZE)

    console.log('[outreach] fetchError:', fetchError)
    console.log('[outreach] contacts found:', contacts?.length ?? 0, JSON.stringify(contacts))

    if (fetchError) throw fetchError
    if (!contacts || contacts.length === 0)
      return NextResponse.json({ ok: true, sent: 0, message: 'Aucun contact en attente' })

    const results = { sent: 0, errors: 0 }

    for (const contact of contacts) {
      try {
        await transporter.sendMail({
          from: `${FROM_NAME} <${FROM_EMAIL}>`,
          to: contact.email,
          subject: '⚡ Simplifiez votre admin freelance avec Spyke',
          text: 'Bonjour,\n\nJe vous contacte au sujet de Spyke, la plateforme tout-en-un pour freelances.\n\nEssayez Spyke gratuitement sur https://spyke.fr\n\nCordialement,\nMehdi — Fondateur de Spyke',
          html: buildEmailHtml(contact.name),
        })

        await supabaseAdmin
          .from('outreach_contacts')
          .update({ status: 'sent', sent_at: new Date().toISOString(), error_msg: null })
          .eq('id', contact.id)

        results.sent++
      } catch (sendErr: unknown) {
        const errMsg = sendErr instanceof Error ? sendErr.message : 'SMTP error'
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
