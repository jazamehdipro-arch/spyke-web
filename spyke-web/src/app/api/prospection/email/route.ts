import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import nodemailer from 'nodemailer'
import { PROSPECTION_URL, PROSPECTION_KEY } from '@/lib/prospection/supabase/config'

export const runtime = 'nodejs'

/**
 * Écrire à un prospect depuis Spyke.
 *
 * Le message part d'une adresse de l'entreprise, pas du compte personnel du
 * commercial : lui demander ses identifiants de messagerie reviendrait à les
 * stocker quelque part, ce qu'on ne veut nulle part. Son prénom signe le
 * message, et le Reply-To porte sa propre adresse, pour que la réponse lui
 * arrive à lui et pas dans une boîte commune que personne ne relit.
 *
 * Deux façons d'envoyer, dans cet ordre :
 *
 *   1. Resend, sur le domaine de la prospection. C'est la bonne voie pour du
 *      volume : le domaine est signé (DKIM), le tableau de bord dit ce qui est
 *      arrivé et ce qui a été rejeté, et n'importe quelle adresse du domaine
 *      peut servir d'expéditeur sans configuration supplémentaire.
 *   2. SMTP, en repli. Une messagerie ordinaire n'est pas faite pour envoyer
 *      quarante messages par jour : au-delà, l'hébergeur limite.
 *
 * Les clés vivent dans les variables d'environnement du projet Vercel, jamais
 * en base : une clé lisible par l'écran d'administration est une clé qui finit
 * par circuler. Celles de la prospection portent leur propre nom, distinct de
 * celles de la facturation : les deux activités ne partagent ni domaine, ni
 * réputation d'expéditeur, et une clé révoquée d'un côté ne coupe pas l'autre.
 */
const MAX_OBJET = 200
const MAX_CORPS = 10000

function viaResend() {
  const cle = process.env.PROSPECTION_RESEND_API_KEY
  const from = process.env.PROSPECTION_RESEND_FROM
  if (!cle || !from) return null
  return { cle, from }
}

function viaSmtp() {
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

  const resend = viaResend()
  const smtp = resend ? null : viaSmtp()
  if (!resend && !smtp) {
    return NextResponse.json({
      ok: false,
      erreur:
        "L'envoi d'e-mails n'est pas configuré : il manque PROSPECTION_RESEND_API_KEY " +
        'et PROSPECTION_RESEND_FROM sur le projet Vercel spyke-web. En attendant, ' +
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
    .select('nom, role, actif, email_envoi')
    .eq('id', user.id)
    .maybeSingle()

  if (!moi?.actif) return NextResponse.json({ ok: false, erreur: 'Ton accès a été désactivé.' })
  const estAdmin = moi.role === 'admin'
  if (!estAdmin && fiche.owner_id && fiche.owner_id !== user.id) {
    return NextResponse.json({ ok: false, erreur: 'Cette fiche est suivie par un collègue.' })
  }

  /**
   * L'expéditeur.
   *
   * Chaque membre peut porter sa propre adresse, posée par le responsable. Le
   * service d'envoi est autorisé sur tout le domaine : aucune clé ni aucun mot
   * de passe supplémentaire n'est nécessaire pour une adresse de plus.
   *
   * La réponse part vers cette même adresse quand elle existe. C'est voulu :
   * un prospect qui répond à Jean-Baptiste doit tomber chez Jean-Baptiste, pas
   * dans une boîte commune où quelqu'un devra faire suivre. L'adresse doit donc
   * recevoir le courrier, boîte réelle ou simple redirection.
   */
  const sienne = (moi.email_envoi ?? '').trim()
  const defaut = resend ? resend.from : smtp!.from
  const expediteur = sienne || defaut
  const repondreA = sienne || user.email || defaut

  // Par SMTP, l'hébergeur refuse un expéditeur qu'il n'a pas approuvé et
  // répond « 550 Sender mismatch ». Par Resend, le domaine suffit.

  if (resend) {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resend.cle}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${moi.nom} <${expediteur}>`,
        to: [fiche.email],
        reply_to: repondreA,
        subject: sujet,
        text: corps,
      }),
    }).catch(() => null)

    if (!r || !r.ok) {
      const j = (await r?.json().catch(() => null)) as { message?: string } | null
      return NextResponse.json({
        ok: false,
        erreur:
          "L'envoi a échoué : " +
          (j?.message ?? `Resend a répondu ${r ? r.status : 'rien'}`),
      })
    }
  } else {
    const transporteur = nodemailer.createTransport({
      host: smtp!.host,
      port: smtp!.port,
      secure: smtp!.port === 465,
      auth: { user: smtp!.user, pass: smtp!.pass },
    })

    try {
      await transporteur.sendMail({
        from: `${moi.nom} <${expediteur}>`,
        to: fiche.email,
        replyTo: repondreA,
        subject: sujet,
        text: corps,
      })
    } catch (e) {
      const m = e instanceof Error ? e.message : String(e)
      return NextResponse.json({ ok: false, erreur: "L'envoi a échoué : " + m })
    }
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
