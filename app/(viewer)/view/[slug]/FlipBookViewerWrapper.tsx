'use client'

import { useEffect, useRef } from 'react'
import { FlipBookViewer } from '@/components/flipbook/FlipBookViewer'

interface FlipBookViewerWrapperProps {
  bookId: string
  pages: string[]
  title: string
  showWatermark: boolean
  autoFlipSeconds: number
  ownerName?: string | null
}

export function FlipBookViewerWrapper({
  bookId,
  pages,
  title,
  showWatermark,
  autoFlipSeconds,
  ownerName
}: FlipBookViewerWrapperProps) {
  const analyticsIdRef = useRef<string | null>(null)
  const pagesViewedRef = useRef(new Set<number>())
  const maxPageRef = useRef(0)
  const startTimeRef = useRef<number | null>(null)

  // Track page views
  const handlePageChange = (page: number) => {
    pagesViewedRef.current.add(page)
    if (page > maxPageRef.current) {
      maxPageRef.current = page
    }
  }

  // Register visit on mount
  useEffect(() => {
    startTimeRef.current = Date.now()

    const registerVisit = async () => {
      try {
        const response = await fetch('/api/analytics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            book_id: bookId,
            is_embed: false
          })
        })

        if (response.ok) {
          const data = await response.json()
          analyticsIdRef.current = data.id
        }
      } catch (error) {
        console.error('Failed to register visit:', error)
      }
    }

    registerVisit()
    pagesViewedRef.current.add(0) // First page viewed
  }, [bookId])

  // Update analytics on unmount or page close
  useEffect(() => {
    const updateAnalytics = () => {
      const startTime = startTimeRef.current
      if (!analyticsIdRef.current || startTime === null) return

      const timeSpent = Math.floor((Date.now() - startTime) / 1000)
      const pagesViewed = pagesViewedRef.current.size

      const data = JSON.stringify({
        id: analyticsIdRef.current,
        pages_viewed: pagesViewed,
        max_page_reached: maxPageRef.current + 1,
        time_spent_seconds: timeSpent
      })

      navigator.sendBeacon('/api/analytics', data)
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        updateAnalytics()
      }
    }

    const interval = setInterval(updateAnalytics, 30000)
    window.addEventListener('beforeunload', updateAnalytics)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      clearInterval(interval)
      window.removeEventListener('beforeunload', updateAnalytics)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      updateAnalytics()
    }
  }, [])

  return (
    <FlipBookViewer
      pages={pages}
      title={title}
      showWatermark={showWatermark}
      showControls={true}
      autoFlipSeconds={autoFlipSeconds}
      onPageChange={handlePageChange}
      ownerName={ownerName}
    />
  )
}
