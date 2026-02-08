import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin']
})

export const metadata: Metadata = {
  title: 'FlipBook - Create Interactive PDF FlipBooks',
  description:
    'Convert your PDF into an interactive 3D flipbook in seconds. Share anywhere with a simple link.',
  keywords: ['flipbook', 'pdf', 'interactive', 'digital publishing', 'embed'],
  openGraph: {
    title: 'FlipBook - Create Interactive PDF FlipBooks',
    description: 'Convert your PDF into an interactive 3D flipbook in seconds.',
    type: 'website'
  }
}

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang='en'>
      <body className={`${inter.variable} antialiased`}>{children}</body>
    </html>
  )
}
