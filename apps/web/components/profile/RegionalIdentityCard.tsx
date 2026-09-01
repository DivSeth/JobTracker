'use client'
import { ChevronDown, ChevronRight } from 'lucide-react'
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
  isOpen: boolean
  onToggle: () => void
  onDeleted: (id: string) => void
  appProfiles: AppProfileOption[]
}

export function RegionalIdentityCard({ identity, isOpen, onToggle, onDeleted, appProfiles }: Props) {
  const countrySummary = (identity.country_codes ?? []).join(', ')
  const label = identity.label ?? 'New region'

  return (
    <article className="rounded-lg border bg-surface-card overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-surface-container/40 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          {isOpen
            ? <ChevronDown size={16} className="text-on-surface-muted shrink-0" />
            : <ChevronRight size={16} className="text-on-surface-muted shrink-0" />
          }
          <span className="font-medium text-sm">{label}</span>
          {countrySummary && (
            <span className="text-xs text-on-surface-muted">· {countrySummary}</span>
          )}
        </div>
        {identity.is_default && (
          <span className="text-[10px] uppercase tracking-wider text-primary font-semibold">Default</span>
        )}
      </button>
      {isOpen && (
        <div className="border-t border-border-subtle">
          <RegionalIdentityForm initial={identity} onDeleted={onDeleted} appProfiles={appProfiles} />
        </div>
      )}
    </article>
  )
}
