'use client'

import { useRef, useEffect } from 'react'

interface TapZonesProps {
  onPrev: () => void
  onNext: () => void
  onToggleChrome: () => void
  enabled: boolean
  isMobile: boolean
}

// Overlay absoluto con tres zonas: 35% izq (prev), 30% centro (toggle),
// 35% der (next). Distingue tap de swipe/pinch comparando desplazamiento
// entre touchstart y touchend — si el dedo se movió > 10 px o hubo
// multitouch, no se activa.
//
// Double-tap suppression: defer the single-tap action for ~280 ms. If a
// second tap arrives in that window the first timer is cancelled so
// onDoubleClick (zoom toggle in the container below) owns the gesture.
export function TapZones({
  onPrev,
  onNext,
  onToggleChrome,
  enabled,
  isMobile
}: TapZonesProps) {
  const startRef = useRef<{ x: number; y: number; touches: number } | null>(null)
  const pendingTapRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Flush pending tap on unmount so it doesn't fire on a stale component.
  useEffect(() => {
    return () => {
      if (pendingTapRef.current) {
        clearTimeout(pendingTapRef.current)
        pendingTapRef.current = null
      }
    }
  }, [])

  if (!enabled || !isMobile) return null

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) {
      startRef.current = { x: 0, y: 0, touches: e.touches.length }
      return
    }
    startRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      touches: 1
    }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    const start = startRef.current
    startRef.current = null
    if (!start || start.touches !== 1) return

    const t = e.changedTouches[0]
    const dx = t.clientX - start.x
    const dy = t.clientY - start.y
    if (Math.hypot(dx, dy) > 10) return

    // Second tap inside double-tap window → cancel the pending first tap;
    // the container's onDoubleClick will handle the zoom toggle.
    if (pendingTapRef.current) {
      clearTimeout(pendingTapRef.current)
      pendingTapRef.current = null
      return
    }

    const target = e.currentTarget as HTMLDivElement
    const rect = target.getBoundingClientRect()
    const xInZone = (t.clientX - rect.left) / rect.width

    pendingTapRef.current = setTimeout(() => {
      pendingTapRef.current = null
      if (xInZone < 0.35) onPrev()
      else if (xInZone > 0.65) onNext()
      else onToggleChrome()
    }, 280)
  }

  return (
    <div
      className='absolute inset-0 z-30'
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    />
  )
}
