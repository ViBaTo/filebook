'use client'

import { useActionState, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { updatePassword, type AuthState } from './actions'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { createClient } from '@/lib/supabase/client'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [state, action, isPending] = useActionState<AuthState, FormData>(
    updatePassword,
    {}
  )
  const [isValidSession, setIsValidSession] = useState<boolean | null>(null)

  useEffect(() => {
    // Check if user has a valid recovery session
    const checkSession = async () => {
      const supabase = createClient()
      const {
        data: { session }
      } = await supabase.auth.getSession()

      if (session) {
        setIsValidSession(true)
      } else {
        setIsValidSession(false)
      }
    }

    checkSession()
  }, [])

  useEffect(() => {
    if (state.success) {
      // Redirect to login after successful password reset
      setTimeout(() => {
        router.push('/login')
      }, 3000)
    }
  }, [state.success, router])

  if (isValidSession === null) {
    return (
      <div className='min-h-screen bg-linear-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] flex items-center justify-center p-4'>
        <div className='text-white'>Cargando...</div>
      </div>
    )
  }

  if (isValidSession === false) {
    return (
      <div className='min-h-screen bg-linear-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] flex items-center justify-center p-4'>
        <div className='w-full max-w-md'>
          <div className='bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl text-center'>
            <div className='w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center'>
              <svg
                className='w-8 h-8 text-red-400'
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
                />
              </svg>
            </div>
            <h1 className='text-xl font-bold text-white mb-2'>
              Enlace inválido o expirado
            </h1>
            <p className='text-gray-400 text-sm mb-6'>
              El enlace para restablecer tu contraseña ha expirado o no es
              válido. Por favor solicita uno nuevo.
            </p>
            <Link href='/forgot-password'>
              <Button className='w-full'>Solicitar nuevo enlace</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-linear-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] flex items-center justify-center p-4'>
      {/* Background decoration */}
      <div className='absolute inset-0 overflow-hidden pointer-events-none'>
        <div className='absolute top-1/4 left-1/4 w-96 h-96 bg-[#e94560]/10 rounded-full blur-3xl' />
        <div className='absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#0f3460]/30 rounded-full blur-3xl' />
      </div>

      <div className='w-full max-w-md relative'>
        {/* Logo */}
        <Link
          href='/'
          className='flex items-center justify-center gap-2 text-white mb-8'
        >
          <svg className='w-10 h-10' viewBox='0 0 24 24' fill='currentColor'>
            <path
              d='M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5'
              stroke='currentColor'
              strokeWidth='2'
              fill='none'
            />
          </svg>
          <span className='text-2xl font-bold'>FlipBook</span>
        </Link>

        {/* Card */}
        <div className='bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl'>
          <div className='text-center mb-8'>
            <div className='w-16 h-16 mx-auto mb-4 rounded-full bg-[#e94560]/20 flex items-center justify-center'>
              <svg
                className='w-8 h-8 text-[#e94560]'
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z'
                />
              </svg>
            </div>
            <h1 className='text-2xl font-bold text-white mb-2'>
              Nueva contraseña
            </h1>
            <p className='text-gray-400 text-sm'>
              Ingresa tu nueva contraseña para tu cuenta.
            </p>
          </div>

          {/* Success message */}
          {state.success && (
            <div className='mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg'>
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
                {state.success}
              </p>
              <p className='text-gray-400 text-xs mt-2'>
                Redirigiendo al login...
              </p>
            </div>
          )}

          {/* Error message */}
          {state.error && (
            <div className='mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg'>
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
                {state.error}
              </p>
            </div>
          )}

          {/* Form */}
          {!state.success && (
            <form action={action} className='space-y-5'>
              <Input
                id='password'
                name='password'
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

              <Button
                type='submit'
                className='w-full'
                size='lg'
                isLoading={isPending}
              >
                Actualizar contraseña
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
