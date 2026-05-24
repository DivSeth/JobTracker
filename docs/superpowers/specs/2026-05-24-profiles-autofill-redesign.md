# Profiles & Autofill Redesign

> **For agentic workers:** Use `superpowers:subagent-driven-development` or `superpowers:executing-plans` to implement this spec task-by-task.

**Goal:** Restructure the three-tier identity model (Base / Regional / App Profile) so data lives at the right level, wire resume to app profiles (niche-based), move EEO to regional identities, add `default_profile_id` to regional identities, remove the Fill Preferences section from the web app, and ensure the extension popup exposes manual overrides for both region and app profile.

---

## 1. Data Model Changes

### `application_profiles` table

**Remove:**
- `eeo_gender`
- `eeo_race`
- `eeo_veteran_status`
- `eeo_disability_status`
- `work_authorization`
- `sponsorship_required`

**Stays:**
- `resume_path`, `cover_letter_path` — resume is niche-based (Option A: one resume per niche+region combination, handled by naming profiles e.g. "US SWE", "India SWE")
- `experience`, `education`, `skills`, `certifications`, `languages`

### `user_regional_identities` table

**Add:**
- `eeo_gender text nullable` — EEO is country-specific, belongs at regional level
- `eeo_race text nullable`
- `eeo_veteran_status text nullable`
- `eeo_disability_status text nullable`
- `default_profile_id uuid nullable references application_profiles(id) on delete set null` — links a regional identity to its default niche profile for autofill

### `profiles` table (base identity)

**Remove** the `preferences` JSONB column (`job_types`, `locations`, `remote_ok`, `min_salary`). Salary already lives in regional identity. Job-type preferences are unused by autofill.

---

## 2. Field Ownership Reference

### Base Identity (`profiles`)
| Field | Mandatory in Greenhouse |
|---|---|
| `first_name` | Yes |
| `last_name` | Yes |
| `preferred_first_name` | No |
| `pronouns` | No |
| `linkedin_url` | No |
| `github_url` | No |
| `portfolio_url` | No |
| `date_of_birth` | No |
| `willing_to_relocate` | No |
| `work_arrangement_preference` | No |
| `earliest_start_date` | No |
| `referral_source` | No |

### Regional Identity (`user_regional_identities`)
| Field | Mandatory in Greenhouse |
|---|---|
| `email` | Yes |
| `phone_e164` | Yes |
| `address_line_1` | Yes |
| `address_line_2` | No |
| `city` | Yes |
| `region` | Yes |
| `postal_code` | Yes |
| `country` | Yes |
| `authorized_to_work` | No |
| `needs_sponsorship_now` | No |
| `needs_sponsorship_future` | No |
| `work_auth_status` | No |
| `work_auth_details` | No |
| `desired_salary_min` / `desired_salary_max` | No |
| `salary_currency` / `salary_cadence` | No |
| `current_compensation` | No |
| `notice_period_weeks` | No |
| `eeo_gender` | No |
| `eeo_race` | No |
| `eeo_veteran_status` | No |
| `eeo_disability_status` | No |
| `default_profile_id` | — (internal) |

### Application Profile (`application_profiles`)
| Field | Mandatory in Greenhouse |
|---|---|
| `resume_path` | Yes |
| `cover_letter_path` | No |
| `experience` | No (structured fields) |
| `education` | No (structured fields) |
| `skills` | No |
| `certifications` | No |
| `languages` | No |

---

## 3. Autofill Resolution Chain

When the extension activates on a Greenhouse page:

1. **Country detection** — read job page URL/content to infer country code (existing logic).
2. **Regional identity selection** — run `selectRegionalIdentity({ blocks, detectedCountry, chosenId })`:
   - Single match → auto-pick
   - Multiple matches → popup prompts user to choose
   - No match → fall back to `is_default` regional identity
3. **App profile selection** — `regional.default_profile_id` → load that profile. If null → use the app profile where `is_default = true`. User can override via popup dropdown.
4. **Field resolution** — merge in this priority:
   - Base Identity fields fill personal/contact metadata
   - Regional Identity fields fill location, contact, work auth, salary, EEO
   - App Profile fields fill experience, education, skills, resume
5. **File upload** — `resume_path` from App Profile is fetched via signed URL and injected into the file input.

