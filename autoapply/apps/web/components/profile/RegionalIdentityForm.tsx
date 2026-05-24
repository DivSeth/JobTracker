'use client'
import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { CountryCodeChipInput } from './CountryCodeChipInput'
import { COUNTRY_CODES } from '@/lib/profile/country-codes'
import type { RegionalIdentityUpdate } from '@/lib/schemas/regional-identity'

const EEO_GENDERS = ['Male', 'Female', 'Non-binary', 'Prefer not to say', 'Decline to self-identify']
const EEO_RACES = [
  'American Indian or Alaskan Native',
  'Asian',
  'Black or African American',
  'Hispanic or Latino',
  'Native Hawaiian or Other Pacific Islander',
  'Two or more races',
  'White',
  'Prefer not to say',
  'Decline to self-identify',
]
const EEO_VETERAN_STATUSES = ['Not a veteran', 'Protected veteran', 'Prefer not to say', 'Decline to self-identify']
const EEO_DISABILITY_STATUSES = ['Yes', 'No', 'Prefer not to say', 'Decline to self-identify']

type Stored = RegionalIdentityUpdate & { id: string }

interface AppProfileOption {
  id: string
  name: string
  is_default: boolean
}

interface Props {
  initial: Stored
  onDeleted: (id: string) => void
  appProfiles: AppProfileOption[]
}

