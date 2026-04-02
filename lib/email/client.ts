import { Resend } from 'resend'

export type EmailSenderKind = 'auth' | 'product'

export const AUTH_FROM_EMAIL = 'FlipBook by VIBATO <noreply@vibato.io>'
export const PRODUCT_FROM_EMAIL = 'FlipBook by VIBATO <hello@vibato.io>'

export function getFromEmail(kind: EmailSenderKind): string {
  return kind === 'auth' ? AUTH_FROM_EMAIL : PRODUCT_FROM_EMAIL
}

let resend: Resend | null = null

export function getResendClient(): Resend {
  if (resend) {
    return resend
  }

  const apiKey = process.env.RESEND_API_KEY

  if (!apiKey) {
    throw new Error('Missing RESEND_API_KEY environment variable')
  }

  resend = new Resend(apiKey)
  return resend
}
