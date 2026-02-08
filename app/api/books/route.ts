import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, slug, pdf_url, pdf_filename, pdf_size_bytes, user_id } = body

    if (!slug || !pdf_url) {
      return NextResponse.json(
        { error: 'Missing required fields: slug and pdf_url' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Check if user is authenticated
    const {
      data: { user }
    } = await supabase.auth.getUser()
    const isAnonymous = !user && !user_id

    const bookData = {
      slug,
      pdf_url,
      pdf_filename: pdf_filename || null,
      pdf_size_bytes: pdf_size_bytes || null,
      title: title || 'Sin título',
      user_id: user?.id || user_id || null,
      is_anonymous: isAnonymous,
      status: 'uploading',
      expires_at: isAnonymous
        ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        : null
    }

    const { data: book, error } = await supabase
      .from('fb_books')
      .insert(bookData)
      .select()
      .single()

    if (error) {
      console.error('Error creating book:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(book, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/books:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user }
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: books, error } = await supabase
      .from('fb_books')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(books)
  } catch (error) {
    console.error('Error in GET /api/books:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
