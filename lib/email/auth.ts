import { buildAuthConfirmUrl } from '@/lib/email/links'
import { sendEmailVerificationEmail } from '@/lib/email/templates/email-verification'
import { sendPasswordResetEmail } from '@/lib/email/templates/password-reset'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

type LinkType = 'signup' | 'recovery'

type GenerateLinkInput =
  | {
      type: 'signup'
      email: string
      password: string
      data?: {
        full_name: string
      }
    }
  | {
      type: 'recovery'
      email: string
    }

type GenerateLinkProperties = {
  hashed_token?: string
}

type GenerateLinkResult = {
  tokenHash: string
  userId?: string
}

type OAuthWelcomeCandidate = {
  created_at?: string
  last_sign_in_at?: string | null
}

const FIRST_OAUTH_SIGN_IN_WINDOW_MS = 60 * 1000

export function shouldSendOAuthWelcomeEmail(candidate: OAuthWelcomeCandidate): boolean {
  if (!candidate.created_at || !candidate.last_sign_in_at) {
    return false
  }

  const createdAt = new Date(candidate.created_at).getTime()
  const lastSignInAt = new Date(candidate.last_sign_in_at).getTime()

  if (Number.isNaN(createdAt) || Number.isNaN(lastSignInAt)) {
    return false
  }

  return Math.abs(lastSignInAt - createdAt) <= FIRST_OAUTH_SIGN_IN_WINDOW_MS
}

async function generateLinkResult(input: GenerateLinkInput): Promise<GenerateLinkResult> {
  const { data, error } = await getSupabaseAdmin().auth.admin.generateLink(input)

  if (error) {
    throw error
  }

  const properties = (data?.properties || {}) as GenerateLinkProperties
  const user = (data?.user || null) as { id?: string } | null

  if (!properties.hashed_token) {
    throw new Error('Supabase did not return a hashed token')
  }

  return {
    tokenHash: properties.hashed_token,
    userId: user?.id
  }
}

async function sendAuthEmail(options: {
  email: string
  name?: string | null
  linkType: LinkType
  next: string
  subject: 'verification' | 'recovery'
  password?: string
}) {
  const { email, name, linkType, next, subject, password } = options
  const payload: GenerateLinkInput =
    linkType === 'signup'
      ? {
          type: 'signup',
          email,
          password: password || '',
          ...(name?.trim()
            ? {
                data: {
                  full_name: name.trim()
                }
              }
            : {})
        }
      : {
          type: 'recovery',
          email
        }

  const { tokenHash, userId } = await generateLinkResult(payload)
  const confirmUrl = buildAuthConfirmUrl({
    tokenHash,
    type: linkType,
    next
  })

  try {
    if (subject === 'verification') {
      await sendEmailVerificationEmail({
        to: email,
        name,
        verificationUrl: confirmUrl
      })
      return
    }

    await sendPasswordResetEmail({
      to: email,
      name,
      resetUrl: confirmUrl
    })
  } catch (error) {
    if (linkType === 'signup' && userId) {
      try {
        await getSupabaseAdmin().auth.admin.deleteUser(userId)
      } catch (cleanupError) {
        console.error('Failed to clean up auth user after email send failure:', cleanupError)
      }
    }

    throw error
  }
}

export async function sendSignupVerificationFlowEmail(options: {
  email: string
  password: string
  name?: string | null
}) {
  return sendAuthEmail({
    ...options,
    linkType: 'signup',
    next: '/create',
    subject: 'verification'
  })
}

export async function sendVerificationResendEmail(options: {
  email: string
  password: string
  name?: string | null
}) {
  return sendAuthEmail({
    ...options,
    linkType: 'signup',
    next: '/create',
    subject: 'verification'
  })
}

export async function sendPasswordRecoveryFlowEmail(options: {
  email: string
  name?: string | null
}) {
  return sendAuthEmail({
    ...options,
    linkType: 'recovery',
    next: '/reset-password',
    subject: 'recovery'
  })
}
