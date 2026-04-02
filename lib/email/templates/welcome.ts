import { getFromEmail, getResendClient } from '@/lib/email/client'
import { buildAbsoluteUrl } from '@/lib/email/links'
import {
  ctaButton,
  emailLayout,
  eyebrowTag,
  infoPanel
} from '@/lib/email/templates/layout'
import { escapeHtml } from '@/lib/email/utils'

export interface SendWelcomeEmailParams {
  to: string
  name?: string | null
  dashboardUrl?: string
}

export async function sendWelcomeEmail({
  to,
  name,
  dashboardUrl = buildAbsoluteUrl('/create')
}: SendWelcomeEmailParams) {
  const resend = getResendClient()
  const safeName = name?.trim() ? escapeHtml(name.trim()) : 'Hola'

  const html = emailLayout(`
    ${eyebrowTag('Bienvenida')}
    <h1 style="margin:0 0 16px;color:#1c1917;font-size:32px;line-height:1.15;font-weight:700;">
      Bienvenido a FlipBook
    </h1>
    <p style="margin:0 0 16px;color:#57534e;font-size:16px;line-height:1.8;">
      ${safeName}, tu cuenta ya esta activa y lista para convertir PDFs en experiencias interactivas.
    </p>
    <p style="margin:0 0 16px;color:#57534e;font-size:16px;line-height:1.8;">
      Desde ahora puedes crear, compartir y gestionar tus flipbooks desde tu panel.
    </p>
    ${infoPanel(`
      <strong>Tu siguiente paso:</strong><br />
      Sube tu primer PDF y genera un enlace compartible en pocos minutos.
    `)}
    ${ctaButton(dashboardUrl, 'Crear mi primer FlipBook')}
    <p style="margin:0;color:#57534e;font-size:14px;line-height:1.8;">
      Si no has creado esta cuenta, puedes ignorar este mensaje.
    </p>
  `)

  const { error } = await resend.emails.send({
    from: getFromEmail('product'),
    to: [to],
    subject: 'Bienvenido a FlipBook',
    html
  })

  if (error) {
    throw new Error(error.message)
  }
}
