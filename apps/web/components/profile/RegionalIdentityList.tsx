'use client'
import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { RegionalIdentityCard } from './RegionalIdentityCard'
import type { RegionalIdentityUpdate } from '@/lib/schemas/regional-identity'

type Stored = RegionalIdentityUpdate & { id: string }

interface AppProfileOption {
  id: string
  name: string
  is_default: boolean
}

interface Props {
  initial: Stored[]
  appProfiles: AppProfileOption[]
}

const DEFAULT_NEW: Omit<Stored, 'id'> = {
  label: 'New region',
  country_codes: ['US'],
  is_default: false,
  email: '',
  country: 'US',
}

export function RegionalIdentityList({ initial, appProfiles }: Props) {
  const [items, setItems] = useState<Stored[]>(initial)
  const [openIds, setOpenIds] = useState<Set<string>>(new Set())
  const [creating, setCreating] = useState(false)
  const newCardRef = useRef<HTMLDivElement | null>(null)

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
        setOpenIds(new Set([created.id]))
      }
    } finally {
      setCreating(false)
    }
  }

  useEffect(() => {
    if (newCardRef.current) {
      setTimeout(() => {
        newCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 50)
    }
  }, [items.length])

  function handleDeleted(id: string) {
    setItems((prev) => prev.filter((it) => it.id !== id))
    setOpenIds((prev) => { const next = new Set(prev); next.delete(id); return next })
  }

  function toggleOpen(id: string) {
    setOpenIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id) } else { next.add(id) }
      return next
    })
  }

  const newestId = items[items.length - 1]?.id

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          {items.length} Region{items.length !== 1 ? 's' : ''}
        </h2>
        <Button onClick={handleAdd} disabled={creating}>
          + Add region
        </Button>
      </div>
      <div className="space-y-4">
        {items.map((it) => (
          <div
            key={it.id}
            ref={it.id === newestId ? newCardRef : null}
          >
            <RegionalIdentityCard
              identity={it}
              isOpen={openIds.has(it.id)}
              onToggle={() => toggleOpen(it.id)}
              onDeleted={handleDeleted}
              appProfiles={appProfiles}
            />
          </div>
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
