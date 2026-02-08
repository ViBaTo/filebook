import Link from 'next/link'

export default function NotFound() {
  return (
    <div className='min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] flex items-center justify-center'>
      <div className='text-center'>
        <div className='w-24 h-24 mx-auto mb-6 rounded-full bg-white/10 flex items-center justify-center'>
          <svg
            className='w-12 h-12 text-white/50'
            fill='none'
            viewBox='0 0 24 24'
            stroke='currentColor'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={1.5}
              d='M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253'
            />
          </svg>
        </div>

        <h1 className='text-3xl font-bold text-white mb-2'>
          FlipBook not found
        </h1>
        <p className='text-gray-400 mb-8'>
          This flipbook may have been deleted or the link is incorrect.
        </p>

        <Link
          href='/'
          className='inline-flex items-center gap-2 px-6 py-3 bg-[#e94560] text-white rounded-lg hover:bg-[#d63d56] transition-colors'
        >
          <svg
            className='w-5 h-5'
            fill='none'
            viewBox='0 0 24 24'
            stroke='currentColor'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6'
            />
          </svg>
          Go home
        </Link>
      </div>
    </div>
  )
}
