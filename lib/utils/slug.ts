// Use URL-safe characters for slugs
const ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyz'
const SLUG_LENGTH = 8

export function generateSlug(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(SLUG_LENGTH))
  let slug = ''
  for (let i = 0; i < SLUG_LENGTH; i++) {
    slug += ALPHABET[bytes[i] % ALPHABET.length]
  }
  return slug
}

export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9-]+$/.test(slug) && slug.length >= 3 && slug.length <= 50
}
