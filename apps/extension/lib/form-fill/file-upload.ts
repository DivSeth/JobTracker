export async function uploadFileToInput(
  input: HTMLInputElement,
  blob: Blob,
  filename: string,
  mimeType: string
): Promise<void> {
  const file = new File([blob], filename, { type: mimeType })
  const transfer = new DataTransfer()
  transfer.items.add(file)

  Object.defineProperty(input, 'files', {
    configurable: true,
    value: transfer.files,
  })

  input.dispatchEvent(new Event('change', { bubbles: true, composed: true }))
}
