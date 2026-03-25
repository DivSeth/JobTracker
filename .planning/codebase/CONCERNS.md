# Codebase Concerns

**Analysis Date:** 2026-03-24

## Tech Debt

**Silent Error Suppression in Async Operations:**
- Issue: Multiple fire-and-forget async operations with `.catch(() => {})` silently swallow errors, making bugs undetectable
- Files: `app/api/gmail/webhook/route.ts` (line 84), `app/api/jobs/sync-ats/route.ts` (line 240+)
- Impact: Gmail webhook processing failures, sync job failures go unlogged and unmonitored, no retry mechanism
- Fix approach: Replace silent catches with explicit error logging via dedicated error tracking service; implement retry queue for failed webhook messages

**Excessive `@typescript-eslint/no-explicit-any` Disables:**
- Issue: `any` type used throughout codebase with eslint-disable comments instead of proper typing
- Files: `app/api/jobs/sync-ats/route.ts` (lines 33, 47, 118, etc.), `components/profile/ProfileForm.tsx` (line 26)
- Impact: Loss of type safety in critical data transformation paths (Supabase operations, database writes), increases bug risk in batch operations
- Fix approach: Create proper type definitions for Supabase admin client responses; use generics for batch operations; remove all `any` disables

**Unvalidated JSON Parsing from Gemini API:**
- Issue: `parseGeminiJSON()` uses regex-based markdown fence stripping without validation, can fail silently on malformed JSON
- Files: `lib/ai/gemini.ts` (lines 57-60)
- Impact: Email classification, entity extraction, deadline extraction can silently fail and return undefined behavior; AI step failures not caught in pipeline
- Fix approach: Add JSON validation schema (zod/ajv); add try-catch with fallback parsing; log parse failures with raw text for debugging

**ATS Job Sync: Manual Pagination Without Offset Validation:**
- Issue: Batch offset/limit params used in `sync-ats/route.ts` without validation of total company count; offset can exceed array bounds
- Files: `app/api/jobs/sync-ats/route.ts` (lines 234, 245)
- Impact: Batch processing can skip companies if offset calculation is wrong; no bounds checking
- Fix approach: Add offset/limit validation before slice; return error if offset >= total

**Email Queue Processing: Missing Idempotency:**
- Issue: Email processing marks status as 'processing' but doesn't use unique request ID; if webhook retries mid-processing, duplicate records created
- Files: `app/api/gmail/process/route.ts` (line 34)
- Impact: Duplicate application records, duplicate deadline entries, duplicate AI logs
- Fix approach: Add request idempotency key; use 'processing' status as distributed lock; implement cleanup for orphaned processing records

**Error Handling Inconsistency in API Routes:**
- Issue: API routes handle errors inconsistently - some return JSON errors, some throw and crash, some silently swallow
- Files: Multiple route handlers (`app/api/**/*.ts`)
- Impact: Unpredictable failure modes; some failures return 5xx, others might not return response at all
- Fix approach: Create unified error handler middleware; standardize all routes to return consistent error JSON with request ID for tracing

## Known Bugs

**SmartRecruiters Job Fetch: Silent Truncation at 3 Pages:**
- Symptoms: Companies with >300 jobs only get first 300 fetched
- Files: `lib/ats/smartrecruiters.ts` (line 45)
- Trigger: Any SmartRecruiters company with >300 open positions
- Workaround: Manually run sync multiple times with pagination params; hardcoded 5s timeout may also abort early

**Gmail Webhook: Polling for User by Email Not Indexed:**
- Symptoms: Webhook processing performance degrades as user count grows
- Files: `app/api/gmail/webhook/route.ts` (line 31)
- Trigger: OAuth webhook received for any user
- Cause: `adminClient.auth.admin.listUsers()` returns ALL users, then linear search for email match - O(n) scan
- Workaround: Process webhook asynchronously with retry; consider caching or indexing user email lookup
- Fix approach: Query user by email directly via Supabase instead of fetching all users

