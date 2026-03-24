'use client'

import { useRouter, useSearchParams } from 'next/navigation'

export function SortControl() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sort = searchParams.get('sort') ?? 'company'

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('sort', e.target.value)
    router.push(`/jobs?${params}`)
  }

  return (
    <select
      value={sort}
      onChange={handleChange}
      className="bg-surface-card border-0 text-sm text-on-surface rounded-xl px-3 py-1.5 outline-none focus:ring-2 focus:ring-primary/20 shadow-ambient"
    >
      <option value="company">Company (A–Z)</option>
      <option value="title">Title (A–Z)</option>
      <option value="date">Date Added</option>
    </select>
  )
}
