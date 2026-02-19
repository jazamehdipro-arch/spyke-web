import { NextResponse } from 'next/server'
import { z } from 'zod'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

const HeaderSchema = z.object({
  authorization: z.string().min(1),
})

const BodySchema = z.object({
  question: z.string().min(10).max(5000),
})

function requireEnv(name: string): string {
  const v = process.env[name]
  if (!v) throw new Error(`Missing env: ${name}`)
  return v
}

export async function POST(req: Request) {
  try {
    const supabaseUrl = requireEnv('NEXT_PUBLIC_SUPABASE_URL')
    const supabaseAnonKey = requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
    const serviceRoleKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY')

    const stripeSecret = requireEnv('STRIPE_SECRET_KEY')
    const stripe = new Stripe(stripeSecret, { apiVersion: '2025-02-24.acacia' })

    const headers = HeaderSchema.parse({ authorization: req.headers.get('authorization') || '' })
    const m = headers.authorization.match(/^Bearer\s+(.+)$/i)
    const token = m?.[1]
    if (!token) return NextResponse.json({ error: 'Missing bearer token' }, { status: 401 })

    const body = BodySchema.parse(await req.json().catch(() => ({})))

    // Identify user
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const { data: userData, error: userError } = await supabaseAuth.auth.getUser()
    if (userError || !userData.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = userData.user.id
    const userEmail = userData.user.email || ''

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    // Pro-only gate
    const { data: profile, error: pErr } = await supabaseAdmin.from('profiles').select('plan').eq('id', userId).maybeSingle()
    if (pErr) throw pErr
    const plan = String((profile as any)?.plan || 'free')
    if (plan !== 'pro') {
      return NextResponse.json({ error: 'Fonction réservée au plan Pro.' }, { status: 403 })
    }

    // Create draft row
    const { data: qRow, error: qErr } = await supabaseAdmin
      .from('legal_questions')
      .insert({ user_id: userId, user_email: userEmail || null, question: body.question, status: 'draft' } as any)
      .select('id')
      .single()

    if (qErr) throw qErr
    const legalQuestionId = String((qRow as any)?.id || '')
    if (!legalQuestionId) throw new Error('Failed to create question')

    const origin = req.headers.get('origin') || ''
    const successUrl = `${origin}/app.html?tab=juriste&legal=success&qid=${encodeURIComponent(legalQuestionId)}`
    const cancelUrl = `${origin}/app.html?tab=juriste&legal=cancel&qid=${encodeURIComponent(legalQuestionId)}`

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: { name: 'Question juriste (Spyke)' },
            unit_amount: 500,
          },
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        type: 'legal_question',
        supabase_user_id: userId,
        legal_question_id: legalQuestionId,
      },
    })

    // Persist stripe session id
    await supabaseAdmin
      .from('legal_questions')
      .update({ stripe_checkout_session_id: session.id } as any)
      .eq('id', legalQuestionId)

    return NextResponse.json({ ok: true, url: session.url, id: legalQuestionId })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error' }, { status: 400 })
  }
}
