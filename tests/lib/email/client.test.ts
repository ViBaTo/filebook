import { beforeEach, describe, expect, it } from 'vitest'
import {
  AUTH_FROM_EMAIL,
  PRODUCT_FROM_EMAIL,
  getFromEmail
} from '@/lib/email/client'

describe('email client sender strategy', () => {
  beforeEach(() => {
    delete process.env.RESEND_API_KEY
  })

  it('usa noreply@vibato.io para correos de autenticacion', () => {
    expect(AUTH_FROM_EMAIL).toBe('FlipBook by VIBATO <noreply@vibato.io>')
    expect(getFromEmail('auth')).toBe('FlipBook by VIBATO <noreply@vibato.io>')
  })

  it('usa hello@vibato.io para correos de producto', () => {
    expect(PRODUCT_FROM_EMAIL).toBe('FlipBook by VIBATO <hello@vibato.io>')
    expect(getFromEmail('product')).toBe('FlipBook by VIBATO <hello@vibato.io>')
  })
})
