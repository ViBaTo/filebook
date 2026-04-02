import { afterEach, describe, expect, it } from 'vitest'
import { buildAuthConfirmUrl, getAppBaseUrl } from '@/lib/email/links'

describe('email links', () => {
  afterEach(() => {
    delete process.env.NEXT_PUBLIC_SITE_URL
    delete process.env.NEXT_PUBLIC_APP_URL
  })

  it('usa NEXT_PUBLIC_SITE_URL como base cuando esta disponible', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://flip.vibato.io/'

    expect(getAppBaseUrl()).toBe('https://flip.vibato.io')
  })

  it('usa NEXT_PUBLIC_APP_URL cuando NEXT_PUBLIC_SITE_URL no existe', () => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://filebook-production.up.railway.app/'

    expect(getAppBaseUrl()).toBe('https://filebook-production.up.railway.app')
  })

  it('usa localhost como fallback cuando no hay variables publicas', () => {
    expect(getAppBaseUrl()).toBe('http://localhost:3000')
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
