'use client'

import { useRef, useState } from 'react'

interface ProgressScrubberProps {
  currentSpread: number
  totalSpreads: number
  totalPages: number
  onJumpToSpread: (target: number) => void
}

// Barra horizontal con handle. Tap → salta a esa página. Drag con pointer
// events (unifica mouse + touch). El label muestra el número de página en
// vivo mientras se arrastra (más intuitivo que "spread" para el lector).
export function ProgressScrubber({
  currentSpread,
  totalSpreads,
  totalPages,
  onJumpToSpread
}: ProgressScrubberProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [dragSpread, setDragSpread] = useState<number | null>(null)

  const spreadFromClientX = (clientX: number) => {
    const track = trackRef.current
    if (!track) return currentSpread
    const rect = track.getBoundingClientRect()
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    return Math.round(pct * (totalSpreads - 1))
  }

  const handlePointerDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    const s = spreadFromClientX(e.clientX)
    setDragSpread(s)
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (dragSpread === null) return
    setDragSpread(spreadFromClientX(e.clientX))
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    if (dragSpread !== null) {
      onJumpToSpread(dragSpread)
      setDragSpread(null)
    }
    e.currentTarget.releasePointerCapture(e.pointerId)
  }

  const displaySpread = dragSpread ?? currentSpread
  const pct =
    totalSpreads > 1 ? (displaySpread / (totalSpreads - 1)) * 100 : 0

  // Convert spread index to a page label. Spread 0 is the cover (page 1);
  // subsequent spreads hold pages (N*2, N*2+1) clamped to totalPages.
  const pageLabel = (() => {
    if (displaySpread === 0) return '1'
    const left = (displaySpread - 1) * 2 + 2
    const right = left + 1
    if (right > totalPages) return String(Math.min(left, totalPages))
    return `${left}–${right}`
  })()

  return (
    <div className='flex items-center gap-3 flex-1 min-w-0'>
      <span className='text-xs text-white/70 tabular-nums shrink-0'>
        {pageLabel}
      </span>
      <div
        ref={trackRef}
        className='relative flex-1 h-8 flex items-center cursor-pointer touch-none'
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <div className='absolute inset-x-0 h-1 bg-white/20 rounded-full' />
        <div
          className='absolute h-1 bg-[#16a34a] rounded-full'
          style={{ left: 0, width: `${pct}%` }}
        />
        <div
          className='absolute w-4 h-4 bg-white rounded-full shadow -translate-x-1/2'
          style={{ left: `${pct}%` }}
        />
      </div>
      <span className='text-xs text-white/70 tabular-nums shrink-0'>
        {totalPages}
      </span>
    </div>
  )
}
