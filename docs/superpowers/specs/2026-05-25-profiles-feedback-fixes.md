# Profiles & Autofill — Post-Launch Feedback Fixes

**Date:** 2026-05-25
**Branch:** phase/03-ui-overhaul
**Scope:** 7 issues discovered during first real-world test of the profiles/autofill redesign.

---

## 1. Regional Identity Accordion UX

### Problem
- All region cards render fully expanded — page is cluttered when multiple regions exist.
- "X active region" counter is hardcoded / not reactive to add/delete.
- Adding a new region dumps a card at the bottom with no visual cue.

### Design

**State:** `RegionalIdentityList` owns `openIds: Set<string>`. Default: all existing IDs collapsed on mount. Only the newly created ID is added to `openIds` after POST.

**Collapsed card:** Shows label + country codes as a one-line summary (e.g. "United States · US, CA") with a chevron toggle. Full form hidden.

**Add region flow:**
1. POST to create region.
2. Replace `openIds` with a new Set containing only the new ID (collapses all others).
3. After 50ms paint tick, call `scrollIntoView({ behavior: 'smooth', block: 'start' })` on the new card's ref.

**Count:** Header text is `{items.length} region{items.length !== 1 ? 's' : ''}` derived from state — updates on every add/delete.

**Files:** `RegionalIdentityList.tsx`, `RegionalIdentityCard.tsx`

---

## 2. EEO Fields Not Saving on Change

### Problem
`RegionalIdentityForm` EEO `<select>` fields call `set()` on `onChange` but never call `commit()`. Since selects don't reliably fire `onBlur`, changes are lost on navigation. Same issue applies to the Default Profile dropdown.

### Design
For every `<select>` in `RegionalIdentityForm`, call both `set()` and `patch({ [key]: value })` inline in the `onChange` handler. This matches the pattern already used by `CountryCodeChipInput`.

Fields affected: `eeo_gender`, `eeo_race`, `eeo_veteran_status`, `eeo_disability_status`, `default_profile_id`, `is_default` checkbox.

