import { describe, expect, it } from 'vitest'
import { escapeHtml } from '@/lib/email/utils'

describe('escapeHtml', () => {
  it('escapa los caracteres HTML especiales', () => {
    expect(escapeHtml(`Tom & "Jerry" <script>alert('x')</script>`)).toBe(
      'Tom &amp; &quot;Jerry&quot; &lt;script&gt;alert(&#39;x&#39;)&lt;/script&gt;'
    )
  })

  it('deja intactos los strings sin caracteres especiales', () => {
    expect(escapeHtml('FlipBook listo')).toBe('FlipBook listo')
  })
})
