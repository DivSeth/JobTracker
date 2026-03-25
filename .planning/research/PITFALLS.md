# Domain Pitfalls

**Domain:** ATS auto-fill browser extension, referral marketplace, recruiter outreach, interview prep, analytics
**Researched:** 2026-03-25

## Critical Pitfalls

Mistakes that cause rewrites or major issues.

### Pitfall 1: Workday DOM Instability

**What goes wrong:** You build a Workday auto-filler that works perfectly, then Workday pushes a UI update and every selector breaks. This happens regularly -- Workday updates their frontend quarterly.
**Why it happens:** Workday uses dynamically generated class names and periodically restructures their component hierarchy. CSS selectors based on classes are fragile.
**Consequences:** Extension stops working for all Workday users simultaneously. Bad reviews, support tickets, user churn.
**Prevention:**
- Use `data-automation-id` attributes (Workday's accessibility hooks) instead of CSS classes. These are more stable because they serve accessibility testing purposes internal to Workday.
- Build a field mapping registry (declarative, not hardcoded) so updating selectors is a config change, not a code change.
- Add a health check that detects when expected fields are not found and gracefully degrades (shows "Workday form structure changed -- manual fill needed" instead of silently failing).
- Ship selector updates as extension config (fetched from Supabase) rather than requiring extension version updates through the Chrome Web Store review process.
**Detection:** Automated smoke tests that load a Workday sample page and verify field detection. Run daily.

### Pitfall 2: React/Angular State Desync from DOM Manipulation

**What goes wrong:** Extension sets `input.value = "John"` but Workday's React state still shows the field as empty. When user submits, the form sends empty values or validation errors fire.
**Why it happens:** React and Angular manage form state internally. Setting `.value` on the DOM element does not trigger their change detection. The ATS framework literally does not know you filled the field.
**Consequences:** Forms submit with missing data. Users get rejected or have to re-fill manually, defeating the purpose.
**Prevention:**
- After setting `.value`, dispatch a sequence of synthetic events: `new Event('input', { bubbles: true })`, `new Event('change', { bubbles: true })`, `new Event('blur', { bubbles: true })`.
- For React specifically, you may need to set the value via the React fiber's internal state setter. Look for `__reactFiber$` or `__reactInternalInstance$` on the DOM element.
- For dropdowns/selects, click the dropdown to open it, find the option element, and click it -- do not set `.value` on a `<select>`.
- Test each field type (text, dropdown, checkbox, radio, file, date picker) separately.
**Detection:** After filling each field, read back the value and compare. If mismatch, retry with event dispatch. Log mismatches for debugging.

### Pitfall 3: Chrome Web Store Review Rejection

**What goes wrong:** Extension is rejected during Chrome Web Store review for overly broad permissions, unclear purpose, or policy violations.
**Why it happens:** Manifest V3 review is strict. Common rejection reasons: requesting `<all_urls>` permission, unclear justification for `activeTab`, accessing browsing history, or the description not clearly explaining what the extension does.
**Consequences:** Blocked from launching. Each resubmission takes 1-7 business days for review.
**Prevention:**
- Request ONLY the permissions you need: `activeTab` (not `<all_urls>`), `storage`, `identity` (for Google OAuth).
- Use host permissions with specific URL patterns: `*://*.myworkdayjobs.com/*`, `*://boards.greenhouse.io/*` -- not wildcard.
- Write a clear, specific Chrome Web Store description explaining exactly what data the extension accesses and why.
- Include a privacy policy URL (required for extensions that handle user data).
- Do not inject content scripts on pages you do not need to fill.
**Detection:** Review Chrome Web Store policies before first submission. Use the Chrome Extension Developer Dashboard's pre-review checklist.

### Pitfall 4: Extension-Web App Auth Desync

**What goes wrong:** User is logged into the web app but the extension shows "not authenticated." Or the extension auth expires while the user is mid-fill.
**Why it happens:** The extension and web app run in separate contexts. Supabase auth tokens in the web app's cookies are not accessible to the extension. The extension needs its own auth flow.
**Consequences:** Users have to log in twice. Or worse, the extension silently loses auth and fails to save filled applications.
**Prevention:**
- Use `chrome.identity` API to handle Google OAuth in the extension, then exchange the Google token for a Supabase session via `supabase.auth.signInWithIdToken()`.
- Store the Supabase session in `chrome.storage.local` (not cookies).
- Background Worker refreshes the session proactively (before expiry, not on failure).
- When auth expires mid-fill, queue the filled data locally and sync when re-authenticated.
**Detection:** Background Worker pings Supabase auth status every 5 minutes. If expired, show a badge on the extension icon ("Login needed").

### Pitfall 5: File Upload Handling in Content Scripts

**What goes wrong:** Extension tries to auto-fill the resume upload field but cannot programmatically set a file input's value (browser security restriction).
**Why it happens:** Browsers block `input[type=file].value = ...` for security reasons. You cannot programmatically trigger a file selection dialog either.
**Consequences:** Resume upload (the most important field) does not work. Users still have to manually upload.
**Prevention:**
- Use `DataTransfer` API to create a synthetic file drop event. Create a `DataTransfer` object, add the file as a `File` object, and dispatch a `drop` event on the file input or its drop zone.
- Alternative: Use `chrome.downloads` API to make the resume file available, then use `input.files = dataTransfer.files` (works in Chromium).
- Store resume files in Supabase Storage. Background Worker fetches the file, Content Script creates a `File` object from the blob.
- Test this on EACH ATS platform -- they handle file uploads differently (some use drag-and-drop zones, some use click-to-upload dialogs).
**Detection:** Automated test that verifies file upload fills correctly on sample Workday and Greenhouse pages.

## Moderate Pitfalls

### Pitfall 6: Referral Marketplace Cold Start

**What goes wrong:** You build the marketplace but nobody lists themselves as a referrer, so applicants see an empty directory and leave.
**Why it happens:** Two-sided marketplace chicken-and-egg problem. Referrers will not list until there are applicants; applicants will not browse until there are referrers.
**Prevention:**
- Seed the referrer side first. Target the same college student demographic -- seniors who got hired can refer juniors. Frame it as "help your classmates" plus "earn credits for your own job search."
- Start with a small number of high-demand companies (FAANG, top finance firms) rather than trying to cover everything.
- Consider a "request a referral" model (applicant-initiated) rather than a "browse referrers" model (supply-initiated). This way the marketplace works even with few referrers -- each request is a targeted notification.

### Pitfall 7: Outreach Email Deliverability

**What goes wrong:** AI-generated cold emails land in spam folders. Users think the feature is broken.
**Why it happens:** Cold email is inherently high-spam-risk. If many users send similar-structured emails from a shared sending domain, email providers flag the pattern.
**Prevention:**
- Use Resend with a custom sending domain (not shared). Users connect their own domain or use AutoApply's verified domain.
- Vary email content significantly per recipient (Gemini should ensure this).
- Implement sending limits (max 20/day for free tier, 50/day for pro).
- Add unsubscribe links and physical address (CAN-SPAM compliance).
- Track bounce rates per user and throttle users with high bounces.

### Pitfall 8: Analytics Data Quality

**What goes wrong:** Success pattern analytics shows misleading correlations because the data is biased or insufficient.
**Why it happens:** Sample size too small. Survivorship bias (only tracking users who got callbacks, not the full population). Confounding variables (user at MIT gets callbacks regardless of resume format).
**Prevention:**
- Require minimum sample sizes before showing patterns (e.g., "Need 50+ applications to generate insights").
- Always show confidence intervals, not just percentages.
- Track negative outcomes too (rejections, ghosts), not just positive ones.
- Add disclaimers: "Correlation, not causation."
- Start with simple, defensible metrics: response rate by day-of-week, response rate by application speed (how quickly after posting).

### Pitfall 9: Workday Multi-Page Navigation Timing

**What goes wrong:** Extension clicks "Next" on Workday and immediately tries to fill the next page, but the page has not loaded yet. Fields are not in the DOM.
**Why it happens:** Workday's page transitions are client-side with loading spinners. The URL does not change. Standard `window.onload` does not fire.
**Prevention:**
- After clicking "Next", use MutationObserver to wait for the loading spinner to disappear AND new form fields to appear.
- Implement a state machine: `IDLE -> SCANNING -> FILLING -> NAVIGATING -> SCANNING -> ...`
- Add timeouts: if a page does not load within 10 seconds, show an error rather than hanging.
- Test with slow network conditions (Chrome DevTools throttling).

### Pitfall 10: Q&A Memory Bank Pollution

**What goes wrong:** The memory bank accumulates bad answers (user gave a placeholder answer, or a company-specific answer gets reused for the wrong company).
**Why it happens:** No review mechanism. Auto-save without user confirmation.
**Prevention:**
- Show saved answers before reuse: "Last time you answered this with: [answer]. Use it?"
- Allow users to edit, delete, and tag answers (general vs company-specific).
- Do not auto-save -- ask "Remember this answer for future applications?" after user provides it.

## Minor Pitfalls

### Pitfall 11: Extension Size Bloat

**What goes wrong:** Extension becomes >5MB, slowing Chrome startup and installation.
**Prevention:** Tree-shake aggressively. Do not bundle the Supabase JS client in content scripts (only in Background Worker). Use dynamic imports for ATS-specific fillers.

### Pitfall 12: Rate Limiting by ATS Platforms

**What goes wrong:** Filling forms too fast triggers Workday/Greenhouse rate limiting or bot detection.
**Prevention:** Add human-like delays between field fills (50-200ms random). Do not fill all fields simultaneously.

### Pitfall 13: Timezone Issues in Analytics

**What goes wrong:** "Best time to apply" analytics are wrong because application timestamps are in server timezone, not user timezone.
**Prevention:** Store all timestamps in UTC. Convert to user timezone for display. Analytics queries should group by user-local hour.

### Pitfall 14: Credit System Gaming

**What goes wrong:** Users create fake referrals to earn credits. Or referrers claim credit for referrals they did not actually submit.
**Prevention:** Require proof of referral (screenshot of submission confirmation, or confirmation from the referred applicant). Implement a review period before credits are awarded.

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Browser extension setup (WXT) | WXT version compatibility with MV3 changes | Pin WXT version, test with latest Chrome beta |
| Workday auto-fill | DOM instability + React state desync | data-automation-id selectors + full event dispatch |
| Greenhouse auto-fill | Simpler but still needs event dispatch | Test each field type individually |
| File upload | Browser security blocks programmatic file input | DataTransfer API approach |
| Extension auth | Desync with web app auth | chrome.identity + signInWithIdToken |
| Referral marketplace | Cold start problem | Seed referrer side, request-based model |
| Recruiter outreach | Email deliverability | Custom domain, content variation, sending limits |
| Interview prep | Over-reliance on AI quality | User edits + human review of generated content |
| Success analytics | Misleading correlations | Minimum sample sizes, confidence intervals |
| Chrome Web Store | Review rejection | Minimal permissions, clear description, privacy policy |

## Sources

- Chrome Extension Manifest V3 policies (training data)
- Workday DOM structure patterns (training data, commonly documented in developer forums)
- React synthetic event requirements (React documentation, training data)
- CAN-SPAM compliance requirements (standard knowledge)
- Two-sided marketplace cold start literature (standard product knowledge)
