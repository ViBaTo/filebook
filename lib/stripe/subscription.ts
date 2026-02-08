import { createClient } from '@/lib/supabase/server'
import { PLANS, type PlanType } from './config'

export interface UserSubscription {
  plan: PlanType
  status: string
  maxFileSizeMB: number
  maxFlipbooks: number
  maxPagesPerBook: number
  removeWatermark: boolean
  customDomain: boolean
  advancedAnalytics: boolean
  passwordProtection: boolean
  stripeCustomerId: string | null
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
}

export async function getUserSubscription(
  userId: string
): Promise<UserSubscription> {
  const supabase = await createClient()

  const { data: subscription } = await supabase
    .from('fb_subscriptions')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (!subscription) {
    // Return free plan defaults
    return {
      plan: 'free',
      status: 'active',
      ...PLANS.free.limits,
      ...PLANS.free.features,
      stripeCustomerId: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false
    }
  }

  return {
    plan: subscription.plan as PlanType,
    status: subscription.status,
    maxFileSizeMB: subscription.max_file_size_mb,
    maxFlipbooks: subscription.max_flipbooks,
    maxPagesPerBook: subscription.max_pages_per_book,
    removeWatermark: subscription.remove_watermark,
    customDomain: subscription.custom_domain,
    advancedAnalytics: subscription.advanced_analytics,
    passwordProtection: subscription.password_protection,
    stripeCustomerId: subscription.stripe_customer_id,
    currentPeriodEnd: subscription.current_period_end,
    cancelAtPeriodEnd: subscription.cancel_at_period_end
  }
}

export async function getUserFlipbookCount(userId: string): Promise<number> {
  const supabase = await createClient()

  const { count } = await supabase
    .from('fb_books')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  return count || 0
}

export async function canUserCreateFlipbook(userId: string | null): Promise<{
  allowed: boolean
  reason?: string
  subscription?: UserSubscription
}> {
  // Anonymous users can create with free tier limits
  if (!userId) {
    return { allowed: true }
  }

  const subscription = await getUserSubscription(userId)
  const flipbookCount = await getUserFlipbookCount(userId)

  // Unlimited flipbooks
  if (subscription.maxFlipbooks === -1) {
    return { allowed: true, subscription }
  }

  if (flipbookCount >= subscription.maxFlipbooks) {
    return {
      allowed: false,
      reason: `Has alcanzado el límite de ${subscription.maxFlipbooks} flipbooks en tu plan ${subscription.plan}. Actualiza a Pro para crear más.`,
      subscription
    }
  }

  return { allowed: true, subscription }
}

export function getFileSizeLimit(
  subscription?: UserSubscription | null
): number {
  if (!subscription) {
    return PLANS.free.limits.maxFileSizeMB
  }
  return subscription.maxFileSizeMB
}

export function getPageLimit(subscription?: UserSubscription | null): number {
  if (!subscription) {
    return PLANS.free.limits.maxPagesPerBook
  }
  return subscription.maxPagesPerBook
}
