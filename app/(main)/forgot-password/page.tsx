'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { resetPassword, type AuthState } from './actions'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export default function ForgotPasswordPage() {
  const [state, action, isPending] = useActionState<AuthState, FormData>(
    resetPassword,
    {}
  )

  return (
    <div className='min-h-screen bg-[#FAFAF9] flex items-center justify-center p-4'>
      {/* Background decoration */}
      <div className='absolute inset-0 overflow-hidden pointer-events-none'>
        <div className='absolute top-1/4 left-1/4 w-96 h-96 bg-[#f0fdf4] rounded-full blur-3xl' />
        <div className='absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#dcfce7]/50 rounded-full blur-3xl' />
      </div>

      <div className='w-full max-w-md relative'>
        {/* Logo */}
        <Link
          href='/'
          className='flex items-center justify-center gap-2 text-stone-900 mb-8'
        >
          <svg className='w-10 h-10' viewBox='0 0 24 24' fill='currentColor'>
            <path
              d='M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5'
              stroke='currentColor'
              strokeWidth='2'
              fill='none'
            />
          </svg>
          <span className='serif text-2xl font-bold'>FlipBook</span>
        </Link>

        {/* Card */}
        <div className='bg-white border border-stone-200 rounded-[16px] p-8 shadow-[0_12px_24px_-4px_rgba(28,25,23,0.08)]'>
          <div className='text-center mb-8'>
            <div className='w-16 h-16 mx-auto mb-4 rounded-full bg-[#f0fdf4] border border-[#dcfce7] flex items-center justify-center'>
              <svg
                className='w-8 h-8 text-[#166534]'
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z'
                />
              </svg>
            </div>
            <h1 className='serif text-2xl text-stone-900 mb-2'>
              ¿Olvidaste tu contraseña?
            </h1>
            <p className='text-stone-500 text-sm'>
              Ingresa tu email y te enviaremos un enlace para restablecer tu
              contraseña.
            </p>
          </div>

          {/* Success message */}
          {state.success && (
            <div className='mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-[10px]'>
              <p className='text-emerald-800 text-sm flex items-center gap-2'>
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
            </div>
          )}

          {/* Error message */}
          {state.error && (
            <div className='mb-6 p-4 bg-red-50 border border-red-200 rounded-[10px]'>
              <p className='text-red-800 text-sm flex items-center gap-2'>
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
                id='email'
                name='email'
                type='email'
                label='Email'
                placeholder='tu@email.com'
                autoComplete='email'
                required
              />

              <Button
                type='submit'
                className='w-full'
                size='lg'
                isLoading={isPending}
              >
                Enviar enlace de recuperación
              </Button>
            </form>
          )}

          {/* Back to login */}
          <div className='mt-6 text-center'>
            <Link
              href='/login'
              className='text-sm text-stone-500 hover:text-[#166534] transition-colors inline-flex items-center gap-2'
            >
              <svg
                className='w-4 h-4'
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M10 19l-7-7m0 0l7-7m-7 7h18'
                />
              </svg>
              Volver a iniciar sesión
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