**Profile Form: Resume Upload Error Not Handled:**
- Symptoms: Resume upload fails silently, user doesn't know
- Files: `components/profile/ProfileForm.tsx` (lines 45-55)
- Trigger: Resume upload fails (network error, file too large, etc.)
- Cause: `fetch()` response not checked for `.ok`; no error message shown
- Workaround: None; user must manually retry

**Gemini API Key Validation: Only at Runtime:**
- Symptoms: API crashes on first Gemini call if GEMINI_API_KEY missing
- Files: `lib/ai/gemini.ts` (line 17)
- Trigger: Gemini function called in email processing without env var
- Cause: Check is at function call time, not boot time

## Security Considerations

**Supabase Admin Client Exposed in Client-Side Requests:**
- Risk: Multiple API routes construct admin client with service role key, passed via environment (correct), but error messages might leak key if logged
- Files: `app/api/jobs/sync-ats/route.ts`, `app/api/gmail/process/route.ts`, `app/api/gmail/webhook/route.ts`
- Current mitigation: Service role key only in `process.env`, not accessible from client; error messages don't quote full key
- Recommendations: Ensure all `catch` blocks sanitize errors before returning to client; add request signing for cron endpoints (done via CRON_SECRET)

**PUBSUB Verification Token in Plain Environment Variable:**
- Risk: Gmail webhook verification token stored in `process.env.PUBSUB_VERIFICATION_TOKEN`
- Files: `app/api/gmail/webhook/route.ts` (line 10)
- Current mitigation: Token validated server-side before processing
- Recommendations: Consider rotating token regularly; add rate limiting to webhook endpoint

**Unsanitized User Input in Batch Pagination:**
- Risk: `offset` and `limit` params parsed directly from URL without bounds
- Files: `app/api/jobs/sync-ats/route.ts` (lines 184-186)
- Current mitigation: `Math.max(1, parseInt(...))` prevents negative values
- Recommendations: Add explicit max limit (e.g., max 1000 per batch); validate limit < totalCompanies

**Authorization: Hardcoded Bearer Token Check:**
- Risk: Same endpoint accepts both `SUPABASE_SERVICE_ROLE_KEY` and `CRON_SECRET`
- Files: `app/api/jobs/sync-ats/route.ts` (line 201), `app/api/gmail/process/route.ts` (line 11)
- Current mitigation: Both are environment variables, not hardcoded
- Recommendations: Use OAuth/signed JWTs for cron invocations instead of shared secrets; audit token rotation policy

**Gmail Tokens in Vault: No Expiration Check:**
- Risk: Refresh tokens stored but no validation that they're still valid
- Files: `lib/gmail/vault.ts`, `lib/gmail/refresh.ts`
- Current mitigation: `refresh.ts` attempts to refresh on each use
- Recommendations: Implement token revocation checking; add metrics for failed token refreshes

## Performance Bottlenecks

**N+1 Query in Gmail Webhook Message Processing:**
- Problem: Fetches one message at a time in loop instead of batch
- Files: `app/api/gmail/webhook/route.ts` (lines 50-68)
- Cause: `for (const msgId of messageIds) { const msg = await fetchMessage(...) }`
- Improvement path: Batch fetch messages from Gmail API; queue as single bulk insert to Supabase

**Gmail History API: No Pagination Handling for Large History:**
- Problem: `getHistoryMessages()` doesn't handle large history windows, all calls are sequential
- Files: `lib/gmail/client.ts`
- Cause: Single history request may timeout or return incomplete data
- Improvement path: Implement pagination in history endpoint; handle partial results with resumption

**Vercel 10s Timeout Causes Incomplete Sync:**
- Problem: Job sync endpoint set to 300s (5min) for Pro plan, but Hobby plan gets 10s limit - batch sync required for scale
- Files: `app/api/jobs/sync-ats/route.ts` (line 14)
- Cause: Multiple sequential ATS API calls, Supabase writes per company
- Improvement path: Increase batch size; implement streaming response; move to background job queue (Bull/BullMQ)

**Supabase Query: Deactivating Stale Jobs Uses `not('ats_job_id', 'in', ...)` with String Interpolation:**
- Problem: Line 164 builds SQL fragment manually with string interpolation - potential for parsing issues
- Files: `app/api/jobs/sync-ats/route.ts` (line 164)
- Cause: Supabase filter builder doesn't support direct `not in` with array
- Improvement path: Use `filter()` method or handle stale deactivation in post-processing step

