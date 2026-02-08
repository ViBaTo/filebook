import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { EmbedViewerWrapper } from './EmbedViewerWrapper'
import type { Metadata } from 'next'

interface PageProps {
  params: Promise<{ slug: string }>
}

async function getBook(slug: string) {
  const supabase = await createClient()

  const { data: book, error } = await supabase
    .from('fb_books')
    .select('*')
    .eq('slug', slug)
    .eq('is_public', true)
    .eq('status', 'ready')
    .single()

  if (error || !book) {
    return null
  }

  return book
}

export async function generateMetadata({
  params
}: PageProps): Promise<Metadata> {
  const { slug } = await params
  const book = await getBook(slug)

  if (!book) {
    return {
      title: 'FlipBook not found'
    }
  }

  return {
    title: `${book.title} | FlipBook`,
    robots: 'noindex' // Don't index embed pages
  }
}

export default async function EmbedPage({ params }: PageProps) {
  const { slug } = await params
  const book = await getBook(slug)

  if (!book) {
    notFound()
  }

  const pagesUrls = (book.pages_urls as string[]) || []

  return (
    <div className='h-screen w-screen bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] overflow-hidden'>
      <EmbedViewerWrapper
        bookId={book.id}
        pages={pagesUrls}
        title={book.title}
        showWatermark={book.is_anonymous}
        autoFlipSeconds={book.settings?.auto_flip_seconds || 0}
      />
    </div>
  )
}
