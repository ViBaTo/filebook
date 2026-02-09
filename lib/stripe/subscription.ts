import { createClient } from '@/lib/supabase/server'
import { PLANS, FREE_FILE_SIZE_LIMIT_MB, type PlanType } from './config'

export interface UserSubscription {
  plan: PlanType
  status: string
  maxFileSizeMB: number
  maxFlipbooks: number
  maxPagesPerBook: number
  premiumCredits: number
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
      premiumCredits: 0,
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
    premiumCredits: subscription.premium_credits || 0,
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

/**
 * Check if a user can create a flipbook.
 * - Free users: up to 3 flipbooks, max 50MB per file
 * - If file > 50MB: needs Pro/Business subscription OR a premium credit (single purchase)
 * - Premium credits are consumed when creating a flipbook with a file > 50MB
 */
export async function canUserCreateFlipbook(
  userId: string | null,
  fileSizeMB?: number
): Promise<{
  allowed: boolean
  reason?: string
  requiresPremium?: boolean
  subscription?: UserSubscription
}> {
  // Anonymous users can create with free tier limits
  if (!userId) {
    if (fileSizeMB && fileSizeMB > FREE_FILE_SIZE_LIMIT_MB) {
      return {
        allowed: false,
        requiresPremium: true,
        reason: `Los archivos de más de ${FREE_FILE_SIZE_LIMIT_MB}MB requieren un plan de pago o un crédito premium.`
      }
    }
    return { allowed: true }
  }

  const subscription = await getUserSubscription(userId)
  const flipbookCount = await getUserFlipbookCount(userId)
  const isPaidPlan = subscription.plan === 'pro' || subscription.plan === 'business'
  const fileExceedsFreeLimit = fileSizeMB ? fileSizeMB > FREE_FILE_SIZE_LIMIT_MB : false

  // Paid plans (Pro/Business): check their own limits
  if (isPaidPlan) {
    if (fileSizeMB && fileSizeMB > subscription.maxFileSizeMB) {
      return {
        allowed: false,
        reason: `Tu archivo supera el límite de ${subscription.maxFileSizeMB}MB de tu plan ${subscription.plan}.`,
        subscription
      }
    }
    return { allowed: true, subscription }
  }

  // Free plan user with a file > 50MB
  if (fileExceedsFreeLimit) {
    // Check if they have premium credits
    if (subscription.premiumCredits > 0) {
      // File must also be within single purchase limits (200MB)
      if (fileSizeMB && fileSizeMB > PLANS.single.limits.maxFileSizeMB) {
        return {
          allowed: false,
          reason: `Tu archivo supera el límite de ${PLANS.single.limits.maxFileSizeMB}MB. Considera el plan Business para archivos de hasta ${PLANS.business.limits.maxFileSizeMB}MB.`,
          subscription
        }
      }
      return { allowed: true, requiresPremium: true, subscription }
    }

    return {
      allowed: false,
      requiresPremium: true,
      reason: `Los archivos de más de ${FREE_FILE_SIZE_LIMIT_MB}MB requieren un plan Pro (7,99€/mes) o un crédito premium (9,99€).`,
      subscription
    }
  }

  // Free plan user with file <= 50MB: check flipbook count
  if (subscription.maxFlipbooks !== -1 && flipbookCount >= subscription.maxFlipbooks) {
    // Even if blocked by free limit, premium credits can unlock an extra slot
    if (subscription.premiumCredits > 0) {
      return { allowed: true, requiresPremium: true, subscription }
    }

    return {
      allowed: false,
      reason: `Has alcanzado el límite de ${subscription.maxFlipbooks} flipbooks en tu plan gratuito. Actualiza a Pro para flipbooks ilimitados.`,
      subscription
    }
  }

  return { allowed: true, subscription }
}

/**
 * Consume a premium credit when creating a flipbook that requires it
 * (file > 50MB or free slots exhausted)
 */
export async function consumePremiumCredit(userId: string): Promise<boolean> {
  const supabase = await createClient()

  const { data: subscription } = await supabase
    .from('fb_subscriptions')
    .select('premium_credits')
    .eq('user_id', userId)
    .single()

  if (!subscription || subscription.premium_credits <= 0) {
    return false
  }

  const { error } = await supabase
    .from('fb_subscriptions')
    .update({ premium_credits: subscription.premium_credits - 1 })
    .eq('user_id', userId)

  return !error
}

export function getFileSizeLimit(
  subscription?: UserSubscription | null
): number {
  if (!subscription) {
    return PLANS.free.limits.maxFileSizeMB
  }
  // If user has premium credits on free plan, they can use single purchase limits
  if (subscription.plan === 'free' && subscription.premiumCredits > 0) {
    return PLANS.single.limits.maxFileSizeMB
  }
  return subscription.maxFileSizeMB
}

export function getPageLimit(subscription?: UserSubscription | null): number {
  if (!subscription) {
    return PLANS.free.limits.maxPagesPerBook
  }
  // If user has premium credits on free plan, they can use single purchase limits
  if (subscription.plan === 'free' && subscription.premiumCredits > 0) {
    return PLANS.single.limits.maxPagesPerBook
  }
  return subscription.maxPagesPerBook
}