**RemoteOK Sync: Sequential Single Inserts for Each Job:**
- Problem: Each RemoteOK job inserted individually instead of batch
- Files: `app/api/jobs/sync-ats/route.ts` (lines 259-293)
- Cause: Loop with individual `.insert()` call per job
- Improvement path: Batch collect all inserts and upsert in one call

**Profile Form: No Debounce on Save:**
- Problem: Each form change potentially triggers full profile save
- Files: `components/profile/ProfileForm.tsx` (lines 57-72)
- Cause: No debounce on handleSubmit; likely called on every field change
- Improvement path: Add debounce; use form.dirty state; only save on blur or explicit save

## Fragile Areas

**ATS Platform Abstraction:**
- Files: `lib/ats/classify.ts`, `lib/ats/greenhouse.ts`, `lib/ats/lever.ts`, `lib/ats/ashby.ts`, `lib/ats/smartrecruiters.ts`, `lib/ats/remoteok.ts`
- Why fragile: Each ATS has different API response shape; standardization layer is thin and relies on manual testing per platform; breaking API changes in one ATS breaks entire sync
- Safe modification: Add comprehensive test cases for each platform before changing response mapping; use strict typing for platform-specific responses; version API integrations
- Test coverage: ATS test files exist (`__tests__/lib/ats/*.test.ts`) but need to validate complete mapping coverage

**Email Classification & AI Pipeline:**
- Files: `lib/ai/*.ts`, `app/api/gmail/process/route.ts`
- Why fragile: Depends on Gemini API response format stability; parsing relies on regex markdown stripping; failed classification cascades to entity extraction
- Safe modification: Add schema validation for all AI responses; implement circuit breaker for Gemini API failures; add comprehensive test mocks for all response variations
- Test coverage: Email processing has basic mocks but missing edge cases (malformed JSON, timeout, invalid responses)

**Normalized Key Deduplication Logic:**
- Files: `lib/ats/classify.ts` (normalizeKey function), used in `app/api/jobs/sync-ats/route.ts`
- Why fragile: `normalizeKey()` is deterministic string normalization; changing it breaks existing key matching and creates duplicates
- Safe modification: Never change the normalization algorithm without data migration; add versioning to normalized_key logic; test with real job data before deploying
- Test coverage: Some test coverage exists (`__tests__/lib/ats/classify.test.ts`) but missing real-world company name variations (spacing, unicode, abbreviations)

**Gmail OAuth Token Refresh:**
- Files: `lib/gmail/refresh.ts`, `lib/gmail/vault.ts`
- Why fragile: Token refresh depends on Supabase Vault RPC functions existing; no fallback if RPC fails; refresh token may be invalid
- Safe modification: Add metrics for refresh failures; implement exponential backoff; handle revoked tokens gracefully
- Test coverage: Vault test exists (`__tests__/lib/gmail/vault.test.ts`) but missing refresh failure scenarios

## Scaling Limits

**User Count Growth:**
- Current capacity: All users in single Supabase project; no sharding
- Limit: Breaks when auth.admin.listUsers() returns thousands (O(n) scan for email lookup in webhook)
- Scaling path: Implement email-indexed user lookup; shard user data by region; move auth to dedicated service

**Job Database Size:**
- Current capacity: Single Supabase table with normalized_key index
- Limit: Upsert performance degrades with large dataset; no partitioning by company/date
- Scaling path: Partition jobs table by company_id; add time-series partitioning; implement job archival for inactive roles

**AI API Costs:**
- Current capacity: Calls Gemini for every email (classification + entities + deadlines)
- Limit: Cost grows linearly with email volume; budget-aware rate limiting missing
- Scaling path: Implement token budgeting per user; add email filtering before AI (spam detection); batch similar emails

**Concurrent Webhook Processing:**
- Current capacity: Sequential message processing in webhook
- Limit: One webhook blocks others; high email volume during job application season causes backlog
- Scaling path: Queue webhook messages to job queue (Bull/BullMQ); implement parallel processing; add backpressure

