'use client'

import Link from 'next/link'
import UserMenu from './UserMenu'

interface AuthStatusProps {
  user: {
    id: string
    email?: string
    user_metadata?: {
      full_name?: string
    }
  } | null
}

export default function AuthStatus({ user }: AuthStatusProps) {
  if (!user) {
    // User is not logged in - show login/signup links
    return (
      <nav className='flex items-center gap-4'>
        <Link
          href='/pricing'
          className='text-stone-600 hover:text-stone-900 transition-colors text-sm md:text-base'
        >
          Precios
        </Link>
        <Link
          href='/login'
          className='text-stone-600 hover:text-stone-900 transition-colors text-sm md:text-base'
        >
          Iniciar Sesión
        </Link>
        <Link
          href='/create'
          className='px-5 py-2 md:px-6 md:py-2.5 bg-[#166534] text-white rounded-full hover:bg-[#14532d] hover:-translate-y-[1px] hover:shadow-[0_4px_12px_-2px_rgba(28,25,23,0.08)] transition-all font-medium text-sm md:text-base'
        >
          Crear FlipBook
        </Link>
      </nav>
    )
  }

  // User is logged in - show user menu
  return <UserMenu user={user} />
}
