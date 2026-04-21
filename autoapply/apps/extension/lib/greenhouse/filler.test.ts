// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { MappedField } from './types'

const eventsMock = vi.hoisted(() => ({
  fillTextField: vi.fn(),
  fillSelectField: vi.fn(),
  fillCheckbox: vi.fn(),
  fillComboboxField: vi.fn(),
}))

vi.mock('@/lib/form-fill/events', () => ({
  fillTextField: eventsMock.fillTextField,
  fillSelectField: eventsMock.fillSelectField,
  fillCheckbox: eventsMock.fillCheckbox,
  fillComboboxField: eventsMock.fillComboboxField,
}))

import { fillForm } from './filler'

function createMappedField(overrides: Partial<MappedField> = {}): MappedField {
  return {
    field: {
      selector: '#field',
      name: 'field',
      label: 'Field',
      type: 'text',
      required: false,
    },
    profileValue: 'value',
    profilePath: 'user_profile.field',
    source: 'user_profile',
    transform: null,
    isMasked: false,
    ...overrides,
  }
}

beforeEach(() => {
  document.body.innerHTML = ''
  eventsMock.fillTextField.mockReset()
  eventsMock.fillSelectField.mockReset()
  eventsMock.fillCheckbox.mockReset()
  eventsMock.fillComboboxField.mockReset()
})

