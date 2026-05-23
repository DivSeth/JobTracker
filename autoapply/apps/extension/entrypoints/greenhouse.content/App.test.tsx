// @vitest-environment jsdom
import React from 'react'
import ReactDOM from 'react-dom/client'
import { act } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import PreviewPanel from './App'
import type { FillResult, MappedField } from '@/lib/greenhouse/types'

const mocks = vi.hoisted(() => ({
  fillForm: vi.fn(),
  watchForSubmissionConfirmation: vi.fn(),
  cancelSubmissionWatch: vi.fn(),
}))

vi.mock('lucide-react', () => {
  const icon = (testId: string) => (props: Record<string, unknown>) =>
    React.createElement('svg', { 'data-testid': testId, ...props })

  return {
    AlertTriangle: icon('icon-alert-triangle'),
    CheckCircle2: icon('icon-check-circle'),
    ChevronRight: icon('icon-chevron-right'),
    Circle: icon('icon-circle'),
    Lock: icon('icon-lock'),
    XCircle: icon('icon-x-circle'),
  }
})

vi.mock('@/lib/greenhouse/filler', () => ({
  fillForm: mocks.fillForm,
}))

vi.mock('@/lib/greenhouse/detector', () => ({
  watchForSubmissionConfirmation: mocks.watchForSubmissionConfirmation,
  cancelSubmissionWatch: mocks.cancelSubmissionWatch,
}))

function createMappedField(overrides: Partial<MappedField> = {}): MappedField {
  return {
    field: {
      selector: '#first_name',
      name: 'first_name',
      label: 'First Name',
      type: 'text',
      required: true,
    },
    profileValue: 'Jane',
    profilePath: 'full_name',
    source: 'user_profile',
    transform: 'first_name',
    isMasked: false,
    ...overrides,
  }
}

function buildFillResult(): FillResult {
  return {
    total: 2,
    filled: 1,
    skipped: 1,
    errors: 0,
    results: [
      {
        field: createMappedField().field,
        status: 'filled',
      },
      {
        field: createMappedField({
          field: {
            selector: '#gender',
            name: 'gender',
            label: 'Gender',
            type: 'select',
            required: false,
          },
        }).field,
        status: 'skipped',
      },
    ],
  }
}

let container: HTMLDivElement
let root: ReactDOM.Root

function renderPanel(mappedFields: MappedField[], duplicateInfo = { exists: false }) {
  act(() => {
    root.render(
      <PreviewPanel
        duplicateInfo={duplicateInfo}
        mappedFields={mappedFields}
        onDismiss={vi.fn()}
        profileId="profile-1"
        profileName="Default Profile"
      />
    )
  })
}

beforeEach(() => {
  ;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
  mocks.fillForm.mockReset()
  mocks.watchForSubmissionConfirmation.mockReset()
  mocks.cancelSubmissionWatch.mockReset()
  mocks.watchForSubmissionConfirmation.mockResolvedValue(undefined)
  document.body.innerHTML = '<h1>Software Engineer</h1>'
  container = document.createElement('div')
  document.body.appendChild(container)
  root = ReactDOM.createRoot(container)
  vi.stubGlobal('chrome', {
    runtime: {
      sendMessage: vi.fn().mockResolvedValue({ id: 'application-1' }),
    },
  })
})

afterEach(() => {
  act(() => {
    root.unmount()
  })
})

