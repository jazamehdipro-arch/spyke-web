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
    if (!stripeSecret) {
      return NextResponse.json({ error: 'Stripe env missing' }, { status: 500 })
    }

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
    const stripe = new Stripe(stripeSecret, { apiVersion: '2025-02-24.acacia' })

    // Best-effort: read stripe_customer_id from profile; fallback by email
    let customerId = ''
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('stripe_customer_id')
        .eq('id', user.id)
        .maybeSingle()
      customerId = String((profile as any)?.stripe_customer_id || '')
    } catch {
      // ignore
    }

    if (!customerId) {
      const email = user.email
      if (!email) return NextResponse.json({ error: 'Missing user email' }, { status: 400 })
      const existing = await stripe.customers.list({ email, limit: 1 })
      const customer = existing.data[0] || (await stripe.customers.create({ email, metadata: { supabase_user_id: user.id } }))
      customerId = customer.id
    }

    const origin = req.headers.get('origin') || 'https://www.spykeapp.fr'
    const returnUrl = `${origin}/app.html`

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    })

    return NextResponse.json({ url: session.url })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Stripe portal error' }, { status: 400 })
  }
}
