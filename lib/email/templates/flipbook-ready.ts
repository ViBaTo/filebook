import { FROM_EMAIL, getResendClient } from '@/lib/email/client'
import {
  ctaButton,
  emailLayout,
  eyebrowTag,
  infoPanel
} from '@/lib/email/templates/layout'
import { escapeHtml } from '@/lib/email/utils'

export interface SendFlipbookReadyEmailParams {
  to: string
  name?: string | null
  bookTitle: string
  bookUrl: string
}

export async function sendFlipbookReadyEmail({
  to,
  name,
  bookTitle,
  bookUrl
}: SendFlipbookReadyEmailParams) {
  const resend = getResendClient()
  const safeName = name?.trim() ? escapeHtml(name.trim()) : 'Hola'
  const safeBookTitle = escapeHtml(bookTitle)

  const html = emailLayout(`
    ${eyebrowTag('Tu contenido')}
    <h1 style="margin:0 0 16px;color:#1c1917;font-size:32px;line-height:1.15;font-weight:700;">
      Tu FlipBook ya esta listo
    </h1>
    <p style="margin:0 0 16px;color:#57534e;font-size:16px;line-height:1.8;">
      ${safeName}, ya hemos terminado de procesar <strong>${safeBookTitle}</strong>.
    </p>
    ${infoPanel(`
      <strong>Siguiente paso:</strong><br />
      Revisa el resultado final y comparte tu flipbook con el enlace publico o el codigo embed.
    `)}
    ${ctaButton(bookUrl, 'Abrir mi FlipBook')}
  `)

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: [to],
    subject: 'Tu FlipBook ya esta listo',
    html
  })

  if (error) {
    throw new Error(error.message)
  }
}
