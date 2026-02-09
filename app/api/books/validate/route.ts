import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  canUserCreateFlipbook,
  consumePremiumCredit
} from '@/lib/stripe/subscription'

/**
 * POST /api/books/validate
 * Validates if user can create a flipbook with the given file size.
 * If a premium credit is needed and available, it will be consumed.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { fileSizeMB, consume } = body as {
      fileSizeMB: number
      consume?: boolean
    }

    const supabase = await createClient()
    const {
      data: { user }
    } = await supabase.auth.getUser()

    const result = await canUserCreateFlipbook(user?.id || null, fileSizeMB)

    if (!result.allowed) {
      return NextResponse.json(
        {
          allowed: false,
          reason: result.reason,
          requiresPremium: result.requiresPremium || false
        },
        { status: 403 }
      )
    }

    // If creation requires a premium credit and consumer flag is set, consume it
    if (result.requiresPremium && consume && user) {
      const consumed = await consumePremiumCredit(user.id)
      if (!consumed) {
        return NextResponse.json(
          {
            allowed: false,
            reason:
              'No se pudo consumir el crédito premium. Intenta de nuevo.',
            requiresPremium: true
          },
          { status: 403 }
        )
      }
      return NextResponse.json({
        allowed: true,
        usedPremiumCredit: true,
        premiumCreditsRemaining:
          (result.subscription?.premiumCredits || 1) - 1
      })
    }

    return NextResponse.json({
      allowed: true,
      requiresPremium: result.requiresPremium || false,
      premiumCredits: result.subscription?.premiumCredits || 0,
      plan: result.subscription?.plan || 'free'
    })
  } catch (error) {
    console.error('Error validating book creation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
