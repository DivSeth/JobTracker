export default defineContentScript({
  matches: ['*://*.myworkdayjobs.com/*'],
  runAt: 'document_idle',
  main() {
    // Detect Workday application form page by DOM selectors
    // Uses data-automation-id attributes which are stable across Workday versions (per WD-08)
    const isApplicationPage = !!(
      document.querySelector('[data-automation-id="jobPostingPage"]') ||
      document.querySelector('[data-automation-id="applyButton"]') ||
      document.querySelector('[data-automation-id="navigationPanel"]') ||
      // Fallback: check URL pattern for apply pages
      window.location.pathname.includes('/apply')
    )

    if (isApplicationPage) {
      chrome.runtime.sendMessage({
        type: 'ATS_PAGE_DETECTED',
        payload: {
          platform: 'workday' as const,
          url: window.location.href,
        },
      })
    }

    // Also detect navigation to apply page (Workday is a SPA)
    const observer = new MutationObserver(() => {
      const applyButton = document.querySelector('[data-automation-id="applyButton"]')
      if (applyButton) {
        chrome.runtime.sendMessage({
          type: 'ATS_PAGE_DETECTED',
          payload: {
            platform: 'workday' as const,
            url: window.location.href,
          },
        })
        observer.disconnect()
      }
    })

    observer.observe(document.body, { childList: true, subtree: true })
  },
})
