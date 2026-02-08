'use client'

import { useEffect, useRef } from 'react'
import { FlipBookViewer } from '@/components/flipbook/FlipBookViewer'

interface FlipBookViewerWrapperProps {
  bookId: string
  pages: string[]
  title: string
  showWatermark: boolean
  autoFlipSeconds: number
}

export function FlipBookViewerWrapper({
  bookId,
  pages,
  title,
  showWatermark,
  autoFlipSeconds
}: FlipBookViewerWrapperProps) {
  const analyticsIdRef = useRef<string | null>(null)
  const pagesViewedRef = useRef(new Set<number>())
  const maxPageRef = useRef(0)
  const startTimeRef = useRef(Date.now())

  // Track page views
  const handlePageChange = (page: number) => {
    pagesViewedRef.current.add(page)
    if (page > maxPageRef.current) {
      maxPageRef.current = page
    }
  }

  // Register visit on mount
  useEffect(() => {
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
      if (!analyticsIdRef.current) return

      const timeSpent = Math.floor((Date.now() - startTimeRef.current) / 1000)
      const pagesViewed = pagesViewedRef.current.size

      // Use sendBeacon for reliable delivery on page close
      const data = JSON.stringify({
        id: analyticsIdRef.current,
        pages_viewed: pagesViewed,
        max_page_reached: maxPageRef.current + 1,
        time_spent_seconds: timeSpent
      })

      navigator.sendBeacon('/api/analytics', data)
    }

    // Update every 30 seconds
    const interval = setInterval(updateAnalytics, 30000)

    // Update on page close
    window.addEventListener('beforeunload', updateAnalytics)
    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        updateAnalytics()
      }
    })

    return () => {
      clearInterval(interval)
      window.removeEventListener('beforeunload', updateAnalytics)
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
    />
  )
}
