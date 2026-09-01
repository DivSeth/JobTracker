'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type SaveState = 'idle' | 'saving' | 'saved' | 'error'

export function JobAnalysisPanel() {
  const router = useRouter()
  const [state, setState] = useState<SaveState>('idle')
  const [alertCount, setAlertCount] = useState(0)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setState('saving')
    setErrorMessage(null)

    const response = await fetch('/api/job-analyses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jobTitle: String(form.get('job_title') ?? '') || undefined,
        companyName: String(form.get('company_name') ?? '') || undefined,
        applyUrl: String(form.get('apply_url') ?? '') || undefined,
        jobText: String(form.get('job_description') ?? ''),
      }),
    })

    if (!response.ok) {
      const json = await response.json().catch(() => null)
      setErrorMessage(
        typeof json?.error === 'string'
          ? json.error
          : 'Analysis failed. Paste the job description fallback and try again.'
      )
      setState('error')
      return
    }

    const json = await response.json()
    setAlertCount(Array.isArray(json.networkAlerts) ? json.networkAlerts.length : 0)
    setState('saved')
    router.refresh()
  }

  return (
    <section className="bg-[#0a0a0a] border border-white/5 rounded-xl p-6 space-y-5">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-white/40 text-[18px]">psychology</span>
          <h3 className="text-sm font-semibold text-white">Job Understanding</h3>
        </div>
        {state !== 'idle' && (
          <p className={`text-xs ${state === 'error' ? 'text-red-300' : 'text-white/50'}`} role="status">
            {state === 'saving'
              ? 'Analyzing...'
              : state === 'saved'
                ? `Analysis saved${alertCount ? ` with ${alertCount} networking alert${alertCount === 1 ? '' : 's'}` : ''}`
                : errorMessage ?? 'Analysis failed'}
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <div className="space-y-4">
          <Input id="job_title" name="job_title" label="Job title" placeholder="Software Engineer, Backend" />
          <Input id="company_name" name="company_name" label="Company name" placeholder="Google" />
          <Input id="apply_url" name="apply_url" label="Apply URL" type="url" placeholder="https://..." />
          <Button type="submit" size="sm">Analyze job</Button>
        </div>
        <div className="space-y-1.5">
          <label htmlFor="job_description" className="block label-sm text-on-surface-muted">
            Job description fallback
          </label>
          <textarea
            id="job_description"
            name="job_description"
            rows={10}
            className="w-full bg-surface-card text-on-surface text-sm px-3 py-2.5 rounded-[10px] border border-border-subtle outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-on-surface-muted/50 resize-none"
            placeholder="Optional. Paste the job description if the link is blocked or incomplete..."
          />
        </div>
      </form>
    </section>
  )
}
