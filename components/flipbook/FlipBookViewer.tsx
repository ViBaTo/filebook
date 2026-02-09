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
const MIN_ZOOM = 1
const MAX_ZOOM = 3
const ZOOM_STEP = 0.5

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
  const [currentZoom, setCurrentZoom] = useState(1)

  // Refs
  const containerRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const baseWidthRef = useRef(0)

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

  // Measure the base width of the book container at zoom 1x
  useEffect(() => {
    const measure = () => {
      if (containerRef.current && currentZoom <= 1) {
        baseWidthRef.current = containerRef.current.offsetWidth
      }
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [currentZoom])

  // Center scroll position when zoom changes
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container || currentZoom <= 1) return

    requestAnimationFrame(() => {
      const scrollX = (container.scrollWidth - container.clientWidth) / 2
      const scrollY = (container.scrollHeight - container.clientHeight) / 2
      container.scrollTo({ left: scrollX, top: scrollY, behavior: 'smooth' })
    })
  }, [currentZoom])

  // Preload adjacent spreads
  useEffect(() => {
    const pagesToPreload: number[] = []
    for (let i = -2; i <= 2; i++) {
      const spreadIndex = currentSpread + i
      if (spreadIndex >= 0 && spreadIndex < totalSpreads) {
        if (spreadIndex === 0) {
          pagesToPreload.push(0)
        } else {
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

  // Zoom helpers
  const clampZoom = useCallback(
    (zoom: number) => Math.round(Math.min(Math.max(zoom, MIN_ZOOM), MAX_ZOOM) * 100) / 100,
    []
  )

  const zoomIn = useCallback(() => {
    setCurrentZoom((prev) => clampZoom(prev + ZOOM_STEP))
  }, [clampZoom])

  const zoomOut = useCallback(() => {
    setCurrentZoom((prev) => clampZoom(prev - ZOOM_STEP))
  }, [clampZoom])

  const zoomReset = useCallback(() => {
    setCurrentZoom(1)
  }, [])

  // Double-click to toggle zoom
  const handleDoubleClick = useCallback(() => {
    setCurrentZoom((prev) => (prev > 1 ? 1 : 2))
  }, [])

  const goToSpread = useCallback(
    (direction: 'next' | 'prev') => {
      if (isAnimating) return
      if (direction === 'next' && currentSpread >= totalSpreads - 1) return
      if (direction === 'prev' && currentSpread <= 0) return

      // Reset zoom before flipping
      setCurrentZoom(1)

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
          const newLeftPageIndex =
            newSpread === 0 ? 0 : (newSpread - 1) * 2 + 1
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

  // Wheel / trackpad zoom (Ctrl+scroll or pinch on trackpad)
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault()
        const delta = -e.deltaY * 0.01
        setCurrentZoom((prev) => clampZoom(prev + delta))
      }
    }

    container.addEventListener('wheel', handleWheel, { passive: false })
    return () => container.removeEventListener('wheel', handleWheel)
  }, [clampZoom])

  // Touch handling: swipe to navigate + pinch to zoom
  const touchStartX = useRef(0)
  const pinchStartDistance = useRef(0)
  const pinchStartZoom = useRef(1)
  const isPinching = useRef(false)

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // Pinch start
      isPinching.current = true
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      pinchStartDistance.current = Math.hypot(dx, dy)
      pinchStartZoom.current = currentZoom
    } else if (e.touches.length === 1) {
      isPinching.current = false
      touchStartX.current = e.touches[0].clientX
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      const distance = Math.hypot(dx, dy)
      if (pinchStartDistance.current > 0) {
        const scale = distance / pinchStartDistance.current
        setCurrentZoom(clampZoom(pinchStartZoom.current * scale))
      }
    }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (isPinching.current) {
      isPinching.current = false
      return
    }
    // Swipe navigation (only when not zoomed)
    if (currentZoom > 1) return
    const touchEndX = e.changedTouches[0].clientX
    const diff = touchStartX.current - touchEndX

    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        goToNext()
      } else {
        goToPrev()
      }
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

  // Compute container style based on zoom
  // At zoom 1x: responsive (w-full max-w-7xl)
  // At zoom > 1x: explicit width = baseWidth * zoom (container grows, parent scrolls)
  const isZoomed = currentZoom > 1
  const zoomedWidth =
    isZoomed && baseWidthRef.current > 0
      ? baseWidthRef.current * currentZoom
      : undefined

  return (
    <div className={`relative w-full h-full flex flex-col ${className}`}>
      {/* Title & Owner */}
      {(title || ownerName) && (
        <div className='text-center py-2 shrink-0'>
          {title && (
            <h1 className='text-xl font-medium text-white leading-tight'>
              {title}
            </h1>
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

      {/* Book container - scrollable when zoomed */}
      <div
        ref={scrollContainerRef}
        className='flex-1 overflow-auto'
      >
        <div
          className='flex items-center justify-center p-4'
          style={{
            minHeight: '100%',
            minWidth: isZoomed ? 'fit-content' : '100%',
          }}
        >
          <div
            ref={containerRef}
            className={`relative select-none ${!zoomedWidth ? 'w-full max-w-7xl' : ''}`}
            style={{
              ...(zoomedWidth ? { width: `${zoomedWidth}px` } : {}),
              aspectRatio: '2.8 / 1',
              transition: 'width 0.3s ease',
            }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onDoubleClick={handleDoubleClick}
          >
            <div
              className='relative w-full h-full'
              style={{ perspective: '2000px' }}
            >
              {/* Pages container - two page spread */}
              <div
                className='absolute inset-0 flex'
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
                        <div className='absolute inset-0 bg-transparent overflow-hidden'>
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
                      <div className='absolute inset-0 bg-transparent overflow-hidden'>
                        <div className='w-full h-full bg-transparent' />
                      </div>
                    )}

                    {/* Base left page (current) - hidden during 'prev' flip since FlipPage shows it */}
                    {flipDirection !== 'prev' && (
                      <div className='absolute inset-0 bg-transparent overflow-hidden'>
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
                          <div className='w-full h-full bg-transparent' />
                        )}
                      </div>
                    )}

                    {/* Flipping page animation - prev direction */}
                    {flipDirection === 'prev' && (
                      <FlipPage
                        direction='prev'
                        progress={flipProgress}
                        frontImage={
                          hasLeftPage ? pages[leftPageIndex] : undefined
                        }
                        backImage={
                          prevSpreadRightIndex >= 0 &&
                          prevSpreadRightIndex < totalPages
                            ? pages[prevSpreadRightIndex]
                            : undefined
                        }
                        isLoaded={
                          hasLeftPage ? isPageLoaded(leftPageIndex) : true
                        }
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
                      <div className='absolute inset-0 bg-transparent overflow-hidden'>
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
                      className={`${isCoverSpread ? 'relative w-1/2 h-full' : 'absolute inset-0'} bg-transparent overflow-hidden`}
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
                        <div className='w-full h-full bg-transparent' />
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
                        nextSpreadLeftIndex >= 0 &&
                        nextSpreadLeftIndex < totalPages
                          ? pages[nextSpreadLeftIndex]
                          : undefined
                      }
                      isLoaded={isPageLoaded(rightPageIndex)}
                    />
                  )}
                </div>
              </div>

              {/* Navigation hints */}
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
            </div>
          </div>
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
          onZoomIn={zoomIn}
          onZoomOut={zoomOut}
          onZoomReset={zoomReset}
          currentZoom={currentZoom}
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
