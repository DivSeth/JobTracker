'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Star, MoreVertical, Trash2, Copy } from 'lucide-react'
import { cn } from '@/lib/utils'
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

  function handleCardClick() {
    router.push(`/profiles/${profile.id}`)
  }

  function handleStarClick(e: React.MouseEvent) {
    e.stopPropagation()
    onSetDefault(profile.id)
  }

  function handleMenuClick(e: React.MouseEvent) {
    e.stopPropagation()
    setMenuOpen(open => !open)
  }

  function handleDuplicate(e: React.MouseEvent) {
    e.stopPropagation()
    setMenuOpen(false)
    onDuplicate(profile.id)
  }

  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation()
    setMenuOpen(false)
    onDelete(profile.id)
  }

  return (
    <div className="relative">
      <div
        className="bg-surface-card rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer overflow-hidden flex"
        onClick={handleCardClick}
      >
        {/* Left indicator strip */}
        <div
          className={cn(
            'w-1 self-stretch shrink-0',
            profile.is_default ? 'bg-primary' : 'bg-outline-variant/15'
          )}
        />

        {/* Content area */}
        <div className="flex-1 p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-semibold font-display text-on-surface truncate">
                  {profile.name}
                </h3>
                {profile.is_default && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-primary text-white shrink-0">
                    Default
                  </span>
                )}
              </div>
              <p className="text-xs text-on-surface-muted mt-1">
                {filled}/{total} fields &middot; {formatRelativeTime(profile.updated_at)}
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                aria-label={
                  profile.is_default
                    ? `Remove ${profile.name} as default profile`
                    : `Set ${profile.name} as default profile`
                }
                onClick={handleStarClick}
                className={cn(
                  'p-1.5 rounded-lg transition-colors hover:bg-surface-container',
                  profile.is_default ? 'text-primary' : 'text-on-surface-muted'
                )}
              >
                <Star
                  size={16}
                  fill={profile.is_default ? 'currentColor' : 'none'}
                />
              </button>
              <div className="relative">
                <button
                  type="button"
                  aria-label={`More actions for ${profile.name}`}
                  onClick={handleMenuClick}
                  className="p-1.5 rounded-lg transition-colors hover:bg-surface-container text-on-surface-muted"
                >
                  <MoreVertical size={16} />
                </button>
                {menuOpen && (
                  <div className="absolute right-0 top-full mt-1 w-36 bg-surface-card rounded-xl shadow-md z-10 py-1 border border-on-surface/5">
                    <button
                      type="button"
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-on-surface hover:bg-surface-container transition-colors"
                      onClick={handleDuplicate}
                    >
                      <Copy size={14} />
                      Duplicate
                    </button>
                    <button
                      type="button"
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-error hover:bg-surface-container transition-colors"
                      onClick={handleDelete}
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Close menu on outside click */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setMenuOpen(false)}
        />
      )}
    </div>
  )
}
