'use server'

import { createClient } from '@/lib/supabase/server'

export type ProfileState = {
  error?: string
  success?: string
}

export async function updateProfile(
  prevState: ProfileState,
  formData: FormData
): Promise<ProfileState> {
  const supabase = await createClient()

  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'No estás autenticado' }
  }

  const full_name = formData.get('full_name') as string
  const company = formData.get('company') as string
  const job_title = formData.get('job_title') as string
  const phone = formData.get('phone') as string

  if (!full_name || !full_name.trim()) {
    return { error: 'El nombre es obligatorio' }
  }

  // Update user_profiles table
  const { error: profileError } = await supabase
    .from('user_profiles')
    .update({
      full_name: full_name.trim(),
      company: company?.trim() || null,
      job_title: job_title?.trim() || null,
      phone: phone?.trim() || null,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', user.id)

  if (profileError) {
    // If no row exists yet, insert instead
    if (profileError.code === 'PGRST116') {
      const { error: insertError } = await supabase
        .from('user_profiles')
        .insert({
          user_id: user.id,
          full_name: full_name.trim(),
          company: company?.trim() || null,
          job_title: job_title?.trim() || null,
          phone: phone?.trim() || null
        })

      if (insertError) {
        return { error: 'Error al guardar el perfil' }
      }
    } else {
      return { error: 'Error al actualizar el perfil' }
    }
  }

  // Also update auth user metadata
  await supabase.auth.updateUser({
    data: { full_name: full_name.trim() }
  })

  return { success: 'Perfil actualizado correctamente' }
}

export async function updatePassword(
  prevState: ProfileState,
  formData: FormData
): Promise<ProfileState> {
  const supabase = await createClient()

  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'No estás autenticado' }
  }

  const newPassword = formData.get('newPassword') as string
  const confirmPassword = formData.get('confirmPassword') as string

  if (!newPassword || !confirmPassword) {
    return { error: 'Todos los campos son obligatorios' }
  }

  if (newPassword.length < 6) {
    return { error: 'La contraseña debe tener al menos 6 caracteres' }
  }

  if (newPassword !== confirmPassword) {
    return { error: 'Las contraseñas no coinciden' }
  }

  const { error } = await supabase.auth.updateUser({
    password: newPassword
  })

  if (error) {
    return { error: 'Error al cambiar la contraseña' }
  }

  return { success: 'Contraseña actualizada correctamente' }
}
