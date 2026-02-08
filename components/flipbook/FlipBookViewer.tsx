'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { FlipPage } from './FlipPage'
import { FlipControls } from './FlipControls'

interface FlipBookViewerProps {
  pages: string[]
  title?: string
  showWatermark?: boolean
  showControls?: boolean
  autoFlipSeconds?: number
  onPageChange?: (page: number) => void
  className?: string
  ownerName?: string | null
}

const FLIP_DURATION = 600 // ms

export function FlipBookViewer({
  pages,
  title,
  showWatermark = true,
  showControls = true,
  autoFlipSeconds = 0,
  onPageChange,
  className = '',
  ownerName
}: FlipBookViewerProps) {
  // currentSpread tracks which two-page spread we're viewing
  // Spread 0 = cover only, Spread 1 = pages 1-2, etc.
  const [currentSpread, setCurrentSpread] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const [flipProgress, setFlipProgress] = useState(0)
  const [flipDirection, setFlipDirection] = useState<'next' | 'prev' | null>(
    null
  )
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set())
  const containerRef = useRef<HTMLDivElement>(null)

  const totalPages = pages.length

  // Spread 0 = cover only (page 0)
  // Spread 1 = pages 1-2
  // Spread 2 = pages 3-4, etc.
  // Total spreads = 1 (cover) + ceil((totalPages - 1) / 2)
  const totalSpreads = 1 + Math.ceil((totalPages - 1) / 2)

  // Calculate page indices for current spread
  const isCoverSpread = currentSpread === 0

  // For cover spread: only show page 0 on the right
  // For other spreads: left = (spread-1)*2 + 1, right = (spread-1)*2 + 2
  const leftPageIndex = isCoverSpread ? -1 : (currentSpread - 1) * 2 + 1
  const rightPageIndex = isCoverSpread ? 0 : (currentSpread - 1) * 2 + 2
  const hasLeftPage = leftPageIndex >= 0 && leftPageIndex < totalPages
  const hasRightPage = rightPageIndex < totalPages

  // Preload adjacent spreads
  useEffect(() => {
    const pagesToPreload: number[] = []
    for (let i = -2; i <= 2; i++) {
      const spreadIndex = currentSpread + i
      if (spreadIndex >= 0 && spreadIndex < totalSpreads) {
        if (spreadIndex === 0) {
          // Cover spread - only page 0
          pagesToPreload.push(0)
        } else {
          // Regular spreads
          const left = (spreadIndex - 1) * 2 + 1
          const right = (spreadIndex - 1) * 2 + 2
          if (left < totalPages) pagesToPreload.push(left)
          if (right < totalPages) pagesToPreload.push(right)
        }
      }
    }

    pagesToPreload.forEach((pageIndex) => {
      if (!loadedImages.has(pageIndex)) {
        const img = new Image()
        img.onload = () => {
          setLoadedImages((prev) => new Set([...prev, pageIndex]))
        }
        img.src = pages[pageIndex]
      }
    })
  }, [currentSpread, pages, totalPages, totalSpreads, loadedImages])

  const goToSpread = useCallback(
    (direction: 'next' | 'prev') => {
      if (isAnimating) return
      if (direction === 'next' && currentSpread >= totalSpreads - 1) return
      if (direction === 'prev' && currentSpread <= 0) return

      setIsAnimating(true)
      setFlipDirection(direction)

      let start: number | null = null
      const animate = (timestamp: number) => {
        if (!start) start = timestamp
        const elapsed = timestamp - start
        const progress = Math.min(elapsed / FLIP_DURATION, 1)
        // Ease-out cubic
        const eased = 1 - Math.pow(1 - progress, 3)
        setFlipProgress(eased)

        if (progress < 1) {
          requestAnimationFrame(animate)
        } else {
          const newSpread =
            direction === 'next' ? currentSpread + 1 : currentSpread - 1
          setCurrentSpread(newSpread)
          setFlipProgress(0)
          setFlipDirection(null)
          setIsAnimating(false)

          // Report the left page index of the new spread
          const newLeftPageIndex = newSpread === 0 ? 0 : (newSpread - 1) * 2 + 1
          onPageChange?.(newLeftPageIndex)
        }
      }
      requestAnimationFrame(animate)
    },
    [isAnimating, currentSpread, totalSpreads, onPageChange]
  )

  const goToNext = useCallback(() => goToSpread('next'), [goToSpread])
  const goToPrev = useCallback(() => goToSpread('prev'), [goToSpread])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault()
        goToNext()
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        goToPrev()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [goToNext, goToPrev])

  // Auto flip
  useEffect(() => {
    if (autoFlipSeconds > 0 && !isAnimating) {
      const timer = setTimeout(() => {
        if (currentSpread < totalSpreads - 1) {
          goToNext()
        }
      }, autoFlipSeconds * 1000)
      return () => clearTimeout(timer)
    }
  }, [autoFlipSeconds, currentSpread, totalSpreads, goToNext, isAnimating])

  // Touch handling
  const touchStartX = useRef(0)
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndX = e.changedTouches[0].clientX
    const diff = touchStartX.current - touchEndX

    if (Math.abs(diff) > 50) {
      // Minimum swipe distance
      if (diff > 0) {
        goToNext()
      } else {
        goToPrev()
      }
    }
  }

  // Click navigation - click left half for prev, right half for next
  const handleClick = (e: React.MouseEvent) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const midpoint = rect.width / 2

    if (clickX > midpoint) {
      goToNext()
    } else {
      goToPrev()
    }
  }

  const isPageLoaded = (index: number) => loadedImages.has(index)

  // Calculate next spread page indices for animation
  const nextSpread = currentSpread + 1
  const nextSpreadLeftIndex = nextSpread === 0 ? -1 : (nextSpread - 1) * 2 + 1
  const nextSpreadRightIndex = nextSpread === 0 ? 0 : (nextSpread - 1) * 2 + 2

  // Calculate previous spread page indices for animation
  const prevSpread = currentSpread - 1
  const prevSpreadLeftIndex =
    prevSpread === 0 ? -1 : prevSpread > 0 ? (prevSpread - 1) * 2 + 1 : -1
  const prevSpreadRightIndex =
    prevSpread === 0 ? 0 : prevSpread > 0 ? (prevSpread - 1) * 2 + 2 : -1

  return (
    <div className={`relative w-full h-full flex flex-col ${className}`}>
      {/* Title & Owner */}
      {(title || ownerName) && (
        <div className='text-center py-2 shrink-0'>
          {title && (
            <h1 className='text-xl font-medium text-white leading-tight'>{title}</h1>
          )}
          {ownerName && (
            <div className='flex items-center justify-center gap-1.5'>
              <div className='w-4 h-4 rounded-full bg-gradient-to-br from-[#e94560] to-[#d63d56] flex items-center justify-center text-white text-[9px] font-semibold shrink-0'>
                {ownerName.charAt(0).toUpperCase()}
              </div>
              <span className='text-xs text-gray-400'>
                Creado por {ownerName}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Book container */}
      <div className='flex-1 flex items-center justify-center p-4'>
        <div
          ref={containerRef}
          className='relative w-full max-w-7xl aspect-[2.8/1] cursor-pointer select-none'
          style={{ perspective: '2000px' }}
          onClick={handleClick}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Book shadow */}
          <div className='absolute inset-x-4 bottom-0 h-8 bg-black/30 blur-xl rounded-full' />

          {/* Pages container - two page spread */}
          <div
            className='absolute inset-0 flex shadow-xl rounded-md'
            style={{ transformStyle: 'preserve-3d' }}
          >
            {/* Left page container */}
            {!isCoverSpread && (
              <div
                className='relative w-1/2 h-full'
                style={{ transformStyle: 'preserve-3d' }}
              >
                {/* Previous spread's left page (underneath, revealed when flipping prev) */}
                {flipDirection === 'prev' &&
                  prevSpreadLeftIndex >= 0 &&
                  prevSpreadLeftIndex < totalPages && (
                    <div className='absolute inset-0 bg-[#fefefe] rounded-l-md overflow-hidden'>
                      {isPageLoaded(prevSpreadLeftIndex) ? (
                        <img
                          src={pages[prevSpreadLeftIndex]}
                          alt={`Page ${prevSpreadLeftIndex + 1}`}
                          className='w-full h-full object-contain'
                          draggable={false}
                        />
                      ) : (
                        <div className='w-full h-full flex items-center justify-center bg-gray-100'>
                          <div className='w-8 h-8 border-2 border-gray-300 border-t-[#e94560] rounded-full animate-spin' />
                        </div>
                      )}
                    </div>
                  )}

                {/* Previous spread's right page for cover transition (when going back to cover) */}
                {flipDirection === 'prev' && prevSpread === 0 && (
                  <div className='absolute inset-0 bg-[#fefefe] rounded-l-md overflow-hidden'>
                    {/* Empty page - cover has no left page */}
                    <div className='w-full h-full bg-[#fefefe]' />
                  </div>
                )}

                {/* Base left page (current) - hidden during 'prev' flip since FlipPage shows it */}
                {flipDirection !== 'prev' && (
                  <div className='absolute inset-0 bg-[#fefefe] rounded-l-md overflow-hidden'>
                    {hasLeftPage && isPageLoaded(leftPageIndex) ? (
                      <img
                        src={pages[leftPageIndex]}
                        alt={`Page ${leftPageIndex + 1}`}
                        className='w-full h-full object-contain'
                        draggable={false}
                      />
                    ) : hasLeftPage ? (
                      <div className='w-full h-full flex items-center justify-center bg-gray-100'>
                        <div className='w-8 h-8 border-2 border-gray-300 border-t-[#e94560] rounded-full animate-spin' />
                      </div>
                    ) : (
                      <div className='w-full h-full bg-[#fefefe]' />
                    )}
                  </div>
                )}

                {/* Flipping page animation - prev direction */}
                {flipDirection === 'prev' && (
                  <FlipPage
                    direction='prev'
                    progress={flipProgress}
                    frontImage={hasLeftPage ? pages[leftPageIndex] : undefined}
                    backImage={
                      prevSpreadRightIndex >= 0 &&
                      prevSpreadRightIndex < totalPages
                        ? pages[prevSpreadRightIndex]
                        : undefined
                    }
                    isLoaded={hasLeftPage ? isPageLoaded(leftPageIndex) : true}
                  />
                )}
              </div>
            )}

            {/* Right page container - full width on cover, half width when open */}
            <div
              className={`relative h-full ${isCoverSpread ? 'w-full flex items-center justify-center' : 'w-1/2'}`}
              style={{ transformStyle: 'preserve-3d' }}
            >
              {/* Next spread's right page (underneath, revealed when flipping to next) */}
              {flipDirection === 'next' &&
                nextSpreadRightIndex < totalPages && (
                  <div className='absolute inset-0 bg-[#fefefe] rounded-r-md overflow-hidden'>
                    {isPageLoaded(nextSpreadRightIndex) ? (
                      <img
                        src={pages[nextSpreadRightIndex]}
                        alt={`Page ${nextSpreadRightIndex + 1}`}
                        className='w-full h-full object-contain'
                        draggable={false}
                      />
                    ) : (
                      <div className='w-full h-full flex items-center justify-center bg-gray-100'>
                        <div className='w-8 h-8 border-2 border-gray-300 border-t-[#e94560] rounded-full animate-spin' />
                      </div>
                    )}
                  </div>
                )}

              {/* Base right page (current) - hidden during 'next' flip since FlipPage shows it */}
              {flipDirection !== 'next' && (
                <div
                  className={`${isCoverSpread ? 'relative w-1/2 h-full' : 'absolute inset-0'} bg-[#fefefe] ${isCoverSpread ? 'rounded-md shadow-xl' : 'rounded-r-md'} overflow-hidden`}
                >
                  {hasRightPage && isPageLoaded(rightPageIndex) ? (
                    <img
                      src={pages[rightPageIndex]}
                      alt={`Page ${rightPageIndex + 1}`}
                      className='w-full h-full object-contain'
                      draggable={false}
                    />
                  ) : hasRightPage ? (
                    <div className='w-full h-full flex items-center justify-center bg-gray-100'>
                      <div className='w-8 h-8 border-2 border-gray-300 border-t-[#e94560] rounded-full animate-spin' />
                    </div>
                  ) : (
                    // Blank page for odd total pages
                    <div className='w-full h-full bg-[#fefefe]' />
                  )}
                </div>
              )}

              {/* Flipping page animation - next direction */}
              {flipDirection === 'next' && (
                <FlipPage
                  direction='next'
                  progress={flipProgress}
                  frontImage={pages[rightPageIndex]}
                  backImage={
                    nextSpreadLeftIndex >= 0 && nextSpreadLeftIndex < totalPages
                      ? pages[nextSpreadLeftIndex]
                      : undefined
                  }
                  isLoaded={isPageLoaded(rightPageIndex)}
                />
              )}
            </div>
          </div>

          {/* Navigation hints */}
          <>
            {currentSpread > 0 && (
              <div className='absolute left-4 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none'>
                <svg
                  className='w-8 h-8'
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
              </div>
            )}
            {currentSpread < totalSpreads - 1 && (
              <div className='absolute right-4 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none'>
                <svg
                  className='w-8 h-8'
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
              </div>
            )}
          </>
        </div>
      </div>

      {/* Controls */}
      {showControls && (
        <FlipControls
          currentSpread={currentSpread}
          totalPages={totalPages}
          totalSpreads={totalSpreads}
          onPrev={goToPrev}
          onNext={goToNext}
          isAnimating={isAnimating}
        />
      )}

      {/* Watermark */}
      {showWatermark && (
        <div className='absolute bottom-2 right-4 text-xs text-white/30'>
          Made with FlipBook
        </div>
      )}
    </div>
  )
}
