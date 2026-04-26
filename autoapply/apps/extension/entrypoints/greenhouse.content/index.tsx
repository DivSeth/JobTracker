import React, { useState } from 'react'
import ReactDOM from 'react-dom/client'
import PreviewPanel, { type DuplicateInfo } from './App'
import './style.css'
import { mapProfileToFields } from '@/lib/greenhouse/mapper'
import { scanGreenhouseForm } from '@/lib/greenhouse/scanner'
import type { ExtensionMessage } from '@/utils/messages'
import { isGreenhouseApplicationPage } from '@/lib/greenhouse/page-detector'
import { detectJobCountry } from '@/lib/greenhouse/country-detector'
import { selectRegionalIdentity } from '@/lib/greenhouse/regional-selection'
import { getBaseIdentity, getRegionalIdentities } from '@/utils/storage'
import { mergeActiveIdentity } from '@/utils/identity'
import type { StoredRegionalIdentity } from '@/utils/identity'

declare global {
  interface Window {
    __autoapplyRegionalBlockId?: string
  }
}

type StoredProfile = {
  id: string
  name?: string | null
  [key: string]: unknown
}

type FillProfileResponse = {
  profile: StoredProfile | null
  userIdentity: unknown | null
}

async function sendMessage<T>(message: ExtensionMessage | { type: 'FILL_STARTED'; payload: { profileId?: string | null } }) {
  return (await chrome.runtime.sendMessage(message)) as T
}

function PickerPanel({
  candidates,
  onPick,
}: {
  candidates: StoredRegionalIdentity[]
  onPick: (id: string) => void
}) {
  return (
    <div className="fixed right-4 top-1/2 z-[2147483647] w-[400px] max-w-[calc(100vw-32px)] -translate-y-1/2 rounded-xl border border-outline-variant bg-surface p-4 font-body text-on-surface shadow-[0_24px_80px_rgba(0,0,0,0.16)]">
      <div className="space-y-3">
        <h2 className="text-base font-semibold">Which region for this job?</h2>
        <div className="flex flex-wrap gap-2">
          {candidates.map((c) => (
            <button
              key={c.id}
              className="rounded-lg border border-primary px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/10"
              onClick={() => onPick(c.id)}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default defineContentScript({
  matches: [
    '*://boards.greenhouse.io/*/jobs/*',
    '*://boards.greenhouse.io/*/apply/*',
    '*://job-boards.greenhouse.io/*/jobs/*',
  ],
  runAt: 'document_idle',
  cssInjectionMode: 'ui',
  async main(ctx) {
    if (isGreenhouseApplicationPage()) {
      chrome.runtime.sendMessage({
        type: 'ATS_PAGE_DETECTED',
        payload: {
          platform: 'greenhouse' as const,
          url: window.location.href,
        },
      })
    }

    let root: ReactDOM.Root | null = null

    const ui = await createShadowRootUi(ctx, {
      name: 'autoapply-greenhouse-preview',
      position: 'overlay',
      alignment: 'top-right',
      anchor: 'body',
      append: 'last',
      zIndex: 2147483647,
      onMount: (container) => {
        root = ReactDOM.createRoot(container)
        return root
      },
      onRemove: () => {
        root?.unmount()
        root = null
      },
    })

    function promptRegionPicker(candidates: StoredRegionalIdentity[]): Promise<StoredRegionalIdentity> {
      return new Promise((resolve) => {
        if (!ui.mounted) ui.mount()
        root?.render(
          <React.StrictMode>
            <PickerPanel
              candidates={candidates}
              onPick={(id) => {
                const picked = candidates.find((c) => c.id === id)!
                resolve(picked)
              }}
            />
          </React.StrictMode>
        )
      })
    }

    async function showPreview(profileId?: string | null) {
      const [fillData, _mappings, duplicateInfo, base, regional] = await Promise.all([
        sendMessage<FillProfileResponse>({
          action: 'getProfileForFill',
          payload: { profileId: profileId ?? null },
        }),
        sendMessage({
          action: 'getFieldMappings',
          payload: { platform: 'greenhouse' },
        }),
        sendMessage<DuplicateInfo>({
          action: 'checkDuplicateApplication',
          payload: { applyUrl: window.location.href },
        }),
        getBaseIdentity(),
        getRegionalIdentities(),
      ])

      const applicationProfile = fillData.profile
      if (!applicationProfile?.id) return

      let userProfile: Record<string, unknown>

      if (base?.firstName) {
        // New 02-07 path: merge base + regional
        const selection = selectRegionalIdentity({
          blocks: regional,
          detectedCountry: detectJobCountry(document),
          chosenId: window.__autoapplyRegionalBlockId ?? null,
        })

        if (selection.reason === 'none') {
          // No regional identities — show blocker
          if (!ui.mounted) ui.mount()
          root?.render(
            <React.StrictMode>
              <div className="fixed right-4 top-1/2 z-[2147483647] w-[400px] max-w-[calc(100vw-32px)] -translate-y-1/2 rounded-xl border border-outline-variant bg-surface p-4 font-body text-on-surface shadow-[0_24px_80px_rgba(0,0,0,0.16)]">
                <p className="text-sm">
                  Add at least one regional identity at{' '}
                  <a href="https://autoapply.app/profile" className="text-primary underline">
                    autoapply.app/profile
                  </a>{' '}
                  before filling.
                </p>
              </div>
            </React.StrictMode>
          )
          return
        }

        let chosen = selection.selected
        if (!chosen && selection.candidates) {
          chosen = await promptRegionPicker(selection.candidates)
          window.__autoapplyRegionalBlockId = chosen.id
        }

        userProfile = mergeActiveIdentity(base, chosen!) as unknown as Record<string, unknown>
      } else {
        // Legacy fallback: use old userIdentity from storage
        const storageData = await chrome.storage.local.get(['userIdentity'])
        userProfile = (fillData.userIdentity ?? storageData.userIdentity ?? {}) as Record<string, unknown>
      }

      const mappedFields = mapProfileToFields(
        { userProfile, applicationProfile },
        scanGreenhouseForm()
      )

      if (!ui.mounted) {
        ui.mount()
      }

      root?.render(
        <React.StrictMode>
          <PreviewPanel
            duplicateInfo={duplicateInfo?.exists ? duplicateInfo : { exists: false }}
            mappedFields={mappedFields}
            onDismiss={() => ui.remove()}
            profileId={applicationProfile.id}
            profileName={applicationProfile.name ?? 'Selected Profile'}
          />
        </React.StrictMode>
      )
    }

    chrome.runtime.onMessage.addListener((message: { type?: string; payload?: { profileId?: string | null } }) => {
      if (message.type === 'FILL_STARTED') {
        void showPreview(message.payload?.profileId ?? null)
      }
    })
  },
})
