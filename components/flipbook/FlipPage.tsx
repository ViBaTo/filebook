'use client'

interface FlipPageProps {
  direction: 'next' | 'prev'
  progress: number // 0 to 1
  frontImage?: string
  backImage?: string
  isLoaded: boolean
}

export function FlipPage({
  direction,
  progress,
  frontImage,
  backImage,
  isLoaded
}: FlipPageProps) {
  // For 'next': flip from right to left (0 to -180)
  // For 'prev': flip from left to right (0 to 180)
  const angle = direction === 'next' ? -180 * progress : 180 * progress

  // Determine which side is visible
  const showFront = direction === 'next' ? angle > -90 : angle < 90

  // Dynamic shadow based on flip progress (peaks at middle of flip)
  const shadowIntensity = Math.sin(progress * Math.PI) * 0.4

  // Transform origin: 'next' flips from left edge, 'prev' flips from right edge
  const transformOrigin = direction === 'next' ? 'left center' : 'right center'

  // Rounding classes based on direction
  const frontRounding = direction === 'next' ? 'rounded-r-md' : 'rounded-l-md'
  const backRounding = direction === 'next' ? 'rounded-l-md' : 'rounded-r-md'

  // Shadow gradient direction
  const frontShadowGradient =
    direction === 'next'
      ? `linear-gradient(to left, rgba(0,0,0,${shadowIntensity * 0.3}) 0%, transparent 50%)`
      : `linear-gradient(to right, rgba(0,0,0,${shadowIntensity * 0.3}) 0%, transparent 50%)`
  const backShadowGradient =
    direction === 'next'
      ? `linear-gradient(to right, rgba(0,0,0,${shadowIntensity * 0.3}) 0%, transparent 50%)`
      : `linear-gradient(to left, rgba(0,0,0,${shadowIntensity * 0.3}) 0%, transparent 50%)`

  // Page edge position
  const edgePosition = direction === 'next' ? 'right-0' : 'left-0'

  return (
    <div
      className='absolute inset-0'
      style={{
        transformStyle: 'preserve-3d',
        transformOrigin,
        transform: `rotateY(${angle}deg)`,
        zIndex: 40
      }}
    >
      {/* Front face - current page content */}
      <div
        className={`absolute inset-0 ${frontRounding} overflow-hidden bg-[#fefefe]`}
        style={{
          backfaceVisibility: 'hidden'
        }}
      >
        {isLoaded && frontImage ? (
          <img
            src={frontImage}
            alt='Page front'
            className='w-full h-full object-contain'
            draggable={false}
          />
        ) : (
          <div className='w-full h-full flex items-center justify-center bg-gray-100'>
            <div className='w-8 h-8 border-2 border-gray-300 border-t-[#e94560] rounded-full animate-spin' />
          </div>
        )}
        {/* Shadow overlay on front face */}
        {showFront && (
          <div
            className='absolute inset-0 pointer-events-none'
            style={{ background: frontShadowGradient }}
          />
        )}
      </div>

      {/* Back face - other page content */}
      <div
        className={`absolute inset-0 ${backRounding} overflow-hidden bg-[#fefefe]`}
        style={{
          backfaceVisibility: 'hidden',
          transform: 'rotateY(180deg)'
        }}
      >
        {backImage ? (
          <img
            src={backImage}
            alt='Page back'
            className='w-full h-full object-contain'
            draggable={false}
          />
        ) : (
          <div className='w-full h-full bg-[#fefefe]' />
        )}
        {/* Shadow overlay on back face */}
        {!showFront && (
          <div
            className='absolute inset-0 pointer-events-none'
            style={{ background: backShadowGradient }}
          />
        )}
      </div>

      {/* Page edge thickness effect */}
      <div
        className={`absolute ${edgePosition} top-0 bottom-0 w-[3px]`}
        style={{
          background: 'linear-gradient(to right, #d0d0d0, #e8e8e8)',
          transform: 'translateZ(-1px)'
        }}
      />
    </div>
  )
}
