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
 * Vérifie la signature de Ringover.
 *
 * L'en-tête x-ringover-webhook-signature est un JWT en HS512 portant deux
 * informations : l'adresse appelée, et le message lui-même. C'est meilleur
 * qu'une simple empreinte du corps — la signature est liée à sa destination et
 * ne peut donc pas être rejouée vers une autre adresse.
 *
 * On se sert ensuite du message CONTENU DANS LE JWT, et non du corps de la
 * requête : c'est celui-là qui est signé. Les deux devraient être identiques ;
 * s'ils divergent, c'est le signé qui fait foi.
 *
 * Le second en-tête, x-ringover-webhook-signature-v3, est une empreinte
 * SHA-256 en base64 dont la formule n'est pas publiée. Elle est ignorée : le
 * JWT suffit, et il se décrit lui-même.
 */
function b64url(buf: Buffer): string {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function decodeB64url(s: string): string {
  const p = s.replace(/-/g, '+').replace(/_/g, '/')
  return Buffer.from(p + '='.repeat((4 - (p.length % 4)) % 4), 'base64').toString('utf8')
}

type Verdict =
  | { ok: true; evenement: Record<string, unknown> }
  | { ok: false; raison: string }

function verifierSignature(
  entete: string | undefined,
  cle: string,
  jeton: string,
  hoteAttendu: string
): Verdict {
  if (!entete) return { ok: false, raison: 'signature absente' }

  const parts = entete.split('.')
  if (parts.length !== 3) return { ok: false, raison: 'signature mal formée' }
  const [h, p, sig] = parts

  let algo: string
  try {
    algo = String((JSON.parse(decodeB64url(h)) as { alg?: string }).alg ?? '')
  } catch {
    return { ok: false, raison: 'en-tête de signature illisible' }
  }
  if (algo !== 'HS512') return { ok: false, raison: `algorithme inattendu : ${algo}` }

  const attendue = b64url(createHmac('sha512', cle).update(`${h}.${p}`).digest())
  if (!memeChaine(attendue, sig)) return { ok: false, raison: 'signature invalide' }

  let claims: {
    url?: string
    payload?: Record<string, unknown>
    resource?: unknown
    event?: unknown
  }
  try {
    claims = JSON.parse(decodeB64url(p)) as typeof claims
  } catch {
    return { ok: false, raison: 'charge de signature illisible' }
  }

  // Deux formes de charge coexistent. Celle qui arrive aujourd'hui enveloppe le
  // message : { url, payload }. Leur documentation en décrit une autre, à plat —
  // resource, event, timestamp, data, attempt. On accepte les deux : n'en
  // reconnaître qu'une ferait cesser l'écriture des appels du jour au lendemain,
  // sans rien casser de visible.
  const enveloppe = claims.payload && typeof claims.payload === 'object'
  const evenement = enveloppe
    ? (claims.payload as Record<string, unknown>)
    : (claims as unknown as Record<string, unknown>)

  if (!enveloppe && !(claims.resource && claims.event)) {
    return { ok: false, raison: 'message absent de la signature' }
  }

  // Quand l'adresse est signée, elle doit être celle où la requête est
  // réellement arrivée — domaine compris. Ne vérifier que le chemin laisserait
  // passer une signature émise pour un autre site portant le même chemin. La
  // forme à plat ne porte pas d'adresse ; il reste alors la signature du corps
  // et le jeton du chemin.
  if (claims.url !== undefined) {
    try {
      const u = new URL(String(claims.url))
      if (u.host.toLowerCase() !== hoteAttendu.toLowerCase()) {
        return { ok: false, raison: 'domaine signé étranger' }
      }
      if (u.pathname !== `/api/prospection/telephonie/${jeton}`) {
        return { ok: false, raison: 'adresse signée étrangère' }
      }
    } catch {
      return { ok: false, raison: 'adresse signée illisible' }
    }
  }

  return { ok: true, evenement }
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
      entetes: { ...entetes, _note: note },
      corps,
    })

  // Sans clé, on observe sans écrire : signer est le seul moyen de savoir qu'un
  // message vient bien du logiciel de téléphonie et non de quelqu'un qui a
  // trouvé l'adresse.
  if (!cleSignature) {
    await journaliser('clé de signature absente — aucune écriture')
    return NextResponse.json({ ok: true, ecrit: false })
  }

  const hote = req.headers.get('host') ?? ''
  const v = verifierSignature(
    entetes['x-ringover-webhook-signature'], cleSignature, jeton, hote
  )
  if (!v.ok) {
    await journaliser(`signature refusée : ${v.raison}`)
    return NextResponse.json({ ok: true, ecrit: false })
  }
  const evt = v.evenement

  if (evt.resource !== 'call' || evt.event !== 'hangup') {
    return NextResponse.json({ ok: true, ecrit: false, raison: 'événement ignoré' })
  }

  const a = (evt.data ?? {}) as Appel
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
