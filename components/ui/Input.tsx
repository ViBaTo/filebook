'use client'

import { forwardRef, InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, id, ...props }, ref) => {
    return (
      <div className='w-full'>
        {label && (
          <label
            htmlFor={id}
            className='block text-sm font-medium text-gray-300 mb-1'
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={`w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#e94560] focus:border-transparent transition-all ${error ? 'border-red-500' : ''} ${className}`}
          {...props}
        />
        {error && <p className='mt-1 text-sm text-red-400'>{error}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'
