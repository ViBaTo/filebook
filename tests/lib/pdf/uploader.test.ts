import { afterEach, describe, expect, it, vi } from 'vitest'
import { updateBookWithPages } from '@/lib/pdf/uploader'

describe('updateBookWithPages', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('usa la API process-complete para finalizar el procesamiento', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({})
    })

    vi.stubGlobal('fetch', fetchMock)

    await updateBookWithPages('book_123', ['https://cdn.test/page-001.webp'], 1)

    expect(fetchMock).toHaveBeenCalledWith('/api/books/book_123/process-complete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        pages_urls: ['https://cdn.test/page-001.webp'],
        page_count: 1
      })
    })
  })

  it('lanza un error util cuando la API no puede finalizar el libro', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      json: vi.fn().mockResolvedValue({ error: 'Book not found' })
    })

    vi.stubGlobal('fetch', fetchMock)

    await expect(updateBookWithPages('book_404', [], 0)).rejects.toThrow(
      'Failed to complete book: Book not found'
    )
  })
})
