'use client'

interface Props {
  firstName: string
}

export function Greeting({ firstName }: Props) {
  const hour = new Date().getHours()
  const greeting =
    hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const dateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
  return (
    <div>
      <h1 className="text-[30px] font-bold font-display text-on-surface leading-tight">
        {greeting}, {firstName}
      </h1>
      <p className="text-sm text-on-surface-muted mt-1">{dateStr}</p>
    </div>
  )
}
