'use client'

import { useRouter, useSearchParams } from 'next/navigation'

export function FilterDropdowns() {
  const router = useRouter()
  const searchParams = useSearchParams()

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value === 'all') {
      params.delete(key)
    } else {
      params.set(key, value)
    }
    router.push(`/jobs${params.toString() ? `?${params}` : ''}`)
  }

  const selectClass =
    'bg-surface-card border-0 text-sm text-on-surface rounded-xl px-3 py-1.5 outline-none focus:ring-2 focus:ring-primary/20 shadow-ambient'

  return (
    <>
      <select
        value={searchParams.get('country') ?? 'all'}
        onChange={e => updateParam('country', e.target.value)}
        className={selectClass}
      >
        <option value="all">All Locations</option>
        <option value="usa">USA</option>
        <option value="canada">Canada</option>
        <option value="uk">UK</option>
        <option value="india">India</option>
        <option value="germany">Germany</option>
        <option value="remote">Remote</option>
      </select>
      <select
        value={searchParams.get('role') ?? 'all'}
        onChange={e => updateParam('role', e.target.value)}
        className={selectClass}
      >
        <option value="all">All Roles</option>
        <option value="swe">Software Engineering</option>
        <option value="aiml">AI / ML</option>
        <option value="data">Data Science</option>
        <option value="other">Other</option>
      </select>
    </>
  )
}
