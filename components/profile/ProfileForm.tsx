'use client'

import { useActionState } from 'react'
import { updateProfile, updatePassword, type ProfileState } from '@/app/(main)/profile/actions'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

interface ProfileFormProps {
  profile: {
    full_name: string | null
    company: string | null
    job_title: string | null
    phone: string | null
  }
  email: string
}

function SuccessMessage({ message }: { message: string }) {
  return (
    <div className='p-4 bg-green-500/10 border border-green-500/30 rounded-lg'>
      <p className='text-green-400 text-sm flex items-center gap-2'>
        <svg
          className='w-5 h-5 shrink-0'
          fill='none'
          viewBox='0 0 24 24'
          stroke='currentColor'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
          />
        </svg>
        {message}
      </p>
    </div>
  )
}

function ErrorMessage({ message }: { message: string }) {
  return (
    <div className='p-4 bg-red-500/10 border border-red-500/30 rounded-lg'>
      <p className='text-red-400 text-sm flex items-center gap-2'>
        <svg
          className='w-5 h-5 shrink-0'
          fill='none'
          viewBox='0 0 24 24'
          stroke='currentColor'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
          />
        </svg>
        {message}
      </p>
    </div>
  )
}

export default function ProfileForm({ profile, email }: ProfileFormProps) {
  const [profileState, profileAction, profilePending] = useActionState<
    ProfileState,
    FormData
  >(updateProfile, {})

  const [passwordState, passwordAction, passwordPending] = useActionState<
    ProfileState,
    FormData
  >(updatePassword, {})

  return (
    <div className='space-y-8'>
      {/* Profile Info Form */}
      <div className='bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl'>
        <div className='px-6 py-4 border-b border-white/10'>
          <h2 className='text-lg font-semibold text-white'>
            Información personal
          </h2>
          <p className='text-sm text-gray-400 mt-1'>
            Actualiza tu información de perfil
          </p>
        </div>
        <form action={profileAction} className='px-6 py-5 space-y-5'>
          {/* Email (read-only) */}
          <div className='w-full'>
            <label
              htmlFor='email'
              className='block text-sm font-medium text-gray-300 mb-1'
            >
              Email
            </label>
            <input
              id='email'
              type='email'
              value={email}
              disabled
              className='w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-gray-500 cursor-not-allowed'
            />
            <p className='mt-1 text-xs text-gray-500'>
              El email no se puede cambiar
            </p>
          </div>

          <Input
            id='full_name'
            name='full_name'
            type='text'
            label='Nombre completo'
            placeholder='Tu nombre'
            defaultValue={profile.full_name || ''}
            autoComplete='name'
            required
          />

          <div className='grid grid-cols-1 md:grid-cols-2 gap-5'>
            <Input
              id='company'
              name='company'
              type='text'
              label='Empresa'
              placeholder='Nombre de tu empresa'
              defaultValue={profile.company || ''}
              autoComplete='organization'
            />
            <Input
              id='job_title'
              name='job_title'
              type='text'
              label='Cargo'
              placeholder='Tu cargo o puesto'
              defaultValue={profile.job_title || ''}
              autoComplete='organization-title'
            />
          </div>

          <Input
            id='phone'
            name='phone'
            type='tel'
            label='Teléfono'
            placeholder='+34 600 000 000'
            defaultValue={profile.phone || ''}
            autoComplete='tel'
          />

          {profileState.success && (
            <SuccessMessage message={profileState.success} />
          )}
          {profileState.error && (
            <ErrorMessage message={profileState.error} />
          )}

          <div className='flex justify-end pt-2'>
            <Button type='submit' isLoading={profilePending}>
              Guardar cambios
            </Button>
          </div>
        </form>
      </div>

      {/* Change Password Form */}
      <div className='bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl'>
        <div className='px-6 py-4 border-b border-white/10'>
          <h2 className='text-lg font-semibold text-white'>
            Cambiar contraseña
          </h2>
          <p className='text-sm text-gray-400 mt-1'>
            Actualiza tu contraseña de acceso
          </p>
        </div>
        <form action={passwordAction} className='px-6 py-5 space-y-5'>
          <Input
            id='newPassword'
            name='newPassword'
            type='password'
            label='Nueva contraseña'
            placeholder='••••••••'
            autoComplete='new-password'
            required
          />

          <Input
            id='confirmPassword'
            name='confirmPassword'
            type='password'
            label='Confirmar contraseña'
            placeholder='••••••••'
            autoComplete='new-password'
            required
          />

          {passwordState.success && (
            <SuccessMessage message={passwordState.success} />
          )}
          {passwordState.error && (
            <ErrorMessage message={passwordState.error} />
          )}

          <div className='flex justify-end pt-2'>
            <Button type='submit' variant='secondary' isLoading={passwordPending}>
              Cambiar contraseña
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
