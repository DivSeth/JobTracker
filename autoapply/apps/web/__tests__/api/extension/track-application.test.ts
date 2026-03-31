import { describe, it, expect } from 'vitest'

describe('POST /api/extension/track-application', () => {
  it.todo('creates application entry with source extension_autofill')
  it.todo('sets status to saved on creation')
  it.todo('links to existing job record when apply_url matches (SYNC-03)')
  it.todo('returns 201 with application data')
  it.todo('returns 401 when not authenticated')
  it.todo('upserts on duplicate user_id + apply_url')
})

describe('GET /api/extension/track-application', () => {
  it.todo('returns { exists: true, appliedAt } when apply_url has existing application')
  it.todo('returns { exists: false } when apply_url has no existing application')
  it.todo('returns 400 when applyUrl query param is missing')
  it.todo('returns 401 when not authenticated')
})

describe('PATCH /api/extension/track-application', () => {
  it.todo('updates application status to applied with applied_at timestamp (SYNC-02)')
})
