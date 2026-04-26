import { CheckCircle } from 'lucide-react'
import { SignInButton } from '@/components/auth/SignInButton'

const VALUE_PROPS = [
  'Auto-fill any ATS form in one click',
  'Track every application in one dashboard',
  'AI-powered interview prep and insights',
]

export default function LoginPage() {
  return (
    <div className="min-h-screen flex">
      {/* Left panel — 60% — dark hero */}
      <div className="hidden lg:flex w-3/5 flex-col bg-surface-container min-h-screen px-12 py-10 relative overflow-hidden">
        {/* Wordmark */}
        <div className="text-xl font-bold font-display text-on-surface">
          Auto<span className="text-primary">Apply</span>
        </div>

        {/* Hero content */}
        <div className="flex-1 flex flex-col justify-center max-w-md">
          <h1 className="text-[48px] font-bold font-display text-on-surface leading-[1.1] mb-8 text-balance">
            Apply once.<br />Apply everywhere.
          </h1>
          <ul className="space-y-4">
            {VALUE_PROPS.map(item => (
              <li key={item} className="flex items-center gap-3">
                <CheckCircle size={18} className="text-success shrink-0" />
                <span className="text-sm text-on-surface-muted">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Decorative background glow */}
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
      </div>

      {/* Right panel — 40% — auth */}
      <div className="flex-1 flex items-center justify-center bg-surface-card px-8 min-h-screen">
        <div className="w-full max-w-sm space-y-8">
          {/* Mobile wordmark (hidden on lg+) */}
          <div className="lg:hidden text-xl font-bold font-display text-on-surface">
            Auto<span className="text-primary">Apply</span>
          </div>

          <div>
            <h2 className="text-2xl font-bold font-display text-on-surface">Sign in</h2>
            <p className="text-sm text-on-surface-muted mt-1">Continue to AutoApply OS</p>
          </div>

          <SignInButton />

          <p className="text-xs text-on-surface-muted text-center leading-relaxed">
            We read your Gmail to detect OA invites, interviews, and rejections.
            We never send emails on your behalf.
          </p>
        </div>
      </div>
    </div>
  )
}
