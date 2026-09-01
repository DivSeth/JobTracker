# Security Policy

AutoApply handles job-search data that may include resumes, contact details, employment history, generated application answers, and private application status. Treat local data as sensitive.

## Privacy Boundaries

- Do not commit `.env`, `.env.local`, provider API keys, Supabase service keys, local database dumps, real resumes, screenshots with personal information, or generated application artifacts.
- Store profile documents in the private Supabase `profile-documents` bucket.
- Use short-lived signed URLs for document retrieval.
- Keep service role keys server-side only. Never prefix service keys with `NEXT_PUBLIC_`.
- Rotate any API key that was pasted into chat, screenshots, logs, or committed files.

## Authentication And Authorization

- Web routes use Supabase auth and user-scoped queries.
- Supabase migrations enable RLS for user-owned tables.
- Extension auth uses a token exchange path and stores session data in extension storage.
- Local auth bypass/dev login controls are for local development only and should remain disabled in production.

## Reporting Issues

This is currently a personal project. If this repo becomes public, open a private security advisory or contact the maintainer directly before disclosing vulnerabilities.

## Known Security Work

- Add automated secret scanning in CI.
- Add stricter claim approval gates before model-extracted claims can power final artifacts.
- Add structured audit events for generated artifact approval/rejection and final fill confirmation.
