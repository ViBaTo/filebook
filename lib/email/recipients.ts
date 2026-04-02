import { getSupabaseAdmin } from '@/lib/supabase/admin'

export type EmailRecipient = {
  email: string
  name?: string | null
}

export async function getUserEmailRecipient(
  userId: string
): Promise<EmailRecipient | null> {
  const supabaseAdmin = getSupabaseAdmin()

  const [{ data: userResult, error: userError }, { data: profile }] =
    await Promise.all([
      supabaseAdmin.auth.admin.getUserById(userId),
      supabaseAdmin
        .from('user_profiles')
        .select('full_name')
        .eq('user_id', userId)
        .maybeSingle()
    ])

  if (userError) {
    throw userError
  }

  const email = userResult.user.email

  if (!email) {
    return null
  }

  const metadata = userResult.user.user_metadata as { full_name?: string } | null
  const name = profile?.full_name || metadata?.full_name || null

  return {
    email,
    name
  }
}
