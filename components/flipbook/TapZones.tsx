'use client'

import { useRef } from 'react'

interface TapZonesProps {
  onPrev: () => void
  onNext: () => void
  onToggleChrome: () => void
  enabled: boolean
}

// Overlay absoluto con tres zonas: 35% izq (prev), 30% centro (toggle),
// 35% der (next). Distingue tap de swipe/pinch comparando desplazamiento
// entre touchstart y touchend — si el dedo se movió > 10 px o hubo
// multitouch, no se activa.
export function TapZones({ onPrev, onNext, onToggleChrome, enabled }: TapZonesProps) {
  const startRef = useRef<{ x: number; y: number; touches: number } | null>(null)

  if (!enabled) return null

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

    const target = e.currentTarget as HTMLDivElement
    const rect = target.getBoundingClientRect()
    const xInZone = (t.clientX - rect.left) / rect.width

    if (xInZone < 0.35) onPrev()
    else if (xInZone > 0.65) onNext()
    else onToggleChrome()
  }

  return (
    <div
      className='absolute inset-0 z-30 sm:hidden'
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    />
  )
}
