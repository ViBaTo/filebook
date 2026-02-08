import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data: book, error } = await supabase
      .from('fb_books')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 })
    }

    return NextResponse.json(book)
  } catch (error) {
    console.error('Error in GET /api/books/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const body = await request.json()
    const supabase = await createClient()

    // Get current user
    const {
      data: { user }
    } = await supabase.auth.getUser()

    // First check if the book exists and user has access
    const { data: existingBook, error: fetchError } = await supabase
      .from('fb_books')
      .select('user_id, is_anonymous')
      .eq('id', id)
      .single()

    if (fetchError || !existingBook) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 })
    }

    // Check authorization: either owner or anonymous book
    const isOwner = user && existingBook.user_id === user.id
    const isAnonymousBook = existingBook.is_anonymous && !existingBook.user_id

    if (!isOwner && !isAnonymousBook) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Extract only allowed fields to update
    const allowedFields = [
      'title',
      'description',
      'settings',
      'is_public',
      'status',
      'pages_urls',
      'page_count',
      'error_message'
    ]
    const updateData: Record<string, unknown> = {}

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      )
    }

    const { data: book, error } = await supabase
      .from('fb_books')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating book:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(book)
  } catch (error) {
    console.error('Error in PATCH /api/books/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Get current user
    const {
      data: { user }
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Delete the book (RLS will ensure only owner can delete)
    const { error } = await supabase
      .from('fb_books')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error deleting book:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/books/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
