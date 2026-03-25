# Feature Landscape

**Domain:** Job application automation platform -- browser extension auto-fill, application profiles, referral systems, recruiter outreach, interview prep, success analytics
**Researched:** 2026-03-25
**Overall Confidence:** MEDIUM (training data knowledge of Simplify, LazyApply, Sonara, Huntr, Teal; web search unavailable for latest competitor updates)

---

## Table Stakes

Features users expect. Missing = product feels incomplete or users choose a competitor.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Auto-fill basic text fields** (name, email, phone, address, LinkedIn URL) | Every auto-fill tool does this. Simplify does it. Chrome native autofill does it. Must be at least as good as browser default. | Low | Foundation -- if this breaks, nothing else matters. |
| **Workday multi-page form navigation** | Workday is the most common ATS for enterprise internships (FAANG, banks, consulting). If the tool cannot handle Workday, it is useless for the target user. | Very High | Workday spans 5-8 pages with dynamic field rendering, XHR-loaded dropdowns, conditional sections. This is the hardest engineering problem in the product. |
| **Greenhouse form fill** | Second most common ATS for tech companies. Single-page forms with standard HTML inputs. | Medium | Much simpler than Workday. Good starting point for development. |
| **Multiple application profiles** | Users applying to SWE and quant roles need different resumes, skill lists, and screening answers. Single-profile forces users to manually override every time -- worse than no tool. | Medium | Core data model: named profiles with role_type, resume, skills, work history, education, EEO, custom answers. |
| **Resume file upload** | Every application requires a resume. Extension must inject files into file input elements and drag-drop zones. | Medium | Workday uses custom upload widgets. Greenhouse uses standard `input[type=file]`. Must support both. PDF minimum. |
| **EEO / demographic field handling** | Workday, Greenhouse, and enterprise ATS forms require race, gender, veteran status, disability status. Users fill these identically every time. | Low | Store once per profile. Dropdown value mapping per ATS is the challenge -- different option IDs for same values. |
| **Application confirmation detection** | After submit, users need to know it worked. Extension should detect success and log to tracker. | Medium | Varies wildly by ATS: confirmation pages, redirects, inline toasts. Heuristic detection with ATS-specific selectors. |
| **Extension popup with status** | Users need "ready to fill" / "filling..." / "complete" feedback. Without this, the extension feels broken. | Low | Standard chrome.action popup UI. |
| **Application tracking sync** | After auto-filling, the application should appear in the dashboard Kanban. No manual entry. | Low | Extension sends POST to existing `/api/applications` endpoint. |
| **Basic personal analytics** | Total apps sent, response rate, status breakdown, activity over time. Huntr and Teal both show this. | Low | Data already exists from Phase 3. Surface aggregate stats on dashboard. |
| **Cover letter attachment** | Many applications require or allow cover letters. Must support attaching a stored cover letter per profile. | Low | Store default cover letter per profile. Upload and attach. |

---

## Differentiators

Features that set AutoApply apart. Not expected, but create competitive advantage and moats.

### Tier 1: Core Differentiators (build in near-term phases)

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Q&A memory bank** | Remember answers to custom screening questions across applications. "Why do you want to work at X?" answered once per company type, reused intelligently. No competitor does this. Simplify just skips unknown fields. | High | Needs: question fingerprinting (normalize variants), fuzzy matching (vector similarity or edit distance), per-user answer store. The compounding value is the moat -- more apps = smarter bank. |
| **Unknown question handling: pause-and-ask vs AI-generate** | Two modes: cautious users see unknown questions and answer manually (answers saved to bank). Power users let AI generate from profile context. User chooses per-profile. | High | The UX toggle is the killer decision. Default to pause-and-ask (safer). AI-generate is Pro tier. |
| **Gmail-powered lifecycle auto-tracking** | Already built (Phase 3). Auto-detect rejections, interview invites, offers from email. Competitors require manual status updates. This is a genuine moat -- zero effort for the user. | Already built | Extend: ensure extension-submitted apps link to Gmail tracking. |
| **Interview prep auto-generation** | When Gmail detects interview invite, auto-generate: company research brief, role-specific questions, STAR story prompts, technical topic checklist, day-by-day prep timeline. Zero manual trigger. | Medium | Input: company + role + JD. Output: structured prep package. Gemini Flash handles this. Calendar integration already exists for timeline. |
| **AI-personalized cover letter generation** | Generate role-specific cover letters from profile + JD + Q&A bank context. Not template-fill -- contextual writing that references specific company initiatives and role requirements. | Medium | Gemini Flash. Differentiation: use Q&A bank answers for genuine personalization. Pro tier feature. |
| **Ghost detection with re-engagement** | Already built (Phase 3). Extend: when app is ghosted, suggest next actions -- follow-up email template, LinkedIn message to recruiter, re-application timing. | Low | Ghost detection exists. Adding actionable next steps is incremental but high-value. |
| **Profile-to-ATS field mapping preview** | Before filling, show a visual map: "Name -> First Name field, Resume -> Upload widget, GPA -> not found (will skip)." Builds confidence. No competitor does this. | Low | Quick win differentiator. Shows users what will happen before it happens. |

