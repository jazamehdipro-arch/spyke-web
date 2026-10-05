import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import nodemailer from 'nodemailer'
import { PROSPECTION_URL, PROSPECTION_KEY } from '@/lib/prospection/supabase/config'

export const runtime = 'nodejs'

/**
 * Écrire à un prospect depuis Spyke.
 *
 * Le message part d'une boîte aux lettres unique, celle de l'entreprise, et pas
 * du compte personnel du commercial : lui donner un accès SMTP reviendrait à
 * stocker son mot de passe de messagerie, ce qu'on ne veut nulle part. Son
 * prénom signe le message, et le Reply-To porte sa propre adresse, pour que la
 * réponse lui arrive à lui et pas dans une boîte commune que personne ne relit.
 *
 * Les identifiants vivent dans les variables d'environnement du projet Vercel,
 * jamais en base : une clé lisible par l'écran d'administration est une clé
 * qui finit par circuler.
 */
const MAX_OBJET = 200
const MAX_CORPS = 10000

function reglages() {
  const user = process.env.PROSPECTION_SMTP_USER ?? process.env.INFOMANIAK_SMTP_USER
  const pass = process.env.PROSPECTION_SMTP_PASSWORD ?? process.env.INFOMANIAK_SMTP_PASSWORD
  if (!user || !pass) return null
  return {
    host: process.env.PROSPECTION_SMTP_HOST ?? 'mail.infomaniak.com',
    port: Number(process.env.PROSPECTION_SMTP_PORT ?? 465),
    user,
    pass,
    from: process.env.PROSPECTION_SMTP_FROM ?? user,
  }
}

export async function POST(req: Request) {
  const cleService = process.env.PROSPECTION_SUPABASE_SERVICE_ROLE_KEY
  if (!cleService) {
    return NextResponse.json({ ok: false, erreur: 'Configuration incomplète.' }, { status: 500 })
  }

  const smtp = reglages()
  if (!smtp) {
    return NextResponse.json({
      ok: false,
      erreur:
        "L'envoi d'e-mails n'est pas configuré : il manque PROSPECTION_SMTP_USER et " +
        'PROSPECTION_SMTP_PASSWORD sur le projet Vercel spyke-web. En attendant, ' +
        'copie le message et envoie-le depuis ta messagerie.',
    })
  }

  const { jeton, leadId, objet, message } = (await req.json().catch(() => ({}))) as {
    jeton?: string
    leadId?: string
    objet?: string
    message?: string
  }

  if (!jeton) return NextResponse.json({ ok: false, erreur: 'Session expirée.' })
  const { data: { user } } = await createClient(PROSPECTION_URL, PROSPECTION_KEY)
    .auth.getUser(jeton)
  if (!user) return NextResponse.json({ ok: false, erreur: 'Session expirée.' })

  const sujet = String(objet ?? '').trim()
  const corps = String(message ?? '').trim()
  if (!sujet) return NextResponse.json({ ok: false, erreur: 'Il faut un objet.' })
  if (!corps) return NextResponse.json({ ok: false, erreur: 'Le message est vide.' })
  if (sujet.length > MAX_OBJET || corps.length > MAX_CORPS) {
    return NextResponse.json({ ok: false, erreur: 'Message trop long.' })
  }

  const sb = createClient(PROSPECTION_URL, cleService, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data: fiche } = await sb
    .from('leads')
    .select('id, nom, email, owner_id')
    .eq('id', String(leadId ?? ''))
    .maybeSingle()

  if (!fiche) return NextResponse.json({ ok: false, erreur: 'Fiche introuvable.' })
  if (!fiche.email) {
    return NextResponse.json({ ok: false, erreur: "Cette fiche n'a pas d'adresse e-mail." })
  }

  /**
   * Le cloisonnement ne tient pas si on ne le refait pas ici.
   *
   * La route travaille avec la clé de service, qui passe au-dessus de la RLS :
   * sans ce contrôle, un commercial pourrait écrire au prospect d'un collègue
   * en changeant l'identifiant dans la requête.
   */
  const { data: moi } = await sb
    .from('profiles')
    .select('nom, role, actif')
    .eq('id', user.id)
    .maybeSingle()

  if (!moi?.actif) return NextResponse.json({ ok: false, erreur: 'Ton accès a été désactivé.' })
  const estAdmin = moi.role === 'admin'
  if (!estAdmin && fiche.owner_id && fiche.owner_id !== user.id) {
    return NextResponse.json({ ok: false, erreur: 'Cette fiche est suivie par un collègue.' })
  }

  const transporteur = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.port === 465,
    auth: { user: smtp.user, pass: smtp.pass },
  })

  try {
    await transporteur.sendMail({
      from: `${moi.nom} <${smtp.from}>`,
      to: fiche.email,
      replyTo: user.email ?? smtp.from,
      subject: sujet,
      text: corps,
    })
  } catch (e) {
    const m = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ ok: false, erreur: "L'envoi a échoué : " + m })
  }

  // Trace dans la fiche. L'objet seul : le corps du message appartient à
  // l'échange, l'historique sert à savoir qu'on a écrit et quand.
  await sb.from('activities').insert({
    id: crypto.randomUUID(),
    lead_id: fiche.id,
    author_id: user.id,
    author_nom: moi.nom,
    label: ('E-mail envoyé : ' + sujet).slice(0, 200),
  })

  return NextResponse.json({ ok: true })
}
