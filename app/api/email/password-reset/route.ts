import { NextRequest, NextResponse } from 'next/server'
import { sendPasswordRecoveryFlowEmail } from '@/lib/email/auth'
import { createRateLimiter, getClientIp } from '@/lib/rate-limit'

const isRateLimited = createRateLimiter()
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(request: NextRequest) {
  const ip = getClientIp(request)

  if (isRateLimited(ip)) {
    return NextResponse.json(
      {
        error:
          'Has superado el limite de solicitudes. Intentalo de nuevo en unos minutos.'
      },
      { status: 429 }
    )
  }

  try {
    const body = await request.json()
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''

    if (!email || !EMAIL_RE.test(email)) {
      return NextResponse.json(
        { error: 'Debes indicar un email valido' },
        { status: 400 }
      )
    }

    try {
      await sendPasswordRecoveryFlowEmail({ email })
    } catch (error) {
      console.error('Failed to send password reset email:', error)
    }

    return NextResponse.json({
      success:
        'Si el email existe en FlipBook, recibirás un enlace para restablecer tu contraseña.'
    })
  } catch (error) {
    console.error('Error in POST /api/email/password-reset:', error)
    return NextResponse.json(
      { error: 'No se pudo procesar la solicitud' },
      { status: 500 }
    )
  }
}