### Tier 2: Network-Effect Differentiators (build after user base exists)

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Success pattern analytics (aggregate)** | "Applicants with 3+ matching skills get 2.3x more callbacks." "Tuesday submissions outperform Friday by 15%." Data-driven application strategy from anonymized platform data. | Very High | Requires 500+ active users minimum for statistical significance. k-anonymization (min group size 10). This is a network-effect feature -- gets better with more users. |
| **Referral marketplace with credit system** | Connect applicants with verified employees at target companies. Referrers earn credits: referral submitted (5), interview reached (15), offer (50). Credits redeemable for Pro features. | Very High | Two-sided marketplace cold-start problem. Need referrers AND applicants. Do NOT build until 1000+ active applicant users. |
| **Multi-channel recruiter outreach** | AI-personalized cold emails to recruiters/hiring managers. Sent via user's connected Gmail. Track opens/replies. Follow-up sequences. | High | Recruiter contact discovery is the hard part (email pattern guessing + verification). Start email-only. Never automate LinkedIn. |
| **Cohort benchmarking** | "You're in the top 25% of applicants for response rate this month." Compare against anonymized peers in same graduation year / role category. | Medium | Requires aggregate data pool. Motivational feature that increases engagement. |
| **Company-level intelligence** | "Company X: 12% interview rate from cold apps. Average response time: 8 days. Most common screening questions: [list]." Aggregated from all users' experiences. | High | Extremely valuable -- like Glassdoor for application outcomes. Needs data volume. |

---

## Anti-Features

Features to explicitly NOT build. These seem appealing but damage the product.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Mass auto-apply / spray-and-pray** | LazyApply's model: apply to 100+ jobs automatically without user review. Gets users blacklisted by ATS platforms (Workday detects and blocks). Produces terrible match quality. Makes the product feel spammy. ATS vendors actively fight this. | One-click apply with user review. Show the filled form, let user confirm, then submit. Speed without recklessness. |
| **LinkedIn automation / bot messaging** | LinkedIn detects and bans automated accounts. Users lose their professional network. Legal risk under CFAA. Multiple documented ban waves. | Generate personalized message templates. User copy-pastes manually. Never make API calls to LinkedIn. |
| **Headless browser submission** | Puppeteer/Playwright submission without visible browser is detectable via canvas fingerprinting, WebGL, and navigation patterns. ATS vendors flag these. | Content script in real browser. User's actual Chrome session. Visible form filling. |
| **CAPTCHA solving** | Ethically dubious, technically fragile, constant arms race. reCAPTCHA v3 detects automation signals beyond just the challenge. | Pause auto-fill at CAPTCHA. Notify user to solve manually. Resume after. |
| **Resume builder** | Teal and Jobscan already do this well. Building a resume builder is a full product. Dilutes focus from application automation. | Accept uploaded resumes (PDF). Parse for auto-fill data. Recommend existing resume tools. |
| **Video interview practice** | Full video recording + AI body language analysis is an entire product (Pramp, Interviewing.io). Enormous infrastructure (video storage, ML models) for marginal value. | Text-based prep: questions, model answers, STAR prompts, technical checklists. Link to external mock interview platforms. |
| **In-app job board / employer postings** | Competing with Indeed, LinkedIn, Glassdoor is impossible. Distracts from core value. | Aggregate from existing ATS APIs (already built). Be the application layer, not the discovery layer. |
| **Salary negotiation tools** | Niche post-offer feature (tiny funnel). levels.fyi owns this space. | Show salary data from JSearch enrichment. Link to levels.fyi. |
| **Automated interview scheduling** | Too many edge cases (timezone, availability, rescheduling, multi-round). High risk of scheduling errors that damage candidacy. | Surface interview invites with one-click calendar add (existing Gmail + Calendar integration). |
| **Background auto-apply without user presence** | Users need to review each application for accuracy and customization. Blind submission leads to incorrect answers, wrong resume versions, and damaged candidacy. | Show filled form for review. User clicks submit. |

