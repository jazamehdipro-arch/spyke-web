import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { PROSPECTION_URL } from '@/lib/prospection/supabase/config'

export const runtime = 'nodejs'

/**
 * Réception des messages du logiciel de téléphonie (Ringover), étape
 * d'observation.
 *
 * On enregistre tel quel ce qui arrive — en-têtes compris — sans rien écrire
 * dans les fiches. Deux raisons de commencer par là plutôt que par le
 * branchement :
 *
 * - Le format exact des messages ne s'invente pas. Le déduire d'une
 *   documentation, c'est écrire du code qui marche sur le papier.
 * - La signature qui authentifie le message voyage dans un en-tête dont le nom
 *   ne s'invente pas non plus. Sans lui, impossible de vérifier qu'un message
 *   vient bien de Ringover et pas de quelqu'un qui a trouvé l'adresse.
 *
 * PROTECTION. L'adresse porte un jeton dans son chemin, comparé à celui rangé
 * dans les variables Vercel. Sans le bon jeton, la route répond 404 : elle ne
 * confirme même pas son existence. C'est la protection d'attente, le temps de
 * connaître le mécanisme de signature ; elle ne suffira plus quand cette route
 * écrira dans les fiches.
 *
 * La comparaison est faite à temps constant : comparer deux chaînes avec ===
 * s'arrête au premier caractère différent, ce qui laisse deviner le jeton
 * caractère par caractère en mesurant le temps de réponse.
 */

const TAILLE_MAX = 64 * 1024

function memeJeton(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

/** Les en-têtes utiles au diagnostic, sans ceux qui n'apprennent rien. */
function entetesRetenus(h: Headers): Record<string, string> {
  const garder = ['content-type', 'user-agent', 'x-forwarded-for']
  const out: Record<string, string> = {}
  h.forEach((v, k) => {
    const kl = k.toLowerCase()
    // Tout ce qui ressemble à une signature est gardé : c'est précisément ce
    // qu'on cherche à identifier.
    if (garder.includes(kl) || kl.includes('signature') || kl.includes('hmac') || kl.startsWith('x-ringover')) {
      out[kl] = v
    }
  })
  return out
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ jeton: string }> }
) {
  const attendu = process.env.PROSPECTION_TELEPHONIE_JETON
  const { jeton } = await params
  if (!attendu || !memeJeton(jeton, attendu)) {
    return new NextResponse(null, { status: 404 })
  }

  const cle = process.env.PROSPECTION_SUPABASE_SERVICE_ROLE_KEY
  if (!cle) {
    // 200 volontairement : Ringover réessaierait en boucle sur une erreur, et
    // la panne est de notre côté, pas du sien.
    return NextResponse.json({ ok: false, raison: 'clé de service absente' })
  }

  const brut = await req.text()
  if (brut.length > TAILLE_MAX) {
    return NextResponse.json({ ok: false, raison: 'message trop volumineux' })
  }

  let corps: unknown
  try {
    corps = JSON.parse(brut)
  } catch {
    corps = { brut }
  }

  const sb = createClient(PROSPECTION_URL, cle, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { error } = await sb.from('telephonie_journal').insert({
    source: 'ringover',
    entetes: entetesRetenus(req.headers),
    corps,
  })

  if (error) return NextResponse.json({ ok: false, raison: error.message })
  return NextResponse.json({ ok: true })
}

/** Certains fournisseurs vérifient l'adresse en GET avant de l'accepter. */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ jeton: string }> }
) {
  const attendu = process.env.PROSPECTION_TELEPHONIE_JETON
  const { jeton } = await params
  if (!attendu || !memeJeton(jeton, attendu)) {
    return new NextResponse(null, { status: 404 })
  }
  return NextResponse.json({ ok: true, service: 'spyke-prospection' })
}
