import { escapeHtml } from '@/lib/email/utils'

const FONT_STACK =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"

const BRAND = '#166534'
const BRAND_LIGHT = '#16a34a'
const BRAND_DARK = '#14532d'
const BRAND_50 = '#f0fdf4'
const BRAND_100 = '#dcfce7'
const TEXT_PRIMARY = '#1c1917'
const TEXT_MUTED = '#57534e'
const BORDER = '#e7e5e4'
const BACKGROUND = '#fafaf9'
const CARD = '#ffffff'

function logoMark() {
  return `
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
        stroke="${BRAND}"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  `
}

export function eyebrowTag(label: string): string {
  return `
    <div style="margin-bottom:16px;">
      <span style="display:inline-block;background:${BRAND_50};border:1px solid ${BRAND_100};color:${BRAND};border-radius:9999px;padding:6px 12px;font-family:${FONT_STACK};font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">
        ${escapeHtml(label).toUpperCase()}
      </span>
    </div>
  `
}

export function ctaButton(url: string, label: string): string {
  return `
    <div style="margin:32px 0;">
      <a
        href="${escapeHtml(url)}"
        style="display:inline-block;background:${BRAND};color:#ffffff;text-decoration:none;font-family:${FONT_STACK};font-size:16px;font-weight:700;line-height:1.2;padding:14px 22px;border-radius:9999px;box-shadow:0 12px 24px -12px rgba(22,101,52,0.55);"
      >
        ${escapeHtml(label)}
      </a>
    </div>
  `
}

export function infoPanel(content: string): string {
  return `
    <div style="margin:24px 0;padding:18px 20px;background:${BRAND_50};border:1px solid ${BRAND_100};border-radius:16px;color:${TEXT_PRIMARY};font-family:${FONT_STACK};font-size:15px;line-height:1.7;">
      ${content}
    </div>
  `
}

export function emailLayout(content: string): string {
  return `
    <!doctype html>
    <html lang="es">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>FlipBook by VIBATO</title>
      </head>
      <body style="margin:0;padding:0;background:${BACKGROUND};color:${TEXT_PRIMARY};font-family:${FONT_STACK};">
        <div style="margin:0;padding:32px 16px;background:${BACKGROUND};">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
            <tr>
              <td align="center">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;max-width:600px;margin:0 auto;">
                  <tr>
                    <td style="padding-bottom:16px;">
                      <div style="padding:20px 24px;background:${CARD};border:1px solid ${BORDER};border-radius:20px 20px 0 0;">
                        <div style="display:flex;align-items:center;gap:12px;">
                          <span style="display:inline-block;vertical-align:middle;">${logoMark()}</span>
                          <span style="display:inline-block;vertical-align:middle;">
                            <span style="display:block;color:${TEXT_PRIMARY};font-size:22px;font-weight:700;line-height:1.1;">FlipBook</span>
                            <span style="display:block;color:${TEXT_MUTED};font-size:12px;line-height:1.4;">by VIBATO</span>
                          </span>
                        </div>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:0;">
                      <div style="background:${CARD};border:1px solid ${BORDER};border-top:none;border-radius:0 0 20px 20px;padding:32px 24px;">
                        ${content}
                        <hr style="border:none;border-top:1px solid ${BORDER};margin:32px 0 24px;" />
                        <p style="margin:0 0 8px;font-size:15px;line-height:1.7;color:${TEXT_PRIMARY};">
                          Un saludo, El equipo de FlipBook
                        </p>
                        <p style="margin:0;font-size:13px;line-height:1.7;color:${TEXT_MUTED};">
                          Este es un correo automatico enviado por FlipBook by VIBATO. Si no esperabas este mensaje, puedes ignorarlo.
                        </p>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding-top:16px;text-align:center;color:${TEXT_MUTED};font-size:12px;line-height:1.6;">
                      FlipBook by VIBATO
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </div>
      </body>
    </html>
  `
}

export const emailTheme = {
  brand: BRAND,
  brandLight: BRAND_LIGHT,
  brandDark: BRAND_DARK,
  brandSoft: BRAND_50,
  textPrimary: TEXT_PRIMARY,
  textMuted: TEXT_MUTED
}