---

## Feature Deep Dives

### 1. Browser Extension Auto-Fill

**Competitor landscape:**
- **Simplify:** Chrome extension detecting ATS forms, auto-fills from profile. Supports Greenhouse, Lever, partial Workday. Free tier with daily limits, premium unlimited. Estimated 500K+ users.
- **LazyApply:** More aggressive -- fills and submits without review. Higher ban rate. Premium-only ($30-50/mo).
- **Sonara:** AI-driven job matching + auto-apply. Less granular form control. Newer entrant.

**What AutoApply should build (ATS adapter priority):**

| ATS Platform | Priority | Target User Coverage | Complexity |
|-------------|----------|---------------------|------------|
| Workday | P0 | ~40% of enterprise internships | Very High |
| Greenhouse | P0 | ~25% of tech company jobs | Medium |
| Lever | P1 | ~15% of tech company jobs | Medium |
| Ashby | P2 | ~5% growing (startups) | Medium |
| SmartRecruiters | P2 | ~5% | Medium |
| iCIMS | P3 (defer) | ~5% (enterprise/legacy) | High |
| Taleo | P3 (defer) | ~3% (legacy, declining) | Very High |

**Extension architecture requirements:**

| Component | Purpose | Complexity |
|-----------|---------|------------|
| Content script (per ATS) | DOM manipulation, field detection, value injection | High (per ATS) |
| Background service worker | State management, API communication, message routing | Medium |
| Extension popup | Profile selection, status display, settings | Low |
| ATS detector | URL + DOM pattern matching to identify which ATS is active | Low |
| Field mapper | Map profile fields to ATS input elements (CSS selectors, name/id attributes) | High (per ATS) |
| Page navigator (Workday) | Multi-page navigation with wait-for-load between pages | Very High |
| File injector | Handle `input[type=file]`, drag-drop zones, custom upload widgets | High |
| Confirmation detector | Detect success/failure after submission | Medium |

**Key Workday challenges:**
- Dynamic dropdowns load values via XHR (school names, degree types, countries). Must trigger dropdown, wait for options to load, then select.
- Multi-page forms: Personal Info -> Work History -> Education -> Skills -> EEO -> Custom Questions. Each page renders dynamically.
- "Add Another" buttons create new form sections for additional work history / education entries. Must handle variable-count sections.
- Custom questions per employer are completely unpredictable. This is where the Q&A bank earns its value.
- Session timeouts: Workday sessions expire. Long fills may fail mid-process.

### 2. Application Profiles

**Full field inventory (Workday-parity):**

| Category | Fields | Notes |
|----------|--------|-------|
| **Identity** | Full name, preferred name, email, phone, address (street/city/state/zip/country), LinkedIn, GitHub, portfolio URL | Every ATS asks. Store once. |
| **Education** | School name, degree type, major, minor, GPA, graduation date, relevant coursework | Multi-entry. Workday requires exact school name match from their dropdown -- store the canonical name. |
| **Work History** | Company, title, location, start date, end date, current flag, description (bullet points) | Multi-entry. Descriptions should be parsed bullet points for flexibility. |
| **Skills** | Technical skills with optional proficiency levels, certifications (name, issuer, date) | Tag-based. Feeds job scoring AND auto-fill. |
| **EEO / Demographics** | Gender, race/ethnicity, veteran status, disability status, citizenship/work authorization | Stored encrypted (PII). Used only for auto-fill. Never for analytics. |
| **Standard Screening** | Work authorization, visa sponsorship needed, willing to relocate, salary expectations, available start date, years of experience | Frequently asked. Store default answers. |
| **Custom Q&A Bank** | Question text + answer pairs, tagged by category (motivation, technical, behavioral) | Grows over time as user encounters new questions. Fuzzy-matched to new questions. |
| **Documents** | Resume (PDF), cover letter (PDF or text), transcript, work samples | Per-profile. Different resume per role type. |

