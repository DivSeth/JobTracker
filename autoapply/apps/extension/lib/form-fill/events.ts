function dispatchFocus(target: HTMLElement): void {
  target.dispatchEvent(new Event('focus'))
}

function dispatchSyntheticInput(target: HTMLInputElement | HTMLTextAreaElement): void {
  const event =
    typeof InputEvent === 'function'
      ? new InputEvent('input', { bubbles: true, composed: true })
      : new Event('input', { bubbles: true, composed: true })

  target.dispatchEvent(event)
}

function dispatchChange(target: HTMLElement): void {
  target.dispatchEvent(new Event('change', { bubbles: true, composed: true }))
}

function dispatchBlur(target: HTMLElement): void {
  target.dispatchEvent(new Event('blur', { bubbles: true, composed: true }))
}

export function fillTextField(
  el: HTMLInputElement | HTMLTextAreaElement,
  value: string
): void {
  el.focus()
  dispatchFocus(el)
  el.value = ''
  el.value = value
  dispatchSyntheticInput(el)
  dispatchChange(el)
  dispatchBlur(el)
}

export function fillSelectField(
  el: HTMLSelectElement,
  value: string,
  aliases?: Record<string, string[]>
): void {
  el.focus()
  dispatchFocus(el)

  const normalized = value.trim().toLowerCase()

  // Build list of candidate strings to match against option text/value
  const candidates: string[] = [normalized]
  if (aliases) {
    for (const [canonical, aliasList] of Object.entries(aliases)) {
      if (canonical.trim().toLowerCase() === normalized) {
        candidates.push(...aliasList.map((a) => a.toLowerCase()))
        break
      }
    }
  }

  const match = Array.from(el.options).find((option) => {
    const optionText = option.text.trim().toLowerCase()
    const optionValue = option.value.trim().toLowerCase()
    return candidates.some(
      (c) =>
        optionText === c ||
        optionValue === c ||
        optionText.includes(c) ||
        (optionText !== '' && c.includes(optionText))
    )
  })

  if (match) {
    el.value = match.value
  }

  dispatchChange(el)
  dispatchBlur(el)
}

export function fillCheckbox(el: HTMLInputElement, checked: boolean): void {
  el.focus()
  dispatchFocus(el)
  el.checked = checked
  dispatchSyntheticInput(el)
  dispatchChange(el)
  dispatchBlur(el)
}

function setNativeInputValue(input: HTMLInputElement, value: string): void {
  const descriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')
  const nativeSetter = descriptor?.set
  if (nativeSetter) {
    nativeSetter.call(input, value)
  } else {
    input.value = value
  }
}

function findComboboxOption(input: HTMLInputElement, value: string): HTMLElement | null {
  const listboxId = input.getAttribute('aria-controls') ?? input.getAttribute('aria-owns')
  const root: ParentNode =
    listboxId != null ? (document.getElementById(listboxId) ?? document) : document
  const options = root.querySelectorAll<HTMLElement>('[role="option"]')
  const target = value.trim().toLowerCase()

  for (const option of options) {
    const text = (option.textContent ?? '').trim().toLowerCase()
    if (text === target) return option
  }
  for (const option of options) {
    const text = (option.textContent ?? '').trim().toLowerCase()
    if (text.includes(target)) return option
  }
  return null
}

export async function fillComboboxField(
  el: HTMLInputElement,
  value: string,
  { openDelayMs = 120 }: { openDelayMs?: number } = {}
): Promise<void> {
  el.focus()
  dispatchFocus(el)
  el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))

  setNativeInputValue(el, value)
  dispatchSyntheticInput(el)

  await new Promise((resolve) => setTimeout(resolve, openDelayMs))

  const option = findComboboxOption(el, value)
  if (!option) {
    throw new Error(`No combobox option matched "${value}"`)
  }

  option.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
  option.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }))
  option.click()

  dispatchChange(el)
  dispatchBlur(el)
}
