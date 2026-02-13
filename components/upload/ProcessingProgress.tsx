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
        return 'Cargando PDF...'
      case 'rendering':
        return 'Renderizando páginas...'
      case 'uploading':
        return 'Subiendo páginas...'
      case 'complete':
        return '¡Procesamiento completo!'
      case 'error':
        return error || 'Ocurrió un error'
      default:
        return 'Procesando...'
    }
  }

  return (
    <div className='w-full max-w-xl mx-auto'>
      <div className='border border-stone-200 rounded-[16px] p-8 bg-white'>
        <div className='flex flex-col items-center gap-6'>
          {/* Animated icon */}
          <div className='relative'>
            {status !== 'error' && status !== 'complete' ? (
              <div className='w-20 h-20 rounded-full border-4 border-stone-200 border-t-[#166534] animate-spin' />
            ) : status === 'complete' ? (
              <div className='w-20 h-20 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center'>
                <svg
                  className='w-10 h-10 text-emerald-600'
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
              <div className='w-20 h-20 rounded-full bg-red-50 border border-red-200 flex items-center justify-center'>
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
              className={`text-lg font-medium ${status === 'error' ? 'text-red-600' : 'text-stone-900'}`}
            >
              {getStatusText()}
            </p>
            {status !== 'error' && status !== 'complete' && (
              <p className='text-sm text-stone-400 mt-1'>
                No cierres esta ventana
              </p>
            )}
          </div>

          {/* Progress bar */}
          {(status === 'rendering' || status === 'uploading') && (
            <div className='w-full'>
              <div className='h-3 bg-stone-100 rounded-full overflow-hidden'>
                <div
                  className='h-full bg-gradient-to-r from-[#166534] to-[#16a34a] transition-all duration-300'
                  style={{ width: `${clampedProgress}%` }}
                />
              </div>
              <p className='text-sm text-stone-400 mt-2 text-center'>
                {clampedProgress}% completado
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
