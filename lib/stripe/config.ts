import Stripe from 'stripe'

// Server-side Stripe instance (lazy initialized to avoid build-time errors)
let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not set')
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2026-01-28.clover',
      typescript: true
    })
  }
  return _stripe
}

// Lookup keys for Stripe prices - create these in your Stripe Dashboard
export const LOOKUP_KEYS = {
  pro: 'flipbook_pro_monthly',
  business: 'flipbook_business_monthly',
  single: 'flipbook_single_purchase' // One-time payment
} as const

// Free tier file size limit (MB) - files above this require a paid plan
export const FREE_FILE_SIZE_LIMIT_MB = 50

// Plan configuration (prices in EUR)
export const PLANS = {
  free: {
    name: 'Free',
    description: 'Para probar FlipBook',
    price: 0,
    currency: 'eur',
    lookupKey: null,
    isRecurring: false,
    limits: {
      maxFileSizeMB: FREE_FILE_SIZE_LIMIT_MB,
      maxFlipbooks: 3,
      maxPagesPerBook: 50
    },
    features: {
      customDomain: false,
      advancedAnalytics: false,
      passwordProtection: false
    }
  },
  single: {
    name: 'Pago único',
    description: 'Un flipbook premium',
    price: 9.99,
    currency: 'eur',
    lookupKey: LOOKUP_KEYS.single,
    isRecurring: false,
    limits: {
      maxFileSizeMB: 200,
      maxFlipbooks: 1, // Per purchase (adds 1 premium credit)
      maxPagesPerBook: 200
    },
    features: {
      customDomain: false,
      advancedAnalytics: true,
      passwordProtection: true
    }
  },
  pro: {
    name: 'Pro',
    description: 'Para creadores y pequeños negocios',
    price: 7.99,
    currency: 'eur',
    lookupKey: LOOKUP_KEYS.pro,
    isRecurring: true,
    limits: {
      maxFileSizeMB: 200,
      maxFlipbooks: -1, // unlimited
      maxPagesPerBook: 200
    },
    features: {
      customDomain: false,
      advancedAnalytics: true,
      passwordProtection: true
    }
  },
  business: {
    name: 'Business',
    description: 'Para equipos y empresas',
    price: 19.99,
    currency: 'eur',
    lookupKey: LOOKUP_KEYS.business,
    isRecurring: true,
    limits: {
      maxFileSizeMB: 500,
      maxFlipbooks: -1, // unlimited
      maxPagesPerBook: 500
    },
    features: {
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