export function RegionalIdentityForm({ initial, onDeleted, appProfiles }: Props) {
  const [values, setValues] = useState<Stored>(initial)
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  async function patch(patchBody: Partial<Stored>) {
    setStatus('saving')
    const res = await fetch(`/api/profile/regional-identities/${initial.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patchBody),
    })
    setStatus(res.ok ? 'saved' : 'error')
  }

  function set<K extends keyof Stored>(key: K, value: Stored[K]) {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  function commit<K extends keyof Stored>(key: K) {
    patch({ [key]: values[key] } as Partial<Stored>)
  }

  async function handleDelete() {
    if (!window.confirm('Delete this regional identity? This cannot be undone.')) return
    const res = await fetch(`/api/profile/regional-identities/${initial.id}`, {
      method: 'DELETE',
    })
    if (res.ok) onDeleted(initial.id)
  }

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">{values.label ?? 'New region'}</h3>
        <Button variant="ghost" size="sm" onClick={handleDelete}>
          Delete region
        </Button>
      </div>

      <Section title="Label">
        <Field label="Label" id={`label-${initial.id}`}>
          <Input
            id={`label-${initial.id}`}
            value={values.label ?? ''}
            onChange={(e) => set('label', e.target.value)}
            onBlur={() => commit('label')}
          />
        </Field>
        <Field label="Applies to countries" id={`cc-${initial.id}`}>
          <CountryCodeChipInput
            value={values.country_codes ?? []}
            onChange={(next) => {
              set('country_codes', next)
              patch({ country_codes: next })
            }}
          />
        </Field>
        <Field label="Use as default" id={`default-${initial.id}`}>
          <input
            id={`default-${initial.id}`}
            type="checkbox"
            checked={values.is_default ?? false}
            onChange={(e) => {
              set('is_default', e.target.checked)
              patch({ is_default: e.target.checked })
            }}
          />
        </Field>
      </Section>

      <Section title="Contact">
        <Field label="Email" id={`email-${initial.id}`}>
          <Input
            id={`email-${initial.id}`}
            type="email"
            value={values.email ?? ''}
            onChange={(e) => set('email', e.target.value)}
            onBlur={() => commit('email')}
          />
        </Field>
        <Field label="Phone (E.164, e.g. +14155551234)" id={`phone-${initial.id}`}>
          <Input
            id={`phone-${initial.id}`}
            value={values.phone_e164 ?? ''}
            onChange={(e) => set('phone_e164', e.target.value || null)}
            onBlur={() => commit('phone_e164')}
          />
        </Field>
      </Section>

      <Section title="Address">
        <Field label="Address line 1" id={`a1-${initial.id}`}>
          <Input
            id={`a1-${initial.id}`}
            value={values.address_line_1 ?? ''}
            onChange={(e) => set('address_line_1', e.target.value || null)}
            onBlur={() => commit('address_line_1')}
          />
        </Field>
        <Field label="Address line 2" id={`a2-${initial.id}`}>
          <Input
            id={`a2-${initial.id}`}
            value={values.address_line_2 ?? ''}
            onChange={(e) => set('address_line_2', e.target.value || null)}
            onBlur={() => commit('address_line_2')}
          />
        </Field>
        <Field label="City" id={`city-${initial.id}`}>
          <Input
            id={`city-${initial.id}`}
            value={values.city ?? ''}
            onChange={(e) => set('city', e.target.value || null)}
            onBlur={() => commit('city')}
          />
        </Field>
        <Field label="Region / state" id={`region-${initial.id}`}>
          <Input
            id={`region-${initial.id}`}
            value={values.region ?? ''}
            onChange={(e) => set('region', e.target.value || null)}
            onBlur={() => commit('region')}
          />
        </Field>
        <Field label="Postal code" id={`pc-${initial.id}`}>
          <Input
            id={`pc-${initial.id}`}
            value={values.postal_code ?? ''}
            onChange={(e) => set('postal_code', e.target.value || null)}
            onBlur={() => commit('postal_code')}
          />
        </Field>
        <Field label="Country" id={`country-${initial.id}`}>
          <select
            id={`country-${initial.id}`}
            value={values.country ?? ''}
            onChange={(e) => {
              set('country', e.target.value)
              patch({ country: e.target.value })
            }}
            className="rounded-md border bg-background px-2 py-1"
          >
            <option value="">—</option>
            {COUNTRY_CODES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
      </Section>

      <Section title="Work authorization">
        <Field label="Authorized to work in this country" id={`atw-${initial.id}`}>
          <YesNo
            id={`atw-${initial.id}`}
            value={values.authorized_to_work ?? null}
            onChange={(v) => { set('authorized_to_work', v); patch({ authorized_to_work: v }) }}
          />
        </Field>
        <Field label="Sponsorship now required" id={`spn-${initial.id}`}>
          <YesNo
            id={`spn-${initial.id}`}
            value={values.needs_sponsorship_now ?? null}
            onChange={(v) => { set('needs_sponsorship_now', v); patch({ needs_sponsorship_now: v }) }}
          />
        </Field>
        <Field label="Sponsorship needed in future" id={`spf-${initial.id}`}>
          <YesNo
            id={`spf-${initial.id}`}
            value={values.needs_sponsorship_future ?? null}
            onChange={(v) => { set('needs_sponsorship_future', v); patch({ needs_sponsorship_future: v }) }}
          />
        </Field>
        <Field label="Work auth status (optional)" id={`was-${initial.id}`}>
          <Input
            id={`was-${initial.id}`}
            value={values.work_auth_status ?? ''}
            onChange={(e) => set('work_auth_status', e.target.value || null)}
            onBlur={() => commit('work_auth_status')}
          />
        </Field>
      </Section>

      <Section title="Compensation">
        <Field label="Desired salary min" id={`smin-${initial.id}`}>
          <Input
            id={`smin-${initial.id}`}
            type="number"
            value={values.desired_salary_min ?? ''}
            onChange={(e) => set('desired_salary_min', e.target.value ? Number(e.target.value) : null)}
            onBlur={() => commit('desired_salary_min')}
          />
        </Field>
        <Field label="Desired salary max" id={`smax-${initial.id}`}>
          <Input
            id={`smax-${initial.id}`}
            type="number"
            value={values.desired_salary_max ?? ''}
            onChange={(e) => set('desired_salary_max', e.target.value ? Number(e.target.value) : null)}
            onBlur={() => commit('desired_salary_max')}
          />
        </Field>
        <Field label="Salary currency" id={`cur-${initial.id}`}>
          <Input
            id={`cur-${initial.id}`}
            value={values.salary_currency ?? ''}
            onChange={(e) => set('salary_currency', (e.target.value || null)?.toUpperCase() ?? null)}
            onBlur={() => commit('salary_currency')}
          />
        </Field>
        <Field label="Salary cadence" id={`cad-${initial.id}`}>
          <select
            id={`cad-${initial.id}`}
            value={values.salary_cadence ?? ''}
            onChange={(e) => {
              const v = (e.target.value || null) as Stored['salary_cadence']
              set('salary_cadence', v)
              patch({ salary_cadence: v })
            }}
            className="rounded-md border bg-background px-2 py-1"
          >
            <option value="">—</option>
            <option value="annual">Annual</option>
            <option value="monthly">Monthly</option>
            <option value="hourly">Hourly</option>
            <option value="lpa">LPA (India)</option>
          </select>
        </Field>
        <Field label="Current compensation" id={`ccval-${initial.id}`}>
          <Input
            id={`ccval-${initial.id}`}
            type="number"
            value={values.current_compensation ?? ''}
            onChange={(e) => set('current_compensation', e.target.value ? Number(e.target.value) : null)}
            onBlur={() => commit('current_compensation')}
          />
        </Field>
      </Section>

      <Section title="Notice period">
        <Field label="Notice period (weeks)" id={`np-${initial.id}`}>
          <Input
            id={`np-${initial.id}`}
            type="number"
            value={values.notice_period_weeks ?? ''}
            onChange={(e) => set('notice_period_weeks', e.target.value ? Number(e.target.value) : null)}
            onBlur={() => commit('notice_period_weeks')}
          />
        </Field>
      </Section>

      <Section title="EEO / Self-Identification">
        <Field label="Gender" id={`eeo_gender-${initial.id}`}>
          <select
            id={`eeo_gender-${initial.id}`}
            value={values.eeo_gender ?? ''}
            onChange={(e) => set('eeo_gender', e.target.value || null)}
            onBlur={() => commit('eeo_gender')}
            className="w-full bg-[#0d0d0d] border border-white/5 text-xs text-white rounded-lg px-3 py-1.5 outline-none focus:border-white/20"
          >
            <option value="">— select —</option>
            {EEO_GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </Field>
        <Field label="Race / Ethnicity" id={`eeo_race-${initial.id}`}>
          <select
            id={`eeo_race-${initial.id}`}
            value={values.eeo_race ?? ''}
            onChange={(e) => set('eeo_race', e.target.value || null)}
            onBlur={() => commit('eeo_race')}
            className="w-full bg-[#0d0d0d] border border-white/5 text-xs text-white rounded-lg px-3 py-1.5 outline-none focus:border-white/20"
          >
            <option value="">— select —</option>
            {EEO_RACES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </Field>
        <Field label="Veteran Status" id={`eeo_veteran-${initial.id}`}>
          <select
            id={`eeo_veteran-${initial.id}`}
            value={values.eeo_veteran_status ?? ''}
            onChange={(e) => set('eeo_veteran_status', e.target.value || null)}
            onBlur={() => commit('eeo_veteran_status')}
            className="w-full bg-[#0d0d0d] border border-white/5 text-xs text-white rounded-lg px-3 py-1.5 outline-none focus:border-white/20"
          >
            <option value="">— select —</option>
            {EEO_VETERAN_STATUSES.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </Field>
        <Field label="Disability Status" id={`eeo_disability-${initial.id}`}>
          <select
            id={`eeo_disability-${initial.id}`}
            value={values.eeo_disability_status ?? ''}
            onChange={(e) => set('eeo_disability_status', e.target.value || null)}
            onBlur={() => commit('eeo_disability_status')}
            className="w-full bg-[#0d0d0d] border border-white/5 text-xs text-white rounded-lg px-3 py-1.5 outline-none focus:border-white/20"
          >
            <option value="">— select —</option>
            {EEO_DISABILITY_STATUSES.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </Field>
      </Section>

      <Section title="Autofill">
        <Field label="Default Application Profile" id={`default_profile-${initial.id}`}>
          <select
            id={`default_profile-${initial.id}`}
            value={values.default_profile_id ?? ''}
            onChange={(e) => {
              const val = e.target.value || null
              set('default_profile_id', val)
              patch({ default_profile_id: val })
            }}
            className="w-full bg-[#0d0d0d] border border-white/5 text-xs text-white rounded-lg px-3 py-1.5 outline-none focus:border-white/20"
          >
            <option value="">— none (use global default) —</option>
            {appProfiles.map(p => (
              <option key={p.id} value={p.id}>
                {p.name}{p.is_default ? ' (default)' : ''}
              </option>
            ))}
          </select>
          <p className="text-[10px] text-white/35 mt-1">
            Extension auto-selects this profile when filling jobs in this region.
          </p>
        </Field>
      </Section>

      <StatusLine status={status} />
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="mb-2 text-sm font-medium text-on-surface-muted">{title}</h4>
      <div className="grid gap-3 sm:grid-cols-2">{children}</div>
    </div>
  )
}

function Field({ label, id, children }: { label: string; id: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  )
}

function YesNo({
  id,
  value,
  onChange,
}: {
  id: string
  value: boolean | null
  onChange: (v: boolean | null) => void
}) {
  return (
    <select
      id={id}
      value={value === null ? '' : value ? 'yes' : 'no'}
      onChange={(e) => {
        const v = e.target.value
        onChange(v === '' ? null : v === 'yes')
      }}
      className="rounded-md border bg-background px-2 py-1"
    >
      <option value="">—</option>
      <option value="yes">Yes</option>
      <option value="no">No</option>
    </select>
  )
}

function StatusLine({ status }: { status: 'idle' | 'saving' | 'saved' | 'error' }) {
  if (status === 'idle') return null
  const text = status === 'saving' ? 'Saving…' : status === 'saved' ? 'Saved' : 'Error'
  return <div className="text-xs text-on-surface-muted">{text}</div>
}
