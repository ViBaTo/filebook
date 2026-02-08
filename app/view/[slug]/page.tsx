import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { FlipBookViewerWrapper } from './FlipBookViewerWrapper'
import { ShareButton } from './ShareButton'
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

  const firstPageUrl = book.pages_urls?.[0] || ''

  return {
    title: `${book.title} | FlipBook`,
    description:
      book.description || `View ${book.title} - an interactive flipbook`,
    openGraph: {
      title: book.title,
      description:
        book.description || `View ${book.title} - an interactive flipbook`,
      images: firstPageUrl ? [{ url: firstPageUrl }] : []
    },
    twitter: {
      card: 'summary_large_image',
      title: book.title,
      description:
        book.description || `View ${book.title} - an interactive flipbook`,
      images: firstPageUrl ? [firstPageUrl] : []
    }
  }
}

export default async function ViewPage({ params }: PageProps) {
  const { slug } = await params
  const book = await getBook(slug)

  if (!book) {
    notFound()
  }

  const pagesUrls = (book.pages_urls as string[]) || []

  return (
    <div className='min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460]'>
      {/* Header */}
      <header className='absolute top-0 left-0 right-0 z-50 p-4 flex items-center justify-between'>
        <div className='flex items-center gap-3'>
          <a
            href='/'
            className='text-white/70 hover:text-white transition-colors'
          >
            <svg className='w-8 h-8' viewBox='0 0 24 24' fill='currentColor'>
              <path
                d='M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5'
                stroke='currentColor'
                strokeWidth='2'
                fill='none'
              />
            </svg>
          </a>
        </div>

        <div className='flex items-center gap-2'>
          <ShareButton slug={slug} title={book.title} />
        </div>
      </header>

      {/* Main viewer */}
      <main className='h-screen pt-16 pb-4'>
        <FlipBookViewerWrapper
          bookId={book.id}
          pages={pagesUrls}
          title={book.title}
          showWatermark={book.is_anonymous}
          autoFlipSeconds={book.settings?.auto_flip_seconds || 0}
        />
      </main>
    </div>
  )
}
