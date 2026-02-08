'use client'

import { loadStripe, type Stripe } from '@stripe/stripe-js'

// Client-side Stripe instance (singleton)
let stripePromise: Promise<Stripe | null> | null = null

export function getStripe() {
  if (!stripePromise) {
    stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)
  }
  return stripePromise
}

export async function redirectToCheckout(sessionUrl: string) {
  // Stripe Checkout now uses direct URL redirect instead of sessionId
  window.location.href = sessionUrl
}

export async function redirectToPortal(portalUrl: string) {
  window.location.href = portalUrl
}