## Dependencies at Risk

**Gemini AI Model Stability:**
- Risk: Depends on `gemini-2.0-flash` API stability; response format changes break parsing
- Impact: Email classification completely non-functional if Gemini changes response format
- Migration plan: Implement response validation schema; add fallback to simpler ML model (rule-based); maintain version pinning

**Gmail API Rate Limits:**
- Risk: Gmail API quota not explicitly handled; batch processing can hit limits
- Impact: Webhook processing fails when quota exceeded
- Migration plan: Implement rate limit headers checking; add exponential backoff; batch history requests; monitor quota usage

**Supabase Vault RPCs:**
- Risk: Depends on custom Vault SQL functions (`vault_update_secret`, `vault_create_secret`) - no native upsert
- Impact: Token storage/update can fail if RPC breaks
- Migration plan: Monitor Vault function health; implement fallback token storage; use Supabase managed secrets if available

**SmartRecruiters API Timeout:**
- Risk: Hardcoded 5s timeout may be too aggressive; no retry for network flakes
- Impact: SmartRecruiters jobs not synced if API slow
- Migration plan: Increase timeout with backoff; implement retry with jitter; add circuit breaker

## Missing Critical Features

**API Rate Limiting:**
- Problem: Public endpoints not rate-limited; cron endpoints only check Bearer token
- Blocks: Cannot prevent abuse; sync endpoint can be DOS'd; no tenant isolation
- Fix: Add rate limiting middleware; implement per-user quotas; add circuit breaker for external APIs

**Request Tracing & Observability:**
- Problem: No request IDs; errors logged without context
- Blocks: Cannot trace errors across services; difficult to debug user-specific issues
- Fix: Add request ID generation; implement structured logging; add tracing headers to Supabase queries

**Database Transaction Handling:**
- Problem: Batch sync does multiple sequential Supabase operations without transactions
- Blocks: Partial failures leave inconsistent state (some jobs created, others fail)
- Fix: Implement Supabase transaction support; add rollback logic; use pessimistic locking

**Webhook Retry Logic:**
- Problem: No retry for failed webhook processing
- Blocks: Lost emails if processing fails; no recovery mechanism
- Fix: Implement dead-letter queue; add retry with exponential backoff; implement webhook signature verification

**User Consent Logging for AI Processing:**
- Problem: No explicit audit trail of which emails were processed by AI
- Blocks: Cannot provide transparency to users; may violate privacy regulations
- Fix: Log all AI processing with user opt-in; expose processing history in UI; add data deletion requests

## Test Coverage Gaps

**Gmail Webhook Processing Edge Cases:**
- What's not tested: Missing historyId, invalid Pub/Sub message format, user with no profile, concurrent webhook deliveries
- Files: `app/api/gmail/webhook/route.ts`
- Risk: Webhook failures go undetected; duplicate processing possible
- Priority: High

**ATS Sync Error Recovery:**
- What's not tested: Partial sync failure, network timeout mid-batch, Supabase connection loss, invalid ATS credentials
- Files: `app/api/jobs/sync-ats/route.ts`
- Risk: Incomplete syncs leave data inconsistent; no retry mechanism
- Priority: High

**Email Classification Failure Modes:**
- What's not tested: Gemini API timeout, malformed JSON response, missing fields in classification result, concurrent classification requests
- Files: `app/api/gmail/process/route.ts`, `lib/ai/email-classifier.ts`
- Risk: Email processing crashes; applications created with wrong data
- Priority: High

**Token Refresh Failure:**
- What's not tested: Revoked refresh token, invalid token format, Vault operation failure
- Files: `lib/gmail/refresh.ts`
- Risk: Silent authentication failure; webhook processing stops working
- Priority: Medium

**Profile Form Submission:**
- What's not tested: Network error during resume upload, concurrent save requests, validation errors, large profile payloads
- Files: `components/profile/ProfileForm.tsx`
- Risk: Profile data loss; resume upload fails silently
- Priority: Medium

---

*Concerns audit: 2026-03-24*
