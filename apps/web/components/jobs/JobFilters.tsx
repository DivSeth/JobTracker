'use client'

export type FilterTab = 'all' | 'new_grad' | 'internship' | 'fulltime'

interface Props {
  active: FilterTab
  onChange: (tab: FilterTab) => void
}

const TABS: { value: FilterTab; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'new_grad', label: 'New Grad' },
  { value: 'internship', label: 'Internship' },
  { value: 'fulltime', label: 'Fulltime' },
]

export function JobFilters({ active, onChange }: Props) {
  return (
    <div className="flex bg-[#0a0a0a] rounded-lg p-1 border border-white/5 gap-0.5">
      {TABS.map(tab => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={`px-3 py-1.5 text-[11px] font-semibold rounded-md transition-all cursor-pointer ${
            active === tab.value
              ? 'bg-white/10 text-white'
              : 'text-white/45 hover:text-white'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
