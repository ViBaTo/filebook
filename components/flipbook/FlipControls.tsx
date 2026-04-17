'use client'

import { ProgressScrubber } from './ProgressScrubber'

interface FlipControlsProps {
  currentSpread: number
  totalPages: number
  totalSpreads: number
  pagesPerSpread?: number
  isMobile?: boolean
  onPrev: () => void
  onNext: () => void
  onJumpToSpread?: (target: number) => void
  onDragActivity?: () => void
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
  pagesPerSpread = 2,
  isMobile = false,
  onPrev,
  onNext,
  onJumpToSpread,
  onDragActivity,
  isAnimating,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  currentZoom = 1
}: FlipControlsProps) {
  const canGoPrev = currentSpread > 0
  const canGoNext = currentSpread < totalSpreads - 1

  // Calculate the page numbers for the current spread.
  // Two-page mode: spread 0 = cover (page 1); spread N = pages (N*2), (N*2+1).
  // Single-page mode: spread index equals page index (0-based).
  const isSinglePage = pagesPerSpread === 1
  const isCoverSpread = !isSinglePage && currentSpread === 0
  const leftPageNum = isSinglePage
    ? -1
    : isCoverSpread
      ? -1
      : (currentSpread - 1) * 2 + 2
  const rightPageNum = isSinglePage
    ? currentSpread + 1
    : isCoverSpread
      ? 1
      : (currentSpread - 1) * 2 + 3
  const hasLeftPage = leftPageNum > 0 && leftPageNum <= totalPages
  const hasRightPage = rightPageNum <= totalPages

  const isZoomed = currentZoom > 1.05

  return (
    <div
      className={`flex items-center ${isMobile ? 'justify-between px-3 py-3 gap-2' : 'justify-center gap-6 py-4'}`}
      style={
        isMobile
          ? { paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 12px)' }
          : undefined
      }
    >
      {/* Previous button */}
      <button
        onClick={onPrev}
        disabled={!canGoPrev || isAnimating}
        className={`
          min-w-[44px] min-h-[44px] p-3 rounded-full transition-all duration-200
          flex items-center justify-center
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
      <div className={`flex items-center ${isMobile ? 'flex-1 min-w-0 gap-2' : 'gap-4'}`}>
        {isMobile ? (
          onJumpToSpread && (
            <ProgressScrubber
              currentSpread={currentSpread}
              totalSpreads={totalSpreads}
              totalPages={totalPages}
              onJumpToSpread={onJumpToSpread}
              onDragActivity={onDragActivity}
            />
          )
        ) : totalSpreads <= 10 ? (
          <div className='flex items-center gap-1.5'>
            {Array.from({ length: totalSpreads }).map((_, i) => (
              <button
                key={i}
                onClick={() => onJumpToSpread?.(i)}
                aria-label={`Go to spread ${i + 1}`}
                className={`
                  w-2 h-2 rounded-full transition-all duration-300
                  ${i === currentSpread
                    ? 'bg-[#16a34a] scale-125'
                    : 'bg-white/30 hover:bg-white/50'}
                `}
              />
            ))}
          </div>
        ) : (
          <PageJumpInput
            currentSpread={currentSpread}
            totalSpreads={totalSpreads}
            totalPages={totalPages}
            pagesPerSpread={pagesPerSpread}
            onJumpToSpread={onJumpToSpread}
          />
        )}

        {/* Page counter — scrubber already shows this in mobile */}
        {!isMobile && (
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
        )}
      </div>

      {/* Next button */}
      <button
        onClick={onNext}
        disabled={!canGoNext || isAnimating}
        className={`
          min-w-[44px] min-h-[44px] p-3 rounded-full transition-all duration-200
          flex items-center justify-center
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

      {/* Zoom controls separator — hidden on mobile (pinch/double-tap) */}
      {onZoomIn && !isMobile && (
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
                    d='M4 8V4h4M20 8V4h-4M4 16v4h4M20 16v4h-4'
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

function PageJumpInput({
  currentSpread,
  totalSpreads,
  totalPages,
  pagesPerSpread,
  onJumpToSpread
}: {
  currentSpread: number
  totalSpreads: number
  totalPages: number
  pagesPerSpread: number
  onJumpToSpread?: (target: number) => void
}) {
  const pageToSpread = (page: number) => {
    // Single-page mode: spread index = page index (0-based). page 1 -> spread 0.
    if (pagesPerSpread === 1) return page - 1
    // Two-page mode: cover holds page 1, subsequent spreads hold 2 pages.
    return page <= 1 ? 0 : Math.ceil((page - 1) / 2)
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const input = form.elements.namedItem('page') as HTMLInputElement
    const n = parseInt(input.value, 10)
    if (!Number.isFinite(n) || n < 1) return
    const page = Math.min(totalPages, n)
    const targetSpread = pageToSpread(page)
    onJumpToSpread?.(Math.max(0, Math.min(totalSpreads - 1, targetSpread)))
    input.blur()
  }

  const coverPage =
    pagesPerSpread === 1
      ? currentSpread + 1
      : currentSpread === 0
        ? 1
        : (currentSpread - 1) * 2 + 2

  return (
    <form onSubmit={handleSubmit} className='flex items-center gap-2'>
      <label className='sr-only' htmlFor='page-jump'>Ir a la página</label>
      <input
        id='page-jump'
        name='page'
        type='number'
        min={1}
        max={totalPages}
        defaultValue={coverPage}
        key={currentSpread}
        className='w-14 px-2 py-1 text-sm bg-white/10 border border-white/20 rounded text-white text-center focus:outline-none focus:border-[#16a34a]'
      />
      <button
        type='submit'
        className='text-xs text-white/70 hover:text-white transition-colors'
      >
        Ir
      </button>
    </form>
  )
}
