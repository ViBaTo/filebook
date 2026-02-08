'use server'

import { createClient } from '@/lib/supabase/server'

export type AuthState = {
  error?: string
  success?: string
}

export async function resetPassword(
  prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const supabase = await createClient()

  const email = formData.get('email') as string

  if (!email) {
    return { error: 'El email es requerido' }
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/reset-password`
  })

  if (error) {
    return { error: error.message }
  }

  return {
    success:
      'Te hemos enviado un email con instrucciones para restablecer tu contraseña. Revisa tu bandeja de entrada.'
  }
}
