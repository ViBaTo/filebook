'use client'

interface UserAvatarProps {
  name?: string
  email: string
  size?: 'sm' | 'md' | 'lg'
}

export default function UserAvatar({ name, email, size = 'md' }: UserAvatarProps) {
  // Extract initials from name or email
  const getInitials = () => {
    if (name && name.trim()) {
      // Get first letter of first word
      return name.trim().charAt(0).toUpperCase()
    }
    // Fallback to first letter of email
    return email.charAt(0).toUpperCase()
  }

  // Size variants
  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg'
  }

  return (
    <div
      className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-[#e94560] to-[#d63d56] flex items-center justify-center text-white font-semibold shadow-lg`}
    >
      {getInitials()}
    </div>
  )
}
