'use client'

interface ProcessingProgressProps {
  currentPage: number
  totalPages: number
  status: 'loading' | 'rendering' | 'uploading' | 'complete' | 'error'
  error?: string
}

export function ProcessingProgress({
  currentPage,
  totalPages,
  status,
  error
}: ProcessingProgressProps) {
  const progress =
    totalPages > 0 ? Math.round((currentPage / totalPages) * 100) : 0

  const getStatusText = () => {
    switch (status) {
      case 'loading':
        return 'Loading PDF...'
      case 'rendering':
        return `Rendering page ${currentPage} of ${totalPages}...`
      case 'uploading':
        return `Uploading page ${currentPage} of ${totalPages}...`
      case 'complete':
        return 'Processing complete!'
      case 'error':
        return error || 'An error occurred'
      default:
        return 'Processing...'
    }
  }

  return (
    <div className='w-full max-w-xl mx-auto'>
      <div className='border border-white/20 rounded-2xl p-8 bg-white/5'>
        <div className='flex flex-col items-center gap-6'>
          {/* Animated icon */}
          <div className='relative'>
            {status !== 'error' && status !== 'complete' ? (
              <div className='w-20 h-20 rounded-full border-4 border-white/10 border-t-[#e94560] animate-spin' />
            ) : status === 'complete' ? (
              <div className='w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center'>
                <svg
                  className='w-10 h-10 text-green-500'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M5 13l4 4L19 7'
                  />
                </svg>
              </div>
            ) : (
              <div className='w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center'>
                <svg
                  className='w-10 h-10 text-red-500'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M6 18L18 6M6 6l12 12'
                  />
                </svg>
              </div>
            )}
          </div>

          {/* Status text */}
          <div className='text-center'>
            <p
              className={`text-lg font-medium ${status === 'error' ? 'text-red-400' : 'text-white'}`}
            >
              {getStatusText()}
            </p>
            {status !== 'error' && status !== 'complete' && (
              <p className='text-sm text-gray-400 mt-1'>
                Please don&apos;t close this window
              </p>
            )}
          </div>

          {/* Progress bar */}
          {(status === 'rendering' || status === 'uploading') && (
            <div className='w-full'>
              <div className='h-3 bg-white/10 rounded-full overflow-hidden'>
                <div
                  className='h-full bg-gradient-to-r from-[#e94560] to-[#ff6b8a] transition-all duration-300'
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className='text-sm text-gray-400 mt-2 text-center'>
                {progress}% complete
              </p>
            </div>
          )}

          {/* Page thumbnails preview */}
          {totalPages > 0 && status !== 'error' && (
            <div className='flex items-center gap-1 mt-2'>
              {Array.from({ length: Math.min(totalPages, 10) }).map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    i < currentPage ? 'bg-[#e94560]' : 'bg-white/20'
                  }`}
                />
              ))}
              {totalPages > 10 && (
                <span className='text-xs text-gray-400 ml-1'>
                  +{totalPages - 10}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
