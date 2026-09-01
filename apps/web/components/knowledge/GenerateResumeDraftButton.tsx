'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

type DraftState = 'idle' | 'saving' | 'saved' | 'error'

export function GenerateResumeDraftButton({ disabled }: { disabled: boolean }) {
  const [state, setState] = useState<DraftState>('idle')

  async function createDraft() {
    setState('saving')
    const response = await fetch('/api/artifacts/resume-drafts', { method: 'POST' })

    if (!response.ok) {
      setState('error')
      return
    }

    setState('saved')
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <Button type="button" size="sm" onClick={createDraft} disabled={disabled || state === 'saving'}>
        {state === 'saving' ? 'Creating...' : 'Create resume draft'}
      </Button>
      {state !== 'idle' ? (
        <p className={`text-xs ${state === 'error' ? 'text-red-300' : 'text-white/45'}`} role="status">
          {state === 'saved' ? 'Resume draft saved' : state === 'saving' ? 'Saving draft...' : 'Draft creation failed'}
        </p>
      ) : null}
    </div>
  )
}
