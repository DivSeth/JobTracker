import { createClient } from '@/lib/supabase/server'
import { resolveWebAppOrigin } from '@/lib/auth/oauth'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { origin } = new URL(request.url)
  const appOrigin = resolveWebAppOrigin({
    configuredOrigin: process.env.NEXT_PUBLIC_WEBAPP_URL || process.env.VITE_WEBAPP_URL,
    browserOrigin: origin,
  })

  if (process.env.NODE_ENV === 'production' || process.env.ENABLE_DEV_LOGIN !== 'true') {
    return NextResponse.json({ message: 'Not found' }, { status: 404 })
  }

  const email = process.env.DEV_LOGIN_EMAIL || 'seth.divyaansh@gmail.com'
  const password = process.env.DEV_LOGIN_PASSWORD || 'local-dev-password'
  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: users, error: listError } = await adminClient.auth.admin.listUsers()
  if (listError) {
    return NextResponse.redirect(`${appOrigin}/login?error=dev_user_lookup_failed`, { status: 302 })
  }

  const user = users.users.find((candidate) => candidate.email?.toLowerCase() === email.toLowerCase())
  if (!user) {
    return NextResponse.redirect(`${appOrigin}/login?error=dev_user_missing`, { status: 302 })
  }

  const { error: updateError } = await adminClient.auth.admin.updateUserById(user.id, {
    password,
    email_confirm: true,
  })
  if (updateError) {
    return NextResponse.redirect(`${appOrigin}/login?error=dev_user_update_failed`, { status: 302 })
  }

  const supabase = await createClient()
  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
  if (signInError) {
    return NextResponse.redirect(`${appOrigin}/login?error=dev_sign_in_failed`, { status: 302 })
  }

  return NextResponse.redirect(`${appOrigin}/`, { status: 302 })
}
