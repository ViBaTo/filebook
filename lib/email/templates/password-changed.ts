import { FROM_EMAIL, getResendClient } from '@/lib/email/client'
import { buildAbsoluteUrl } from '@/lib/email/links'
import {
  ctaButton,
  emailLayout,
  eyebrowTag,
  infoPanel
} from '@/lib/email/templates/layout'
import { escapeHtml } from '@/lib/email/utils'

export interface SendPasswordChangedEmailParams {
  to: string
  name?: string | null
  loginUrl?: string
}

export async function sendPasswordChangedEmail({
  to,
  name,
  loginUrl = buildAbsoluteUrl('/login')
}: SendPasswordChangedEmailParams) {
  const resend = getResendClient()
  const safeName = name?.trim() ? escapeHtml(name.trim()) : 'Hola'

  const html = emailLayout(`
    ${eyebrowTag('Seguridad')}
    <h1 style="margin:0 0 16px;color:#1c1917;font-size:32px;line-height:1.15;font-weight:700;">
      Tu contraseña se ha actualizado
    </h1>
    <p style="margin:0 0 16px;color:#57534e;font-size:16px;line-height:1.8;">
      ${safeName}, te confirmamos que la contraseña de tu cuenta de FlipBook se ha cambiado correctamente.
    </p>
    ${infoPanel(`
      Si no has realizado este cambio, te recomendamos restablecer tu acceso cuanto antes y revisar la seguridad de tu cuenta.
    `)}
    ${ctaButton(loginUrl, 'Ir al login de FlipBook')}
  `)

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: [to],
    subject: 'Tu contraseña de FlipBook se ha actualizado',
    html
  })

  if (error) {
    throw new Error(error.message)
  }
}
