'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ProfileCard } from './ProfileCard'
import type { ApplicationProfile } from '@/lib/types'

interface Props {
  profiles: ApplicationProfile[]
}

export function ProfileListClient({ profiles }: Props) {
  const router = useRouter()
  const [deleteTarget, setDeleteTarget] = useState<ApplicationProfile | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function handleSetDefault(id: string) {
    await fetch(`/api/profiles/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_default: true }),
    })
    router.refresh()
  }

  async function handleDuplicate(id: string) {
    await fetch(`/api/profiles/${id}/duplicate`, { method: 'POST' })
    router.refresh()
  }

  function handleDelete(id: string) {
    const profile = profiles.find(p => p.id === id)
    if (profile) setDeleteTarget(profile)
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    await fetch(`/api/profiles/${deleteTarget.id}`, { method: 'DELETE' })
    setDeleting(false)
    setDeleteTarget(null)
    router.refresh()
  }

  return (
    <>
      {profiles.map(profile => (
        <ProfileCard
          key={profile.id}
          profile={profile}
          onSetDefault={handleSetDefault}
          onDuplicate={handleDuplicate}
          onDelete={handleDelete}
        />
      ))}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0a0a0a] rounded-xl border border-white/10 p-6 max-w-md w-full mx-4">
            <h3 className="text-sm font-semibold text-white mb-2 uppercase tracking-wider">
              Delete &ldquo;{deleteTarget.name}&rdquo;?
            </h3>
            <p className="text-[12px] text-white/50 mb-6 leading-relaxed">
              This cannot be undone. All profile data including resume and cover letter will be permanently removed.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white/60 border border-white/10 rounded hover:bg-white/5 transition-colors"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-black bg-white rounded hover:bg-neutral-200 transition-all disabled:opacity-50"
                onClick={confirmDelete}
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