describe('fillForm', () => {
  it('fills text input fields with correct values', async () => {
    document.body.innerHTML = `<input id="first_name" />`

    await fillForm(
      [
        createMappedField({
          field: {
            selector: '#first_name',
            name: 'first_name',
            label: 'First Name',
            type: 'text',
            required: true,
          },
          profileValue: 'Jane',
        }),
      ],
      { delayMs: 0 }
    )

    expect(eventsMock.fillTextField).toHaveBeenCalledWith(document.querySelector('#first_name'), 'Jane')
  })

  it('fills select dropdowns by matching option text', async () => {
    document.body.innerHTML = `<select id="country"><option value="us">United States</option></select>`

    await fillForm(
      [
        createMappedField({
          field: {
            selector: '#country',
            name: 'country',
            label: 'Country',
            type: 'select',
            required: true,
          },
          profileValue: 'United States',
        }),
      ],
      { delayMs: 0 }
    )

    expect(eventsMock.fillSelectField).toHaveBeenCalledWith(
      document.querySelector('#country'),
      'United States'
    )
  })

  it('fills textarea fields', async () => {
    document.body.innerHTML = `<textarea id="cover_letter"></textarea>`

    await fillForm(
      [
        createMappedField({
          field: {
            selector: '#cover_letter',
            name: 'cover_letter',
            label: 'Cover Letter',
            type: 'textarea',
            required: false,
          },
          profileValue: 'I would love to join.',
        }),
      ],
      { delayMs: 0 }
    )

    expect(eventsMock.fillTextField).toHaveBeenCalledWith(
      document.querySelector('#cover_letter'),
      'I would love to join.'
    )
  })

  it('skips unmapped fields (profileValue is null)', async () => {
    document.body.innerHTML = `<input id="phone" />`

    const result = await fillForm(
      [
        createMappedField({
          field: {
            selector: '#phone',
            name: 'phone',
            label: 'Phone',
            type: 'tel',
            required: false,
          },
          profileValue: null,
          profilePath: null,
          source: null,
        }),
      ],
      { delayMs: 0 }
    )

    expect(result.results[0]?.status).toBe('skipped')
    expect(eventsMock.fillTextField).not.toHaveBeenCalled()
  })

  it('returns FillResult with correct filled/skipped/error counts', async () => {
    document.body.innerHTML = `
      <input id="first_name" />
      <select id="country"><option value="us">United States</option></select>
      <input id="missing_source" />
      <input id="terms" type="checkbox" />
    `

    eventsMock.fillCheckbox.mockImplementation(() => {
      throw new Error('Checkbox failed')
    })

    const result = await fillForm(
      [
        createMappedField({
          field: {
            selector: '#first_name',
            name: 'first_name',
            label: 'First Name',
            type: 'text',
            required: true,
          },
          profileValue: 'Jane',
        }),
        createMappedField({
          field: {
            selector: '#country',
            name: 'country',
            label: 'Country',
            type: 'select',
            required: true,
          },
          profileValue: 'United States',
        }),
        createMappedField({
          field: {
            selector: '#missing_source',
            name: 'portfolio',
            label: 'Portfolio',
            type: 'url',
            required: false,
          },
          profileValue: null,
          profilePath: null,
          source: null,
        }),
        createMappedField({
          field: {
            selector: '#terms',
            name: 'terms',
            label: 'Terms',
            type: 'checkbox',
            required: true,
          },
          profileValue: 'true',
        }),
      ],
      { delayMs: 0 }
    )

    expect(result).toMatchObject({
      total: 4,
      filled: 2,
      skipped: 1,
      errors: 1,
    })
    expect(result.results.map((entry) => entry.status)).toEqual(['filled', 'filled', 'skipped', 'error'])
  })

  it('handles errors on individual fields without stopping entire fill', async () => {
    document.body.innerHTML = `
      <input id="first_name" />
      <input id="last_name" />
    `

    eventsMock.fillTextField.mockImplementationOnce(() => {
      throw new Error('First field exploded')
    })

    const result = await fillForm(
      [
        createMappedField({
          field: {
            selector: '#first_name',
            name: 'first_name',
            label: 'First Name',
            type: 'text',
            required: true,
          },
          profileValue: 'Jane',
        }),
        createMappedField({
          field: {
            selector: '#last_name',
            name: 'last_name',
            label: 'Last Name',
            type: 'text',
            required: true,
          },
          profileValue: 'Doe',
        }),
      ],
      { delayMs: 0 }
    )

    expect(result.results[0]).toMatchObject({
      status: 'error',
      error: 'First field exploded',
    })
    expect(result.results[1]?.status).toBe('filled')
    expect(eventsMock.fillTextField).toHaveBeenCalledTimes(2)
  })

  it('fills fields in DOM order (top to bottom)', async () => {
    document.body.innerHTML = `
      <input id="first_name" />
      <input id="last_name" />
      <input id="email" />
    `

    const order: string[] = []
    eventsMock.fillTextField.mockImplementation((element: Element) => {
      order.push((element as HTMLInputElement).id)
    })

    const progress = vi.fn()

    await fillForm(
      [
        createMappedField({
          field: {
            selector: '#first_name',
            name: 'first_name',
            label: 'First Name',
            type: 'text',
            required: true,
          },
          profileValue: 'Jane',
        }),
        createMappedField({
          field: {
            selector: '#last_name',
            name: 'last_name',
            label: 'Last Name',
            type: 'text',
            required: true,
          },
          profileValue: 'Doe',
        }),
        createMappedField({
          field: {
            selector: '#email',
            name: 'email',
            label: 'Email',
            type: 'email',
            required: true,
          },
          profileValue: 'jane@example.com',
        }),
      ],
      { delayMs: 0, onProgress: progress }
    )

    expect(order).toEqual(['first_name', 'last_name', 'email'])
    expect(progress).toHaveBeenNthCalledWith(
      1,
      1,
      3,
      expect.objectContaining({ field: expect.objectContaining({ selector: '#first_name' }) })
    )
    expect(progress).toHaveBeenNthCalledWith(
      3,
      3,
      3,
      expect.objectContaining({ field: expect.objectContaining({ selector: '#email' }) })
    )
  })

  it('routes combobox fields to fillComboboxField', async () => {
    document.body.innerHTML = `<input id="country" role="combobox" />`

    await fillForm(
      [
        createMappedField({
          field: {
            selector: '#country',
            name: 'country',
            label: 'Country',
            type: 'combobox',
            required: true,
          },
          profileValue: 'United States',
          profilePath: 'user_profile.country',
        }),
      ],
      { delayMs: 0 }
    )

    expect(eventsMock.fillComboboxField).toHaveBeenCalledTimes(1)
    expect(eventsMock.fillComboboxField).toHaveBeenCalledWith(
      document.querySelector('#country'),
      'United States'
    )
  })
})
