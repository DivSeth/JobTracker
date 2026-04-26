'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { RegionalIdentityCard } from './RegionalIdentityCard'
import type { RegionalIdentityUpdate } from '@/lib/schemas/regional-identity'

type Stored = RegionalIdentityUpdate & { id: string }

interface Props {
  initial: Stored[]
}

const DEFAULT_NEW: Omit<Stored, 'id'> = {
  label: 'New region',
  country_codes: ['US'],
  is_default: false,
  email: '',
  country: 'US',
}

export function RegionalIdentityList({ initial }: Props) {
  const [items, setItems] = useState<Stored[]>(initial)
  const [creating, setCreating] = useState(false)

  async function handleAdd() {
    setCreating(true)
    try {
      const res = await fetch('/api/profile/regional-identities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(DEFAULT_NEW),
      })
      if (res.ok) {
        const created = (await res.json()) as Stored
        setItems((prev) => [...prev, created])
      }
    } finally {
      setCreating(false)
    }
  }

  function handleDeleted(id: string) {
    setItems((prev) => prev.filter((it) => it.id !== id))
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Regional Identities</h2>
        <Button onClick={handleAdd} disabled={creating}>
          + Add region
        </Button>
      </div>
      <div className="space-y-4">
        {items.map((it) => (
          <RegionalIdentityCard key={it.id} identity={it} onDeleted={handleDeleted} />
        ))}
        {items.length === 0 && (
          <p className="rounded-lg border border-dashed p-6 text-center text-sm text-on-surface-muted">
            No regions yet. Add at least one before the extension can auto-fill applications.
          </p>
        )}
      </div>
    </section>
  )
}
