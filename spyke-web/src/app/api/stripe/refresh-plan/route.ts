import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

const HeaderSchema = z.object({
  authorization: z.string().min(1),
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

    const stripeSecret = process.env.STRIPE_SECRET_KEY
    if (!stripeSecret) return NextResponse.json({ error: 'Stripe env missing' }, { status: 500 })

    const headers = HeaderSchema.parse({
      authorization: req.headers.get('authorization') || '',
    })
    const m = headers.authorization.match(/^Bearer\s+(.+)$/i)
    const token = m?.[1]
    if (!token) return NextResponse.json({ error: 'Missing bearer token' }, { status: 401 })

    // Validate user session
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

    const stripe = new Stripe(stripeSecret, { apiVersion: '2025-02-24.acacia' })

    // Find Stripe customer by email (most common case)
    const existing = await stripe.customers.list({ email, limit: 10 })
    const customers = existing.data || []

    // Find the most relevant subscription among all customers.
    // Prefer subscriptions with metadata.supabase_user_id matching current userId.
    let best:
      | {
          customerId: string
          subscriptionId: string
          status: Stripe.Subscription.Status
          currentPeriodEnd: string | null
        }
      | null = null

    for (const c of customers) {
      const subs = await stripe.subscriptions.list({ customer: c.id, status: 'all', limit: 10 })
      for (const s of subs.data || []) {
        const metaUserId = String((s.metadata as any)?.supabase_user_id || '')
        const score = metaUserId && metaUserId === userId ? 2 : 1

        const currentPeriodEnd = s.current_period_end ? new Date(s.current_period_end * 1000).toISOString() : null

        const candidate = {
          customerId: c.id,
          subscriptionId: s.id,
          status: s.status,
          currentPeriodEnd,
          score,
        }

        if (!best) {
          best = { customerId: candidate.customerId, subscriptionId: candidate.subscriptionId, status: candidate.status, currentPeriodEnd: candidate.currentPeriodEnd }
          ;(best as any).score = candidate.score
          continue
        }

        if ((candidate as any).score > (best as any).score) {
          best = { customerId: candidate.customerId, subscriptionId: candidate.subscriptionId, status: candidate.status, currentPeriodEnd: candidate.currentPeriodEnd }
          ;(best as any).score = candidate.score
        }
      }
    }

    const supabaseAdmin = getSupabaseAdmin()

    if (!best) {
      // No subscription found: ensure free
      await supabaseAdmin
        .from('profiles')
        .update({ plan: 'free', stripe_subscription_status: null, stripe_current_period_end: null } as any)
        .eq('id', userId)

      return NextResponse.json({ plan: 'free', found: false })
    }

    const isPro = best.status === 'active' || best.status === 'trialing'

    await supabaseAdmin
      .from('profiles')
      .update({
        plan: isPro ? 'pro' : 'free',
        stripe_customer_id: best.customerId || null,
        stripe_subscription_id: best.subscriptionId || null,
        stripe_subscription_status: best.status || null,
        stripe_current_period_end: best.currentPeriodEnd,
      } as any)
      .eq('id', userId)

    return NextResponse.json({ plan: isPro ? 'pro' : 'free', found: true, status: best.status })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error' }, { status: 400 })
  }
}
