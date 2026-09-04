import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { PROSPECTION_URL, PROSPECTION_KEY } from '@/lib/prospection/supabase/config'

export const runtime = 'nodejs'

/**
 * Raccrocher l'appel en cours.
 *
 * L'opérateur expose bien la fonction — POST /channels/{channelId}/events/hangup
 * — mais elle exige la clé API, qui ne doit jamais atteindre le navigateur.
 * Le raccrochage passe donc par ici.
 *
 * L'identifiant du canal n'est pas demandé à l'appelant : il est retrouvé en
 * base à partir du numéro, tel que les messages de sonnerie l'ont déposé. Sans
 * cela, n'importe qui muni d'un jeton valide pourrait couper l'appel d'un
 * inconnu en devinant un identifiant.
 *
 * Deux conditions côté opérateur, sans quoi il répond 401 : la clé doit porter
 * le droit d'écriture sur les appels, et son option de supervision doit être
 * active — raccrocher est considéré comme un acte de supervision.
 */
const RINGOVER = 'https://public-api.ringover.com/v2'
const APPEL_TROP_VIEUX_MIN = 60

export async function POST(req: Request) {
  const cleService = process.env.PROSPECTION_SUPABASE_SERVICE_ROLE_KEY
  const cleApi = process.env.PROSPECTION_RINGOVER_CLE_API
  if (!cleService) {
    return NextResponse.json({ ok: false, erreur: 'Configuration incomplète.' }, { status: 500 })
  }
  if (!cleApi) {
    return NextResponse.json({
      ok: false,
      erreur: "Raccrochage indisponible : la variable PROSPECTION_RINGOVER_CLE_API manque sur le projet Vercel spyke-web.",
    })
  }

  const { jeton, numero } = (await req.json().catch(() => ({}))) as {
    jeton?: string
    numero?: string
  }

  // Le jeton de la personne connectée est vérifié auprès de Supabase, qui en
  // contrôle la signature. Sans quoi cette route couperait des appels sur
  // simple demande.
  if (!jeton) return NextResponse.json({ ok: false, erreur: 'Session expirée.' })
  const { data: { user } } = await createClient(PROSPECTION_URL, PROSPECTION_KEY)
    .auth.getUser(jeton)
  if (!user) return NextResponse.json({ ok: false, erreur: 'Session expirée.' })

  const norm = String(numero ?? '').replace(/\D/g, '')
  if (!norm) return NextResponse.json({ ok: false, erreur: 'Numéro manquant.' })

  const sb = createClient(PROSPECTION_URL, cleService, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data: actif } = await sb
    .from('telephonie_appels_actifs')
    .select('channel_id, debut')
    .eq('numero_norm', norm)
    .maybeSingle()

  const ligne = actif as { channel_id: string; debut: string } | null
  if (!ligne) {
    return NextResponse.json({ ok: false, erreur: "Aucun appel en cours sur ce numéro." })
  }

  // Un message de raccroché perdu laisserait une ligne éternelle ; on refuse de
  // couper un appel prétendument commencé il y a une heure.
  if (Date.now() - new Date(ligne.debut).getTime() > APPEL_TROP_VIEUX_MIN * 60_000) {
    await sb.from('telephonie_appels_actifs').delete().eq('numero_norm', norm)
    return NextResponse.json({ ok: false, erreur: "Aucun appel en cours sur ce numéro." })
  }

  const rep = await fetch(
    `${RINGOVER}/channels/${encodeURIComponent(ligne.channel_id)}/events/hangup`,
    { method: 'POST', headers: { Authorization: cleApi } }
  ).catch(() => null)

  if (!rep) return NextResponse.json({ ok: false, erreur: "L'opérateur n'a pas répondu." })

  if (rep.status === 401) {
    return NextResponse.json({
      ok: false,
      erreur: "L'opérateur refuse : la clé API doit avoir « Appels — Écriture » et l'option Monitoring active.",
    })
  }
  if (!rep.ok) {
    return NextResponse.json({ ok: false, erreur: `L'opérateur a refusé (${rep.status}).` })
  }

  await sb.from('telephonie_appels_actifs').delete().eq('numero_norm', norm)
  return NextResponse.json({ ok: true })
}
