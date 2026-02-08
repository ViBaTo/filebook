'use client'

import { useEffect, useRef } from 'react'
import { FlipBookViewer } from '@/components/flipbook/FlipBookViewer'

interface EmbedViewerWrapperProps {
  bookId: string
  pages: string[]
  title: string
  showWatermark: boolean
  autoFlipSeconds: number
}

export function EmbedViewerWrapper({
  bookId,
  pages,
  title,
  showWatermark,
  autoFlipSeconds
}: EmbedViewerWrapperProps) {
  const analyticsIdRef = useRef<string | null>(null)
  const pagesViewedRef = useRef(new Set<number>())
  const maxPageRef = useRef(0)
  const startTimeRef = useRef(Date.now())

  // Get embed domain from parent window
  const getEmbedDomain = () => {
    try {
      if (window.parent !== window) {
        return document.referrer
          ? new URL(document.referrer).hostname
          : undefined
      }
    } catch {
      return undefined
    }
    return undefined
  }

  // Track page views
  const handlePageChange = (page: number) => {
    pagesViewedRef.current.add(page)
    if (page > maxPageRef.current) {
      maxPageRef.current = page
    }

    // Notify parent window of page change
    try {
      window.parent.postMessage(
        {
          type: 'flipbook:pageChange',
          page: page + 1,
          totalPages: pages.length
        },
        '*'
      )
    } catch {
      // Ignore cross-origin errors
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
            is_embed: true,
            embed_domain: getEmbedDomain()
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

    // Notify parent that embed is ready
    try {
      window.parent.postMessage(
        {
          type: 'flipbook:ready',
          totalPages: pages.length,
          title
        },
        '*'
      )
    } catch {
      // Ignore cross-origin errors
    }
  }, [bookId, pages.length, title])

  // Update analytics on unmount or page close
  useEffect(() => {
    const updateAnalytics = () => {
      if (!analyticsIdRef.current) return

      const timeSpent = Math.floor((Date.now() - startTimeRef.current) / 1000)
      const pagesViewed = pagesViewedRef.current.size

      const data = JSON.stringify({
        id: analyticsIdRef.current,
        pages_viewed: pagesViewed,
        max_page_reached: maxPageRef.current + 1,
        time_spent_seconds: timeSpent
      })

      navigator.sendBeacon('/api/analytics', data)
    }

    const interval = setInterval(updateAnalytics, 30000)

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
      showWatermark={showWatermark}
      showControls={true}
      autoFlipSeconds={autoFlipSeconds}
      onPageChange={handlePageChange}
      className='h-full'
    />
  )
}
