import { NextRequest, NextResponse } from 'next/server'
import { sendVerificationResendEmail } from '@/lib/email/auth'
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
    const password = typeof body.password === 'string' ? body.password : ''
    const name = typeof body.name === 'string' ? body.name.trim() : undefined

    if (!email || !EMAIL_RE.test(email)) {
      return NextResponse.json(
        { error: 'Debes indicar un email valido' },
        { status: 400 }
      )
    }

    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: 'Debes indicar una contraseña valida' },
        { status: 400 }
      )
    }

    try {
      await sendVerificationResendEmail({ email, password, name })
    } catch (error) {
      console.error('Failed to resend verification email:', error)
    }

    return NextResponse.json({
      success:
        'Si tu cuenta aun no esta confirmada, te hemos enviado un nuevo enlace de verificacion.'
    })
  } catch (error) {
    console.error('Error in POST /api/email/verify:', error)
    return NextResponse.json(
      { error: 'No se pudo procesar la solicitud' },
      { status: 500 }
    )
  }
}