**Profile UX:**
- Named profiles: "SWE - Frontend", "Quant Research", "Data Science"
- Clone profile: duplicate and modify (don't re-enter everything)
- Default profile: auto-selected in extension popup
- Profile completeness indicator: "85% complete -- add work history for better auto-fill"

### 3. Referral Marketplace

**How it should work:**

| Phase | Component | Description |
|-------|-----------|-------------|
| Pre-marketplace | Referral request form | Applicant requests referral for a specific job. Captures: target company, role, their profile. Stored in DB. No matching yet. |
| v1 | Referrer registration | Employees register with company email verification (send code to @company.com email). Verified badge. |
| v1 | Matching + request flow | Applicant sees "Request Referral" on jobs where verified referrers exist. Referrer receives request with applicant's profile. Accept/decline. |
| v1 | Credit system | Referrers earn credits on milestones. Credits unlock Pro features (not cash initially). |
| v2 | Trust + reputation | Rating system (did the referrer actually submit?), LinkedIn verification, max 10 referrals/month per referrer to prevent spam. |
| v2 | Communication | Minimal in-app messaging between matched pairs. Template-based to reduce abuse. |

**Credit economy:**

| Event | Credits Earned | Rationale |
|-------|---------------|-----------|
| Referral submitted | 5 | Low bar, encourages participation |
| Applicant reaches interview | 15 | Signal of referral quality |
| Applicant receives offer | 50 | High-value outcome |
| Referrer-applicant both confirm hire | 100 | Ultimate success metric |

**Credit redemption:**
- 50 credits = 1 month Pro tier
- 200 credits = lifetime Pro tier (aggressive but drives viral growth)
- Future: cash redemption at $0.10/credit (only after funding)

**Cold-start strategy:**
1. Launch referral REQUEST form immediately (one-sided -- applicants request, you see demand)
2. Manually recruit referrers from target companies via founder's network
3. Partner with college career centers (career advisors have alumni networks)
4. Launch full marketplace only when you have 50+ verified referrers across 20+ companies AND 1000+ active applicant users

### 4. Recruiter Outreach

**System design:**

| Component | Description | Complexity |
|-----------|-------------|------------|
| Recruiter contact discovery | Given company + role: find recruiter/HM email. Pattern-based (firstname.lastname@company.com) + verification via SMTP check. | High |
| Email personalization engine | Input: job posting + user profile + company info. Output: 3-4 sentence personalized email expressing interest. Gemini Flash. | Medium |
| Send via connected Gmail | Use existing Gmail OAuth to send from user's actual email. Feels authentic, not spammy. | Low (OAuth exists) |
| Open/reply tracking | Embed tracking pixel (optional). Or poll Gmail API for replies to sent messages. | Medium |
| Follow-up sequencing | If no reply in 5 days, auto-draft follow-up. Max 2 follow-ups total. User approves before send. | Medium |
| LinkedIn message templates | Generate connection request note + follow-up DM. User copies manually. Never automate. | Low |
| Rate limiting + compliance | Max 10 outreach emails/day/user. Unsubscribe link in every email. CAN-SPAM compliance. | Low |

**Contact discovery approaches (in order of reliability):**
1. Company careers page -- sometimes lists recruiter contact
2. Email pattern guess + SMTP verification (free, 60-70% accuracy)
3. Hunter.io API (paid, $49/mo for 500 lookups -- consider as Pro tier cost)
4. Apollo.io API (paid, expensive -- defer)

**Launch approach:** Start with email-only. Generate drafts, user reviews and sends. Track responses. LinkedIn is copy-paste templates only.

### 5. Interview Prep

**Auto-triggered prep package structure:**

| Section | Content | Source | Complexity |
|---------|---------|--------|------------|
| **Company Brief** | Overview, founding year, headcount, recent funding, tech stack, mission | Public sources (Crunchbase data, company website). Cache per company. | Medium |
| **Role Analysis** | Key requirements extracted from JD, skills match/gap vs user profile, seniority signals | Job description + user profile. Existing scoring data. | Low |
| **Behavioral Questions** | 5-7 likely behavioral questions based on role type + company culture. STAR story suggestions from user's work history. | Gemini Flash generation. Role-type question banks as seed data. | Medium |
| **Technical Topics** | Checklist of topics to review based on JD keywords. "Review: distributed systems, SQL optimization, React performance." | Keyword extraction from JD + curated topic-to-study-resource mapping. | Low |
| **Prep Timeline** | Day-by-day schedule from now until interview date. "Day 1: Company research. Day 2: Behavioral stories. Day 3-4: Technical review." | Days until interview (from deadline extractor). Template-based. | Low |
| **Calendar Events** | Auto-create prep reminders in Google Calendar leading up to interview. | Existing Calendar API integration. | Low |

**What NOT to build:** Video recording, AI speech analysis, peer matching, live mock interviews. These are entire products.

### 6. Success Pattern Analytics

**Two tiers:**

**Tier A: Personal Analytics (launch immediately, data exists)**

| Metric | Source | Value |
|--------|--------|-------|
| Application funnel | Applications table status counts | "You've applied to 85 jobs, got 12 OAs, 4 interviews, 1 offer" |
| Response rate | Status transitions over time | "Your response rate is 14%, up from 8% last month" |
| Time to first response | Application created_at vs first status change | "Average 11 days. Companies with referrals: 6 days." |
| Activity heatmap | Application timestamps | "You apply most on Sundays. Response rates are higher for Tuesday-Thursday submissions." |
| Resume version performance | Track which profile/resume was used per application | "Your SWE profile has a 18% response rate vs 9% for your general profile" |
| Ghost rate by company | Ghosted status + company grouping | "Company X: 100% ghost rate across 5 apps. Consider deprioritizing." |

**Tier B: Aggregate Analytics (defer until 500+ users)**

| Metric | Requirements | Value |
|--------|-------------|-------|
| Optimal submission timing | 1000+ applications with timestamp + outcome data | "Tuesday 10am-2pm submissions get 15% more callbacks" |
| Skill match thresholds | Scoring data + outcome data across users | "Applicants with 60%+ skill match get 2.3x more interviews" |
| Company responsiveness rankings | Application + outcome data across users per company | "Top 10 most responsive companies for SWE internships" |
| Resume characteristic signals | Resume metadata + outcomes (requires resume parsing) | "Resumes with 3-5 bullet points per role outperform 6+" |
| Referral lift measurement | Referral vs non-referral application outcomes | "Referrals increase interview rate by 4.2x at Company X" |

**Privacy requirements for aggregate analytics:**
- k-anonymization: minimum group size of 10 for any reported segment
- No individual user data ever exposed to other users
- Users opt-in to anonymous data pool (default: opted out)
- Show confidence intervals, not just point estimates
- Dashboard shows "Based on N=847 applications" style attribution

---

## Feature Dependencies

```
Application Profiles -----> Browser Extension Auto-Fill
                              |
                              +--> Unknown Field Detection
                              |       |
                              |       +--> Q&A Memory Bank
                              |               |
                              |               +--> AI Answer Generation (from bank context)
                              |
                              +--> Application Confirmation Detection
                                      |
                                      +--> Application Tracking Sync (auto-create records)

Gmail Integration (built) -----> Interview Prep Auto-Trigger
                            |
                            +--> Ghost Detection Re-Engagement
                            |
                            +--> Recruiter Outreach (send via Gmail)

Job Scoring (built) -----> Profile-to-ATS Field Mapping Preview

User Base (1000+) -----> Referral Marketplace (need two-sided liquidity)
                    |
                    +--> Aggregate Success Analytics (need data volume)
                    |
                    +--> Company-Level Intelligence (need data breadth)

Q&A Memory Bank -----> AI Cover Letter Generation (bank provides personalization context)
```

**Critical path:** Profiles -> Extension -> Q&A Bank -> complete auto-fill loop. Everything else layers on top.

---

## MVP Recommendation

### Phase 4: Core Auto-Fill Loop (ASAP -- the product does not exist without this)

1. **Application profiles with Workday-parity fields** -- the data layer everything depends on
2. **Browser extension: Greenhouse auto-fill** -- start with the simpler ATS, validate the approach
3. **Browser extension: Workday auto-fill** -- the hard one, the one that matters most
4. **Profile selector popup** -- choose which profile to apply with
5. **Resume file upload injection** -- every app needs this
6. **Unknown field detection with pause-and-ask** -- surface unknowns, let user answer
7. **Application confirmation detection + tracking sync** -- close the loop

### Phase 5: Intelligence Extensions (Summer 2026)

8. **Q&A memory bank** -- save answers from Phase 4 unknowns, reuse across apps
9. **AI answer generation for unknown questions** -- Pro tier, opt-in
10. **Interview prep auto-generation** -- triggered by existing Gmail pipeline
11. **AI cover letter generation** -- Gemini Flash, per-profile + per-JD
12. **Personal funnel analytics dashboard** -- surface data that already exists
13. **Ghost detection re-engagement suggestions** -- actionable next steps

### Phase 6: Network Effects (Summer 2026 -- only after user traction)

14. **Referral request form** (one-sided: applicants request, gauge demand)
15. **Recruiter outreach: email drafts + send** -- leverage Gmail OAuth
16. **Lever + Ashby auto-fill support** -- expand ATS coverage
17. **Profile-to-ATS field mapping preview** -- confidence builder

### Phase 7: Marketplace + Analytics (defer until metrics justify)

18. **Referral marketplace** (full two-sided, with verified referrers and credit system)
19. **Aggregate success pattern analytics** -- only after 500+ active users
20. **Company-level intelligence** -- aggregated application outcome data
21. **Cohort benchmarking** -- peer comparison

### Defer Indefinitely

- **Native mobile app** -- web + extension covers the entire workflow
- **Taleo / iCIMS support** -- legacy enterprise ATS, add only on proven demand
- **LinkedIn automation** -- legal risk. Templates only, forever.
- **Batch auto-apply** -- high ban risk, validates the "spray and pray" anti-pattern
- **Resume builder** -- separate product, existing tools serve this
- **Video interview prep** -- separate product

---

## Competitive Positioning

| Feature Area | Simplify | LazyApply | Sonara | AutoApply (Target) |
|-------------|----------|-----------|--------|-------------------|
| Auto-fill extension | Good (GH, Lever, partial Workday) | Aggressive (mass-apply, ban risk) | Limited | Deep Workday + Greenhouse with Q&A bank |
| Application tracking | Basic list | None | Basic | Kanban + Gmail auto-tracking (built) |
| AI intelligence | Minimal | None | Job matching only | Email classification, scoring, ghost detection, insights (built) |
| Interview prep | None | None | None | Auto-triggered prep packages |
| Referral system | None | None | None | Credit-based marketplace (planned) |
| Recruiter outreach | None | None | None | AI-personalized email via Gmail (planned) |
| Success analytics | None | None | None | Personal + aggregate patterns (planned) |
| Pricing | Freemium ($5-8/mo pro) | Premium-only ($30-50/mo) | Premium-only | Freemium (student-friendly) |

**AutoApply's moat thesis:** The intelligence layer (Gmail tracking + AI classification + ghost detection) combined with the Q&A memory bank creates compounding value -- the more you use it, the smarter it gets at filling forms and predicting outcomes. Competitors are stateless form-fillers. AutoApply remembers and learns.

---

## Sources and Confidence

| Claim | Confidence | Basis |
|-------|------------|-------|
| Simplify feature set and market position | MEDIUM | Training data (pre-May 2025). Features may have evolved. |
| LazyApply mass-apply model and ban risk | MEDIUM | Training data. Well-documented approach. |
| Workday form complexity and multi-page structure | HIGH | Consistent across all sources, well-known in ATS automation. |
| Chrome Manifest V3 requirement | HIGH | Google enforced starting 2024. |
| LinkedIn automation ban risk | HIGH | Consistently enforced. Multiple documented ban waves. |
| Two-sided marketplace cold-start dynamics | HIGH | Foundational marketplace economics. |
| k-anonymization requirements for aggregate data | HIGH | Standard privacy practice. |
| CAN-SPAM compliance for email outreach | HIGH | Federal law. |
| Competitor lack of interview prep / referral / outreach | MEDIUM | Based on training data. Competitors may have added features since May 2025. |
| ATS market share estimates (Workday 40%, Greenhouse 25%, etc.) | LOW | Rough estimates from training data. Actual percentages vary by industry segment. |

**Gaps requiring validation:**
- Current Simplify feature set (may have added features post-training cutoff)
- Workday latest DOM structure (Workday updates their UI; extension selectors may need frequent updates)
- Greenhouse and Lever form structure stability
- Hunter.io / Apollo.io current pricing and API capabilities for recruiter discovery
- Actual ATS platform distribution for college internship applications specifically
