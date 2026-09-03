import { NextResponse } from 'next/server'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { createHmac } from 'node:crypto'
import { PROSPECTION_URL } from '@/lib/prospection/supabase/config'

export const runtime = 'nodejs'

/**
 * Réception des appels remontés par le logiciel de téléphonie (Ringover).
 *
 * Un appel raccroché devient une ligne d'historique sur la fiche du prospect,
 * sans que personne ne saisisse rien. C'est là qu'est le gain réel : le clic
 * pour composer, le logiciel le fait déjà.
 *
 * DEUX VERROUS, dans cet ordre.
 *
 * 1. Un jeton dans le chemin de l'adresse. Sans lui, la route répond 404 sans
 *    même confirmer son existence. Il filtre le tout-venant.
 *
 * 2. La signature de Ringover. C'est elle qui compte : l'adresse peut fuiter
 *    par un journal de serveur ou un en-tête Referer, la signature non. Dès que
 *    la clé est configurée, un message non signé correctement est enregistré au
 *    journal mais n'écrit RIEN dans les fiches.
 *
 * Le schéma exact de signature v3 n'est pas documenté publiquement. Plutôt que
 * de le deviner, on teste les formes usuelles et on note laquelle a répondu :
 * la vérification se fait sur le serveur, avec la vraie clé, sur de vrais
 * messages. Une fois la bonne forme connue, elle sera figée ici.
 *
 * RATTACHEMENT À UNE FICHE. Ringover donne le numéro appelé au format
 * international sans le plus — « 33612345678 ». C'est exactement la forme que
 * tel_normalise() produit en base, et sur laquelle porte l'index unique des
 * fiches : le rapprochement est direct, sans heuristique.
 *
 * QUI A APPELÉ. Le message porte l'e-mail de l'utilisateur Ringover. On le
 * rapproche du compte Spyke du même e-mail. Sans correspondance, la ligne est
 * quand même écrite, sans auteur : perdre l'appel serait pire que perdre le nom.
 */

const TAILLE_MAX = 64 * 1024

