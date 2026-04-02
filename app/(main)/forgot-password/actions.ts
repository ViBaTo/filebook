'use server'

import { sendPasswordRecoveryFlowEmail } from '@/lib/email/auth'

export type AuthState = {
  error?: string
  success?: string
}

export async function resetPassword(
  prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = formData.get('email') as string

  if (!email) {
    return { error: 'El email es requerido' }
  }

  try {
    await sendPasswordRecoveryFlowEmail({
      email: email.trim().toLowerCase()
    })
  } catch (error) {
    console.error('Failed to send password reset email:', error)
  }

  return {
    success:
      'Si el email existe en FlipBook, te hemos enviado un enlace para restablecer tu contraseña.'
  }
}
