import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import AuthStatus from '@/components/auth/AuthStatus'

export default async function Header() {
  // Get user session from server
  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()

  return (
    <header className='sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-stone-200'>
      <div className='max-w-[1200px] mx-auto px-4 sm:px-6 h-16 md:h-20 flex items-center justify-between'>
        {/* Logo */}
        <Link href='/' className='flex items-center gap-2 text-stone-900 hover:opacity-80 transition-opacity'>
          <svg className='w-7 h-7 md:w-8 md:h-8' viewBox='0 0 24 24' fill='currentColor'>
            <path
              d='M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5'
              stroke='currentColor'
              strokeWidth='2'
              fill='none'
            />
          </svg>
          <span className='serif text-lg md:text-xl font-bold'>FlipBook</span>
          <span className='text-xs text-stone-400 font-normal hidden sm:inline'>by VIBATO</span>
        </Link>

        {/* Auth Status - shows login/signup or user menu based on auth state */}
        <AuthStatus user={user} />
      </div>
    </header>
  )
}