function memeChaine(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

/**
 * Les formes de signature à éprouver. Chacune produit une empreinte comparée à
 * celles reçues ; le nom de celle qui correspond est noté au journal.
 */
function empreintes(corpsBrut: string, horodatage: string, cle: string): Record<string, string> {
  const h = (données: string, sortie: 'hex' | 'base64') =>
    createHmac('sha256', cle).update(données).digest(sortie)
  return {
    'corps.hex': h(corpsBrut, 'hex'),
    'corps.b64': h(corpsBrut, 'base64'),
    'horodatage.corps.hex': h(`${horodatage}.${corpsBrut}`, 'hex'),
    'horodatage.corps.b64': h(`${horodatage}.${corpsBrut}`, 'base64'),
    'horodatagecorps.hex': h(`${horodatage}${corpsBrut}`, 'hex'),
    'horodatagecorps.b64': h(`${horodatage}${corpsBrut}`, 'base64'),
  }
}

function formeQuiCorrespond(
  corpsBrut: string, horodatage: string, cle: string, recues: string[]
): string | null {
  const cands = empreintes(corpsBrut, horodatage, cle)
  for (const [nom, valeur] of Object.entries(cands)) {
    for (const recue of recues) {
      if (recue && memeChaine(valeur, recue.trim())) return nom
    }
  }
  return null
}

/** Les en-têtes utiles : signatures, horodatage, et de quoi diagnostiquer. */
function entetesRetenus(h: Headers): Record<string, string> {
  const garder = ['content-type', 'user-agent', 'x-forwarded-for']
  const out: Record<string, string> = {}
  h.forEach((v, k) => {
    const kl = k.toLowerCase()
    if (garder.includes(kl) || kl.startsWith('x-ringover') || kl.includes('signature')) out[kl] = v
  })
  return out
}

/** « 1 min 23 », « 8 s » — lisible dans un historique, pas « 83000 ms ». */
function duree(secondes: number): string {
  if (secondes < 60) return `${secondes} s`
  const m = Math.floor(secondes / 60)
  const s = secondes % 60
  return s ? `${m} min ${s}` : `${m} min`
}

type Appel = {
  call_id?: string | number
  direction?: string
  to_number?: string
  duration_in_seconds?: number | string
  answering_machine_detection?: string
  user?: { email?: string }
}

/** Le libellé qui apparaîtra dans l'historique de la fiche. */
function libelle(a: Appel): string {
  const s = Number(a.duration_in_seconds ?? 0)
  const machine = String(a.answering_machine_detection ?? '').toUpperCase()
  if (s <= 0) return 'Appel sans réponse'
  if (machine === 'MACHINE' || machine === 'VOICEMAIL') return `Appel · répondeur (${duree(s)})`
  return `Appel · ${duree(s)}`
}

async function auteur(sb: SupabaseClient, email?: string): Promise<string | null> {
  if (!email) return null
  // listUsers ne filtre pas par e-mail ; sur une équipe de quelques personnes
  // la première page suffit largement.
  const { data } = await sb.auth.admin.listUsers({ page: 1, perPage: 200 })
  const u = data?.users?.find((x) => x.email?.toLowerCase() === email.toLowerCase())
  return u?.id ?? null
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ jeton: string }> }
) {
  const attendu = process.env.PROSPECTION_TELEPHONIE_JETON
  const { jeton } = await params
  if (!attendu || !memeChaine(jeton, attendu)) return new NextResponse(null, { status: 404 })

  const cleService = process.env.PROSPECTION_SUPABASE_SERVICE_ROLE_KEY
  // 200 volontairement sur nos propres pannes : une erreur ferait réessayer
  // Ringover en boucle sans que ça change quoi que ce soit.
  if (!cleService) return NextResponse.json({ ok: false, raison: 'clé de service absente' })

  const brut = await req.text()
  if (brut.length > TAILLE_MAX) return NextResponse.json({ ok: false, raison: 'message trop volumineux' })

  const entetes = entetesRetenus(req.headers)
  const cleSignature = process.env.PROSPECTION_TELEPHONIE_CLE
  let forme: string | null = null
  if (cleSignature) {
    forme = formeQuiCorrespond(
      brut,
      entetes['x-ringover-request-signature-v3-timestamp'] ?? '',
      cleSignature,
      [entetes['x-ringover-webhook-signature-v3'], entetes['x-ringover-webhook-signature']].filter(Boolean)
    )
  }

  let corps: Record<string, unknown>
  try {
    corps = JSON.parse(brut) as Record<string, unknown>
  } catch {
    corps = { brut }
  }

  const sb = createClient(PROSPECTION_URL, cleService, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const journaliser = (note: string) =>
    sb.from('telephonie_journal').insert({
      source: 'ringover',
      entetes: { ...entetes, _signature: forme ?? 'aucune correspondance', _note: note },
      corps,
    })

  // Tant que la clé n'est pas configurée, on observe sans écrire dans les
  // fiches : signer est le seul moyen de savoir qu'un message vient bien du
  // logiciel de téléphonie et non de quelqu'un qui a trouvé l'adresse.
  if (!cleSignature) {
    await journaliser('clé de signature absente — aucune écriture')
    return NextResponse.json({ ok: true, ecrit: false })
  }
  if (!forme) {
    await journaliser('signature non reconnue — aucune écriture')
    return NextResponse.json({ ok: true, ecrit: false })
  }

  if (corps.resource !== 'call' || corps.event !== 'hangup') {
    return NextResponse.json({ ok: true, ecrit: false, raison: 'événement ignoré' })
  }

  const a = (corps.data ?? {}) as Appel
  if (a.direction !== 'outbound') {
    return NextResponse.json({ ok: true, ecrit: false, raison: 'appel entrant' })
  }

  const numero = String(a.to_number ?? '').replace(/\D/g, '')
  if (!numero) return NextResponse.json({ ok: true, ecrit: false, raison: 'numéro absent' })

  const { data: fiche } = await sb
    .from('leads').select('id').eq('tel_norm', numero).maybeSingle()
  if (!fiche) {
    await journaliser(`aucune fiche pour ce numéro`)
    return NextResponse.json({ ok: true, ecrit: false, raison: 'numéro hors fichier' })
  }

  const { error } = await sb.from('activities').insert({
    id: crypto.randomUUID(),
    lead_id: (fiche as { id: string }).id,
    author_id: await auteur(sb, a.user?.email),
    author_nom: '',                       // posé par la base
    label: libelle(a),
    telephonie_id: a.call_id ? String(a.call_id) : null,
  })

  // 23505 : l'appel est déjà passé lors d'un essai précédent. C'est le
  // comportement voulu, pas une erreur.
  if (error && error.code !== '23505') {
    await journaliser(`écriture refusée : ${error.message}`)
    return NextResponse.json({ ok: false, raison: error.message })
  }

  return NextResponse.json({ ok: true, ecrit: !error })
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ jeton: string }> }
) {
  const attendu = process.env.PROSPECTION_TELEPHONIE_JETON
  const { jeton } = await params
  if (!attendu || !memeChaine(jeton, attendu)) return new NextResponse(null, { status: 404 })
  return NextResponse.json({ ok: true, service: 'spyke-prospection' })
}
