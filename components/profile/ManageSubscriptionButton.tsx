'use client'

import { useState } from 'react'
import Link from 'next/link'

interface ManageSubscriptionButtonProps {
  plan: string
}

export default function ManageSubscriptionButton({
  plan
}: ManageSubscriptionButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  const isPaidPlan = plan === 'pro' || plan === 'business'

  const handleManageBilling = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST'
      })

      const data = await response.json()

      if (data.url) {
        window.location.href = data.url
      } else if (data.error) {
        console.error('Portal error:', data.error)
        setIsLoading(false)
      }
    } catch (error) {
      console.error('Error accessing billing portal:', error)
      setIsLoading(false)
    }
  }

  if (!isPaidPlan) {
    return (
      <Link
        href='/pricing'
        className='text-sm text-stone-500 hover:text-[#166534] transition-colors flex items-center gap-1.5'
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
            d='M13 7h8m0 0v8m0-8l-8 8-4-4-6 6'
          />
        </svg>
        Mejorar plan
      </Link>
    )
  }

  return (
    <button
      onClick={handleManageBilling}
      disabled={isLoading}
      className='text-sm text-stone-500 hover:text-[#166534] transition-colors flex items-center gap-1.5 disabled:opacity-50'
    >
      {isLoading ? (
        <div className='w-4 h-4 border-2 border-stone-300 border-t-stone-600 rounded-full animate-spin' />
      ) : (
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
            d='M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z'
          />
        </svg>
      )}
      Gestionar suscripción
    </button>
  )
}
