'use client'
import { useRouter } from 'next/navigation'
import { JobFilters } from '@/components/jobs/JobFilters'
import type { JobType } from '@/lib/types'

interface Props { active: JobType | 'all' }

export function JobFiltersClient({ active }: Props) {
  const router = useRouter()
  return (
    <JobFilters
      active={active}
      onChange={(tab: string) => {
        const params = new URLSearchParams()
        if (tab !== 'all') params.set('type', tab)
        router.push(`/jobs${params.toString() ? `?${params}` : ''}`)
      }}
    />
  )
}
