const DEFAULT_MAX = 3
const DEFAULT_WINDOW_MS = 15 * 60 * 1000

type RateLimitOptions = {
  max?: number
  windowMs?: number
}

export function createRateLimiter(options?: RateLimitOptions) {
  const max = options?.max ?? DEFAULT_MAX
  const windowMs = options?.windowMs ?? DEFAULT_WINDOW_MS
  const requests = new Map<string, number[]>()

  return function isRateLimited(ip: string): boolean {
    const now = Date.now()
    const timestamps = requests.get(ip)?.filter((t) => now - t < windowMs) ?? []

    requests.set(ip, timestamps)

    if (timestamps.length >= max) {
      return true
    }

    timestamps.push(now)
    return false
  }
}

export function getClientIp(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  )
}
