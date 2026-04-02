import { getFromEmail, getResendClient } from '@/lib/email/client'
import {
  ctaButton,
  emailLayout,
  eyebrowTag,
  infoPanel
} from '@/lib/email/templates/layout'
import { escapeHtml } from '@/lib/email/utils'

export interface SendPaymentFailedEmailParams {
  to: string
  name?: string | null
  planName: string
  manageUrl: string
}

export async function sendPaymentFailedEmail({
  to,
  name,
  planName,
  manageUrl
}: SendPaymentFailedEmailParams) {
  const resend = getResendClient()
  const safeName = name?.trim() ? escapeHtml(name.trim()) : 'Hola'
  const safePlanName = escapeHtml(planName)

  const html = emailLayout(`
    ${eyebrowTag('Facturacion')}
    <h1 style="margin:0 0 16px;color:#1c1917;font-size:32px;line-height:1.15;font-weight:700;">
      No hemos podido procesar tu pago
    </h1>
    <p style="margin:0 0 16px;color:#57534e;font-size:16px;line-height:1.8;">
      ${safeName}, hemos detectado un problema al renovar tu plan ${safePlanName}.
    </p>
    ${infoPanel(`
      <strong>Que revisar ahora:</strong><br />
      Verifica tu metodo de pago para evitar interrupciones en tu suscripcion y en las funciones premium de FlipBook.
    `)}
    ${ctaButton(manageUrl, 'Actualizar metodo de pago')}
    <p style="margin:0;color:#57534e;font-size:14px;line-height:1.8;">
      Si ya has actualizado tus datos de pago, puedes ignorar este mensaje.
    </p>
  `)

  const { error } = await resend.emails.send({
    from: getFromEmail('product'),
    to: [to],
    subject: 'No hemos podido procesar tu pago de FlipBook',
    html
  })

  if (error) {
    throw new Error(error.message)
  }
}
