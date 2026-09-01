// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import { isGreenhouseApplicationPage } from './page-detector'

beforeEach(() => {
  document.body.innerHTML = ''
  window.history.replaceState({}, '', '/')
})

describe('isGreenhouseApplicationPage', () => {
  it('returns true for legacy boards.greenhouse.io form (#application_form)', () => {
    document.body.innerHTML = '<form id="application_form"></form>'
    expect(isGreenhouseApplicationPage()).toBe(true)
  })

  it('returns true for modern job-boards.greenhouse.io form (#application-form)', () => {
    document.body.innerHTML = '<form id="application-form" class="application--form"></form>'
    expect(isGreenhouseApplicationPage()).toBe(true)
  })

  it('returns true when URL path includes /apply even without form', () => {
    window.history.replaceState({}, '', '/some-company/apply/1234')
    expect(isGreenhouseApplicationPage()).toBe(true)
  })

  it('returns true for modern form identified only by class (form.application--form)', () => {
    document.body.innerHTML = '<form class="application--form"></form>'
    expect(isGreenhouseApplicationPage()).toBe(true)
  })

  it('returns false on a marketing page with no form and no /apply in path', () => {
    document.body.innerHTML = '<main>Careers</main>'
    window.history.replaceState({}, '', '/')
    expect(isGreenhouseApplicationPage()).toBe(false)
  })
})
