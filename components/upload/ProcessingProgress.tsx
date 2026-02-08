'use client'

interface ProcessingProgressProps {
  progress: number
  status: 'loading' | 'rendering' | 'uploading' | 'complete' | 'error'
  statusText?: string
  error?: string
}

export function ProcessingProgress({
  progress,
  status,
  statusText,
  error
}: ProcessingProgressProps) {
  const clampedProgress = Math.min(100, Math.max(0, progress))

  const getStatusText = () => {
    if (statusText) return statusText
    switch (status) {
      case 'loading':
        return 'Loading PDF...'
      case 'rendering':
        return 'Rendering pages...'
      case 'uploading':
        return 'Uploading pages...'
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
                  style={{ width: `${clampedProgress}%` }}
                />
              </div>
              <p className='text-sm text-gray-400 mt-2 text-center'>
                {clampedProgress}% complete
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
