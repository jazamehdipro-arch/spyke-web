import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) throw new Error('Supabase admin env missing')
  return createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })
}

export async function POST(req: Request) {
  const stripeSecret = process.env.STRIPE_SECRET_KEY
  const whSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!stripeSecret || !whSecret) {
    return NextResponse.json({ error: 'Stripe env missing' }, { status: 500 })
  }

  const stripe = new Stripe(stripeSecret, { apiVersion: '2025-02-24.acacia' })

  const sig = req.headers.get('stripe-signature')
  if (!sig) return NextResponse.json({ error: 'Missing stripe-signature' }, { status: 400 })

  const rawBody = await req.text()

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, whSecret)
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook signature verification failed: ${err?.message || err}` }, { status: 400 })
  }

  try {
    const supabase = getSupabaseAdmin()

    // We treat subscription status as the source of truth.
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      const userId = String((session.metadata as any)?.supabase_user_id || '')
      const subscriptionId = String(session.subscription || '')
      const customerId = String(session.customer || '')

      if (userId) {
        // Fetch subscription for status + period_end
        let status: string | null = null
        let currentPeriodEnd: string | null = null
        if (subscriptionId) {
          const sub = await stripe.subscriptions.retrieve(subscriptionId)
          status = sub.status
          currentPeriodEnd = sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null
        }

        await supabase
          .from('profiles')
          .update({
            plan: status === 'active' || status === 'trialing' ? 'pro' : 'free',
            stripe_customer_id: customerId || null,
            stripe_subscription_id: subscriptionId || null,
            stripe_subscription_status: status || null,
            stripe_current_period_end: currentPeriodEnd,
          } as any)
          .eq('id', userId)
      }
    }

    if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
      const sub = event.data.object as Stripe.Subscription
      const userId = String((sub.metadata as any)?.supabase_user_id || '')
      const status = sub.status
      const currentPeriodEnd = sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null

      if (userId) {
        await supabase
          .from('profiles')
          .update({
            plan: status === 'active' || status === 'trialing' ? 'pro' : 'free',
            stripe_customer_id: String(sub.customer || '') || null,
            stripe_subscription_id: sub.id,
            stripe_subscription_status: status,
            stripe_current_period_end: currentPeriodEnd,
          } as any)
          .eq('id', userId)
      }
    }

    return NextResponse.json({ received: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Webhook handler error' }, { status: 500 })
  }
}
