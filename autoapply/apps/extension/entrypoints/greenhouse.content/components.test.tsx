// @vitest-environment jsdom
import React from 'react'
import ReactDOM from 'react-dom/client'
import { act } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { FillProgressBar } from './FillProgressBar'
import { FillResultBanner } from './FillResultBanner'
import { MappingRow } from './MappingRow'
import { SubmissionToast } from './SubmissionToast'
import { UnmappedRow } from './UnmappedRow'

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

let container: HTMLDivElement
let root: ReactDOM.Root

function renderNode(node: React.ReactNode) {
  ;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
  container = document.createElement('div')
  document.body.appendChild(container)
  root = ReactDOM.createRoot(container)

  act(() => {
    root.render(node)
  })
}

afterEach(() => {
  if (root) {
    act(() => {
      root.unmount()
    })
  }
  container?.remove()
})

describe('MappingRow', () => {
  it('renders Greenhouse label and profile value', () => {
    renderNode(
      <MappingRow
        field={{ selector: '#first_name', name: 'first_name', label: 'First Name', type: 'text', required: true }}
        isMasked={false}
        profileValue="Jane"
        status="pending"
      />
    )

    expect(container.textContent).toContain('First Name')
    expect(container.textContent).toContain('Jane')
  })

  it('renders CheckCircle2 icon when status is filled', () => {
    renderNode(
      <MappingRow
        field={{ selector: '#first_name', name: 'first_name', label: 'First Name', type: 'text', required: true }}
        isMasked={false}
        profileValue="Jane"
        status="filled"
      />
    )

    expect(container.querySelector('[data-testid="status-filled"]')).not.toBeNull()
  })

  it('renders gray Circle icon when status is pending', () => {
    renderNode(
      <MappingRow
        field={{ selector: '#first_name', name: 'first_name', label: 'First Name', type: 'text', required: true }}
        isMasked={false}
        profileValue="Jane"
        status="pending"
      />
    )

    expect(container.querySelector('[data-testid="status-pending"]')).not.toBeNull()
  })
})

describe('UnmappedRow', () => {
  it('renders Greenhouse label and "No match" text', () => {
    renderNode(
      <UnmappedRow
        field={{ selector: '#portfolio', name: 'portfolio', label: 'Portfolio', type: 'url', required: false }}
      />
    )

    expect(container.textContent).toContain('Portfolio')
    expect(container.textContent).toContain('No match')
  })

  it('renders AlertTriangle icon in amber', () => {
    renderNode(
      <UnmappedRow
        field={{ selector: '#portfolio', name: 'portfolio', label: 'Portfolio', type: 'url', required: false }}
      />
    )

    expect(container.querySelector('[data-testid="unmapped-icon"]')).not.toBeNull()
  })
})

describe('FillProgressBar', () => {
  it('renders progress bar with correct fill percentage', () => {
    renderNode(<FillProgressBar completed={3} total={4} />)

    const progressbar = container.querySelector('[role="progressbar"]') as HTMLElement
    expect(progressbar.style.width).toBe('75%')
  })

  it('displays "Filling N of M fields..." text', () => {
    renderNode(<FillProgressBar completed={2} total={5} />)

    expect(container.textContent).toContain('Filling 2 of 5 fields...')
  })
})

describe('FillResultBanner', () => {
  it('shows success message when all fields filled', () => {
    renderNode(
      <FillResultBanner
        onClose={vi.fn()}
        result={{ total: 2, filled: 2, skipped: 0, errors: 0, results: [] }}
      />
    )

    expect(container.textContent).toContain('Application fields filled successfully.')
  })

  it('shows partial message with skipped count', () => {
    renderNode(
      <FillResultBanner
        onClose={vi.fn()}
        result={{ total: 3, filled: 2, skipped: 1, errors: 0, results: [] }}
      />
    )

    expect(container.textContent).toContain('Filled 2, skipped 1, errors 0.')
  })

  it('shows error message with error count', () => {
    const onClose = vi.fn()

    renderNode(
      <FillResultBanner
        onClose={onClose}
        result={{ total: 3, filled: 1, skipped: 0, errors: 2, results: [] }}
      />
    )

    expect(container.textContent).toContain('Some fields failed to fill.')
    const button = Array.from(container.querySelectorAll('button')).find(
      (element) => element.textContent === 'Close Panel'
    ) as HTMLButtonElement
    button.click()
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})

describe('SubmissionToast', () => {
  it('renders message and icon', () => {
    renderNode(<SubmissionToast message="Application tracked!" onDismiss={() => {}} />)

    expect(container.querySelector('[role="status"]')).not.toBeNull()
    expect(container.textContent).toContain('Application tracked!')
  })

  it('calls onDismiss after duration', async () => {
    vi.useFakeTimers()
    const onDismiss = vi.fn()

    renderNode(<SubmissionToast duration={1000} message="Done" onDismiss={onDismiss} />)

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000)
    })

    expect(onDismiss).toHaveBeenCalledTimes(1)
    vi.useRealTimers()
  })
})
