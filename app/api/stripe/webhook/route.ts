import { NextRequest, NextResponse } from 'next/server'
import { getStripe, PLANS, type PlanType } from '@/lib/stripe/config'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

// Lazy-init supabase admin to avoid build-time errors
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    )
  }

  const stripe = getStripe()
  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        await handleCheckoutComplete(session)
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionUpdate(subscription)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionDeleted(subscription)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        await handlePaymentFailed(invoice)
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook handler error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}

async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.user_id
  const plan = session.metadata?.plan as PlanType
  const paymentType = session.metadata?.type // 'one_time' for single purchase

  if (!userId || !plan) {
    console.error('Missing metadata in checkout session')
    return
  }

  const planConfig = PLANS[plan]

  // Handle one-time payment (single flipbook purchase)
  if (paymentType === 'one_time' && plan === 'single') {
    // Get current credits
    const supabaseAdmin = getSupabaseAdmin()
    const { data: existing } = await supabaseAdmin
      .from('fb_subscriptions')
      .select('premium_credits')
      .eq('user_id', userId)
      .single()

    const currentCredits = existing?.premium_credits || 0

    // Add one premium credit
    await getSupabaseAdmin().from('fb_subscriptions').upsert({
      user_id: userId,
      stripe_customer_id: session.customer as string,
      premium_credits: currentCredits + 1,
      // Keep existing plan if they have one, otherwise stay free
      ...(existing ? {} : { plan: 'free' })
    })

    console.log(
      `Added 1 premium credit for user ${userId}. Total: ${currentCredits + 1}`
    )
    return
  }

  // Handle subscription payment
  await getSupabaseAdmin().from('fb_subscriptions').upsert({
    user_id: userId,
    stripe_customer_id: session.customer as string,
    stripe_subscription_id: session.subscription as string,
    stripe_price_id: planConfig.lookupKey,
    plan,
    status: 'active',
    max_file_size_mb: planConfig.limits.maxFileSizeMB,
    max_flipbooks: planConfig.limits.maxFlipbooks,
    max_pages_per_book: planConfig.limits.maxPagesPerBook,
    remove_watermark: true, // Watermark removed for all plans
    custom_domain: planConfig.features.customDomain,
    advanced_analytics: planConfig.features.advancedAnalytics,
    password_protection: planConfig.features.passwordProtection
  })
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.user_id

  if (!userId) {
    // Try to find by customer ID
    const { data } = await getSupabaseAdmin()
      .from('fb_subscriptions')
      .select('user_id')
      .eq('stripe_subscription_id', subscription.id)
      .single()

    if (!data) {
      console.error('Could not find user for subscription:', subscription.id)
      return
    }
  }

  const status =
    subscription.status === 'active'
      ? 'active'
      : subscription.status === 'past_due'
        ? 'past_due'
        : subscription.status === 'canceled'
          ? 'canceled'
          : 'active'

  // Get period dates from the subscription object
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const subAny = subscription as any
  const periodStart =
    typeof subAny.current_period_start === 'number'
      ? new Date(subAny.current_period_start * 1000).toISOString()
      : null
  const periodEnd =
    typeof subAny.current_period_end === 'number'
      ? new Date(subAny.current_period_end * 1000).toISOString()
      : null

  await getSupabaseAdmin()
    .from('fb_subscriptions')
    .update({
      status,
      current_period_start: periodStart,
      current_period_end: periodEnd,
      cancel_at_period_end: subscription.cancel_at_period_end
    })
    .eq('stripe_subscription_id', subscription.id)
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  // Downgrade to free plan
  await getSupabaseAdmin()
    .from('fb_subscriptions')
    .update({
      plan: 'free',
      status: 'canceled',
      stripe_subscription_id: null,
      stripe_price_id: null,
      max_file_size_mb: PLANS.free.limits.maxFileSizeMB,
      max_flipbooks: PLANS.free.limits.maxFlipbooks,
      max_pages_per_book: PLANS.free.limits.maxPagesPerBook,
      remove_watermark: true, // Watermark removed for all plans
      custom_domain: false,
      advanced_analytics: false,
      password_protection: false
    })
    .eq('stripe_subscription_id', subscription.id)
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const invoiceAny = invoice as any
  const subscriptionId = invoiceAny.subscription as string | null

  if (subscriptionId) {
    await getSupabaseAdmin()
      .from('fb_subscriptions')
      .update({ status: 'past_due' })
      .eq('stripe_subscription_id', subscriptionId)
  }
}
