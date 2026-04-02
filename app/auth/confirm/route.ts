import { createServerClient } from '@supabase/ssr'
import type { EmailOtpType } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { sendWelcomeEmail } from '@/lib/email/templates/welcome'

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const tokenHash = url.searchParams.get('token_hash')
  const type = url.searchParams.get('type') as EmailOtpType | null
  const next = url.searchParams.get('next') ?? '/create'
  const redirectUrl = request.nextUrl.clone()
  redirectUrl.pathname = next
  redirectUrl.searchParams.delete('token_hash')
  redirectUrl.searchParams.delete('type')
  redirectUrl.searchParams.delete('next')

  if (!tokenHash || !type) {
    return NextResponse.redirect(new URL('/login?error=invalid_email_link', request.url))
  }

  const response = NextResponse.redirect(redirectUrl)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            try {
              request.cookies.set(name, value)
            } catch {
              // Ignore request cookie mutation failures in edge runtimes.
            }

            response.cookies.set(name, value, options)
          })
        }
      }
    }
  )

  const { data, error } = await supabase.auth.verifyOtp({
    type,
    token_hash: tokenHash
  })

  if (error) {
    return NextResponse.redirect(new URL('/login?error=invalid_email_link', request.url))
  }

  if (type === 'signup' && data.user?.email) {
    try {
      const metadata = data.user.user_metadata as { full_name?: string } | null

      await sendWelcomeEmail({
        to: data.user.email,
        name: metadata?.full_name,
        dashboardUrl: new URL('/create', request.url).toString()
      })
    } catch (welcomeError) {
      console.error('Failed to send welcome email:', welcomeError)
    }
  }

  return response
}
