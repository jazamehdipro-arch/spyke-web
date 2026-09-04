import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { PROSPECTION_URL, PROSPECTION_KEY } from '@/lib/prospection/supabase/config'

export const runtime = 'nodejs'

/**
 * Lancer un appel depuis Spyke.
 *
 * On ne passe plus par le composant embarqué : il accepte l'ordre et l'ignore,
 * parce que l'application de l'opérateur n'autorise pas ce domaine à lui donner
 * des ordres. Constaté sur pièce — le même numéro composé à la main dans leur
 * clavier sonne, envoyé par commande il ne se passe rien.
 *
 * On demande donc l'appel à leur serveur, avec la clé API. Aucune autorisation
 * de domaine n'entre en jeu : c'est notre serveur qui parle au leur.
 *
 * Le déroulé : leur application sonne chez la personne, elle décroche, et le
 * prospect est composé automatiquement. `device: WEB` fait sonner le clavier
 * ouvert dans la page plutôt qu'un téléphone.
 */
const RINGOVER = 'https://public-api.ringover.com/v2'

/**
 * Les identifiants d'appel dépassent la précision des nombres du langage :
 * 12345678909876543000 relu par JSON.parse devient 12345678909876543000 arrondi,
 * et le raccrochage viserait alors un canal qui n'existe pas. On les extrait du
 * texte brut, comme des chaînes.
 */
function idBrut(texte: string, champ: string): string | null {
  const m = new RegExp(`"${champ}"\\s*:\\s*"?(\\d+)"?`).exec(texte)
  return m ? m[1] : null
}

export async function POST(req: Request) {
  const cleService = process.env.PROSPECTION_SUPABASE_SERVICE_ROLE_KEY
  const cleApi = process.env.PROSPECTION_RINGOVER_CLE_API
  if (!cleService) {
    return NextResponse.json({ ok: false, erreur: 'Configuration incomplète.' }, { status: 500 })
  }
  if (!cleApi) {
    return NextResponse.json({
      ok: false,
      erreur: "Appels indisponibles : la variable PROSPECTION_RINGOVER_CLE_API manque sur le projet Vercel spyke-web.",
    })
  }

  const { jeton, numero } = (await req.json().catch(() => ({}))) as {
    jeton?: string
    numero?: string
  }

  if (!jeton) return NextResponse.json({ ok: false, erreur: 'Session expirée.' })
  const { data: { user } } = await createClient(PROSPECTION_URL, PROSPECTION_KEY)
    .auth.getUser(jeton)
  if (!user) return NextResponse.json({ ok: false, erreur: 'Session expirée.' })

  const norm = String(numero ?? '').replace(/\D/g, '')
  if (!norm) return NextResponse.json({ ok: false, erreur: 'Numéro manquant.' })

  /**
   * On demande d'abord le clavier de la page — c'est ce que veut le commercial :
   * appeler depuis l'ordinateur, casque aux oreilles. Mais il n'est pas toujours
   * enregistré comme appareil chez l'opérateur, et sa téléphonie répond alors
   * 502 sans plus d'explication. On retente donc avec « tous les appareils »,
   * qui fait sonner ce qui est disponible, clavier compris.
   *
   * Deux essais, pas plus : au-delà, c'est un vrai problème qu'il faut voir.
   */
  const sb = createClient(PROSPECTION_URL, cleService, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  /**
   * Le numéro d'où part l'appel.
   *
   * Leur spécification le dit facultatif — « sans lui, le numéro par défaut de
   * l'utilisateur est utilisé ». Mais avec la supervision active, ce défaut
   * n'est apparemment plus résolu, et leur service répond 502 sans rien
   * expliquer. On le fournit donc explicitement.
   *
   * Il n'est pas écrit en dur : on le relit dans les appels déjà passés, tels
   * que l'opérateur nous les a rapportés. Le jour où le numéro change, le code
   * suit sans qu'on y touche.
   */
  const { data: passe } = await sb
    .from('telephonie_journal')
    .select('corps')
    .order('recu_le', { ascending: false })
    .limit(40)

  let depuis: number | null = null
  for (const l of (passe ?? []) as { corps: { data?: { direction?: string; from_number?: string } } }[]) {
    const d = l.corps?.data
    if (d?.direction === 'outbound' && d.from_number) {
      const n = Number(String(d.from_number).replace(/\D/g, ''))
      if (Number.isFinite(n) && n > 0) { depuis = n; break }
    }
  }

  async function demander(device: string, avecDepuis: boolean) {
    const corps: Record<string, unknown> = {
      to_number: Number(norm), device, timeout: 45,
    }
    if (avecDepuis && depuis) corps.from_number = depuis
    const r = await fetch(`${RINGOVER}/callback`, {
      method: 'POST',
      headers: { Authorization: cleApi!, 'Content-Type': 'application/json' },
      body: JSON.stringify(corps),
    }).catch(() => null)
    return r
  }

  /* Trois tentatives au plus, de la plus souhaitable à la plus permissive :
     le clavier de la page avec le numéro explicite, puis tous les appareils,
     puis sans numéro d'origine — au cas où c'est lui que leur service refuse.
     Un refus d'autorisation n'est jamais retenté : il se reproduirait. */
  let appareil = 'WEB'
  let rep = await demander(appareil, true)
  if (!rep || (!rep.ok && rep.status !== 401)) {
    appareil = 'ALL'
    rep = await demander(appareil, true)
  }
  if (!rep || (!rep.ok && rep.status !== 401)) {
    appareil = 'ALL (sans numéro d\'origine)'
    rep = await demander('ALL', false)
  }

  if (!rep) return NextResponse.json({ ok: false, erreur: "L'opérateur n'a pas répondu." })

  const texte = await rep.text()

  if (rep.status === 401) {
    return NextResponse.json({
      ok: false,
      erreur: "L'opérateur refuse : la clé API doit avoir « Appels — Écriture » et l'option Monitoring active.",
    })
  }
  if (!rep.ok) {
    return NextResponse.json({
      ok: false,
      erreur:
        `L'opérateur a refusé (${rep.status}) sur les trois tentatives. ` +
        `${texte.slice(0, 200)}`,
    })
  }

  // Le canal arrive dès la réponse : le raccrochage est possible tout de suite,
  // sans attendre le message de sonnerie.
  const channel = idBrut(texte, 'channel_id')
  if (channel) {
    await sb.from('telephonie_appels_actifs').upsert({
      numero_norm: norm,
      channel_id: channel,
      call_id: idBrut(texte, 'call_id'),
      debut: new Date().toISOString(),
    }, { onConflict: 'numero_norm' })
  }

  return NextResponse.json({ ok: true, appareil })
}
