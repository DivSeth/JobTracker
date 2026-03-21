'use client'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

export default function LoginPage() {
  const supabase = createClient()

  async function signInWithGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
        scopes: [
          'https://www.googleapis.com/auth/gmail.readonly',
          'https://www.googleapis.com/auth/calendar',
        ].join(' '),
      },
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-6 p-8 max-w-sm">
        <h1 className="text-3xl font-bold tracking-tight">AutoApply</h1>
        <p className="text-muted-foreground">
          Your job application operating system
        </p>
        <Button onClick={signInWithGoogle} size="lg" className="w-full">
          Sign in with Google
        </Button>
        <p className="text-xs text-muted-foreground">
          This app reads your Gmail to automatically detect OA invites,
          interviews, and rejections. We never send emails on your behalf.
        </p>
      </div>
    </div>
  )
}
