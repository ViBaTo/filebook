import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

// Hash IP for privacy
function hashIP(ip: string): string {
  return crypto.createHash('sha256').update(ip).digest('hex').substring(0, 16)
}

// Detect device type from user agent
function getDeviceType(userAgent: string): 'desktop' | 'mobile' | 'tablet' {
  const ua = userAgent.toLowerCase()
  if (/tablet|ipad|playbook|silk/i.test(ua)) {
    return 'tablet'
  }
  if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(ua)) {
    return 'mobile'
  }
  return 'desktop'
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      book_id,
      is_embed,
      embed_domain,
      id,
      pages_viewed,
      max_page_reached,
      time_spent_seconds
    } = body

    const supabase = await createClient()

    // If this is an update (has id), update the existing record
    if (id) {
      const updateData: Record<string, unknown> = {}
      if (pages_viewed !== undefined) updateData.pages_viewed = pages_viewed
      if (max_page_reached !== undefined)
        updateData.max_page_reached = max_page_reached
      if (time_spent_seconds !== undefined)
        updateData.time_spent_seconds = time_spent_seconds

      if (Object.keys(updateData).length > 0) {
        await supabase.from('fb_analytics').update(updateData).eq('id', id)
      }

      return NextResponse.json({ success: true })
    }

    // Otherwise, create a new analytics record
    if (!book_id) {
      return NextResponse.json(
        { error: 'Missing required field: book_id' },
        { status: 400 }
      )
    }

    // Get visitor info from headers
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown'
    const userAgent = request.headers.get('user-agent') || ''
    const referrer = request.headers.get('referer') || null

    const analyticsData = {
      book_id,
      visitor_ip: hashIP(ip),
      user_agent: userAgent.substring(0, 500), // Limit length
      referrer: referrer?.substring(0, 500) || null,
      device_type: getDeviceType(userAgent),
      is_embed: is_embed || false,
      embed_domain: embed_domain?.substring(0, 255) || null,
      pages_viewed: 1,
      max_page_reached: 1,
      time_spent_seconds: 0
    }

    const { data: analytics, error } = await supabase
      .from('fb_analytics')
      .insert(analyticsData)
      .select()
      .single()

    if (error) {
      console.error('Error creating analytics:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(analytics, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/analytics:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
