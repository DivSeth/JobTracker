import type { GreenhouseField } from '@/lib/greenhouse/types'

function cssEscape(value: string): string {
  if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') {
    return CSS.escape(value)
  }

  return value.replace(/["\\]/g, '\\$&')
}

function normalizeLabel(label: string | null | undefined): string {
  return (label ?? '').replace(/\s+/g, ' ').trim()
}

function getLabelText(element: Element): string {
  const htmlElement = element as HTMLElement
  const id = htmlElement.getAttribute('id')

  if (id) {
    const explicitLabel = document.querySelector(`label[for="${cssEscape(id)}"]`)
    const text = normalizeLabel(explicitLabel?.textContent)
    if (text) return text
  }

  const fieldContainer = htmlElement.closest('.field')
  const inlineLabel = fieldContainer?.querySelector('label')
  const inlineText = normalizeLabel(inlineLabel?.textContent)
  if (inlineText) return inlineText

  const ariaLabel = normalizeLabel(htmlElement.getAttribute('aria-label'))
  if (ariaLabel) return ariaLabel

  const placeholder = normalizeLabel(htmlElement.getAttribute('placeholder'))
  if (placeholder) return placeholder

  return normalizeLabel(htmlElement.getAttribute('name'))
}

function buildSelector(element: Element): string {
  const htmlElement = element as HTMLElement
  const id = htmlElement.getAttribute('id')
  if (id) return `#${cssEscape(id)}`

  const name = htmlElement.getAttribute('name')
  if (name) return `${element.tagName.toLowerCase()}[name="${name.replace(/"/g, '\\"')}"]`

  return element.tagName.toLowerCase()
}

function getFieldType(
  element: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
): GreenhouseField['type'] {
  if (element instanceof HTMLSelectElement) return 'select'
  if (element instanceof HTMLTextAreaElement) return 'textarea'

  const inputType = element.type.toLowerCase()
  if (
    inputType === 'email' ||
    inputType === 'tel' ||
    inputType === 'file' ||
    inputType === 'checkbox' ||
    inputType === 'radio' ||
    inputType === 'url'
  ) {
    return inputType
  }

  return 'text'
}

function getOptions(element: HTMLInputElement | HTMLSelectElement): string[] | undefined {
  if (element instanceof HTMLSelectElement) {
    return Array.from(element.options)
      .map((option) => normalizeLabel(option.textContent))
      .filter(Boolean)
  }

  if (element.type.toLowerCase() === 'radio') {
    const radios = document.querySelectorAll<HTMLInputElement>(
      `input[type="radio"][name="${element.name.replace(/"/g, '\\"')}"]`
    )

    const options = Array.from(radios)
      .map((radio) => normalizeLabel(getLabelText(radio) || radio.value))
      .filter(Boolean)

    return options.length ? options : undefined
  }

  return undefined
}

function isRequired(element: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement): boolean {
  if (element.required || element.getAttribute('aria-required') === 'true') return true
  return !!element.closest('.field')?.querySelector('.field_required')
}

function shouldIgnore(element: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement): boolean {
  if (element instanceof HTMLInputElement) {
    const type = element.type.toLowerCase()
    if (type === 'hidden' || type === 'submit' || type === 'button') return true
  }

  return false
}

export function scanGreenhouseForm(): GreenhouseField[] {
  const form = document.querySelector('#application_form')
  if (!form) return []

  const elements = Array.from(
    form.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
      '[data-field], input, select, textarea'
    )
  )

  const unique = new Set<Element>()
  const fields: GreenhouseField[] = []

  for (const element of elements) {
    if (unique.has(element) || shouldIgnore(element)) continue
    unique.add(element)

    const field: GreenhouseField = {
      selector: buildSelector(element),
      name: element.getAttribute('name') ?? element.id ?? '',
      label: getLabelText(element),
      type: getFieldType(element),
      required: isRequired(element),
    }

    if (element instanceof HTMLInputElement || element instanceof HTMLSelectElement) {
      const options = getOptions(element)
      if (options?.length) field.options = options
    }

    if ('value' in element && typeof element.value === 'string' && element.value) {
      field.value = element.value
    }

    fields.push(field)
  }

  return fields
}
