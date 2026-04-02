import { FROM_EMAIL, getResendClient } from '@/lib/email/client'
import {
  ctaButton,
  emailLayout,
  eyebrowTag,
  infoPanel
} from '@/lib/email/templates/layout'
import { escapeHtml } from '@/lib/email/utils'

export interface SendSubscriptionActivatedEmailParams {
  to: string
  name?: string | null
  planName: string
  manageUrl: string
}

export async function sendSubscriptionActivatedEmail({
  to,
  name,
  planName,
  manageUrl
}: SendSubscriptionActivatedEmailParams) {
  const resend = getResendClient()
  const safeName = name?.trim() ? escapeHtml(name.trim()) : 'Hola'
  const safePlanName = escapeHtml(planName)

  const html = emailLayout(`
    ${eyebrowTag('Suscripcion')}
    <h1 style="margin:0 0 16px;color:#1c1917;font-size:32px;line-height:1.15;font-weight:700;">
      Tu plan ${safePlanName} ya esta activo
    </h1>
    <p style="margin:0 0 16px;color:#57534e;font-size:16px;line-height:1.8;">
      ${safeName}, tu upgrade se ha completado correctamente y ya puedes acceder a las prestaciones de tu nuevo plan.
    </p>
    ${infoPanel(`
      <strong>Plan activado:</strong> ${safePlanName}<br />
      Puedes revisar el estado de tu suscripcion y gestionar la facturacion desde tu perfil.
    `)}
    ${ctaButton(manageUrl, 'Ver mi suscripcion')}
  `)

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: [to],
    subject: `Tu plan ${planName} de FlipBook ya esta activo`,
    html
  })

  if (error) {
    throw new Error(error.message)
  }
}
