// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cancelSubmissionWatch, watchForSubmissionConfirmation } from './detector'

beforeEach(() => {
  document.body.innerHTML = '<main id="app"></main>'
  window.history.replaceState({}, '', '/apply')
  vi.useFakeTimers()
})

afterEach(() => {
  cancelSubmissionWatch()
  vi.useRealTimers()
})

describe('watchForSubmissionConfirmation', () => {
  it('detects URL change to /confirmation path', async () => {
    const pending = watchForSubmissionConfirmation(1_000)

    window.history.pushState({}, '', '/jobs/confirmation')
    await expect(pending).resolves.toBeUndefined()
  })

  it('detects URL change to /thank-you path', async () => {
    const pending = watchForSubmissionConfirmation(1_000)

    window.history.replaceState({}, '', '/jobs/thank-you')
    await expect(pending).resolves.toBeUndefined()
  })

  it('detects DOM mutation with "application submitted" text', async () => {
    const pending = watchForSubmissionConfirmation(1_000)

    document.body.appendChild(Object.assign(document.createElement('div'), { textContent: 'Application submitted successfully.' }))
    await expect(pending).resolves.toBeUndefined()
  })

  it('detects DOM mutation with "thank you for applying" text', async () => {
    const pending = watchForSubmissionConfirmation(1_000)

    document.body.appendChild(Object.assign(document.createElement('p'), { textContent: 'Thank you for applying to Acme.' }))
    await expect(pending).resolves.toBeUndefined()
  })

  it('resolves exactly once when multiple confirmation signals fire', async () => {
    const pending = watchForSubmissionConfirmation(1_000)

    window.history.pushState({}, '', '/jobs/confirmation')
    document.body.appendChild(Object.assign(document.createElement('div'), { textContent: 'Application submitted.' }))
    await expect(pending).resolves.toBeUndefined()
  })

  it('times out after the provided timeout without detection', async () => {
    const pending = watchForSubmissionConfirmation(250)
    const rejection = expect(pending).rejects.toThrow('Submission confirmation not detected')

    await vi.advanceTimersByTimeAsync(250)
    await rejection
  })

  it('cleans up listeners and observer on detection', async () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')
    const disconnectSpy = vi.spyOn(MutationObserver.prototype, 'disconnect')

    const pending = watchForSubmissionConfirmation(1_000)

    document.body.appendChild(Object.assign(document.createElement('div'), { textContent: 'Confirmation received.' }))
    await expect(pending).resolves.toBeUndefined()

    expect(removeEventListenerSpy).toHaveBeenCalledWith('popstate', expect.any(Function))
    expect(disconnectSpy).toHaveBeenCalledTimes(1)

    removeEventListenerSpy.mockRestore()
    disconnectSpy.mockRestore()
  })
})
