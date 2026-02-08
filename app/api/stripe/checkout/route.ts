import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe, PLANS, type PlanType } from '@/lib/stripe/config'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { lookup_key } = body as { lookup_key: string }

    // Map lookup_key to plan
    const planMap: Record<string, PlanType> = {
      flipbook_pro_monthly: 'pro',
      flipbook_business_monthly: 'business',
      flipbook_single_purchase: 'single'
    }

    const plan = planMap[lookup_key]
    if (!plan) {
      return NextResponse.json(
        { error: 'Invalid plan selected' },
        { status: 400 }
      )
    }

    const planConfig = PLANS[plan]
    const isOneTime = plan === 'single'

    const supabase = await createClient()
    const {
      data: { user }
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'You must be logged in to purchase' },
        { status: 401 }
      )
    }

    // Check if user already has a subscription record
    const { data: existingSubscription } = await supabase
      .from('fb_subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single()

    let customerId = existingSubscription?.stripe_customer_id

    // Create Stripe customer if not exists
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_user_id: user.id
        }
      })
      customerId = customer.id

      // Create subscription record
      await supabase.from('fb_subscriptions').upsert({
        user_id: user.id,
        stripe_customer_id: customerId,
        plan: 'free'
      })
    }

    // Get price by lookup_key
    const prices = await stripe.prices.list({
      lookup_keys: [lookup_key],
      expand: ['data.product']
    })

    if (!prices.data.length) {
      return NextResponse.json(
        { error: 'Price not found for this plan' },
        { status: 404 }
      )
    }

    // Create checkout session - different config for one-time vs subscription
    if (isOneTime) {
      // One-time payment for single flipbook
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: 'payment',
        billing_address_collection: 'auto',
        line_items: [
          {
            price: prices.data[0].id,
            quantity: 1
          }
        ],
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/create?purchase=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?canceled=true`,
        metadata: {
          user_id: user.id,
          plan: 'single',
          type: 'one_time'
        }
      })

      return NextResponse.json({ url: session.url })
    } else {
      // Subscription payment
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: 'subscription',
        billing_address_collection: 'auto',
        line_items: [
          {
            price: prices.data[0].id,
            quantity: 1
          }
        ],
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?canceled=true`,
        metadata: {
          user_id: user.id,
          plan
        },
        subscription_data: {
          metadata: {
            user_id: user.id,
            plan
          }
        }
      })

      return NextResponse.json({ url: session.url })
    }
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
