import { getFromEmail, getResendClient } from '@/lib/email/client'
import {
  ctaButton,
  emailLayout,
  eyebrowTag,
  infoPanel
} from '@/lib/email/templates/layout'
import { escapeHtml } from '@/lib/email/utils'

export interface SendEmailVerificationEmailParams {
  to: string
  name?: string | null
  verificationUrl: string
}

export async function sendEmailVerificationEmail({
  to,
  name,
  verificationUrl
}: SendEmailVerificationEmailParams) {
  const resend = getResendClient()
  const safeName = name?.trim() ? escapeHtml(name.trim()) : 'Hola'

  const html = emailLayout(`
    ${eyebrowTag('Cuenta')}
    <h1 style="margin:0 0 16px;color:#1c1917;font-size:32px;line-height:1.15;font-weight:700;">
      Confirma tu email
    </h1>
    <p style="margin:0 0 16px;color:#57534e;font-size:16px;line-height:1.8;">
      ${safeName}, gracias por registrarte en FlipBook. Para activar tu cuenta y empezar a crear flipbooks, confirma tu direccion de correo.
    </p>
    ${infoPanel(`
      <strong>Importante:</strong><br />
      Este enlace es personal y esta pensado para completar el alta de tu cuenta de forma segura.
    `)}
    ${ctaButton(verificationUrl, 'Confirmar mi email')}
    <p style="margin:0;color:#57534e;font-size:14px;line-height:1.8;">
      Si no has solicitado esta cuenta, puedes ignorar este mensaje.
    </p>
  `)

  const { error } = await resend.emails.send({
    from: getFromEmail('auth'),
    to: [to],
    subject: 'Confirma tu email en FlipBook',
    html
  })

  if (error) {
    throw new Error(error.message)
  }
}
