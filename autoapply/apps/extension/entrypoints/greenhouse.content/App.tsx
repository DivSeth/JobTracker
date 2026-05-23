import { useEffect, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { fillForm } from '@/lib/greenhouse/filler'
import { cancelSubmissionWatch, watchForSubmissionConfirmation } from '@/lib/greenhouse/detector'
import type { FillResult, FillStatus, MappedField, TrackApplicationPayload } from '@/lib/greenhouse/types'
import { FillProgressBar } from './FillProgressBar'
import { FillResultBanner } from './FillResultBanner'
import { MappingRow } from './MappingRow'
import { SubmissionToast } from './SubmissionToast'
import { UnmappedRow } from './UnmappedRow'

type PanelState = 'preview' | 'filling' | 'complete'

export interface DuplicateInfo {
  exists: boolean
  appliedAt?: string | null
}

interface Props {
  mappedFields: MappedField[]
  profileName: string
  profileId: string
  duplicateInfo: DuplicateInfo
  onDismiss: () => void
}

function getJobTitle(): string {
  return (
    document.querySelector('h1')?.textContent?.trim() ||
    document.title.split('|')[0]?.trim() ||
    'Greenhouse Application'
  )
}

function getCompanyName(): string {
  return (
    document.querySelector('[data-company-name]')?.textContent?.trim() ||
    document.querySelector('meta[property="og:site_name"]')?.getAttribute('content')?.trim() ||
    window.location.hostname.replace(/^boards\./, '').replace(/^job-boards\./, '')
  )
}

function formatAppliedAt(appliedAt?: string | null): string | null {
  if (!appliedAt) return null

  try {
    return new Date(appliedAt).toLocaleDateString()
  } catch {
    return null
  }
}

export default function PreviewPanel({
  mappedFields,
  profileName,
  profileId,
  duplicateInfo,
  onDismiss,
}: Props) {
  const [panelState, setPanelState] = useState<PanelState>('preview')
  const [completed, setCompleted] = useState(0)
  const [statuses, setStatuses] = useState<Record<string, FillStatus>>({})
  const [result, setResult] = useState<FillResult | null>(null)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('Application tracked!')

  useEffect(() => {
    setPanelState('preview')
    setCompleted(0)
    setResult(null)
    setStatuses({})
    setShowToast(false)
    setToastMessage('Application tracked!')
  }, [mappedFields, profileId])

  useEffect(() => {
    return () => {
      cancelSubmissionWatch()
    }
  }, [])

  const mappedRows = mappedFields.filter((field) => field.profileValue !== null)
  const unmappedRows = mappedFields.filter((field) => field.profileValue === null)
  const total = mappedFields.length

  async function handleFileUpload(storagePath: string, selector: string): Promise<void> {
    const result = await chrome.runtime.sendMessage({ action: 'getResumeSignedUrl', payload: { storagePath } })
    const url: string | null = result?.url ?? null
    if (!url) return

    const resp = await fetch(url)
    if (!resp.ok) return

    const blob = await resp.blob()
    const filename = storagePath.split('/').pop() ?? 'resume.pdf'
    const file = new File([blob], filename, { type: blob.type || 'application/pdf' })

    const input = document.querySelector<HTMLInputElement>(selector)
    if (!input) return

    const dt = new DataTransfer()
    dt.items.add(file)
    input.files = dt.files
    input.dispatchEvent(new Event('change', { bubbles: true, composed: true }))
  }

  async function handleConfirmFill() {
    setPanelState('filling')
    setCompleted(0)
    setStatuses(
      Object.fromEntries(mappedRows.map((field) => [field.field.selector, 'pending' as FillStatus]))
    )

    const fillResult = await fillForm(mappedFields, {
      delayMs: 50,
      onFileUploadRequest: handleFileUpload,
      onProgress: (nextCompleted, _total, last) => {
        setCompleted(nextCompleted)
        setStatuses((current) => ({
          ...current,
          [last.field.selector]: last.status,
        }))
      },
    })

    setResult(fillResult)
    setPanelState('complete')

    const trackPayload: TrackApplicationPayload = {
      applyUrl: window.location.href,
      jobTitle:
        document.querySelector('h1.app-title, .posting-headline h2, h1')?.textContent?.trim() ??
        getJobTitle(),
      companyName:
        document.querySelector('.company-name, .posting-headline .company')?.textContent?.trim() ??
        getCompanyName(),
      profileId,
      source: 'extension_autofill',
    }

    const tracked = await chrome.runtime.sendMessage({
      action: 'trackApplication',
      payload: trackPayload,
    })

    const applicationId =
      tracked && typeof tracked === 'object' && 'id' in tracked ? String(tracked.id) : null

    if (applicationId) {
      setToastMessage('Application tracked!')
      setShowToast(true)
    } else {
      const errorMessage =
        tracked && typeof tracked === 'object' && 'error' in tracked && typeof tracked.error === 'string'
          ? tracked.error
          : 'Tracking failed'
      setToastMessage(`Tracking failed: ${errorMessage}`)
      setShowToast(true)
    }

    void watchForSubmissionConfirmation()
      .then(async () => {
        if (!applicationId) return

        await chrome.runtime.sendMessage({
          action: 'updateApplicationStatus',
          payload: {
            id: applicationId,
            status: 'applied',
          },
        })
      })
      .catch(() => {})
  }

  const appliedDateLabel = formatAppliedAt(duplicateInfo.appliedAt)

  return (
    <>
      <div className="fixed right-4 top-1/2 z-[2147483647] w-[400px] max-w-[calc(100vw-32px)] -translate-y-1/2 rounded-xl border border-outline-variant bg-surface p-4 font-body text-on-surface shadow-[0_24px_80px_rgba(0,0,0,0.16)]">
        <div className="space-y-4">
          {panelState === 'preview' && (
            <>
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                  {profileName}
                </p>
                <h2 className="text-xl font-semibold font-display">Review Field Mappings</h2>
              </div>

              {duplicateInfo.exists && (
                <div className="rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm text-on-surface">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                    <p>
                      You may have already applied here
                      {appliedDateLabel ? ` — ${appliedDateLabel}` : ''}.
                    </p>
                  </div>
                </div>
              )}

              <div className="max-h-[52vh] space-y-2 overflow-y-auto pr-1">
                {mappedRows.map((field) => (
                  <MappingRow
                    key={field.field.selector}
                    field={field.field}
                    isMasked={field.isMasked}
                    profileValue={field.profileValue ?? ''}
                    status={statuses[field.field.selector] ?? 'pending'}
                  />
                ))}
                {unmappedRows.map((field) => (
                  <UnmappedRow key={field.field.selector} field={field.field} />
                ))}
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  className="min-h-[44px] rounded-lg border border-outline-variant px-4 py-2.5 text-sm font-semibold text-on-surface transition-colors hover:bg-surface-container"
                  onClick={onDismiss}
                >
                  Discard
                </button>
                <button
                  className="min-h-[44px] rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                  onClick={handleConfirmFill}
                >
                  Confirm Fill
                </button>
              </div>
            </>
          )}

          {panelState === 'filling' && (
            <>
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                  Autofill In Progress
                </p>
                <h2 className="text-xl font-semibold font-display">Applying {profileName}</h2>
              </div>
              <FillProgressBar completed={completed} total={total} />
              <div className="max-h-[48vh] space-y-2 overflow-y-auto pr-1">
                {mappedRows.map((field) => (
                  <MappingRow
                    key={field.field.selector}
                    field={field.field}
                    isMasked={field.isMasked}
                    profileValue={field.profileValue ?? ''}
                    status={statuses[field.field.selector] ?? 'pending'}
                  />
                ))}
                {unmappedRows.map((field) => (
                  <UnmappedRow key={field.field.selector} field={field.field} />
                ))}
              </div>
            </>
          )}

          {panelState === 'complete' && result && (
            <FillResultBanner result={result} onClose={onDismiss} />
          )}
        </div>
      </div>
      {showToast && (
        <SubmissionToast
          message={toastMessage}
          onDismiss={() => setShowToast(false)}
        />
      )}
    </>
  )
}
