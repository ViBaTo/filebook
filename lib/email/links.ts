import type { EmailOtpType } from '@supabase/supabase-js'

type SupportedEmailLinkType = Extract<EmailOtpType, 'signup' | 'recovery' | 'magiclink'>

const LOCALHOST_URL = 'http://localhost:3000'

export function getAppBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    LOCALHOST_URL
  ).replace(/\/$/, '')
}

export function buildAbsoluteUrl(pathname: string): string {
  return new URL(pathname, `${getAppBaseUrl()}/`).toString()
}

type BuildAuthConfirmUrlOptions = {
  tokenHash: string
  type: SupportedEmailLinkType
  next?: string
}

export function buildAuthConfirmUrl({
  tokenHash,
  type,
  next
}: BuildAuthConfirmUrlOptions): string {
  const url = new URL('/auth/confirm', `${getAppBaseUrl()}/`)
  url.searchParams.set('token_hash', tokenHash)
  url.searchParams.set('type', type)

  if (next) {
    url.searchParams.set('next', next)
  }

  return url.toString()
}
