'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'

interface Props {
  profileId: string
  profileName: string
}

export function DeleteProfileButton({ profileId, profileName }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleConfirm() {
    setDeleting(true)
    await fetch(`/api/profiles/${profileId}`, { method: 'DELETE' })
    router.push('/profiles')
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-sm text-on-surface-muted hover:text-error transition-colors"
      >
        <Trash2 size={15} />
        Delete
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-surface-card rounded-2xl shadow-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-base font-semibold text-on-surface mb-2">
              Delete &ldquo;{profileName}&rdquo;?
            </h3>
            <p className="text-sm text-on-surface-muted mb-6">
              This cannot be undone. All profile data including resume and cover letter will be permanently removed.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                className="px-4 py-2 text-sm text-on-surface-muted hover:text-on-surface transition-colors rounded-xl"
                onClick={() => setOpen(false)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-4 py-2 text-sm font-medium text-white bg-error rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
                onClick={handleConfirm}
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
