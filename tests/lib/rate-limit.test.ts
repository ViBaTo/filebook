import { describe, expect, it, vi } from 'vitest'
import { createRateLimiter, getClientIp } from '@/lib/rate-limit'

describe('createRateLimiter', () => {
  it('bloquea cuando se supera el maximo dentro de la ventana', () => {
    const isRateLimited = createRateLimiter({ max: 2, windowMs: 1000 })

    expect(isRateLimited('127.0.0.1')).toBe(false)
    expect(isRateLimited('127.0.0.1')).toBe(false)
    expect(isRateLimited('127.0.0.1')).toBe(true)
  })

  it('descarta timestamps antiguos fuera de la ventana', () => {
    vi.useFakeTimers()
    const isRateLimited = createRateLimiter({ max: 2, windowMs: 1000 })

    expect(isRateLimited('127.0.0.1')).toBe(false)
    vi.advanceTimersByTime(1001)
    expect(isRateLimited('127.0.0.1')).toBe(false)

    vi.useRealTimers()
  })
})

describe('getClientIp', () => {
  it('usa x-forwarded-for cuando existe', () => {
    const request = new Request('https://flip.vibato.io/api/email/password-reset', {
      headers: {
        'x-forwarded-for': '203.0.113.10, 198.51.100.5'
      }
    })

    expect(getClientIp(request)).toBe('203.0.113.10')
  })

  it('usa x-real-ip como fallback', () => {
    const request = new Request('https://flip.vibato.io/api/email/password-reset', {
      headers: {
        'x-real-ip': '203.0.113.11'
      }
    })

    expect(getClientIp(request)).toBe('203.0.113.11')
  })
})
