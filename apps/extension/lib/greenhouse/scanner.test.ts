// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest'
import { scanGreenhouseForm } from './scanner'

describe('scanGreenhouseForm', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  it('discovers standard text inputs (first_name, last_name, email, phone)', () => {
    document.body.innerHTML = `
      <form id="application_form">
        <label for="first_name">First Name</label>
        <input id="first_name" name="first_name" type="text" />
        <label for="last_name">Last Name</label>
        <input id="last_name" name="last_name" type="text" />
        <label for="email">Email</label>
        <input id="email" name="email" type="email" />
        <label for="phone">Phone</label>
        <input id="phone" name="phone" type="tel" />
      </form>
    `

    const fields = scanGreenhouseForm()

    expect(fields.map((field) => field.name)).toEqual(['first_name', 'last_name', 'email', 'phone'])
    expect(fields.map((field) => field.type)).toEqual(['text', 'text', 'email', 'tel'])
  })

  it('discovers select elements with their options', () => {
    document.body.innerHTML = `
      <form id="application_form">
        <label for="country">Country</label>
        <select id="country" name="country">
          <option value="">Select one</option>
          <option value="us">United States</option>
          <option value="ca">Canada</option>
        </select>
      </form>
    `

    const [field] = scanGreenhouseForm()

    expect(field.type).toBe('select')
    expect(field.options).toEqual(['Select one', 'United States', 'Canada'])
  })

  it('discovers textarea fields', () => {
    document.body.innerHTML = `
      <form id="application_form">
        <label for="cover_letter">Cover Letter</label>
        <textarea id="cover_letter" name="cover_letter"></textarea>
      </form>
    `

    const [field] = scanGreenhouseForm()
    expect(field.type).toBe('textarea')
  })

  it('discovers file inputs (resume, cover_letter)', () => {
    document.body.innerHTML = `
      <form id="application_form">
        <label for="resume">Resume</label>
        <input id="resume" name="resume" type="file" />
        <label for="cover_letter_file">Cover Letter</label>
        <input id="cover_letter_file" name="cover_letter" type="file" />
      </form>
    `

    const fields = scanGreenhouseForm()
    expect(fields.every((field) => field.type === 'file')).toBe(true)
  })

  it('extracts label text for each field', () => {
    document.body.innerHTML = `
      <form id="application_form">
        <div class="field">
          <label for="location">Current Location</label>
          <input id="location" name="location" type="text" />
        </div>
      </form>
    `

    const [field] = scanGreenhouseForm()
    expect(field.label).toBe('Current Location')
  })

  it('marks required fields based on .field_required or required attribute', () => {
    document.body.innerHTML = `
      <form id="application_form">
        <div class="field">
          <label for="email">Email <span class="field_required">*</span></label>
          <input id="email" name="email" type="email" />
        </div>
        <label for="phone">Phone</label>
        <input id="phone" name="phone" type="tel" required />
      </form>
    `

    const fields = scanGreenhouseForm()
    expect(fields.every((field) => field.required)).toBe(true)
  })

  it('discovers custom question fields with question_{ID} pattern', () => {
    document.body.innerHTML = `
      <form id="application_form">
        <label for="question_12345">Why this company?</label>
        <input id="question_12345" name="question_12345" type="text" />
      </form>
    `

    const [field] = scanGreenhouseForm()
    expect(field.name).toBe('question_12345')
    expect(field.label).toBe('Why this company?')
  })

  it('returns empty array when no form is found', () => {
    expect(scanGreenhouseForm()).toEqual([])
  })

  it('ignores hidden and submit inputs', () => {
    document.body.innerHTML = `
      <form id="application_form">
        <input name="csrf" type="hidden" value="token" />
        <input name="submit" type="submit" value="Submit" />
        <label for="email">Email</label>
        <input id="email" name="email" type="email" />
      </form>
    `

    const fields = scanGreenhouseForm()
    expect(fields).toHaveLength(1)
    expect(fields[0]?.name).toBe('email')
  })

  it('discovers fields inside a modern job-boards.greenhouse.io form (#application-form)', async () => {
    const { MODERN_DISCORD_FORM_HTML } = await import('./__fixtures__/modern-discord-form')
    document.body.innerHTML = MODERN_DISCORD_FORM_HTML

    const fields = scanGreenhouseForm()

    expect(fields.length).toBeGreaterThan(0)
    expect(fields.map((field) => field.name)).toContain('first_name')
    expect(fields.map((field) => field.name)).toContain('email')
  })

  it('resolves label via aria-labelledby when no <label for=""> exists', () => {
    document.body.innerHTML = `
      <form id="application-form">
        <label id="country-label">Country</label>
        <input id="country" role="combobox" aria-labelledby="country-label" type="text" />
      </form>
    `

    const [field] = scanGreenhouseForm()
    expect(field.label).toBe('Country')
  })

  it('classifies role="combobox" inputs as type combobox', () => {
    document.body.innerHTML = `
      <form id="application-form">
        <input id="country" aria-label="Country" role="combobox" type="text" />
      </form>
    `

    const [field] = scanGreenhouseForm()
    expect(field.type).toBe('combobox')
  })
})
