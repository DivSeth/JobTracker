'use client'
import { RegionalIdentityForm } from './RegionalIdentityForm'
import type { RegionalIdentityUpdate } from '@/lib/schemas/regional-identity'

type Stored = RegionalIdentityUpdate & { id: string }

interface AppProfileOption {
  id: string
  name: string
  is_default: boolean
}

interface Props {
  identity: Stored
  onDeleted: (id: string) => void
  appProfiles: AppProfileOption[]
}

export function RegionalIdentityCard({ identity, onDeleted, appProfiles }: Props) {
  return (
    <article className="rounded-lg border bg-surface-card">
      <RegionalIdentityForm initial={identity} onDeleted={onDeleted} appProfiles={appProfiles} />
    </article>
  )
}
