import { describe, it, expect } from 'vitest'
// import { watchForSubmissionConfirmation } from './detector'

describe('watchForSubmissionConfirmation', () => {
  it.todo('detects URL change to /confirmation path')
  it.todo('detects URL change to /thank-you path')
  it.todo('detects DOM mutation with "application submitted" text')
  it.todo('detects DOM mutation with "thank you for applying" text')
  it.todo('calls onConfirmed callback exactly once')
  it.todo('times out after 5 minutes without detection')
  it.todo('cleans up interval and observer on detection')
})
