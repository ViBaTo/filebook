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
            className='block text-sm font-medium text-stone-700 mb-1'
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={`w-full px-4 py-3 bg-white border-[1.5px] border-stone-300 rounded-[6px] text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#166534] focus:shadow-[0_0_0_3px_#f0fdf4] transition-[border-color] duration-150 ${error ? 'border-red-500' : ''} ${className}`}
          {...props}
        />
        {error && <p className='mt-1 text-sm text-red-600'>{error}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'
