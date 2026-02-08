'use client'

interface FlipControlsProps {
  currentSpread: number
  totalPages: number
  totalSpreads: number
  onPrev: () => void
  onNext: () => void
  isAnimating: boolean
}

export function FlipControls({
  currentSpread,
  totalPages,
  totalSpreads,
  onPrev,
  onNext,
  isAnimating
}: FlipControlsProps) {
  const canGoPrev = currentSpread > 0
  const canGoNext = currentSpread < totalSpreads - 1

  // Calculate the page numbers for the current spread
  // Spread 0 = cover (page 1)
  // Spread 1 = pages 2-3
  // Spread N = pages (N*2), (N*2+1)
  const isCoverSpread = currentSpread === 0
  const leftPageNum = isCoverSpread ? -1 : (currentSpread - 1) * 2 + 2
  const rightPageNum = isCoverSpread ? 1 : (currentSpread - 1) * 2 + 3
  const hasLeftPage = leftPageNum > 0 && leftPageNum <= totalPages
  const hasRightPage = rightPageNum <= totalPages

  return (
    <div className='flex items-center justify-center gap-6 py-4'>
      {/* Previous button */}
      <button
        onClick={onPrev}
        disabled={!canGoPrev || isAnimating}
        className={`
          p-3 rounded-full transition-all duration-200
          ${
            canGoPrev && !isAnimating
              ? 'bg-white/10 hover:bg-white/20 text-white'
              : 'bg-white/5 text-white/30 cursor-not-allowed'
          }
        `}
        aria-label='Previous spread'
      >
        <svg
          className='w-6 h-6'
          fill='none'
          viewBox='0 0 24 24'
          stroke='currentColor'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M15 19l-7-7 7-7'
          />
        </svg>
      </button>

      {/* Page indicator */}
      <div className='flex items-center gap-4'>
        {/* Spread dots for small books (based on spreads, not pages) */}
        {totalSpreads <= 10 && (
          <div className='flex items-center gap-1.5'>
            {Array.from({ length: totalSpreads }).map((_, i) => (
              <div
                key={i}
                className={`
                  w-2 h-2 rounded-full transition-all duration-300
                  ${
                    i === currentSpread
                      ? 'bg-[#e94560] scale-125'
                      : 'bg-white/30 hover:bg-white/50'
                  }
                `}
              />
            ))}
          </div>
        )}

        {/* Page counter - show current spread's page range */}
        <div className='text-white/70 text-sm font-medium min-w-[80px] text-center'>
          <span className='text-white'>
            {isCoverSpread
              ? '1'
              : hasLeftPage && hasRightPage
                ? `${leftPageNum}-${rightPageNum}`
                : hasLeftPage
                  ? leftPageNum
                  : rightPageNum}
          </span>
          <span className='mx-1'>/</span>
          <span>{totalPages}</span>
        </div>
      </div>

      {/* Next button */}
      <button
        onClick={onNext}
        disabled={!canGoNext || isAnimating}
        className={`
          p-3 rounded-full transition-all duration-200
          ${
            canGoNext && !isAnimating
              ? 'bg-white/10 hover:bg-white/20 text-white'
              : 'bg-white/5 text-white/30 cursor-not-allowed'
          }
        `}
        aria-label='Next spread'
      >
        <svg
          className='w-6 h-6'
          fill='none'
          viewBox='0 0 24 24'
          stroke='currentColor'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M9 5l7 7-7 7'
          />
        </svg>
      </button>
    </div>
  )
}
