// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { fillCheckbox, fillSelectField, fillTextField } from './events'

describe('fillTextField', () => {
  it('dispatches focus, input, change, blur events in order', () => {
    const input = document.createElement('input')
    const events: string[] = []

    ;['focus', 'input', 'change', 'blur'].forEach((type) => {
      input.addEventListener(type, () => events.push(type))
    })

    fillTextField(input, 'Jane')

    expect(events).toEqual(['focus', 'input', 'change', 'blur'])
  })

  it('sets input value to provided string', () => {
    const input = document.createElement('input')
    fillTextField(input, 'jane@example.com')
    expect(input.value).toBe('jane@example.com')
  })

  it('clears existing value before setting new value', () => {
    const input = document.createElement('input')
    input.value = 'stale'
    fillTextField(input, 'fresh')
    expect(input.value).toBe('fresh')
  })
})

describe('fillSelectField', () => {
  it('selects option matching value case-insensitively', () => {
    const select = document.createElement('select')
    select.innerHTML = `
      <option value="">Select one</option>
      <option value="us">United States</option>
    `

    fillSelectField(select, 'united states')
    expect(select.value).toBe('us')
  })

  it('dispatches change event after setting value', () => {
    const select = document.createElement('select')
    select.innerHTML = `<option value="us">United States</option>`
    const events: string[] = []

    ;['change', 'blur'].forEach((type) => {
      select.addEventListener(type, () => events.push(type))
    })

    fillSelectField(select, 'us')
    expect(events).toEqual(['change', 'blur'])
  })

  it('handles partial text match for option selection', () => {
    const select = document.createElement('select')
    select.innerHTML = `
      <option value="full_time">Full Time Employment</option>
      <option value="internship">Internship</option>
    `

    fillSelectField(select, 'full time')
    expect(select.value).toBe('full_time')
  })
})

describe('fillCheckbox', () => {
  it('sets the checked state and dispatches synthetic events', () => {
    const checkbox = document.createElement('input')
    checkbox.type = 'checkbox'
    const events: string[] = []

    ;['focus', 'input', 'change', 'blur'].forEach((type) => {
      checkbox.addEventListener(type, () => events.push(type))
    })

    fillCheckbox(checkbox, true)

    expect(checkbox.checked).toBe(true)
    expect(events).toEqual(['focus', 'input', 'change', 'blur'])
  })
})
