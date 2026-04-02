import { shouldSendOAuthWelcomeEmail } from '@/lib/email/auth'
import { sendWelcomeEmail } from '@/lib/email/templates/welcome'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/create'

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      if (data.user?.email && shouldSendOAuthWelcomeEmail(data.user)) {
        try {
          const metadata = data.user.user_metadata as { full_name?: string } | null

          await sendWelcomeEmail({
            to: data.user.email,
            name: metadata?.full_name,
            dashboardUrl: new URL('/create', request.url).toString()
          })
        } catch (welcomeError) {
          console.error('Failed to send OAuth welcome email:', welcomeError)
        }
      }

      const forwardedHost = request.headers.get('x-forwarded-host')
      const isLocalEnv = process.env.NODE_ENV === 'development'

      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      } else {
        return NextResponse.redirect(`${origin}${next}`)
      }
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`)
}
