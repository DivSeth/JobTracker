'use client'
import { RegionalIdentityForm } from './RegionalIdentityForm'
import type { RegionalIdentityUpdate } from '@/lib/schemas/regional-identity'

type Stored = RegionalIdentityUpdate & { id: string }

interface Props {
  identity: Stored
  onDeleted: (id: string) => void
}

export function RegionalIdentityCard({ identity, onDeleted }: Props) {
  return (
    <article className="rounded-lg border bg-surface-card">
      <RegionalIdentityForm initial={identity} onDeleted={onDeleted} />
    </article>
  )
}
