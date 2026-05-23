'use client'
import { useRef, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { BaseIdentity } from '@/lib/schemas/base-identity'

interface Props {
  initial: Partial<BaseIdentity>
}

type Status = 'idle' | 'saving' | 'saved' | 'error'

export function BaseIdentityForm({ initial }: Props) {
  const [values, setValues] = useState<Partial<BaseIdentity>>(initial)
  const [status, setStatus] = useState<Status>('idle')
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  async function save(next: Partial<BaseIdentity>) {
    setStatus('saving')
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(next),
      })
      setStatus(res.ok ? 'saved' : 'error')
    } catch {
      setStatus('error')
    }
  }

  function update<K extends keyof BaseIdentity>(key: K, value: BaseIdentity[K]) {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  function commit<K extends keyof BaseIdentity>(key: K) {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      save({ [key]: values[key] } as Partial<BaseIdentity>)
    }, 0)
  }

  return (
    <section className="space-y-6 rounded-lg border bg-surface-card p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Base Identity</h2>
        <StatusPill status={status} />
      </div>

      <Grid>
        <Field label="First name" id="first_name">
          <Input
            id="first_name"
            value={values.first_name ?? ''}
            onChange={(e) => update('first_name', e.target.value || null)}
            onBlur={() => commit('first_name')}
          />
        </Field>
        <Field label="Last name" id="last_name">
          <Input
            id="last_name"
            value={values.last_name ?? ''}
            onChange={(e) => update('last_name', e.target.value || null)}
            onBlur={() => commit('last_name')}
          />
        </Field>
        <Field label="Preferred name" id="preferred_first_name">
          <Input
            id="preferred_first_name"
            value={values.preferred_first_name ?? ''}
            onChange={(e) => update('preferred_first_name', e.target.value || null)}
            onBlur={() => commit('preferred_first_name')}
          />
        </Field>
        <Field label="Pronouns" id="pronouns">
          <Input
            id="pronouns"
            value={values.pronouns ?? ''}
            onChange={(e) => update('pronouns', e.target.value || null)}
            onBlur={() => commit('pronouns')}
          />
        </Field>
        <Field label="LinkedIn URL" id="linkedin_url">
          <Input
            id="linkedin_url"
            type="url"
            value={values.linkedin_url ?? ''}
            onChange={(e) => update('linkedin_url', e.target.value || null)}
            onBlur={() => commit('linkedin_url')}
          />
        </Field>
        <Field label="GitHub URL" id="github_url">
          <Input
            id="github_url"
            type="url"
            value={values.github_url ?? ''}
            onChange={(e) => update('github_url', e.target.value || null)}
            onBlur={() => commit('github_url')}
          />
        </Field>
        <Field label="Portfolio URL" id="portfolio_url">
          <Input
            id="portfolio_url"
            type="url"
            value={values.portfolio_url ?? ''}
            onChange={(e) => update('portfolio_url', e.target.value || null)}
            onBlur={() => commit('portfolio_url')}
          />
        </Field>
        <Field label="Date of birth" id="date_of_birth">
          <Input
            id="date_of_birth"
            type="date"
            value={values.date_of_birth ?? ''}
            onChange={(e) => update('date_of_birth', e.target.value || null)}
            onBlur={() => commit('date_of_birth')}
          />
        </Field>
        <Field label="Willing to relocate" id="willing_to_relocate">
          <input
            id="willing_to_relocate"
            type="checkbox"
            checked={values.willing_to_relocate ?? false}
            onChange={(e) => {
              update('willing_to_relocate', e.target.checked)
              commit('willing_to_relocate')
            }}
          />
        </Field>
        <Field label="Work arrangement" id="work_arrangement_preference">
          <select
            id="work_arrangement_preference"
            value={values.work_arrangement_preference ?? ''}
            onChange={(e) => {
              const v = (e.target.value || null) as BaseIdentity['work_arrangement_preference']
              update('work_arrangement_preference', v)
              commit('work_arrangement_preference')
            }}
            className="rounded-md border bg-background px-2 py-1"
          >
            <option value="">—</option>
            <option value="remote">Remote</option>
            <option value="hybrid">Hybrid</option>
            <option value="onsite">On-site</option>
            <option value="any">Any</option>
          </select>
        </Field>
        <Field label="Earliest start date" id="earliest_start_date">
          <Input
            id="earliest_start_date"
            type="date"
            value={values.earliest_start_date ?? ''}
            onChange={(e) => update('earliest_start_date', e.target.value || null)}
            onBlur={() => commit('earliest_start_date')}
          />
        </Field>
        <Field label="How did you hear about us (referral source)" id="referral_source">
          <Input
            id="referral_source"
            value={values.referral_source ?? ''}
            onChange={(e) => update('referral_source', e.target.value || null)}
            onBlur={() => commit('referral_source')}
          />
        </Field>
      </Grid>
    </section>
  )
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2">{children}</div>
}

function Field({ label, id, children }: { label: string; id: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  )
}

function StatusPill({ status }: { status: Status }) {
  if (status === 'idle') return null
  const text = status === 'saving' ? 'Saving…' : status === 'saved' ? 'Saved' : 'Error'
  return <span className="text-xs text-on-surface-muted">{text}</span>
}
