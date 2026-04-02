'use server'

import { sendSignupVerificationFlowEmail } from '@/lib/email/auth'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export type AuthState = {
  error?: string
  success?: string
  emailForVerification?: string
}

export async function login(
  prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Email y contraseña son requeridos' }
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password
  })

  if (error) {
    if (error.message.includes('Invalid login credentials')) {
      return { error: 'Email o contraseña incorrectos' }
    }
    if (error.message.includes('Email not confirmed')) {
      return {
        error: 'Por favor confirma tu email antes de iniciar sesión',
        emailForVerification: email
      }
    }
    return { error: error.message }
  }

  redirect('/create')
}

export async function signup(
  prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string
  const name = formData.get('name') as string

  if (!email || !password) {
    return { error: 'Email y contraseña son requeridos' }
  }

  if (password !== confirmPassword) {
    return { error: 'Las contraseñas no coinciden' }
  }

  if (password.length < 6) {
    return { error: 'La contraseña debe tener al menos 6 caracteres' }
  }

  try {
    await sendSignupVerificationFlowEmail({
      email: email.trim().toLowerCase(),
      password,
      name
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al crear la cuenta'

    if (
      message.includes('already registered') ||
      message.includes('already been registered')
    ) {
      return { error: 'Este email ya está registrado' }
    }

    return { error: message }
  }

  return {
    success:
      'Cuenta creada. Te hemos enviado un email de verificación para activar tu cuenta.'
  }
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/')
}

export async function loginWithGoogle() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`
    }
  })

  if (error) {
    return { error: error.message }
  }

  if (data.url) {
    redirect(data.url)
  }
}
