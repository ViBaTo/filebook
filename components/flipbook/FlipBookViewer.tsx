'use client'

import NextImage from 'next/image'
import { useState, useEffect, useCallback, useRef } from 'react'
import { FlipPage } from './FlipPage'
import { FlipControls } from './FlipControls'
import { TapZones } from './TapZones'

interface FlipBookViewerProps {
  pages: string[]
  title?: string
  showWatermark?: boolean
  showControls?: boolean
  autoFlipSeconds?: number
  onPageChange?: (page: number) => void
  className?: string
  ownerName?: string | null
  pageAspectRatio?: number
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
  ownerName,
  pageAspectRatio: pageAspectRatioProp
}: FlipBookViewerProps) {
  const [detectedRatio, setDetectedRatio] = useState<number | null>(null)
  // Fallback to A4 portrait until we detect the real ratio from an image.
  const pageAspectRatio = pageAspectRatioProp ?? detectedRatio ?? 1 / 1.414
  // currentSpread tracks which two-page spread we're viewing
  // Spread 0 = cover only, Spread 1 = pages 1-2, etc.
  const [currentSpread, setCurrentSpread] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const [flipProgress, setFlipProgress] = useState(0)
  const [flipDirection, setFlipDirection] = useState<'next' | 'prev' | null>(
    null
  )
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set())
  const [failedImages, setFailedImages] = useState<Set<number>>(new Set())
  const [currentZoom, setCurrentZoom] = useState(1)
  const [baseWidth, setBaseWidth] = useState(0)

  // Refs
  const containerRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const retryCountRef = useRef<Map<number, number>>(new Map())
  const loadingImagesRef = useRef<Set<number>>(new Set())
  const currentZoomRef = useRef(1)
  const pendingDeltaRef = useRef(0)
  const rafScheduledRef = useRef(false)
  const anchorRef = useRef({ x: 0, y: 0 })
  const lastPinchEndedAtRef = useRef(0)
  const MAX_RETRIES = 2

  const [transitionEnabled, setTransitionEnabled] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [chromeVisible, setChromeVisible] = useState(true)
  const toggleChrome = useCallback(() => setChromeVisible((v) => !v), [])
  const showChromeBriefly = useCallback(() => setChromeVisible(true), [])
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  // Mobile-detect is only used for CHROME (footer/header) adaptations —
  // layout stays as a two-page spread on every screen so the flip-book
  // feel is preserved. Small screens just scale the whole spread down.
  useEffect(() => {
    if (typeof window === 'undefined') return
    const compute = () => {
      const shortestSide = Math.min(window.innerWidth, window.innerHeight)
      setIsMobile(shortestSide <= 500)
    }
    compute()
    window.addEventListener('resize', compute)
    window.addEventListener('orientationchange', compute)
    return () => {
      window.removeEventListener('resize', compute)
      window.removeEventListener('orientationchange', compute)
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setPrefersReducedMotion(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  const totalPages = pages.length

  // Always two-page spread — the book-flip experience is the product.
  const pagesPerSpread: number = 2
  const totalSpreads = 1 + Math.ceil((totalPages - 1) / 2)

  // Clamp currentSpread if layout changes (e.g. rotate, single-page toggle).
  // Uses the "adjusting state while rendering" pattern so we avoid the
  // set-state-in-effect anti-pattern.
  // See https://react.dev/reference/react/useState#storing-information-from-previous-renders
  const [prevTotalSpreads, setPrevTotalSpreads] = useState(totalSpreads)
  if (totalSpreads !== prevTotalSpreads) {
    setPrevTotalSpreads(totalSpreads)
    if (currentSpread > totalSpreads - 1) {
      setCurrentSpread(Math.max(0, totalSpreads - 1))
    }
  }

  // Auto-hide chrome after 3s of inactivity on mobile
  useEffect(() => {
    if (!isMobile || !chromeVisible) return
    const timer = setTimeout(() => setChromeVisible(false), 3000)
    return () => clearTimeout(timer)
  }, [isMobile, chromeVisible, currentSpread])

  const isCoverSpread = pagesPerSpread === 2 && currentSpread === 0

  const leftPageIndex =
    pagesPerSpread === 1 ? -1 : isCoverSpread ? -1 : (currentSpread - 1) * 2 + 1
  const rightPageIndex =
    pagesPerSpread === 1
      ? currentSpread
      : isCoverSpread
        ? 0
        : (currentSpread - 1) * 2 + 2
  const hasLeftPage = leftPageIndex >= 0 && leftPageIndex < totalPages
  const hasRightPage = rightPageIndex < totalPages

  // Measure base width via ResizeObserver. Skip while zoomed to avoid
  // feedback loops; on return to 1x the next observer tick refreshes it.
  useEffect(() => {
    const container = scrollContainerRef.current
    const inner = containerRef.current
    if (!container || !inner) return

    const measure = () => {
      if (currentZoomRef.current <= 1) {
        const w = inner.offsetWidth
        if (w > 0) setBaseWidth(w)
      }
    }

    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(container)
    return () => ro.disconnect()
  }, [])

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

    const timers: ReturnType<typeof setTimeout>[] = []
    const createdImages: HTMLImageElement[] = []
    const claimedIndices: number[] = []
    const loadingSet = loadingImagesRef.current
    let cancelled = false

    pagesToPreload.forEach((pageIndex) => {
      if (
        loadedImages.has(pageIndex) ||
        failedImages.has(pageIndex) ||
        loadingSet.has(pageIndex)
      ) return

      loadingSet.add(pageIndex)
      claimedIndices.push(pageIndex)
      const img = new Image()
      createdImages.push(img)

      const onLoad = () => {
        if (cancelled) return
        loadingSet.delete(pageIndex)
        if (!pageAspectRatioProp && img.naturalWidth > 0 && img.naturalHeight > 0) {
          setDetectedRatio((prev) => prev ?? img.naturalWidth / img.naturalHeight)
        }
        setLoadedImages((prev) => {
          if (prev.has(pageIndex)) return prev
          const next = new Set(prev)
          next.add(pageIndex)
          return next
        })
        retryCountRef.current.delete(pageIndex)
      }

      const onError = () => {
        if (cancelled) return
        const attempts = retryCountRef.current.get(pageIndex) ?? 0
        if (attempts < MAX_RETRIES) {
          retryCountRef.current.set(pageIndex, attempts + 1)
          const timerId = setTimeout(() => {
            if (cancelled) return
            const url = pages[pageIndex]
            if (!url) return
            const retryImg = new Image()
            createdImages.push(retryImg)
            retryImg.onload = onLoad
            retryImg.onerror = onError
            retryImg.src = `${url}${url.includes('?') ? '&' : '?'}retry=${attempts + 1}`
          }, 1000 * (attempts + 1))
          timers.push(timerId)
        } else {
          loadingSet.delete(pageIndex)
          setFailedImages((prev) => {
            if (prev.has(pageIndex)) return prev
            const next = new Set(prev)
            next.add(pageIndex)
            return next
          })
        }
      }

      img.onload = onLoad
      img.onerror = onError
      img.src = pages[pageIndex]
    })

    return () => {
      cancelled = true
      timers.forEach(clearTimeout)
      createdImages.forEach((img) => {
        img.onload = null
        img.onerror = null
      })
      // Release pending reservations so the next effect run (e.g. StrictMode
      // double-invocation) can re-issue the load. Pages already marked as
      // loaded/failed were removed by their handlers before cancel.
      claimedIndices.forEach((idx) => loadingSet.delete(idx))
    }
  }, [currentSpread, pages, totalPages, totalSpreads, loadedImages, failedImages, pageAspectRatioProp])

  // Zoom helpers
  const clampZoom = useCallback(
    (zoom: number) => Math.round(Math.min(Math.max(zoom, MIN_ZOOM), MAX_ZOOM) * 100) / 100,
    []
  )

  // Apply a new zoom level while keeping the anchor point (in viewport coords
  // of the scroll container) stable. animated=true enables a short CSS
  // transition for discrete actions; continuous input (wheel/pinch) passes false.
  const applyZoom = useCallback(
    (newZoom: number, anchorX: number, anchorY: number, animated = false) => {
      const container = scrollContainerRef.current
      if (!container) return
      const oldZoom = currentZoomRef.current
      const clamped = clampZoom(newZoom)
      if (clamped === oldZoom) return

      const contentX = container.scrollLeft + anchorX
      const contentY = container.scrollTop + anchorY
      const k = clamped / oldZoom

      currentZoomRef.current = clamped
      if (animated) setTransitionEnabled(true)
      setCurrentZoom(clamped)

      requestAnimationFrame(() => {
        container.scrollLeft = contentX * k - anchorX
        container.scrollTop = contentY * k - anchorY
      })
    },
    [clampZoom]
  )

  const getCenterAnchor = useCallback(() => {
    const container = scrollContainerRef.current
    return {
      x: (container?.clientWidth ?? 0) / 2,
      y: (container?.clientHeight ?? 0) / 2
    }
  }, [])

  const zoomIn = useCallback(() => {
    const anchor = getCenterAnchor()
    applyZoom(currentZoomRef.current + ZOOM_STEP, anchor.x, anchor.y, true)
  }, [applyZoom, getCenterAnchor])

  const zoomOut = useCallback(() => {
    const anchor = getCenterAnchor()
    applyZoom(currentZoomRef.current - ZOOM_STEP, anchor.x, anchor.y, true)
  }, [applyZoom, getCenterAnchor])

  const zoomReset = useCallback(() => {
    const container = scrollContainerRef.current
    currentZoomRef.current = 1
    setTransitionEnabled(true)
    setCurrentZoom(1)
    if (container) {
      requestAnimationFrame(() => {
        container.scrollLeft = 0
        container.scrollTop = 0
      })
    }
  }, [])

  // Double-click to toggle zoom, anchored to click point
  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      showChromeBriefly()
      const container = scrollContainerRef.current
      if (!container) return
      const rect = container.getBoundingClientRect()
      const anchorX = e.clientX - rect.left
      const anchorY = e.clientY - rect.top
      const target = currentZoomRef.current > 1 ? 1 : 2
      applyZoom(target, anchorX, anchorY, true)
    },
    [applyZoom, showChromeBriefly]
  )

  const goToSpread = useCallback(
    (direction: 'next' | 'prev') => {
      showChromeBriefly()
      if (isAnimating) return
      if (direction === 'next' && currentSpread >= totalSpreads - 1) return
      if (direction === 'prev' && currentSpread <= 0) return

      // Reset zoom & scroll before flipping
      currentZoomRef.current = 1
      setCurrentZoom(1)
      const container = scrollContainerRef.current
      if (container) {
        container.scrollLeft = 0
        container.scrollTop = 0
      }

      setIsAnimating(true)
      setFlipDirection(direction)

      // Shorter animation when the user prefers reduced motion, but still
      // keep the page-flip — it's the product's signature interaction.
      const duration = prefersReducedMotion ? 200 : FLIP_DURATION

      let start: number | null = null
      const animate = (timestamp: number) => {
        if (!start) start = timestamp
        const elapsed = timestamp - start
        const progress = Math.min(elapsed / duration, 1)
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

          const reportedPage =
            pagesPerSpread === 1
              ? newSpread
              : newSpread === 0
                ? 0
                : (newSpread - 1) * 2 + 1
          onPageChange?.(reportedPage)
        }
      }
      requestAnimationFrame(animate)
    },
    [isAnimating, currentSpread, totalSpreads, onPageChange, pagesPerSpread, prefersReducedMotion, showChromeBriefly]
  )

  const goToNext = useCallback(() => goToSpread('next'), [goToSpread])
  const goToPrev = useCallback(() => goToSpread('prev'), [goToSpread])

  const jumpToSpread = useCallback(
    (target: number) => {
      showChromeBriefly()
      if (isAnimating) return
      const clamped = Math.max(0, Math.min(totalSpreads - 1, target))
      if (clamped === currentSpread) return
      currentZoomRef.current = 1
      setCurrentZoom(1)
      setCurrentSpread(clamped)
      const reportedPage =
        pagesPerSpread === 1
          ? clamped
          : clamped === 0
            ? 0
            : (clamped - 1) * 2 + 1
      onPageChange?.(reportedPage)
    },
    [isAnimating, totalSpreads, currentSpread, onPageChange, pagesPerSpread, showChromeBriefly]
  )

  // Keyboard navigation. Skip when typing in inputs; only hijack Space if the
  // viewer is currently visible (so it doesn't break scroll on host pages).
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) return

      if (e.key === 'ArrowRight') {
        e.preventDefault()
        goToNext()
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        goToPrev()
      } else if (e.key === ' ') {
        const container = containerRef.current
        if (!container) return
        const rect = container.getBoundingClientRect()
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          e.preventDefault()
          goToNext()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [goToNext, goToPrev])

  // Auto flip — loop back to first spread when reaching the end
  useEffect(() => {
    if (autoFlipSeconds <= 0 || isAnimating) return
    const timer = setTimeout(() => {
      if (currentSpread < totalSpreads - 1) {
        goToNext()
      } else {
        setCurrentSpread(0)
        onPageChange?.(0)
      }
    }, autoFlipSeconds * 1000)
    return () => clearTimeout(timer)
  }, [autoFlipSeconds, currentSpread, totalSpreads, goToNext, isAnimating, onPageChange])

  // Wheel / trackpad zoom (Ctrl+scroll or pinch on trackpad).
  // Coalesce events per animation frame; exponential mapping keeps steps
  // perceptually uniform across zoom levels.
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const ZOOM_SENSITIVITY = 0.0015

    const handleWheel = (e: WheelEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return
      e.preventDefault()
      const rect = container.getBoundingClientRect()
      anchorRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      }
      pendingDeltaRef.current += e.deltaY
      if (rafScheduledRef.current) return
      rafScheduledRef.current = true
      requestAnimationFrame(() => {
        const factor = Math.exp(-pendingDeltaRef.current * ZOOM_SENSITIVITY)
        applyZoom(
          currentZoomRef.current * factor,
          anchorRef.current.x,
          anchorRef.current.y,
          false
        )
        pendingDeltaRef.current = 0
        rafScheduledRef.current = false
      })
    }

    container.addEventListener('wheel', handleWheel, { passive: false })
    return () => container.removeEventListener('wheel', handleWheel)
  }, [applyZoom])

  // Touch handling: swipe to navigate + pinch to zoom
  const touchStartX = useRef(0)
  const pinchStartDistance = useRef(0)
  const pinchStartZoom = useRef(1)
  const isPinching = useRef(false)

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      isPinching.current = true
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      pinchStartDistance.current = Math.hypot(dx, dy)
      pinchStartZoom.current = currentZoomRef.current
    } else if (e.touches.length === 1) {
      isPinching.current = false
      touchStartX.current = e.touches[0].clientX
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length !== 2) return
    const container = scrollContainerRef.current
    if (!container) return
    const rect = container.getBoundingClientRect()
    const dx = e.touches[0].clientX - e.touches[1].clientX
    const dy = e.touches[0].clientY - e.touches[1].clientY
    const distance = Math.hypot(dx, dy)
    if (pinchStartDistance.current <= 0) return
    const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left
    const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top
    const scale = distance / pinchStartDistance.current
    applyZoom(pinchStartZoom.current * scale, midX, midY, false)
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (isPinching.current) {
      isPinching.current = false
      lastPinchEndedAtRef.current = Date.now()
      return
    }
    // Suppress swipe for 150ms after a pinch ends to avoid accidental flips
    if (Date.now() - lastPinchEndedAtRef.current < 150) return
    if (currentZoomRef.current > 1) return
    const touchEndX = e.changedTouches[0].clientX
    const diff = touchStartX.current - touchEndX

    if (Math.abs(diff) > 50) {
      if (diff > 0) goToNext()
      else goToPrev()
    }
  }

  const isPageLoaded = (index: number) => loadedImages.has(index)
  const isPageFailed = (index: number) => failedImages.has(index)

  const retryPage = useCallback((pageIndex: number) => {
    setFailedImages((prev) => {
      const next = new Set(prev)
      next.delete(pageIndex)
      return next
    })
    retryCountRef.current.delete(pageIndex)
    loadingImagesRef.current.delete(pageIndex)
  }, [])

  const renderFailedPage = (pageIndex: number) => (
    <div className='w-full h-full flex flex-col items-center justify-center bg-gray-100 gap-2'>
      <svg className='w-8 h-8 text-gray-400' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
      </svg>
      <button onClick={() => retryPage(pageIndex)} className='text-xs text-[#16a34a] hover:underline'>
        Reintentar
      </button>
    </div>
  )

  const renderSpinner = () => (
    <div className='w-full h-full flex items-center justify-center bg-gray-100'>
      <div className='w-8 h-8 border-2 border-gray-300 border-t-[#16a34a] rounded-full animate-spin' />
    </div>
  )

  const spreadToLeftIndex = (s: number) => {
    if (pagesPerSpread === 1) return -1
    if (s <= 0) return -1
    return (s - 1) * 2 + 1
  }
  const spreadToRightIndex = (s: number) => {
    if (pagesPerSpread === 1) return s
    if (s === 0) return 0
    return (s - 1) * 2 + 2
  }

  const nextSpread = currentSpread + 1
  const prevSpread = currentSpread - 1
  const nextSpreadLeftIndex = spreadToLeftIndex(nextSpread)
  const nextSpreadRightIndex = spreadToRightIndex(nextSpread)
  const prevSpreadLeftIndex = spreadToLeftIndex(prevSpread)
  const prevSpreadRightIndex = spreadToRightIndex(prevSpread)

  // Spread ratio = two pages side by side when open (or one page on mobile).
  // Cover keeps the same container ratio so the layout doesn't jump when the
  // book opens.
  const spreadAspectRatio = pageAspectRatio * pagesPerSpread

  const isZoomed = currentZoom > 1

  const bookInner = (
    <div
      className='relative w-full h-full'
      style={{ perspective: '2000px' }}
    >
      {/* Pages container - two page spread */}
      <div
        className='absolute inset-0 flex'
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Left page container — only in two-page mode when not on cover */}
        {pagesPerSpread === 2 && !isCoverSpread && (
          <div
            className='relative w-1/2 h-full'
            style={{ transformStyle: 'preserve-3d' }}
          >
            {flipDirection === 'prev' &&
              prevSpreadLeftIndex >= 0 &&
              prevSpreadLeftIndex < totalPages && (
                <div className='absolute inset-0 bg-transparent overflow-hidden'>
                  {isPageLoaded(prevSpreadLeftIndex) ? (
                    <NextImage
                      src={pages[prevSpreadLeftIndex]}
                      alt={`Page ${prevSpreadLeftIndex + 1}`}
                      fill
                      sizes='50vw'
                      unoptimized
                      className='object-contain'
                      draggable={false}
                    />
                  ) : isPageFailed(prevSpreadLeftIndex) ? (
                    renderFailedPage(prevSpreadLeftIndex)
                  ) : (
                    renderSpinner()
                  )}
                </div>
              )}

            {flipDirection === 'prev' && prevSpread === 0 && (
              <div className='absolute inset-0 bg-transparent overflow-hidden'>
                <div className='w-full h-full bg-transparent' />
              </div>
            )}

            {flipDirection !== 'prev' && (
              <div className='absolute inset-0 bg-transparent overflow-hidden'>
                {hasLeftPage && isPageLoaded(leftPageIndex) ? (
                  <NextImage
                    src={pages[leftPageIndex]}
                    alt={`Page ${leftPageIndex + 1}`}
                    fill
                    sizes='50vw'
                    unoptimized
                    className='object-contain'
                    draggable={false}
                  />
                ) : hasLeftPage && isPageFailed(leftPageIndex) ? (
                  renderFailedPage(leftPageIndex)
                ) : hasLeftPage ? (
                  renderSpinner()
                ) : (
                  <div className='w-full h-full bg-transparent' />
                )}
              </div>
            )}

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

        {/* Right page container */}
        <div
          className={`relative h-full ${pagesPerSpread === 1 || isCoverSpread ? 'w-full' : 'w-1/2'}`}
          style={{ transformStyle: 'preserve-3d' }}
        >
          {flipDirection === 'next' &&
            nextSpreadRightIndex < totalPages && (
              <div className='absolute inset-0 bg-transparent overflow-hidden'>
                {isPageLoaded(nextSpreadRightIndex) ? (
                  <NextImage
                    src={pages[nextSpreadRightIndex]}
                    alt={`Page ${nextSpreadRightIndex + 1}`}
                    fill
                    sizes='50vw'
                    unoptimized
                    className='object-contain'
                    draggable={false}
                  />
                ) : isPageFailed(nextSpreadRightIndex) ? (
                  renderFailedPage(nextSpreadRightIndex)
                ) : (
                  renderSpinner()
                )}
              </div>
            )}

          {flipDirection !== 'next' && (
            <div
              className={`${isCoverSpread ? 'relative w-1/2 h-full' : 'absolute inset-0'} bg-transparent overflow-hidden`}
            >
              {hasRightPage && isPageLoaded(rightPageIndex) ? (
                <NextImage
                  src={pages[rightPageIndex]}
                  alt={`Page ${rightPageIndex + 1}`}
                  fill
                  sizes='50vw'
                  unoptimized
                  className='object-contain'
                  draggable={false}
                />
              ) : hasRightPage && isPageFailed(rightPageIndex) ? (
                renderFailedPage(rightPageIndex)
              ) : hasRightPage ? (
                renderSpinner()
              ) : (
                <div className='w-full h-full bg-transparent' />
              )}
            </div>
          )}

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

      {/* Navigation hints — hidden on mobile (TapZones overlay intercepts
          touches on these areas). */}
      {!isMobile && currentSpread > 0 && (
        <button
          type='button'
          onClick={goToPrev}
          aria-label='Previous spread'
          className='absolute left-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors'
        >
          <svg className='w-8 h-8' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 19l-7-7 7-7' />
          </svg>
        </button>
      )}
      {!isMobile && currentSpread < totalSpreads - 1 && (
        <button
          type='button'
          onClick={goToNext}
          aria-label='Next spread'
          className='absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors'
        >
          <svg className='w-8 h-8' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 5l7 7-7 7' />
          </svg>
        </button>
      )}
    </div>
  )

  return (
    <div
      className={`relative w-full h-full flex flex-col ${className}`}
    >
      {/* Title & Owner — hidden on mobile (page header already shows branding) */}
      {(title || ownerName) && !isMobile && (
        <div
          className={`text-center py-2 shrink-0 transition-opacity duration-300 ${chromeVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        >
          {title && (
            <h1 className='text-xl font-medium text-white leading-tight'>
              {title}
            </h1>
          )}
          {ownerName && (
            <div className='flex items-center justify-center gap-1.5'>
              <div className='w-4 h-4 rounded-full bg-linear-to-br from-[#166534] to-[#14532d] flex items-center justify-center text-white text-[9px] font-semibold shrink-0'>
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
          className={`flex items-center justify-center h-full ${isMobile ? 'p-0' : 'p-4'}`}
          style={{
            minHeight: '100%',
            minWidth: isZoomed ? 'fit-content' : '100%'
          }}
        >
          {isZoomed && baseWidth > 0 ? (
            <div
              style={{
                width: baseWidth * currentZoom,
                height: (baseWidth / spreadAspectRatio) * currentZoom,
                position: 'relative'
              }}
            >
              <div
                ref={containerRef}
                className='select-none absolute top-0 left-0'
                style={{
                  width: baseWidth,
                  aspectRatio: `${spreadAspectRatio} / 1`,
                  transform: `scale(${currentZoom})`,
                  transformOrigin: '0 0',
                  transition: transitionEnabled ? 'transform 0.2s ease' : 'none',
                  willChange: 'transform',
                  backfaceVisibility: 'hidden'
                }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onDoubleClick={handleDoubleClick}
                onTransitionEnd={() => setTransitionEnabled(false)}
              >
                {bookInner}
              </div>
            </div>
          ) : (
            <div
              ref={containerRef}
              className='relative select-none'
              style={{
                aspectRatio: `${spreadAspectRatio} / 1`,
                width: '100%',
                maxHeight: '100%',
                margin: 'auto'
              }}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onDoubleClick={handleDoubleClick}
            >
              <div className='relative w-full h-full'>
                {bookInner}
                <TapZones
                  onPrev={goToPrev}
                  onNext={goToNext}
                  onToggleChrome={toggleChrome}
                  enabled={!isZoomed}
                  isMobile={isMobile}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      {showControls && (
        <div
          className={`transition-opacity duration-300 ${chromeVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        >
          <FlipControls
            currentSpread={currentSpread}
            totalPages={totalPages}
            totalSpreads={totalSpreads}
            pagesPerSpread={pagesPerSpread}
            isMobile={isMobile}
            onPrev={goToPrev}
            onNext={goToNext}
            onJumpToSpread={jumpToSpread}
            onDragActivity={showChromeBriefly}
            isAnimating={isAnimating}
            onZoomIn={zoomIn}
            onZoomOut={zoomOut}
            onZoomReset={zoomReset}
            currentZoom={currentZoom}
          />
        </div>
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
