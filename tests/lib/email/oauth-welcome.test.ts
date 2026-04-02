import { describe, expect, it } from 'vitest'
import { shouldSendOAuthWelcomeEmail } from '@/lib/email/auth'

describe('shouldSendOAuthWelcomeEmail', () => {
  it('envia welcome cuando created_at y last_sign_in_at caen en la misma primera sesion', () => {
    expect(
      shouldSendOAuthWelcomeEmail({
        created_at: '2026-04-02T18:00:00.000Z',
        last_sign_in_at: '2026-04-02T18:00:20.000Z'
      })
    ).toBe(true)
  })

  it('no envia welcome cuando el ultimo login es claramente posterior al alta', () => {
    expect(
      shouldSendOAuthWelcomeEmail({
        created_at: '2026-04-02T18:00:00.000Z',
        last_sign_in_at: '2026-04-10T09:30:00.000Z'
      })
    ).toBe(false)
  })

  it('no envia welcome si faltan timestamps de sesion', () => {
    expect(
      shouldSendOAuthWelcomeEmail({
        created_at: '2026-04-02T18:00:00.000Z'
      })
    ).toBe(false)
  })
})
