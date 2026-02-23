import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

const HeaderSchema = z.object({
  authorization: z.string().min(1),
})

const BodySchema = z.object({
  ratings: z.record(z.string(), z.number().min(0).max(5)),
  comments: z.record(z.string(), z.string()).optional().default({}),
})

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) throw new Error('Supabase admin env missing')
  return createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })
}

export async function POST(req: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!supabaseUrl || !supabaseAnon) return NextResponse.json({ error: 'Supabase env missing' }, { status: 500 })

    const headers = HeaderSchema.parse({ authorization: req.headers.get('authorization') || '' })
    const m = headers.authorization.match(/^Bearer\s+(.+)$/i)
    const token = m?.[1]
    if (!token) return NextResponse.json({ error: 'Missing bearer token' }, { status: 401 })

    const bodyJson = await req.json().catch(() => ({}))
    const body = BodySchema.parse(bodyJson)

    const supabase = createClient(supabaseUrl, supabaseAnon, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const { data, error } = await supabase.auth.getUser()
    if (error || !data.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = data.user.id

    // Insert survey (RLS: insert own)
    const { error: insErr } = await supabase.from('feedback_surveys').insert({ user_id: userId, ratings: body.ratings, comments: body.comments } as any)
    if (insErr) throw insErr

    // Mark completed on profile using admin (in case profiles RLS blocks update)
    const supabaseAdmin = getSupabaseAdmin()
    await supabaseAdmin.from('profiles').update({ feedback_survey_completed_at: new Date().toISOString() } as any).eq('id', userId)

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error' }, { status: 400 })
  }
}
