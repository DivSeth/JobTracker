'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { ApplicationProfile } from '@/lib/types'

interface Props {
  profile: ApplicationProfile
  onSetDefault: (id: string) => void
  onDuplicate: (id: string) => void
  onDelete: (id: string) => void
}

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'Updated today'
  if (days === 1) return 'Updated yesterday'
  if (days < 30) return `Updated ${days}d ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `Updated ${months}mo ago`
  return `Updated ${Math.floor(months / 12)}y ago`
}

function countFields(profile: ApplicationProfile): { filled: number; total: number } {
  const total = 18
  let filled = 0
  if (profile.name) filled++
  if (profile.experience.length > 0) filled++
  if (profile.education.length > 0) filled++
  if (profile.skills.length > 0) filled++
  if (profile.certifications.length > 0) filled++
  if (profile.languages.length > 0) filled++
  if (profile.eeo_gender) filled++
  if (profile.eeo_race) filled++
  if (profile.eeo_veteran_status) filled++
  if (profile.eeo_disability_status) filled++
  if (profile.work_authorization) filled++
  if (profile.sponsorship_required !== null) filled++
  if (profile.resume_path) filled++
  if (profile.cover_letter_path) filled++
  return { filled, total }
}

export function ProfileCard({ profile, onSetDefault, onDuplicate, onDelete }: Props) {
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const { filled, total } = countFields(profile)
  const completionPct = Math.round((filled / total) * 100)

  return (
    <div className="relative">
      <div
        className={`bg-[#0a0a0a] rounded-xl border ${profile.is_default ? 'border-white/20' : 'border-white/5'} p-5 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center hover:border-white/15 transition-all cursor-pointer`}
        onClick={() => router.push(`/profiles/${profile.id}`)}
      >
        {/* Profile info */}
        <div className="flex items-start gap-4 flex-1">
          <div className="w-10 h-10 rounded bg-[#121212] border border-white/5 flex items-center justify-center text-white/80">
            <span className="material-symbols-outlined text-[20px]">description</span>
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h4 className="font-semibold text-xs text-white">{profile.name}</h4>
              {profile.is_default && (
                <span className="bg-white text-black text-[7px] font-bold px-1.5 py-0.5 rounded tracking-widest uppercase">
                  DEFAULT PRIMARY
                </span>
              )}
            </div>
            <p className="text-[10px] text-white/40 mt-1">
              {filled}/{total} fields · {formatRelativeTime(profile.updated_at)}
            </p>
            <div className="mt-2 h-[2px] w-32 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-white" style={{ width: `${completionPct}%` }} />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={e => { e.stopPropagation(); onSetDefault(profile.id) }}
            className="text-[10px] text-white/50 hover:text-white uppercase tracking-widest font-medium transition-colors"
          >
            {profile.is_default ? 'Default' : 'Set Default'}
          </button>
          <div className="relative">
            <button
              type="button"
              onClick={e => { e.stopPropagation(); setMenuOpen(o => !o) }}
              className="w-9 h-9 flex items-center justify-center border border-white/5 hover:border-white/20 transition-all rounded text-white/50 hover:text-white"
            >
              <span className="material-symbols-outlined text-[16px]">more_vert</span>
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 w-36 bg-[#121212] rounded-lg border border-white/10 z-10 py-1">
                <button
                  type="button"
                  className="w-full flex items-center gap-2 px-3 py-2 text-[11px] text-white/60 hover:text-white hover:bg-white/5 transition-colors"
                  onClick={e => { e.stopPropagation(); setMenuOpen(false); onDuplicate(profile.id) }}
                >
                  <span className="material-symbols-outlined text-[14px]">content_copy</span>
                  Duplicate
                </button>
                <button
                  type="button"
                  className="w-full flex items-center gap-2 px-3 py-2 text-[11px] text-white/60 hover:text-white hover:bg-white/5 transition-colors"
                  onClick={e => { e.stopPropagation(); setMenuOpen(false); onDelete(profile.id) }}
                >
                  <span className="material-symbols-outlined text-[14px]">delete</span>
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {menuOpen && (
        <div className="fixed inset-0 z-0" onClick={() => setMenuOpen(false)} />
      )}
    </div>
  )
}
