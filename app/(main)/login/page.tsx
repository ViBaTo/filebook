'use client'

import { useState, useActionState } from 'react'
import Link from 'next/link'
import { login, signup, type AuthState } from './actions'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [loginState, loginAction, loginPending] = useActionState<
    AuthState,
    FormData
  >(login, {})
  const [signupState, signupAction, signupPending] = useActionState<
    AuthState,
    FormData
  >(signup, {})

  const state = mode === 'login' ? loginState : signupState
  const action = mode === 'login' ? loginAction : signupAction
  const isPending = mode === 'login' ? loginPending : signupPending

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
          {/* Tabs */}
          <div className='flex mb-8 bg-stone-100 rounded-[10px] p-1'>
            <button
              onClick={() => setMode('login')}
              className={`flex-1 py-2.5 text-sm font-medium rounded-[8px] transition-all ${
                mode === 'login'
                  ? 'bg-[#166534] text-white shadow-sm'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              Iniciar Sesión
            </button>
            <button
              onClick={() => setMode('signup')}
              className={`flex-1 py-2.5 text-sm font-medium rounded-[8px] transition-all ${
                mode === 'signup'
                  ? 'bg-[#166534] text-white shadow-sm'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              Crear Cuenta
            </button>
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
          <form action={action} className='space-y-5'>
            {mode === 'signup' && (
              <Input
                id='name'
                name='name'
                type='text'
                label='Nombre'
                placeholder='Tu nombre'
                autoComplete='name'
              />
            )}

            <Input
              id='email'
              name='email'
              type='email'
              label='Email'
              placeholder='tu@email.com'
              autoComplete='email'
              required
            />

            <Input
              id='password'
              name='password'
              type='password'
              label='Contraseña'
              placeholder='••••••••'
              autoComplete={
                mode === 'login' ? 'current-password' : 'new-password'
              }
              required
            />

            {mode === 'signup' && (
              <Input
                id='confirmPassword'
                name='confirmPassword'
                type='password'
                label='Confirmar Contraseña'
                placeholder='••••••••'
                autoComplete='new-password'
                required
              />
            )}

            {mode === 'login' && (
              <div className='flex justify-end'>
                <Link
                  href='/forgot-password'
                  className='text-sm text-stone-500 hover:text-[#166534] transition-colors'
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
            )}

            <Button
              type='submit'
              className='w-full'
              size='lg'
              isLoading={isPending}
            >
              {mode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}
            </Button>
          </form>

          {/* Divider */}
          <div className='relative my-8'>
            <div className='absolute inset-0 flex items-center'>
              <div className='w-full border-t border-stone-200' />
            </div>
            <div className='relative flex justify-center text-sm'>
              <span className='px-4 bg-white text-stone-400'>
                o continúa con
              </span>
            </div>
          </div>

          {/* Social login */}
          <div className='grid grid-cols-1 gap-3'>
            <Button
              type='button'
              variant='secondary'
              className='w-full'
              onClick={() => {
                // Google login would be implemented here
              }}
            >
              <svg className='w-5 h-5 mr-2' viewBox='0 0 24 24'>
                <path
                  fill='currentColor'
                  d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z'
                />
                <path
                  fill='currentColor'
                  d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'
                />
                <path
                  fill='currentColor'
                  d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z'
                />
                <path
                  fill='currentColor'
                  d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z'
                />
              </svg>
              Google
            </Button>
          </div>

          {/* Terms */}
          {mode === 'signup' && (
            <p className='mt-6 text-center text-xs text-stone-400'>
              Al crear una cuenta, aceptas nuestros{' '}
              <Link href='/terms' className='text-[#166534] hover:underline'>
                Términos de Servicio
              </Link>{' '}
              y{' '}
              <Link href='/privacy' className='text-[#166534] hover:underline'>
                Política de Privacidad
              </Link>
            </p>
          )}
        </div>

        {/* Back to home */}
        <p className='mt-8 text-center text-stone-400 text-sm'>
          <Link
            href='/'
            className='hover:text-stone-700 transition-colors inline-flex items-center gap-2'
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
            Volver al inicio
          </Link>
        </p>
      </div>
    </div>
  )
}
