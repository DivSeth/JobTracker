import React from 'react'
import ReactDOM from 'react-dom/client'
import PreviewPanel, { type DuplicateInfo } from './App'
import './style.css'
import { mapProfileToFields } from '@/lib/greenhouse/mapper'
import { scanGreenhouseForm } from '@/lib/greenhouse/scanner'
import type { ExtensionMessage } from '@/utils/messages'
import { isGreenhouseApplicationPage } from '@/lib/greenhouse/page-detector'

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

    async function showPreview(profileId?: string | null) {
      const [fillData, _mappings, storageData, duplicateInfo] = await Promise.all([
        sendMessage<FillProfileResponse>({
          action: 'getProfileForFill',
          payload: { profileId: profileId ?? null },
        }),
        sendMessage({
          action: 'getFieldMappings',
          payload: { platform: 'greenhouse' },
        }),
        chrome.storage.local.get(['userIdentity']),
        sendMessage<DuplicateInfo>({
          action: 'checkDuplicateApplication',
          payload: { applyUrl: window.location.href },
        }),
      ])

      const applicationProfile = fillData.profile
      if (!applicationProfile?.id) return

      const userProfile = fillData.userIdentity ?? storageData.userIdentity ?? null
      const mappedFields = mapProfileToFields(
        {
          userProfile: (userProfile ?? {}) as Record<string, unknown>,
          applicationProfile,
        },
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
