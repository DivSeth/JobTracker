'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type SaveState = 'idle' | 'saving' | 'saved' | 'error'

function FieldGroup({
  title,
  icon,
  children,
}: {
  title: string
  icon: string
  children: React.ReactNode
}) {
  return (
    <section className="bg-[#0a0a0a] border border-white/5 rounded-xl p-6 space-y-5">
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-white/40 text-[18px]">{icon}</span>
        <h3 className="text-sm font-semibold text-white">{title}</h3>
      </div>
      {children}
    </section>
  )
}

function StatusLine({ state }: { state: SaveState }) {
  if (state === 'idle') return null

  return (
    <p
      className={`text-xs ${state === 'error' ? 'text-red-300' : 'text-white/50'}`}
      role="status"
    >
      {state === 'saving' ? 'Saving...' : state === 'saved' ? 'Saved' : 'Save failed'}
    </p>
  )
}

export function KnowledgeManualEntryPanel() {
  const [evidenceState, setEvidenceState] = useState<SaveState>('idle')
  const [claimState, setClaimState] = useState<SaveState>('idle')
  const [contactState, setContactState] = useState<SaveState>('idle')

  async function submitJson(
    endpoint: string,
    payload: Record<string, unknown>,
    setState: (state: SaveState) => void
  ) {
    setState('saving')
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    setState(response.ok ? 'saved' : 'error')
  }

  async function handleEvidenceSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)

    await submitJson(
      '/api/knowledge/evidence',
      {
        source_type: 'manual_note',
        title: String(form.get('evidence_title') ?? ''),
        raw_text: String(form.get('evidence_text') ?? ''),
        metadata: {
          source: 'manual_knowledge_page',
        },
      },
      setEvidenceState
    )
  }

  async function handleClaimSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)

    await submitJson(
      '/api/knowledge/claims',
      {
        claim: String(form.get('claim') ?? ''),
        category: String(form.get('category') ?? 'backend'),
        evidence_strength: String(form.get('evidence_strength') ?? 'medium'),
        confidence: Number(form.get('confidence') ?? 0.75),
        resume_usable: true,
        best_role_archetypes: String(form.get('role_archetypes') ?? '')
          .split(',')
          .map((role) => role.trim())
          .filter(Boolean),
        do_not_overclaim: String(form.get('do_not_overclaim') ?? '')
          .split('\n')
          .map((rule) => rule.trim())
          .filter(Boolean),
        source_evidence_ids: [String(form.get('evidence_source_id') ?? '')].filter(Boolean),
      },
      setClaimState
    )
  }

  async function handleContactSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)

    await submitJson(
      '/api/network/contacts',
      {
        full_name: String(form.get('contact_name') ?? ''),
        company_name: String(form.get('company') ?? ''),
        role_title: String(form.get('role_title') ?? ''),
        seniority: String(form.get('seniority') ?? 'unknown'),
        relationship_strength: String(form.get('relationship_strength') ?? 'unknown'),
        email: String(form.get('email') ?? '') || null,
        referral_ok: form.get('referral_ok') === 'on',
        reminder_preference: 'before_applying',
        notes: String(form.get('notes') ?? '') || null,
      },
      setContactState
    )
  }

  return (
    <div className="grid gap-5 xl:grid-cols-3">
      <FieldGroup title="Evidence Vault" icon="inventory_2">
        <form onSubmit={handleEvidenceSubmit} className="space-y-4">
          <Input id="evidence_title" name="evidence_title" label="Evidence title" required />
          <div className="space-y-1.5">
            <label htmlFor="evidence_text" className="block label-sm text-on-surface-muted">
              Evidence text
            </label>
            <textarea
              id="evidence_text"
              name="evidence_text"
              rows={6}
              required
              className="w-full bg-surface-card text-on-surface text-sm px-3 py-2.5 rounded-[10px] border border-border-subtle outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-on-surface-muted/50 resize-none"
            />
          </div>
          <div className="flex items-center justify-between gap-3">
            <StatusLine state={evidenceState} />
            <Button type="submit" size="sm">Save evidence</Button>
          </div>
        </form>
      </FieldGroup>

      <FieldGroup title="Professional Claims" icon="verified">
        <form onSubmit={handleClaimSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="claim" className="block label-sm text-on-surface-muted">
              Claim
            </label>
            <textarea
              id="claim"
              name="claim"
              rows={4}
              required
              className="w-full bg-surface-card text-on-surface text-sm px-3 py-2.5 rounded-[10px] border border-border-subtle outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-on-surface-muted/50 resize-none"
            />
          </div>
          <Input id="evidence_source_id" name="evidence_source_id" label="Evidence source ID" required />
          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-1.5">
              <span className="block label-sm text-on-surface-muted">Category</span>
              <select name="category" className="w-full h-9 bg-surface-card text-on-surface text-sm px-3 rounded-[10px] border border-border-subtle">
                <option value="backend">Backend</option>
                <option value="full_stack">Full-stack</option>
                <option value="ai_ml">AI/ML</option>
                <option value="quant">Quant</option>
                <option value="consulting">Consulting</option>
              </select>
            </label>
            <label className="space-y-1.5">
              <span className="block label-sm text-on-surface-muted">Evidence strength</span>
              <select name="evidence_strength" className="w-full h-9 bg-surface-card text-on-surface text-sm px-3 rounded-[10px] border border-border-subtle">
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </label>
          </div>
          <Input id="confidence" name="confidence" label="Confidence" type="number" min="0" max="1" step="0.05" defaultValue="0.8" />
          <Input id="role_archetypes" name="role_archetypes" label="Role archetypes" placeholder="backend, platform" />
          <div className="space-y-1.5">
            <label htmlFor="do_not_overclaim" className="block label-sm text-on-surface-muted">
              Do not overclaim
            </label>
            <textarea
              id="do_not_overclaim"
              name="do_not_overclaim"
              rows={3}
              className="w-full bg-surface-card text-on-surface text-sm px-3 py-2.5 rounded-[10px] border border-border-subtle outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-on-surface-muted/50 resize-none"
            />
          </div>
          <div className="flex items-center justify-between gap-3">
            <StatusLine state={claimState} />
            <Button type="submit" size="sm">Save claim</Button>
          </div>
        </form>
      </FieldGroup>

      <FieldGroup title="Networking Graph" icon="hub">
        <form onSubmit={handleContactSubmit} className="space-y-4">
          <Input id="contact_name" name="contact_name" label="Contact name" required />
          <Input id="company" name="company" label="Company" required />
          <Input id="role_title" name="role_title" label="Role title" required />
          <Input id="email" name="email" label="Email" type="email" />
          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-1.5">
              <span className="block label-sm text-on-surface-muted">Seniority</span>
              <select name="seniority" className="w-full h-9 bg-surface-card text-on-surface text-sm px-3 rounded-[10px] border border-border-subtle">
                <option value="unknown">Unknown</option>
                <option value="mid">Mid</option>
                <option value="senior">Senior</option>
                <option value="manager">Manager</option>
                <option value="recruiter">Recruiter</option>
              </select>
            </label>
            <label className="space-y-1.5">
              <span className="block label-sm text-on-surface-muted">Relationship</span>
              <select name="relationship_strength" className="w-full h-9 bg-surface-card text-on-surface text-sm px-3 rounded-[10px] border border-border-subtle">
                <option value="unknown">Unknown</option>
                <option value="weak">Weak</option>
                <option value="warm">Warm</option>
                <option value="strong">Strong</option>
              </select>
            </label>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="notes" className="block label-sm text-on-surface-muted">
              Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={4}
              className="w-full bg-surface-card text-on-surface text-sm px-3 py-2.5 rounded-[10px] border border-border-subtle outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-on-surface-muted/50 resize-none"
            />
          </div>
          <label className="flex items-center gap-2 text-xs text-white/60">
            <input name="referral_ok" type="checkbox" className="h-4 w-4 rounded border-white/20 bg-surface-card" />
            Referral OK
          </label>
          <div className="flex items-center justify-between gap-3">
            <StatusLine state={contactState} />
            <Button type="submit" size="sm">Save contact</Button>
          </div>
        </form>
      </FieldGroup>
    </div>
  )
}
