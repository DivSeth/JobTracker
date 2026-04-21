import { fillCheckbox, fillComboboxField, fillSelectField, fillTextField } from '@/lib/form-fill/events'
import type { FillFieldResult, FillResult, MappedField } from '@/lib/greenhouse/types'

interface FillOptions {
  onFileUploadRequest?: (profilePath: string, selector: string) => Promise<void>
  onProgress?: (completed: number, total: number, last: FillFieldResult) => void
  delayMs?: number
}

function sleep(delayMs: number): Promise<void> {
  if (delayMs <= 0) return Promise.resolve()

  return new Promise((resolve) => {
    setTimeout(resolve, delayMs)
  })
}

function getFillTarget(field: MappedField): HTMLElement {
  const target = document.querySelector(field.field.selector)

  if (!target) {
    throw new Error(`Field not found for selector: ${field.field.selector}`)
  }

  return target as HTMLElement
}

export async function fillForm(
  mappedFields: MappedField[],
  options: FillOptions = {}
): Promise<FillResult> {
  const delayMs = options.delayMs ?? 50
  const results: FillFieldResult[] = []
  let filled = 0
  let skipped = 0
  let errors = 0

  for (const [index, mappedField] of mappedFields.entries()) {
    let result: FillFieldResult

    try {
      if (mappedField.profileValue === null && mappedField.field.type !== 'file') {
        result = {
          field: mappedField.field,
          status: 'skipped',
        }
      } else {
        const target = getFillTarget(mappedField)

        switch (mappedField.field.type) {
          case 'text':
          case 'email':
          case 'tel':
          case 'url':
          case 'textarea':
            fillTextField(
              target as HTMLInputElement | HTMLTextAreaElement,
              mappedField.profileValue ?? ''
            )
            break
          case 'select':
            fillSelectField(target as HTMLSelectElement, mappedField.profileValue ?? '')
            break
          case 'combobox':
            await fillComboboxField(
              target as HTMLInputElement,
              mappedField.profileValue ?? ''
            )
            break
          case 'checkbox':
            fillCheckbox(target as HTMLInputElement, mappedField.profileValue === 'true')
            break
          case 'file':
            if (mappedField.profilePath) {
              await options.onFileUploadRequest?.(mappedField.profilePath, mappedField.field.selector)
            }
            break
          default:
            result = {
              field: mappedField.field,
              status: 'skipped',
            }
            skipped += 1
            results.push(result)
            options.onProgress?.(index + 1, mappedFields.length, result)
            await sleep(delayMs)
            continue
        }

        result = {
          field: mappedField.field,
          status: 'filled',
        }
      }
    } catch (error) {
      result = {
        field: mappedField.field,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown fill error',
      }
    }

    if (result.status === 'filled') filled += 1
    if (result.status === 'skipped') skipped += 1
    if (result.status === 'error') errors += 1

    results.push(result)
    options.onProgress?.(index + 1, mappedFields.length, result)

    await sleep(delayMs)
  }

  return {
    total: mappedFields.length,
    filled,
    skipped,
    errors,
    results,
  }
}
