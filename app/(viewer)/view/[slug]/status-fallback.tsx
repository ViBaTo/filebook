import Link from 'next/link'

interface StatusFallbackProps {
  status: 'uploading' | 'processing' | 'error'
  errorMessage?: string | null
  title?: string | null
}

export function StatusFallback({ status, errorMessage, title }: StatusFallbackProps) {
  const isError = status === 'error'

  return (
    <div className='min-h-screen bg-linear-to-br from-[#1C1917] via-[#292524] to-[#1C1917] flex items-center justify-center px-6'>
      <div className='max-w-md w-full bg-white/5 border border-white/10 rounded-[16px] p-8 text-center backdrop-blur'>
        {!isError ? (
          <>
            <div className='w-12 h-12 mx-auto mb-4 border-2 border-white/20 border-t-[#16a34a] rounded-full animate-spin' />
            <h1 className='serif text-2xl text-white mb-2'>
              Procesando tu FlipBook
            </h1>
            <p className='text-white/60 text-sm'>
              {title ? `"${title}" está generándose.` : 'Tu flipbook está generándose.'}{' '}
              Esto suele tardar menos de un minuto. Refresca la página en unos segundos.
            </p>
          </>
        ) : (
          <>
            <div className='w-12 h-12 mx-auto mb-4 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center'>
              <svg className='w-6 h-6 text-red-400' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
              </svg>
            </div>
            <h1 className='serif text-2xl text-white mb-2'>
              No se pudo generar este FlipBook
            </h1>
            <p className='text-white/60 text-sm mb-4'>
              {errorMessage || 'El PDF no pudo procesarse. Intenta subirlo de nuevo.'}
            </p>
            <Link
              href='/create'
              className='inline-block px-5 py-2.5 bg-[#166534] hover:bg-[#14532d] text-white text-sm font-medium rounded-full transition-colors'
            >
              Subir otro PDF
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
