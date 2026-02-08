import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const body = await request.json()
    const { pages_urls, page_count } = body

    if (!pages_urls || !Array.isArray(pages_urls) || pages_urls.length === 0) {
      return NextResponse.json(
        { error: 'Missing required field: pages_urls' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Get current user
    const {
      data: { user }
    } = await supabase.auth.getUser()

    // Check if the book exists
    const { data: existingBook, error: fetchError } = await supabase
      .from('fb_books')
      .select('user_id, is_anonymous, status')
      .eq('id', id)
      .single()

    if (fetchError || !existingBook) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 })
    }

    // Check authorization
    const isOwner = user && existingBook.user_id === user.id
    const isAnonymousBook = existingBook.is_anonymous && !existingBook.user_id

    if (!isOwner && !isAnonymousBook) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Update the book with processed pages
    const { data: book, error } = await supabase
      .from('fb_books')
      .update({
        pages_urls,
        page_count: page_count || pages_urls.length,
        status: 'ready'
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error completing processing:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(book)
  } catch (error) {
    console.error('Error in POST /api/books/[id]/process-complete:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
