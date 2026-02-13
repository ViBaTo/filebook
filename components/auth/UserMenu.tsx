'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { logout } from '@/app/(main)/login/actions'
import UserAvatar from '@/components/ui/UserAvatar'

interface UserMenuProps {
  user: {
    id: string
    email?: string
    user_metadata?: {
      full_name?: string
    }
  }
}

export default function UserMenu({ user }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Get display name
  const displayName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuario'

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Handle logout
  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await logout()
    } catch (error) {
      console.error('Error logging out:', error)
      setIsLoggingOut(false)
    }
  }

  return (
    <div className='relative' ref={menuRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className='flex items-center gap-2 hover:opacity-80 transition-opacity'
        aria-label='User menu'
        aria-expanded={isOpen}
      >
        <UserAvatar name={user.user_metadata?.full_name} email={user.email} size='md' />
        <span className='hidden md:block text-stone-800 font-medium truncate max-w-[150px]'>
          {displayName}
        </span>
        {/* Chevron icon */}
        <svg
          className={`hidden md:block w-4 h-4 text-stone-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill='none'
          viewBox='0 0 24 24'
          stroke='currentColor'
        >
          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 9l-7 7-7-7' />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className='absolute right-0 mt-2 w-64 bg-white rounded-[10px] shadow-[0_12px_24px_-4px_rgba(28,25,23,0.12)] border border-stone-200 overflow-hidden z-50'>
          {/* User Info Section */}
          <div className='px-4 py-3 border-b border-stone-200'>
            <p className='text-sm font-medium text-stone-900 truncate'>
              {user.user_metadata?.full_name || 'Usuario'}
            </p>
            <p className='text-xs text-stone-500 truncate'>{user.email}</p>
          </div>

          {/* Menu Items */}
          <div className='py-2'>
            <Link
              href='/profile'
              className='flex items-center gap-3 px-4 py-2 text-sm text-stone-600 hover:bg-stone-50 hover:text-stone-900 transition-colors'
              onClick={() => setIsOpen(false)}
            >
              <svg className='w-5 h-5' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
                />
              </svg>
              Mi perfil
            </Link>

            <Link
              href='/pricing'
              className='flex items-center gap-3 px-4 py-2 text-sm text-stone-600 hover:bg-stone-50 hover:text-stone-900 transition-colors'
              onClick={() => setIsOpen(false)}
            >
              <svg className='w-5 h-5' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z'
                />
              </svg>
              Mi suscripción
            </Link>

            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className='w-full flex items-center gap-3 px-4 py-2 text-sm text-stone-600 hover:bg-stone-50 hover:text-stone-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
            >
              {isLoggingOut ? (
                <>
                  <svg
                    className='w-5 h-5 animate-spin'
                    fill='none'
                    viewBox='0 0 24 24'
                    stroke='currentColor'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15'
                    />
                  </svg>
                  Cerrando sesión...
                </>
              ) : (
                <>
                  <svg className='w-5 h-5' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1'
                    />
                  </svg>
                  Cerrar sesión
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
