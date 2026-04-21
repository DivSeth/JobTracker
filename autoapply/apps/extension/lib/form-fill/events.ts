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

export function fillSelectField(el: HTMLSelectElement, value: string): void {
  el.focus()
  dispatchFocus(el)

  const normalized = value.trim().toLowerCase()
  const match = Array.from(el.options).find((option) => {
    const optionText = option.text.trim().toLowerCase()
    const optionValue = option.value.trim().toLowerCase()
    return (
      optionText === normalized ||
      optionValue === normalized ||
      optionText.includes(normalized) ||
      normalized.includes(optionText)
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
