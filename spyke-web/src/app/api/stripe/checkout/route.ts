import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

const HeaderSchema = z.object({
  authorization: z.string().min(1),
})

export async function POST(req: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!supabaseUrl || !supabaseAnon) {
      return NextResponse.json({ error: 'Supabase env missing' }, { status: 500 })
    }

    const stripeSecret = process.env.STRIPE_SECRET_KEY
    const stripePriceId = process.env.STRIPE_PRICE_PRO_MONTHLY
    if (!stripeSecret || !stripePriceId) {
      return NextResponse.json({ error: 'Stripe env missing' }, { status: 500 })
    }

    const headers = HeaderSchema.parse({
      authorization: req.headers.get('authorization') || '',
    })
    const m = headers.authorization.match(/^Bearer\s+(.+)$/i)
    const token = m?.[1]
    if (!token) return NextResponse.json({ error: 'Missing bearer token' }, { status: 401 })

    // Validate user
    const supabase = createClient(supabaseUrl, supabaseAnon, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const { data, error } = await supabase.auth.getUser()
    if (error || !data.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = data.user
    const email = user.email
    if (!email) return NextResponse.json({ error: 'Missing user email' }, { status: 400 })

    const stripe = new Stripe(stripeSecret, {
      // keep in sync with installed stripe types
      apiVersion: '2025-02-24.acacia',
    })

    // Find or create Stripe customer (by email)
    const existing = await stripe.customers.list({ email, limit: 1 })
    const customer = existing.data[0] || (await stripe.customers.create({ email, metadata: { supabase_user_id: user.id } }))

    const origin = req.headers.get('origin') || 'https://www.spykeapp.fr'

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customer.id,
      line_items: [{ price: stripePriceId, quantity: 1 }],
      allow_promotion_codes: true,
      success_url: `${origin}/app.html?stripe=success`,
      cancel_url: `${origin}/app.html?stripe=cancel`,
      subscription_data: {
        metadata: {
          supabase_user_id: user.id,
        },
      },
      metadata: {
        supabase_user_id: user.id,
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Stripe checkout error' }, { status: 400 })
  }
}
