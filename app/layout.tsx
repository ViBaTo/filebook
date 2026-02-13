import type { Metadata } from 'next'
import { Instrument_Serif } from 'next/font/google'
import './globals.css'

const instrumentSerif = Instrument_Serif({
  variable: '--font-instrument-serif',
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  display: 'swap'
})

export const metadata: Metadata = {
  title: 'FlipBook by VIBATO — Tus documentos, convertidos en experiencias',
  description:
    'Convierte tus PDFs en flipbooks interactivos con efecto de pasar páginas. Perfecto para catálogos, portfolios, revistas y presentaciones.',
  keywords: [
    'flipbook',
    'pdf',
    'catálogo interactivo',
    'portfolio digital',
    'publicación digital',
    'embed'
  ],
  openGraph: {
    title: 'FlipBook by VIBATO — Tus documentos, convertidos en experiencias',
    description:
      'Convierte tus PDFs en flipbooks interactivos con efecto de pasar páginas.',
    type: 'website'
  }
}

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang='es'>
      <body className={`${instrumentSerif.variable} antialiased`}>
        {children}
      </body>
    </html>
  )
}
