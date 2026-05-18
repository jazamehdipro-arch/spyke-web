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
  const firstName = name?.split(' ')[0] || null
  const greeting = firstName ? `Bonjour ${firstName},` : 'Bonjour,'

  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 20px">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08)">
        <tr>
          <td style="background:#0a0a0a;padding:32px 40px;text-align:center">
            <span style="color:#ffffff;font-size:26px;font-weight:700;letter-spacing:-0.5px">⚡ Spyke</span>
          </td>
        </tr>
        <tr>
          <td style="padding:40px 40px 32px">
            <p style="margin:0 0 20px;font-size:16px;color:#333;line-height:1.6">${greeting}</p>

            <p style="margin:0 0 16px;font-size:16px;color:#333;line-height:1.6">
              Je suis Mehdi, fondateur de <strong>Spyke</strong> — un outil conçu pour les freelances français afin de générer devis, factures et contrats en moins de 30 secondes, avec des documents validés par des juristes et conformes au droit français.
            </p>

            <p style="margin:0 0 16px;font-size:16px;color:#333;line-height:1.6">
              En découvrant votre contenu, je me suis dit que Spyke pouvait réellement intéresser votre communauté de freelances et d'indépendants.
            </p>

            <p style="margin:0 0 12px;font-size:16px;color:#333;line-height:1.6">
              L'idée serait de vous proposer une <strong>collaboration affiliée</strong> autour de l'outil :
            </p>

            <table cellpadding="0" cellspacing="0" style="margin:0 0 24px;background:#f9f9f9;border-radius:10px;padding:20px 24px;width:100%">
              <tr><td style="padding:6px 0;font-size:15px;color:#333">💰 &nbsp;<strong>19,90€</strong> par abonnement généré via votre lien</td></tr>
              <tr><td style="padding:6px 0;font-size:15px;color:#333">🔄 &nbsp;puis <strong>25% de commission récurrente pendant 6 mois</strong> sur chaque abonné actif</td></tr>
            </table>

            <p style="margin:0 0 16px;font-size:16px;color:#333;line-height:1.6">
              Même avec quelques conversions par mois, cela peut rapidement représenter un revenu récurrent intéressant, tout en recommandant un outil réellement utile à votre audience.
            </p>

            <p style="margin:0 0 24px;font-size:16px;color:#333;line-height:1.6">
              Je peux évidemment vous offrir un <strong>accès complet à la plateforme</strong> afin que vous puissiez la tester librement avant toute décision.
            </p>

            <p style="margin:0 0 32px;font-size:16px;color:#333;line-height:1.6">
              Si le sujet vous intéresse, je serais ravi d'en discuter avec vous.
            </p>

            <table cellpadding="0" cellspacing="0" style="margin:0 auto 32px">
              <tr>
                <td align="center" style="background:#0a0a0a;border-radius:8px;padding:14px 32px">
                  <a href="https://spykeapp.fr" style="color:#ffffff;font-size:16px;font-weight:700;text-decoration:none">Découvrir Spyke →</a>
                </td>
              </tr>
            </table>

            <p style="margin:0;font-size:15px;color:#333;line-height:1.6">
              À bientôt,<br>
              <strong>Mehdi</strong><br>
              <span style="color:#888;font-size:14px">Fondateur de Spyke — <a href="https://spykeapp.fr" style="color:#888">spykeapp.fr</a></span>
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#f9f9f9;padding:20px 40px;border-top:1px solid #eee">
            <p style="margin:0;font-size:12px;color:#999;text-align:center;line-height:1.5">
              Vous recevez cet email car nous pensons que cette collaboration pourrait vous intéresser.<br>
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

function buildEmailText(name: string | null): string {
  const firstName = name?.split(' ')[0] || null
  const greeting = firstName ? `Bonjour ${firstName},` : 'Bonjour,'
  return `${greeting}

Je suis Mehdi, fondateur de Spyke — un outil conçu pour les freelances français afin de générer devis, factures et contrats en moins de 30 secondes, avec des documents validés par des juristes et conformes au droit français.

En découvrant votre contenu, je me suis dit que Spyke pouvait réellement intéresser votre communauté de freelances et d'indépendants.

L'idée serait de vous proposer une collaboration affiliée autour de l'outil :

- 19,90€ par abonnement généré via votre lien
- puis 25% de commission récurrente pendant 6 mois sur chaque abonné actif

Même avec quelques conversions par mois, cela peut rapidement représenter un revenu récurrent intéressant, tout en recommandant un outil réellement utile à votre audience.

Je peux évidemment vous offrir un accès complet à la plateforme afin que vous puissiez la tester librement avant toute décision.

Si le sujet vous intéresse, je serais ravi d'en discuter avec vous.

À bientôt,
Mehdi
Fondateur de Spyke - spykeapp.fr`
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
      .select('id, email, name, platform, followers')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(BATCH_SIZE)

    if (fetchError) throw fetchError
    if (!contacts || contacts.length === 0)
      return NextResponse.json({ ok: true, sent: 0, message: 'Aucun contact en attente' })

    const results = { sent: 0, errors: 0 }

    for (const contact of contacts) {
      try {
        await transporter.sendMail({
          from: `${FROM_NAME} <${FROM_EMAIL}>`,
          to: contact.email,
          subject: 'Demande de collaboration — Spyke',
          text: buildEmailText(contact.name),
          html: buildEmailHtml(contact.name),
        })

        await supabaseAdmin
          .from('influencer_contacts')
          .update({ status: 'sent', sent_at: new Date().toISOString(), error_msg: null })
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
