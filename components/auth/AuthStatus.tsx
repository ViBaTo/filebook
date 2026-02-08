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
          className='text-gray-300 hover:text-white transition-colors text-sm md:text-base'
        >
          Precios
        </Link>
        <Link
          href='/login'
          className='text-gray-300 hover:text-white transition-colors text-sm md:text-base'
        >
          Iniciar Sesión
        </Link>
        <Link
          href='/create'
          className='px-3 py-2 md:px-4 md:py-2 bg-[#e94560] text-white rounded-lg hover:bg-[#d63d56] transition-colors font-medium text-sm md:text-base'
        >
          Crear FlipBook
        </Link>
      </nav>
    )
  }

  // User is logged in - show user menu
  return <UserMenu user={user} />
}
