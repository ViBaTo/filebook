import { getFromEmail, getResendClient } from '@/lib/email/client'
import {
  ctaButton,
  emailLayout,
  eyebrowTag,
  infoPanel
} from '@/lib/email/templates/layout'
import { escapeHtml } from '@/lib/email/utils'

export interface SendPasswordResetEmailParams {
  to: string
  name?: string | null
  resetUrl: string
}

export async function sendPasswordResetEmail({
  to,
  name,
  resetUrl
}: SendPasswordResetEmailParams) {
  const resend = getResendClient()
  const safeName = name?.trim() ? escapeHtml(name.trim()) : 'Hola'

  const html = emailLayout(`
    ${eyebrowTag('Seguridad')}
    <h1 style="margin:0 0 16px;color:#1c1917;font-size:32px;line-height:1.15;font-weight:700;">
      Restablece tu contraseña
    </h1>
    <p style="margin:0 0 16px;color:#57534e;font-size:16px;line-height:1.8;">
      ${safeName}, hemos recibido una solicitud para cambiar la contraseña de tu cuenta en FlipBook.
    </p>
    ${infoPanel(`
      <strong>Recomendacion:</strong><br />
      Usa una contraseña unica y segura. Si no has solicitado este cambio, ignora este correo.
    `)}
    ${ctaButton(resetUrl, 'Crear una nueva contraseña')}
    <p style="margin:0;color:#57534e;font-size:14px;line-height:1.8;">
      Por seguridad, este enlace solo debe usarse desde un dispositivo de confianza.
    </p>
  `)

  const { error } = await resend.emails.send({
    from: getFromEmail('auth'),
    to: [to],
    subject: 'Restablece tu contraseña de FlipBook',
    html
  })

  if (error) {
    throw new Error(error.message)
  }
}
