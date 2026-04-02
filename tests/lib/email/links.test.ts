import { describe, expect, it } from 'vitest'
import { buildAuthConfirmUrl, getAppBaseUrl } from '@/lib/email/links'

describe('email links', () => {
  it('usa NEXT_PUBLIC_SITE_URL como base cuando esta disponible', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://flip.vibato.io/'

    expect(getAppBaseUrl()).toBe('https://flip.vibato.io')
  })

  it('construye enlaces de confirmacion para auth/confirm', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://flip.vibato.io'

    expect(
      buildAuthConfirmUrl({
        tokenHash: 'hashed-token',
        type: 'signup',
        next: '/create'
      })
    ).toBe(
      'https://flip.vibato.io/auth/confirm?token_hash=hashed-token&type=signup&next=%2Fcreate'
    )
  })
})
