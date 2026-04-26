export default function CalendarPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold font-display text-on-surface">Calendar</h1>
        <p className="text-sm text-on-surface-muted mt-1">Interview schedules and deadlines</p>
      </div>
      <div className="bg-surface-card rounded-card border border-border-subtle shadow-card flex flex-col items-center justify-center min-h-[400px] text-center p-8">
        <p className="text-[3.5rem] font-light text-on-surface-muted/20 tracking-[-0.02em] select-none">▦</p>
        <h2 className="text-xl font-semibold font-display text-on-surface mt-4">Coming in Phase 2B</h2>
        <p className="text-sm text-on-surface-muted mt-2 max-w-sm">
          Connect Gmail to auto-extract interview schedules and deadlines.
        </p>
      </div>
    </div>
  )
}
