import { Resend } from 'resend'

export const FROM_EMAIL = 'VIBATO <noreply@flip.vibato.io>'

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
