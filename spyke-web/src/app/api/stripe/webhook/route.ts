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
      const meta: any = session.metadata || {}

      // 1) One-off payment: legal question
      if (String(meta?.type || '') === 'legal_question') {
        const userId = String(meta?.supabase_user_id || '')
        const legalQuestionId = String(meta?.legal_question_id || '')

        if (userId && legalQuestionId) {
          const paymentIntentId = String(session.payment_intent || '')

          // Mark paid
          const nowIso = new Date().toISOString()
          await supabase
            .from('legal_questions')
            .update({
              status: 'paid',
              stripe_checkout_session_id: session.id,
              stripe_payment_intent_id: paymentIntentId || null,
              paid_at: nowIso,
            } as any)
            .eq('id', legalQuestionId)
            .eq('user_id', userId)

          // Fetch question + notify jurists via Resend
          const { data: qRow } = await supabase
            .from('legal_questions')
            .select('id,question,user_email,status,created_at')
            .eq('id', legalQuestionId)
            .maybeSingle()

          // Ensure jurist token for reply-link
          let juristToken = ''
          try {
            const { data: tokRow } = await supabase.from('legal_questions').select('jurist_token').eq('id', legalQuestionId).maybeSingle()
            juristToken = String((tokRow as any)?.jurist_token || '')
          } catch {}

          if (!juristToken) {
            juristToken = Buffer.from(String(crypto.randomUUID()) + String(Date.now())).toString('base64url')
            await supabase.from('legal_questions').update({ jurist_token: juristToken } as any).eq('id', legalQuestionId)
          }

          const resendKey = process.env.RESEND_API_KEY
          const resendFrom = process.env.RESEND_FROM_EMAIL
          const recipients = String(process.env.LEGAL_RECIPIENTS || '')
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)

          if (resendKey && resendFrom && recipients.length && (qRow as any)?.question) {
            const baseUrl = process.env.APP_BASE_URL || 'https://spykeapp.fr'
            const replyLink = `${baseUrl}/jurist/reply?id=${encodeURIComponent(legalQuestionId)}&token=${encodeURIComponent(juristToken)}`

            const subject = `Nouvelle question juriste (Spyke)`
            const text = [
              `Nouvelle question juriste payée (5€).`,
              ``,
              `Question ID: ${(qRow as any)?.id}`,
              `Utilisateur: ${(qRow as any)?.user_email || userId}`,
              `Créée le: ${(qRow as any)?.created_at}`,
              ``,
              `Question:`,
              String((qRow as any)?.question || '').trim(),
              ``,
              `Répondre dans Spyke:`,
              replyLink,
              ``,
              `— Spyke`,
            ].join('\n')

            const sendRes = await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${resendKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                from: resendFrom,
                to: recipients,
                subject,
                text,
              }),
            })

            if (sendRes.ok) {
              await supabase
                .from('legal_questions')
                .update({ status: 'sent', sent_at: new Date().toISOString() } as any)
                .eq('id', legalQuestionId)
            } else {
              await supabase.from('legal_questions').update({ status: 'failed' } as any).eq('id', legalQuestionId)
            }
          }
        }

        // Done
        return NextResponse.json({ received: true })
      }

      // 2) Subscription: Pro plan
      const userId = String(meta?.supabase_user_id || '')
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
