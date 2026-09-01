let activeWatcherCleanup: (() => void) | null = null

function isConfirmationUrl(url: string): boolean {
  return /\/confirmation\b|\?confirmation\b|\/thank-you\b/i.test(url)
}

function hasConfirmationText(text: string): boolean {
  return /application.*submitted|thank you|confirmation/i.test(text)
}

export function cancelSubmissionWatch(): void {
  activeWatcherCleanup?.()
  activeWatcherCleanup = null
}

export function watchForSubmissionConfirmation(timeoutMs = 30000): Promise<void> {
  cancelSubmissionWatch()

  return new Promise((resolve, reject) => {
    const originalPushState = history.pushState.bind(history)
    const originalReplaceState = history.replaceState.bind(history)
    let settled = false
    let timeoutId: ReturnType<typeof setTimeout> | null = null
    let observer: MutationObserver | null = null

    const initialBodyText = document.body?.textContent ?? ''
    const matchedOnStart = hasConfirmationText(initialBodyText)

    const cleanup = () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }

      observer?.disconnect()
      window.removeEventListener('popstate', onLocationSignal)
      history.pushState = originalPushState
      history.replaceState = originalReplaceState

      if (activeWatcherCleanup === cleanup) {
        activeWatcherCleanup = null
      }
    }

    const settle = (fn: () => void) => {
      if (settled) return
      settled = true
      cleanup()
      fn()
    }

    const confirmIfMatched = () => {
      const currentBody = document.body?.textContent ?? ''
      if (
        isConfirmationUrl(window.location.href) ||
        (!matchedOnStart && hasConfirmationText(currentBody))
      ) {
        settle(resolve)
      }
    }

    const onLocationSignal = () => {
      confirmIfMatched()
    }

    history.pushState = function pushState(...args) {
      originalPushState(...args)
      onLocationSignal()
    }

    history.replaceState = function replaceState(...args) {
      originalReplaceState(...args)
      onLocationSignal()
    }

    observer = new MutationObserver(() => {
      confirmIfMatched()
    })

    if (document.body) {
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true,
      })
    }

    window.addEventListener('popstate', onLocationSignal)

    timeoutId = setTimeout(() => {
      settle(() => reject(new Error('Submission confirmation not detected')))
    }, timeoutMs)

    activeWatcherCleanup = () => {
      settle(() => reject(new Error('Submission watch cancelled')))
    }

    confirmIfMatched()
  })
}
