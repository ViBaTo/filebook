import { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div
      className={`bg-white border border-stone-200 rounded-[10px] transition-all duration-250 hover:shadow-[0_4px_12px_-2px_rgba(28,25,23,0.08)] hover:border-stone-300 hover:-translate-y-[2px] ${className}`}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className = '' }: CardProps) {
  return (
    <div className={`px-8 py-5 border-b border-stone-200 ${className}`}>
      {children}
    </div>
  )
}

export function CardContent({ children, className = '' }: CardProps) {
  return <div className={`px-8 py-5 ${className}`}>{children}</div>
}

export function CardFooter({ children, className = '' }: CardProps) {
  return (
    <div className={`px-8 py-5 border-t border-stone-200 ${className}`}>
      {children}
    </div>
  )
}
