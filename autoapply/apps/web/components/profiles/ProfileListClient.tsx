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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {profiles.map(profile => (
          <ProfileCard
            key={profile.id}
            profile={profile}
            onSetDefault={handleSetDefault}
            onDuplicate={handleDuplicate}
            onDelete={handleDelete}
          />
        ))}
      </div>

      {/* Delete confirmation dialog */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-surface-card rounded-2xl shadow-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-base font-semibold text-on-surface mb-2">
              Delete &ldquo;{deleteTarget.name}&rdquo;?
            </h3>
            <p className="text-sm text-on-surface-muted mb-6">
              This cannot be undone. All profile data including resume and cover letter will be permanently removed.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                className="px-4 py-2 text-sm text-on-surface-muted hover:text-on-surface transition-colors rounded-xl"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-4 py-2 text-sm font-medium text-white bg-error rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
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
