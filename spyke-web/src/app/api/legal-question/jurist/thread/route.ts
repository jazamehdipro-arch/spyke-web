import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

const QuerySchema = z.object({
  id: z.string().min(1),
  token: z.string().min(10),
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

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const parsed = QuerySchema.parse({
      id: String(url.searchParams.get('id') || ''),
      token: String(url.searchParams.get('token') || ''),
    })

    const supabase = getAdminClient()

    const { data: q, error: qErr } = await supabase
      .from('legal_questions')
      .select('id,question,status,created_at')
      .eq('id', parsed.id)
      .eq('jurist_token', parsed.token)
      .maybeSingle()

    if (qErr) throw qErr
    if (!q) return NextResponse.json({ error: 'Lien invalide' }, { status: 404 })

    const { data: msgs, error: mErr } = await supabase
      .from('legal_question_messages')
      .select('id,role,content,created_at')
      .eq('legal_question_id', parsed.id)
      .order('created_at', { ascending: true })

    if (mErr) throw mErr

    return NextResponse.json({ ok: true, question: q, messages: msgs || [] })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error' }, { status: 400 })
  }
}
