import { getFromEmail, getResendClient } from '@/lib/email/client'
import {
  ctaButton,
  emailLayout,
  eyebrowTag,
  infoPanel
} from '@/lib/email/templates/layout'
import { escapeHtml } from '@/lib/email/utils'

export interface SendSubscriptionCanceledEmailParams {
  to: string
  name?: string | null
  reactivateUrl: string
}

export async function sendSubscriptionCanceledEmail({
  to,
  name,
  reactivateUrl
}: SendSubscriptionCanceledEmailParams) {
  const resend = getResendClient()
  const safeName = name?.trim() ? escapeHtml(name.trim()) : 'Hola'

  const html = emailLayout(`
    ${eyebrowTag('Suscripcion')}
    <h1 style="margin:0 0 16px;color:#1c1917;font-size:32px;line-height:1.15;font-weight:700;">
      Tu suscripcion ha pasado al plan gratuito
    </h1>
    <p style="margin:0 0 16px;color:#57534e;font-size:16px;line-height:1.8;">
      ${safeName}, hemos actualizado tu cuenta al plan gratuito de FlipBook.
    </p>
    ${infoPanel(`
      Tus flipbooks seguiran accesibles, pero se aplicaran los limites del plan free para nuevas acciones y contenido premium.
    `)}
    ${ctaButton(reactivateUrl, 'Ver planes disponibles')}
  `)

  const { error } = await resend.emails.send({
    from: getFromEmail('product'),
    to: [to],
    subject: 'Tu suscripcion de FlipBook ha sido cancelada',
    html
  })

  if (error) {
    throw new Error(error.message)
  }
}
