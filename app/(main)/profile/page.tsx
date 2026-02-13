import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import UserAvatar from '@/components/ui/UserAvatar'
import ProfileForm from '@/components/profile/ProfileForm'
import FlipbookGrid from '@/components/profile/FlipbookGrid'
import ManageSubscriptionButton from '@/components/profile/ManageSubscriptionButton'
import Link from 'next/link'
import type { FlipBook } from '@/lib/types'

export const metadata = {
  title: 'Mi Perfil - FlipBook'
}

export default async function ProfilePage() {
  const supabase = await createClient()

  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?redirect=/profile')
  }

  // Fetch profile, flipbooks, and subscription in parallel
  const [profileResult, booksResult, subscriptionResult] = await Promise.all([
    supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single(),
    supabase
      .from('fb_books')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('fb_subscriptions')
      .select('plan, status, max_flipbooks, max_pages_per_book, max_file_size_mb, current_period_end')
      .eq('user_id', user.id)
      .single()
  ])

  const profile = profileResult.data || {
    full_name: user.user_metadata?.full_name || null,
    avatar_url: null,
    company: null,
    job_title: null,
    phone: null
  }

  const flipbooks = (booksResult.data || []) as FlipBook[]

  const subscription = subscriptionResult.data || {
    plan: 'free',
    status: 'active',
    max_flipbooks: 3,
    max_pages_per_book: 50,
    max_file_size_mb: 30,
    current_period_end: null
  }

  const displayName =
    profile.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuario'

  const planLabels: Record<string, string> = {
    free: 'Gratuito',
    pro: 'Pro',
    business: 'Business'
  }

  return (
    <div className='min-h-screen bg-[#FAFAF9]'>
      <div className='max-w-[1200px] mx-auto px-4 py-12'>
        {/* Profile Header */}
        <div className='flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-10'>
          <UserAvatar
            name={profile.full_name || undefined}
            email={user.email || ''}
            size='lg'
          />
          <div className='flex-1'>
            <h1 className='serif text-2xl text-stone-900'>{displayName}</h1>
            <p className='text-stone-500 mt-1'>{user.email}</p>
            <div className='flex items-center gap-3 mt-2'>
              <span className='inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full bg-[#f0fdf4] text-[#166534] border border-[#dcfce7]'>
                Plan {planLabels[subscription.plan] || subscription.plan}
              </span>
              <span className='text-xs text-stone-400'>
                {flipbooks.length} / {subscription.max_flipbooks} flipbooks
              </span>
            </div>
          </div>
          <ManageSubscriptionButton plan={subscription.plan} />
        </div>

        {/* Two-column layout on desktop */}
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
          {/* Left column: Profile form */}
          <div className='lg:col-span-1'>
            <ProfileForm
              profile={{
                full_name: profile.full_name,
                company: profile.company,
                job_title: profile.job_title,
                phone: profile.phone
              }}
              email={user.email || ''}
            />
          </div>

          {/* Right column: Flipbooks */}
          <div className='lg:col-span-2'>
            <div className='flex items-center justify-between mb-5'>
              <h2 className='text-lg font-medium text-stone-900'>
                Mis Flipbooks
              </h2>
              <Link
                href='/create'
                className='inline-flex items-center gap-1.5 px-4 py-2 text-sm bg-[#166534] text-white font-medium rounded-full hover:bg-[#14532d] transition-all hover:-translate-y-[1px]'
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
                    d='M12 4v16m8-8H4'
                  />
                </svg>
                Nuevo
              </Link>
            </div>
            <FlipbookGrid flipbooks={flipbooks} />
          </div>
        </div>
      </div>
    </div>
  )
}
