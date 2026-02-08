'use client'

import { createClient } from '@/lib/supabase/client'
import type { RenderedPage } from './renderer'

export interface UploadProgress {
  currentPage: number
  totalPages: number
  status: 'uploading' | 'complete' | 'error'
  error?: string
}

export async function uploadRenderedPages(
  bookId: string,
  pages: RenderedPage[],
  onProgress?: (progress: UploadProgress) => void
): Promise<string[]> {
  const supabase = createClient()
  const urls: string[] = []

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i]
    const pageNumber = String(page.pageNumber).padStart(3, '0')
    const filePath = `${bookId}/page-${pageNumber}.webp`

    onProgress?.({
      currentPage: i + 1,
      totalPages: pages.length,
      status: 'uploading'
    })

    const { error } = await supabase.storage
      .from('flipbook-pages')
      .upload(filePath, page.blob, {
        cacheControl: '31536000', // 1 year cache
        contentType: 'image/webp',
        upsert: true
      })

    if (error) {
      onProgress?.({
        currentPage: i + 1,
        totalPages: pages.length,
        status: 'error',
        error: error.message
      })
      throw new Error(`Failed to upload page ${i + 1}: ${error.message}`)
    }

    // Get public URL
    const { data } = supabase.storage
      .from('flipbook-pages')
      .getPublicUrl(filePath)

    urls.push(data.publicUrl)
  }

  onProgress?.({
    currentPage: pages.length,
    totalPages: pages.length,
    status: 'complete'
  })

  return urls
}

export async function updateBookWithPages(
  bookId: string,
  pagesUrls: string[],
  pageCount: number
): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('fb_books')
    .update({
      pages_urls: pagesUrls,
      page_count: pageCount,
      status: 'ready'
    })
    .eq('id', bookId)

  if (error) {
    throw new Error(`Failed to update book: ${error.message}`)
  }
}

export async function markBookAsError(
  bookId: string,
  errorMessage: string
): Promise<void> {
  const supabase = createClient()

  await supabase
    .from('fb_books')
    .update({
      status: 'error',
      error_message: errorMessage
    })
    .eq('id', bookId)
}
