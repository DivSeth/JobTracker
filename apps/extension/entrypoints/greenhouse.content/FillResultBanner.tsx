import type { FillResult } from '@/lib/greenhouse/types'

interface Props {
  result: FillResult
  onClose: () => void
}

export function FillResultBanner({ result, onClose }: Props) {
  const tone =
    result.errors > 0
      ? 'border-error/30 bg-error/10 text-error'
      : result.skipped > 0
        ? 'border-outline-variant bg-surface text-on-surface'
        : 'border-success/30 bg-success/10 text-success'

  const headline =
    result.errors > 0
      ? 'Some fields failed to fill.'
      : result.skipped > 0
        ? 'Fill completed with skipped fields.'
        : 'Application fields filled successfully.'

  return (
    <div className={`space-y-3 rounded-xl border p-4 ${tone}`}>
      <div>
        <p className="text-sm font-semibold">{headline}</p>
        <p className="mt-1 text-sm">
          Filled {result.filled}, skipped {result.skipped}, errors {result.errors}.
        </p>
      </div>
      <button
        className="min-h-[44px] w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        onClick={onClose}
      >
        Close Panel
      </button>
    </div>
  )
}
