import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

const HeaderSchema = z.object({
  authorization: z.string().min(1),
})

type ResendResp = { id?: string }

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

    const resendKey = process.env.RESEND_API_KEY
    const resendFrom = process.env.RESEND_FROM_EMAIL
    if (!resendKey || !resendFrom) return NextResponse.json({ error: 'Resend env missing' }, { status: 500 })

    const headers = HeaderSchema.parse({
      authorization: req.headers.get('authorization') || '',
    })
    const m = headers.authorization.match(/^Bearer\s+(.+)$/i)
    const token = m?.[1]
    if (!token) return NextResponse.json({ error: 'Missing bearer token' }, { status: 401 })

    const supabase = createClient(supabaseUrl, supabaseAnon, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const { data, error } = await supabase.auth.getUser()
    if (error || !data.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = data.user
    const userId = user.id
    const email = user.email
    if (!email) return NextResponse.json({ error: 'Missing user email' }, { status: 400 })

    const supabaseAdmin = getSupabaseAdmin()

    // Check if already sent
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('welcome_sent_at,first_name')
      .eq('id', userId)
      .maybeSingle()

    if ((profile as any)?.welcome_sent_at) {
      return NextResponse.json({ ok: true, skipped: true })
    }

    const firstName = String((profile as any)?.first_name || '')

    const subject = 'Bienvenue sur Spyke'
    const baseUrl = process.env.APP_BASE_URL || 'https://spykeapp.fr'
    const text = [
      `Bonjour${firstName ? ' ' + firstName : ''},`,
      '',
      "Bienvenue sur Spyke !", 
      'Tu peux dès maintenant :',
      '- générer des devis, factures et contrats',
      '- envoyer tes documents par email',
      '- utiliser l’assistant IA pour répondre à tes clients',
      '',
      `Accéder à l’app : ${baseUrl}/app.html`,
      '',
      '— Spyke',
    ].join('\n')

    const sendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: resendFrom,
        to: [email],
        subject,
        text,
      }),
    })

    const json = (await sendRes.json().catch(() => null)) as ResendResp | null

    if (!sendRes.ok) {
      const errText = (json as any)?.message || (json as any)?.error || `Resend error (${sendRes.status})`
      return NextResponse.json({ error: errText }, { status: 400 })
    }

    await supabaseAdmin.from('profiles').update({ welcome_sent_at: new Date().toISOString() } as any).eq('id', userId)

    return NextResponse.json({ ok: true, id: json?.id || null })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error' }, { status: 400 })
  }
}
