// @vitest-environment jsdom
import { beforeEach, describe, it, expect, vi } from 'vitest'
import { uploadFileToInput } from './file-upload'

class MockDataTransfer {
  files: File[] = []

  items = {
    add: (file: File) => {
      this.files.push(file)
    },
  }
}

describe('uploadFileToInput', () => {
  beforeEach(() => {
    vi.stubGlobal('DataTransfer', MockDataTransfer)
  })

  it('creates File object from provided blob', async () => {
    const input = document.createElement('input')
    input.type = 'file'

    await uploadFileToInput(input, new Blob(['resume']), 'resume.pdf', 'application/pdf')

    expect(input.files?.[0]).toBeInstanceOf(File)
    expect(input.files?.[0]?.name).toBe('resume.pdf')
  })

  it('sets file input files via DataTransfer API', async () => {
    const input = document.createElement('input')
    input.type = 'file'

    await uploadFileToInput(input, new Blob(['resume']), 'resume.pdf', 'application/pdf')

    expect(input.files).toHaveLength(1)
  })

  it('dispatches change event after setting files', async () => {
    const input = document.createElement('input')
    input.type = 'file'
    const handler = vi.fn()
    input.addEventListener('change', handler)

    await uploadFileToInput(input, new Blob(['resume']), 'resume.pdf', 'application/pdf')

    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('handles empty blobs without failing', async () => {
    const input = document.createElement('input')
    input.type = 'file'

    await expect(
      uploadFileToInput(input, new Blob([]), 'empty.txt', 'text/plain')
    ).resolves.toBeUndefined()
  })
})
