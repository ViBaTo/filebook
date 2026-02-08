import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
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

    // Check if user owns this book
    const { data: book, error: bookError } = await supabase
      .from('fb_books')
      .select('user_id')
      .eq('id', id)
      .single()

    if (bookError || !book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 })
    }

    if (book.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Get analytics data
    const { data: analytics, error: analyticsError } = await supabase
      .from('fb_analytics')
      .select('*')
      .eq('book_id', id)
      .order('created_at', { ascending: false })

    if (analyticsError) {
      return NextResponse.json(
        { error: analyticsError.message },
        { status: 500 }
      )
    }

    // Calculate aggregated stats
    const totalViews = analytics.length
    const uniqueVisitors = new Set(analytics.map((a) => a.visitor_ip)).size
    const avgTimeSpent =
      analytics.length > 0
        ? Math.round(
            analytics.reduce((sum, a) => sum + (a.time_spent_seconds || 0), 0) /
              analytics.length
          )
        : 0
    const avgPagesViewed =
      analytics.length > 0
        ? Math.round(
            (analytics.reduce((sum, a) => sum + (a.pages_viewed || 0), 0) /
              analytics.length) *
              10
          ) / 10
        : 0

    // Views by day (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const viewsByDay: Record<string, number> = {}
    analytics.forEach((a) => {
      const date = new Date(a.created_at).toISOString().split('T')[0]
      viewsByDay[date] = (viewsByDay[date] || 0) + 1
    })

    // Device breakdown
    const deviceBreakdown: Record<string, number> = {
      desktop: 0,
      mobile: 0,
      tablet: 0
    }
    analytics.forEach((a) => {
      if (a.device_type) {
        deviceBreakdown[a.device_type] =
          (deviceBreakdown[a.device_type] || 0) + 1
      }
    })

    // Top referrers
    const referrerCounts: Record<string, number> = {}
    analytics.forEach((a) => {
      if (a.referrer) {
        try {
          const domain = new URL(a.referrer).hostname
          referrerCounts[domain] = (referrerCounts[domain] || 0) + 1
        } catch {
          // Invalid URL, skip
        }
      }
    })
    const topReferrers = Object.entries(referrerCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([domain, count]) => ({ domain, count }))

    // Embed vs direct views
    const embedViews = analytics.filter((a) => a.is_embed).length
    const directViews = totalViews - embedViews

    return NextResponse.json({
      total_views: totalViews,
      unique_visitors: uniqueVisitors,
      avg_time_spent: avgTimeSpent,
      avg_pages_viewed: avgPagesViewed,
      views_by_day: viewsByDay,
      device_breakdown: deviceBreakdown,
      top_referrers: topReferrers,
      embed_views: embedViews,
      direct_views: directViews
    })
  } catch (error) {
    console.error('Error in GET /api/books/[id]/analytics:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
