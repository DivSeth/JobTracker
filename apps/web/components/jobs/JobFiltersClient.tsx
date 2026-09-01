'use client'
import { useRouter, useSearchParams } from 'next/navigation'
import { JobFilters } from '@/components/jobs/JobFilters'
import type { JobType } from '@/lib/types'

interface Props { active: JobType | 'all' }

export function JobFiltersClient({ active }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  return (
    <JobFilters
      active={active}
      onChange={(tab: string) => {
        const params = new URLSearchParams(searchParams.toString())
        if (tab !== 'all') {
          params.set('type', tab)
        } else {
          params.delete('type')
        }
        router.push(`/jobs${params.toString() ? `?${params}` : ''}`)
      }}
    />
  )
}
