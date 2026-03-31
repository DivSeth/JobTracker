# Active Tasks

**Status:** Phase 02 Wave 1 resuming — 02-00 done, executing 02-01 + 02-02

---

## TASK-01 [x] — Implement form scanner + mapper (02-01, Part A)
**File:** `autoapply/apps/extension/lib/greenhouse/scanner.ts`
**Also:** `autoapply/apps/extension/lib/greenhouse/mapper.ts`
**Depends on:** `lib/greenhouse/types.ts` (already written)

scanner.ts must export `scanGreenhouseForm(): GreenhouseField[]`
- Query `[data-field]`, `input`, `select`, `textarea` inside `#application_form`
- Detect field type: text | select | checkbox | file | custom_question
- Return label, selector, fieldType, required flag

mapper.ts must export `mapProfileToFields(profile, fields): MappedField[]` + `resolveProfileValue`
- Map profile keys to GreenhouseField selectors using FieldMappingConfig
- Mark custom_question fields as unmapped if no match

**Test:** Fill in `it.todo()` stubs in `scanner.test.ts` and `mapper.test.ts`
**Commit:** `feat(02-01): greenhouse form scanner and profile mapper`
**Done:** Added `scanGreenhouseForm`, `mapProfileToFields`, `resolveProfileValue`, and replaced all Task-01 `it.todo()` cases with assertions.

---

## TASK-02 [x] — Implement events + file-upload helpers (02-01, Part B)
**File:** `autoapply/apps/extension/lib/form-fill/events.ts`
**Also:** `autoapply/apps/extension/lib/form-fill/file-upload.ts`

events.ts must export: `fillTextField(el, value)`, `fillSelectField(el, value)`, `fillCheckbox(el, checked)`
- Dispatch focus → InputEvent(input) → Event(change) → blur in sequence
- Use `bubbles: true, composed: true` for Shadow DOM compatibility

file-upload.ts must export: `uploadFileToInput(input, blob, filename, mimeType)`
- Create `new DataTransfer()`, append File, assign to `input.files`
- Dispatch change event after

**Test:** Fill stubs in `events.test.ts` + `file-upload.test.ts`
**Commit:** `feat(02-01): synthetic event helpers and file upload utility`
**Done:** Added text/select/checkbox fill helpers, DataTransfer-based file upload, and replaced all Task-02 `it.todo()` cases with assertions.

---

## TASK-03 [x] — API routes: field-mappings + track-application (02-02, Part A)
**Files:**
- `autoapply/apps/web/app/api/extension/field-mappings/route.ts`
- `autoapply/apps/web/app/api/extension/track-application/route.ts`

field-mappings: `GET ?platform=greenhouse` → query `ats_field_mappings` table → return rows
track-application:
- `POST` → insert into `applications` table, return created row
- `PATCH` → update status by id
- `GET ?applyUrl=...` → check for duplicate by apply_url + user_id

Auth: use `createServerClient` + `supabase.auth.getUser()` → 401 if missing
**Test:** Fill stubs in `field-mappings.test.ts` + `track-application.test.ts`
**Commit:** `feat(02-02): field-mappings and track-application API routes`
**Done:** Added both extension API route files and replaced all Task-03 `it.todo()` cases with mocked route assertions for auth, query validation, duplicate lookup, upsert, and status updates.

---

## TASK-04 [x] — Extend background worker (02-02, Part B)
**Files:**
- `autoapply/apps/extension/entrypoints/background.ts`
- `autoapply/apps/extension/utils/messages.ts`
- `autoapply/apps/extension/utils/storage.ts`

messages.ts: add to `ExtensionMessage` union:
`startFill | getProfileForFill | getFieldMappings | trackApplication | updateApplicationStatus | checkDuplicateApplication`

storage.ts: add `getUserIdentity()` / `setUserIdentity()` helpers

background.ts: on `syncProfiles` also fetch + store `userIdentity` (userId + email).
Handle new message types — proxy to web API or return from storage.

**Commit:** `feat(02-02): extend background worker with fill message routing`
**Done:** Extended the message union, added persisted `userIdentity` helpers, synced identity during profile sync, and routed fill/mapping/tracking/duplicate messages through the background worker.

---

## TASK-05 — Run tests, verify Wave 1 green
```bash
cd autoapply && npm run test -w apps/extension
cd autoapply && npm run test -w apps/web
```
Expected: all 02-01 + 02-02 test files pass (no `it.todo` remaining)
If failures: fix before proceeding to Wave 2 (02-03)

---

**Next after these 5 tasks:** Wave 2 → execute 02-03 (filler + detector)
