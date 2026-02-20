import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

const HeaderSchema = z.object({
  authorization: z.string().min(1),
})

function requireEnv(name: string): string {
  const v = process.env[name]
  if (!v) throw new Error(`Missing env: ${name}`)
  return v
}

function getAdminClient() {
  const url = requireEnv('NEXT_PUBLIC_SUPABASE_URL')
  const serviceKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY')
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
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

export async function GET(req: Request) {
  try {
    const headers = HeaderSchema.parse({ authorization: req.headers.get('authorization') || '' })
    const m = headers.authorization.match(/^Bearer\s+(.+)$/i)
    const token = m?.[1]
    if (!token) return NextResponse.json({ error: 'Missing bearer token' }, { status: 401 })

    const url = new URL(req.url)
    const qid = String(url.searchParams.get('id') || '').trim()
    if (!qid) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

    const userId = await getUserIdFromBearer(token)
    const supabaseAdmin = getAdminClient()

    const { data: q, error: qErr } = await supabaseAdmin
      .from('legal_questions')
      .select('id,user_id,question,status,created_at,paid_at,sent_at')
      .eq('id', qid)
      .maybeSingle()

    if (qErr) throw qErr
    if (!q || String((q as any).user_id) !== userId) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const { data: msgs, error: mErr } = await supabaseAdmin
      .from('legal_question_messages')
      .select('id,role,content,created_at')
      .eq('legal_question_id', qid)
      .order('created_at', { ascending: true })

    if (mErr) throw mErr

    return NextResponse.json({ ok: true, question: q, messages: msgs || [] })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error' }, { status: 400 })
  }
}
