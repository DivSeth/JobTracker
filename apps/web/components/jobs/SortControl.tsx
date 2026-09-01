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
      className="bg-[#0d0d0d] border border-white/5 text-xs text-white rounded-lg px-3 py-1.5 outline-none focus:border-white/20 transition-colors cursor-pointer"
    >
      <option value="company">Company (A–Z)</option>
      <option value="title">Title (A–Z)</option>
      <option value="date">Date Added</option>
    </select>
  )
}
