export default defineContentScript({
  matches: [
    '*://boards.greenhouse.io/*/jobs/*',
    '*://boards.greenhouse.io/*/apply/*',
    '*://job-boards.greenhouse.io/*/jobs/*',
  ],
  runAt: 'document_idle',
  main() {
    // Detect Greenhouse application form page
    const isApplicationPage = !!(
      document.querySelector('#application_form') ||
      document.querySelector('#main_fields') ||
      document.querySelector('.application-form') ||
      // URL-based detection for /apply/ pages
      window.location.pathname.includes('/apply')
    )

    if (isApplicationPage) {
      chrome.runtime.sendMessage({
        type: 'ATS_PAGE_DETECTED',
        payload: {
          platform: 'greenhouse' as const,
          url: window.location.href,
        },
      })
    }
  },
})
