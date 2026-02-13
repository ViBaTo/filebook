'use client'

import { forwardRef, ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className = '',
      variant = 'primary',
      size = 'md',
      isLoading,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'

    const variants = {
      primary:
        'bg-[#166534] text-white rounded-full hover:bg-[#14532d] hover:-translate-y-[1px] hover:shadow-[0_4px_12px_-2px_rgba(28,25,23,0.08)] focus:ring-[#166534]',
      secondary:
        'bg-transparent text-stone-800 border-[1.5px] border-stone-300 rounded-full hover:bg-stone-50 hover:border-stone-400 focus:ring-stone-300',
      ghost:
        'text-[#166534] hover:bg-[#f0fdf4] rounded-full focus:ring-[#166534]/20',
      danger:
        'bg-red-600 text-white rounded-full hover:bg-red-700 focus:ring-red-500'
    }

    const sizes = {
      sm: 'px-4 py-1.5 text-sm',
      md: 'px-6 py-2.5 text-base',
      lg: 'px-7 py-3.5 text-lg'
    }

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <svg
            className='animate-spin -ml-1 mr-2 h-4 w-4'
            fill='none'
            viewBox='0 0 24 24'
          >
            <circle
              className='opacity-25'
              cx='12'
              cy='12'
              r='10'
              stroke='currentColor'
              strokeWidth='4'
            />
            <path
              className='opacity-75'
              fill='currentColor'
              d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
            />
          </svg>
        )}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
