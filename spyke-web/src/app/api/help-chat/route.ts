import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

const HeaderSchema = z.object({
  authorization: z.string().min(1),
})

const PostBodySchema = z.object({
  message: z.string().min(1),
})

function requireEnv(name: string): string {
  const v = process.env[name]
  if (!v) throw new Error(`Missing env: ${name}`)
  return v
}

async function getUserIdFromBearer(token: string) {
  const supabaseUrl = requireEnv('NEXT_PUBLIC_SUPABASE_URL')
  const supabaseAnonKey = requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')

  const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data: userData, error: userError } = await supabaseAuth.auth.getUser()
  if (userError || !userData.user) throw new Error('Unauthorized')
  return userData.user.id
}

function getAdminClient() {
  const supabaseUrl = requireEnv('NEXT_PUBLIC_SUPABASE_URL')
  const serviceRoleKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY')
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

async function listMessages(userId: string, limit = 50) {
  const supabaseAdmin = getAdminClient()
  const { data, error } = await supabaseAdmin
    .from('help_chat_messages')
    .select('id,role,content,created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(limit)

  if (error) throw error
  return (data || []) as Array<{ id: string; role: 'user' | 'assistant'; content: string; created_at: string }>
}

async function insertMessage(userId: string, role: 'user' | 'assistant', content: string) {
  const supabaseAdmin = getAdminClient()
  const { error } = await supabaseAdmin
    .from('help_chat_messages')
    .insert({ user_id: userId, role, content })
  if (error) throw error
}

export async function GET(req: Request) {
  try {
    const headers = HeaderSchema.parse({ authorization: req.headers.get('authorization') || '' })
    const m = headers.authorization.match(/^Bearer\s+(.+)$/i)
    const token = m?.[1]
    if (!token) return NextResponse.json({ error: 'Missing bearer token' }, { status: 401 })

    const userId = await getUserIdFromBearer(token)
    const messages = await listMessages(userId, 80)
    return NextResponse.json({ ok: true, messages })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error' }, { status: 400 })
  }
}

export async function POST(req: Request) {
  try {
    const headers = HeaderSchema.parse({ authorization: req.headers.get('authorization') || '' })
    const m = headers.authorization.match(/^Bearer\s+(.+)$/i)
    const token = m?.[1]
    if (!token) return NextResponse.json({ error: 'Missing bearer token' }, { status: 401 })

    const body = PostBodySchema.parse(await req.json().catch(() => ({})))

    const userId = await getUserIdFromBearer(token)

    // Save user message
    await insertMessage(userId, 'user', body.message)

    // Build prompt from last messages
    const history = await listMessages(userId, 30)
    const system = `Tu es l'assistant d'aide de Spyke (outil pour freelances).\n\nRÔLE : aider l'utilisateur à comprendre comment utiliser Spyke et répondre à ses questions générales sur Spyke (devis, factures, contrats, emails, navigation).\n\nSCOPE (ce que tu fais) :\n- Expliquer les fonctionnalités Spyke et guider étape-par-étape\n- Expliquer des notions liées aux documents (mentions facture, relance, etc.) de manière générale\n- Proposer des formulations (emails, relances) si l'utilisateur te donne le contexte\n\nHORS SCOPE (ce que tu ne fais pas) :\n- Accéder aux données privées non fournies (clients, devis/factures spécifiques)\n- Exécuter des actions (envoyer un mail, générer un PDF, modifier un document)\n- Répondre à des sujets sans rapport avec Spyke\n\nRÈGLES :\n- Réponds en français\n- Sois concis et actionnable\n- Ne demande jamais de secrets (mots de passe, clés API)\n\nSI LA QUESTION EST HORS SCOPE :\nRéponds EXACTEMENT avec ce format :\n\"Je suis l’aide Spyke : je peux répondre aux questions sur l’utilisation de Spyke (devis/factures/contrats/emails).\n\nPour ta demande : <1 phrase qui explique pourquoi c'est hors scope ou ce qui manque>.\n\nOption : si tu colles ici le texte / le message / l’erreur (sans données sensibles), je te propose une réponse ou la marche à suivre dans Spyke.\"\n\nIMPORTANT : tu guides seulement, tu ne fais pas d’actions à la place de l’utilisateur.\n`

    const prompt = history
      .map((m) => `${m.role === 'user' ? 'Utilisateur' : 'Assistant'}: ${m.content}`)
      .join('\n')

    // Reuse existing Claude endpoint
    const baseUrl = req.headers.get('x-forwarded-proto')
      ? `${req.headers.get('x-forwarded-proto')}://${req.headers.get('x-forwarded-host')}`
      : ''

    const claudeRes = await fetch(`${baseUrl}/api/claude`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ system, prompt }),
    })

    const claudeJson = await claudeRes.json().catch(() => null)
    if (!claudeRes.ok) {
      throw new Error(claudeJson?.error || `Erreur IA (${claudeRes.status})`)
    }

    const out = String(claudeJson?.text || '').trim() || "Désolé, je n'ai pas pu répondre."

    // Save assistant message
    await insertMessage(userId, 'assistant', out)

    const messages = await listMessages(userId, 80)
    return NextResponse.json({ ok: true, messages })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error' }, { status: 400 })
  }
}