**Vercel env note (manual step):** The deployed site still has the old `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Update in Vercel Dashboard → Project Settings → Environment Variables → redeploy.

**Files:** `RegionalIdentityForm.tsx`

---

## 3. Resume Parsing Failure

### Problem
`pdf-parse` performs filesystem reads at startup that crash in Next.js serverless/Vercel environments. Errors are silently swallowed — user sees generic "Resume parsing failed" with no actionable info.

### Design

**PDF extraction:** Replace `pdf-parse` with `pdfjs-dist` (pure JS, no native deps, works in Vercel serverless). Extract text via `getTextContent()` on each page, join with newlines.

**Error surfacing:** Remove the top-level `try/catch` that swallows the actual error. Return `{ error: actualMessage }` with `status: 500` so the client can display it. The `ResumeUploadZone` already has a `parseError` state — populate it with the server's error message.

**Files:** `app/api/profiles/[id]/parse-resume/route.ts`

---

## 4. Experience Date Pickers

### Problem
`ApplicationProfileForm` uses plain `<input type="text">` for experience start/end dates, causing MM/DD vs DD/MM ambiguity and format errors.

### Design
Replace text inputs for `start` and `end` in the experience section with `<input type="month">`. This renders a native month+year picker (YYYY-MM value), matching the format already used in `ResumeParser` and expected by the DB schema.

The "Current" checkbox pattern (disabling the end input when `end === null`) stays unchanged.

**Files:** `ApplicationProfileForm.tsx`

---

## 5. Education Graduation Month + Skills Expansion

### Education month

**Problem:** `EducationEntry` only stores `graduation_year: number`. Job apps typically ask for both month and year.

**Design:**
- Add `graduation_month: number | null` to `EducationEntry` type and `applicationProfileSchema`.
- In both `ApplicationProfileForm` and `ResumeParser`: render a month dropdown (1–12, displayed as Jan–Dec) + year number input side by side.
- Resume parse prompt updated to extract graduation month (YYYY-MM format → split into month + year).
- `ResumeParseResult` education type updated to include `graduation_month`.

**Files:** `lib/types.ts`, `lib/schemas/application-profile.ts`, `ApplicationProfileForm.tsx`, `ResumeParser.tsx`, `parse-resume/route.ts`

### Skills list expansion

**Problem:** Current skills list is too small — users can't find niche/technical skills.

**Design:**
- Create `lib/profile/skills-list.ts` exporting `SKILLS: string[]` — a curated ~400-entry list covering:
  - Programming languages (Python, TypeScript, Go, Rust, Java, C++, etc.)
  - Frameworks (React, Next.js, Django, FastAPI, Spring, Rails, etc.)
  - Cloud/DevOps (AWS, GCP, Azure, Docker, Kubernetes, Terraform, CI/CD)
  - Data/ML (PyTorch, TensorFlow, Pandas, Spark, SQL, dbt, Airflow)
  - Design (Figma, Adobe XD, Illustrator, Sketch)
  - Soft skills (Leadership, Communication, Project Management, etc.)
  - Domain skills (Financial Modeling, Clinical Research, CAD, etc.)
- Free-form entry (typing a skill not in the list) remains fully supported.
- `TagInput` / skills combobox in `ApplicationProfileForm` consumes this list for autocomplete suggestions.

**Files:** `lib/profile/skills-list.ts` (new), `ApplicationProfileForm.tsx`

---

## 6. Export Data Button

### Problem
The export button on `/profile` has a `file_download` icon but no click handler — it does nothing.

### Design

**New route:** `GET /api/profile/export`
- Auth-gated: returns 401 if no session (same pattern as all other profile routes).
- Fetches: base identity (`profiles`), all regional identities (`user_regional_identities`), all app profiles (`application_profiles`) for the authenticated user.
- Returns: pretty-printed JSON `{ exportedAt, baseIdentity, regionalIdentities, applicationProfiles }`.

**Client:** The export button on the profile page becomes a client component. On click, calls `GET /api/profile/export`, receives JSON blob, triggers browser download via `URL.createObjectURL` + `<a download="autoapply-export.json">`.

**Files:** `app/api/profile/export/route.ts` (new), `app/(dashboard)/profile/page.tsx`

---

## 7. EEO Dropdown Autofill — ATS Alias Map

### Problem
Stored EEO values (e.g. "Decline to self-identify") don't match what Greenhouse/Discord/other ATS platforms render in their dropdowns (e.g. "I don't wish to answer", "I prefer not to say"). The fuzzy matcher in `fillSelectField` fails to bridge this gap reliably.

### Design

**New file:** `lib/greenhouse/eeo-aliases.ts`

```ts
// Maps our canonical stored values → known ATS phrasings
export const EEO_ALIASES: Record<string, string[]> = {
  'Decline to self-identify': [
    "I don't wish to answer",
    "I prefer not to say",
    "Prefer not to say",
    "Decline to self-identify",
    "Choose not to disclose",
    "I do not wish to provide this information",
    "Prefer to not say",
  ],
  'Male': ['Male', 'Man', 'He/Him'],
  'Female': ['Female', 'Woman', 'She/Her'],
  'Non-binary': ['Non-binary', 'Non-Binary', 'Nonbinary', 'They/Them', 'Gender non-conforming'],
  'Not a veteran': ['Not a veteran', 'I am not a protected veteran', 'No'],
  'Protected veteran': ['Protected veteran', 'I am a protected veteran', 'Yes'],
  'Yes': ['Yes', 'I have a disability'],
  'No': ['No', 'I do not have a disability'],
  // ... full list in implementation
}
```

**Integration:** `fillSelectField` in `lib/form-fill/events.ts` accepts an optional `aliases` map. The greenhouse filler passes `EEO_ALIASES` when filling EEO fields (identified by field pattern from the mapper). Alias lookup runs before the existing fuzzy match.

**Files:** `lib/greenhouse/eeo-aliases.ts` (new), `lib/form-fill/events.ts`, `lib/greenhouse/filler.ts`, `lib/greenhouse/mapper.ts`

---

## Out of Scope

- Workday EEO autofill (same alias approach applies but different filler — future task).
- PDF export / formatted resume export (future enhancement).
- AI-suggested skills based on job description (future).
- Vercel redeployment after env var update (manual step, not code).
