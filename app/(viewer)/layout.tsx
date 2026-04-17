import type { Viewport } from 'next'

// Viewer-scoped: disable user scaling so pinch/double-tap drive the
// custom zoom instead of the browser's native page zoom. Marketing and
// auth pages keep browser zoom for WCAG 1.4.4 compliance.
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  userScalable: false,
  themeColor: '#1C1917'
}

export default function ViewerLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return <>{children}</>
}
