interface Props {
  completed: number
  total: number
}

export function FillProgressBar({ completed, total }: Props) {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-on-surface">
        Filling {completed} of {total} fields...
      </p>
      <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container">
        <div
          aria-label="Fill progress"
          className="h-full rounded-full bg-primary transition-all duration-200"
          role="progressbar"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