describe('PreviewPanel', () => {
  it('renders "Review Field Mappings" heading in preview state', () => {
    renderPanel([createMappedField()])

    expect(container.textContent).toContain('Review Field Mappings')
    expect(container.textContent).toContain('Default Profile')
  })

  it('renders MappingRow for each mapped field with green checkmark', () => {
    renderPanel([createMappedField()])

    expect(container.textContent).toContain('First Name')
    expect(container.textContent).toContain('Jane')
    expect(container.querySelector('[data-testid="status-pending"]')).not.toBeNull()
  })

  it('renders UnmappedRow for fields with null profileValue', () => {
    renderPanel([
      createMappedField({
        field: {
          selector: '#portfolio',
          name: 'portfolio',
          label: 'Portfolio',
          type: 'url',
          required: false,
        },
        profileValue: null,
        profilePath: null,
        source: null,
      }),
    ])

    expect(container.textContent).toContain('Portfolio')
    expect(container.textContent).toContain('No match')
  })

  it('renders lock icon with "[protected]" for isMasked fields (D-02)', () => {
    renderPanel([
      createMappedField({
        field: {
          selector: '#gender',
          name: 'gender',
          label: 'Gender',
          type: 'select',
          required: false,
        },
        profileValue: 'Female',
        isMasked: true,
      }),
    ])

    expect(container.querySelector('[data-testid="masked-lock-icon"]')).not.toBeNull()
    expect(container.textContent).toContain('[protected]')
    expect(container.textContent).not.toContain('Female')
  })

  it('shows duplicate warning banner when duplicateInfo.exists is true (D-05)', () => {
    renderPanel([createMappedField()], { exists: true, appliedAt: '2026-03-31T12:00:00.000Z' })

    expect(container.textContent).toContain('You may have already applied here')
  })

  it('transitions to filling state on Confirm Fill click', async () => {
    let resolveFill: ((value: FillResult) => void) | null = null
    mocks.fillForm.mockImplementation(
      () =>
        new Promise<FillResult>((resolve) => {
          resolveFill = resolve
        })
    )

    renderPanel([createMappedField()])

    const button = Array.from(container.querySelectorAll('button')).find(
      (element) => element.textContent === 'Confirm Fill'
    ) as HTMLButtonElement

    await act(async () => {
      button.click()
    })

    expect(container.textContent).toContain('Filling 0 of 1 fields...')

    await act(async () => {
      resolveFill?.({
        total: 1,
        filled: 1,
        skipped: 0,
        errors: 0,
        results: [{ field: createMappedField().field, status: 'filled' }],
      })
      await Promise.resolve()
    })

    expect(container.textContent).toContain('Application fields filled successfully.')
  })

  it('transitions to complete state after fill resolves', async () => {
    mocks.fillForm.mockResolvedValue(buildFillResult())

    renderPanel([createMappedField()])

    const button = Array.from(container.querySelectorAll('button')).find(
      (element) => element.textContent === 'Confirm Fill'
    ) as HTMLButtonElement

    await act(async () => {
      button.click()
      await Promise.resolve()
    })

    expect(container.textContent).toContain('Fill completed with skipped fields.')
  })

  it('renders FillResultBanner with filled/skipped/errors in complete state', async () => {
    mocks.fillForm.mockResolvedValue(buildFillResult())

    renderPanel([createMappedField()])

    const button = Array.from(container.querySelectorAll('button')).find(
      (element) => element.textContent === 'Confirm Fill'
    ) as HTMLButtonElement

    await act(async () => {
      button.click()
      await Promise.resolve()
    })

    expect(container.textContent).toContain('Filled 1, skipped 1, errors 0.')
  })

  it('does not show the "Application tracked!" toast when trackApplication returns no id (D-06)', async () => {
    mocks.fillForm.mockResolvedValue(buildFillResult())
    vi.stubGlobal('chrome', {
      runtime: {
        sendMessage: vi.fn(async (msg: { action?: string }) => {
          if (msg.action === 'trackApplication') {
            return { success: false, error: 'network error' }
          }
          return { success: true }
        }),
      },
    })

    renderPanel([createMappedField()])

    const button = Array.from(container.querySelectorAll('button')).find(
      (element) => element.textContent === 'Confirm Fill'
    ) as HTMLButtonElement

    await act(async () => {
      button.click()
      await Promise.resolve()
    })
    await act(async () => {
      await Promise.resolve()
    })

    expect(container.textContent).not.toContain('Application tracked!')
  })
})
