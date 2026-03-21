'use client'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

export type FilterTab = 'all' | 'new_grad' | 'internship' | 'fulltime'

interface Props {
  active: FilterTab
  onChange: (tab: FilterTab) => void
}

export function JobFilters({ active, onChange }: Props) {
  return (
    <Tabs value={active} onValueChange={v => onChange(v as FilterTab)}>
      <TabsList>
        <TabsTrigger value="all">All</TabsTrigger>
        <TabsTrigger value="new_grad">New Grad</TabsTrigger>
        <TabsTrigger value="internship">Internship</TabsTrigger>
        <TabsTrigger value="fulltime">Fulltime</TabsTrigger>
      </TabsList>
    </Tabs>
  )
}
