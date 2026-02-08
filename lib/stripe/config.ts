import Stripe from 'stripe'

// Server-side Stripe instance
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-01-28.clover',
  typescript: true
})

// Lookup keys for Stripe prices - create these in your Stripe Dashboard
export const LOOKUP_KEYS = {
  pro: 'flipbook_pro_monthly',
  business: 'flipbook_business_monthly',
  single: 'flipbook_single_purchase' // One-time payment
} as const

// Plan configuration
export const PLANS = {
  free: {
    name: 'Free',
    description: 'Para probar FlipBook',
    price: 0,
    lookupKey: null,
    isRecurring: false,
    limits: {
      maxFileSizeMB: 30,
      maxFlipbooks: 3,
      maxPagesPerBook: 50
    },
    features: {
      removeWatermark: false,
      customDomain: false,
      advancedAnalytics: false,
      passwordProtection: false
    }
  },
  single: {
    name: 'Pago único',
    description: 'Un flipbook premium',
    price: 4.99,
    lookupKey: LOOKUP_KEYS.single,
    isRecurring: false,
    limits: {
      maxFileSizeMB: 200,
      maxFlipbooks: 1, // Per purchase
      maxPagesPerBook: 200
    },
    features: {
      removeWatermark: true,
      customDomain: false,
      advancedAnalytics: true,
      passwordProtection: true
    }
  },
  pro: {
    name: 'Pro',
    description: 'Para creadores y pequeños negocios',
    price: 2.99,
    lookupKey: LOOKUP_KEYS.pro,
    isRecurring: true,
    limits: {
      maxFileSizeMB: 200,
      maxFlipbooks: -1, // unlimited
      maxPagesPerBook: 200
    },
    features: {
      removeWatermark: true,
      customDomain: false,
      advancedAnalytics: true,
      passwordProtection: true
    }
  },
  business: {
    name: 'Business',
    description: 'Para equipos y empresas',
    price: 14.99,
    lookupKey: LOOKUP_KEYS.business,
    isRecurring: true,
    limits: {
      maxFileSizeMB: 500,
      maxFlipbooks: -1, // unlimited
      maxPagesPerBook: 500
    },
    features: {
      removeWatermark: true,
      customDomain: true,
      advancedAnalytics: true,
      passwordProtection: true
    }
  }
} as const

export type PlanType = keyof typeof PLANS
export type RecurringPlanType = 'pro' | 'business'
export type OneTimePlanType = 'single'

export function getPlanLimits(plan: PlanType) {
  return PLANS[plan].limits
}

export function getPlanFeatures(plan: PlanType) {
  return PLANS[plan].features
}
