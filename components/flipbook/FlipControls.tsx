'use client'

interface FlipControlsProps {
  currentSpread: number
  totalPages: number
  totalSpreads: number
  onPrev: () => void
  onNext: () => void
  isAnimating: boolean
  onZoomIn?: () => void
  onZoomOut?: () => void
  onZoomReset?: () => void
  currentZoom?: number
}

export function FlipControls({
  currentSpread,
  totalPages,
  totalSpreads,
  onPrev,
  onNext,
  isAnimating,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  currentZoom = 1
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

  const isZoomed = currentZoom > 1.05

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

      {/* Zoom controls separator */}
      {onZoomIn && (
        <>
          <div className='w-px h-6 bg-white/20' />

          <div className='flex items-center gap-2'>
            {/* Zoom out */}
            <button
              onClick={onZoomOut}
              disabled={currentZoom <= 1}
              className={`
                p-2 rounded-full transition-all duration-200
                ${
                  currentZoom > 1
                    ? 'bg-white/10 hover:bg-white/20 text-white'
                    : 'bg-white/5 text-white/30 cursor-not-allowed'
                }
              `}
              aria-label='Zoom out'
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
                  d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7'
                />
              </svg>
            </button>

            {/* Zoom in */}
            <button
              onClick={onZoomIn}
              disabled={currentZoom >= 3}
              className={`
                p-2 rounded-full transition-all duration-200
                ${
                  currentZoom < 3
                    ? 'bg-white/10 hover:bg-white/20 text-white'
                    : 'bg-white/5 text-white/30 cursor-not-allowed'
                }
              `}
              aria-label='Zoom in'
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
                  d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7'
                />
              </svg>
            </button>

            {/* Reset zoom - only show when zoomed */}
            {isZoomed && (
              <button
                onClick={onZoomReset}
                className='p-2 rounded-full transition-all duration-200 bg-white/10 hover:bg-white/20 text-white'
                aria-label='Reset zoom'
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
                    d='M4 4v5h5M20 20v-5h-5M4 9a9 9 0 0115.36-6.36M20 15a9 9 0 01-15.36 6.36'
                  />
                </svg>
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}
