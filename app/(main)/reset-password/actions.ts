'use server'

import { createClient } from '@/lib/supabase/server'

export type AuthState = {
  error?: string
  success?: string
}

export async function updatePassword(
  prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const supabase = await createClient()

  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string

  if (!password) {
    return { error: 'La contraseña es requerida' }
  }

  if (password.length < 6) {
    return { error: 'La contraseña debe tener al menos 6 caracteres' }
  }

  if (password !== confirmPassword) {
    return { error: 'Las contraseñas no coinciden' }
  }

  const { error } = await supabase.auth.updateUser({
    password: password
  })

  if (error) {
    if (error.message.includes('same as the old password')) {
      return { error: 'La nueva contraseña debe ser diferente a la anterior' }
    }
    return { error: error.message }
  }

  // Sign out after password reset
  await supabase.auth.signOut()

  return {
    success:
      '¡Contraseña actualizada correctamente! Ya puedes iniciar sesión con tu nueva contraseña.'
  }
}