---

## 4. Extension Popup Override UX

The popup always shows two dropdowns before filling:

```
Region    [ India (IN)  ▾ ]   ← auto-selected, fully overridable
Profile   [ India SWE   ▾ ]   ← resolved from default_profile_id, fully overridable
```

**Rules:**
- Changing Region → re-resolves Profile to that region's `default_profile_id` (keeps current profile if null).
- Changing Profile independently → region stays, only profile swaps.
- Both dropdowns list all available options — user is never locked in.
- Selection is **not persisted** across pages — each page starts fresh from auto-detection.
- If no profile can be resolved (no `default_profile_id`, no global default) → popup shows a warning and requires the user to manually pick a profile before filling is enabled.

---

## 5. Extension API Change

`GET /api/extension/profile` currently returns:
```json
{ "baseIdentity": {}, "regionalIdentities": [] }
```

Extend to:
```json
{ "baseIdentity": {}, "regionalIdentities": [], "applicationProfiles": [] }
```

Resolution of which profile to use happens client-side in the extension using `regional.default_profile_id`. No extra round-trip needed.

---

## 6. Web App UI Changes

### `/profile` page (Base Identity)
- **Remove** the Fill Preferences section entirely (job types, locations, remote preference, min salary).
- Keep: BaseIdentityForm, RegionalIdentityList, ProfileForm.

### Regional Identity form
- **Add** EEO fields: Gender, Race/Ethnicity, Veteran Status, Disability Status — each with a "Decline to self-identify" option.
- **Add** "Default Application Profile" selector — dropdown of all user's application profiles (nullable). Label: "Default profile for autofill".

### Application Profile form
- **Remove** EEO fields (gender, race, veteran, disability).
- **Remove** Work Authorization and Sponsorship Required fields (these move to regional identity, already present there via `authorized_to_work`, `needs_sponsorship_now`, `needs_sponsorship_future`).

---

## 7. TypeScript Type Updates

```ts
// application_profiles — remove EEO + work auth fields
interface ApplicationProfile {
  // remove: eeo_gender, eeo_race, eeo_veteran_status, eeo_disability_status
  // remove: work_authorization, sponsorship_required
}

// user_regional_identities — add EEO + default_profile_id
interface RegionalIdentity {
  // add:
  eeo_gender: string | null
  eeo_race: string | null
  eeo_veteran_status: string | null
  eeo_disability_status: string | null
  default_profile_id: string | null
}

// profiles — remove preferences
interface Profile {
  // remove: preferences: UserPreferences
}
```

---

## 8. Zod Schema Updates

- `applicationProfileSchema` — remove `eeo_*`, `work_authorization`, `sponsorship_required` fields.
- `regionalIdentityCreateSchema` — add `eeo_gender`, `eeo_race`, `eeo_veteran_status`, `eeo_disability_status` (all `z.string().nullable().optional()`), add `default_profile_id` (`z.string().uuid().nullable().optional()`).
- `baseIdentitySchema` — remove any `preferences`-related fields if present.

---

## 9. Database Migration

```sql
-- 1. Add new columns to regional identities
ALTER TABLE user_regional_identities
  ADD COLUMN eeo_gender text,
  ADD COLUMN eeo_race text,
  ADD COLUMN eeo_veteran_status text,
  ADD COLUMN eeo_disability_status text,
  ADD COLUMN default_profile_id uuid references application_profiles(id) on delete set null;

-- 2. Remove EEO + work auth columns from application_profiles
ALTER TABLE application_profiles
  DROP COLUMN IF EXISTS eeo_gender,
  DROP COLUMN IF EXISTS eeo_race,
  DROP COLUMN IF EXISTS eeo_veteran_status,
  DROP COLUMN IF EXISTS eeo_disability_status,
  DROP COLUMN IF EXISTS work_authorization,
  DROP COLUMN IF EXISTS sponsorship_required;

-- 3. Remove preferences from profiles
ALTER TABLE profiles
  DROP COLUMN IF EXISTS preferences;
```

---

## 10. Out of Scope (future)

- GenAI resume generation per region+niche — deferred, current model handles it via named profiles.
- Workday autofill — same resolution chain applies but different field mapper.
- Custom screening question autofill — requires per-job AI inference, separate feature.
