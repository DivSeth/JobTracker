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

  let match = Array.from(el.options).find((option) => {
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

  // Word-overlap fallback when no exact/alias match found
  if (!match) {
    const words = candidates[0].split(/\s+/).filter((w) => w.length > 2)
    if (words.length > 0) {
      let best = { option: null as HTMLOptionElement | null, score: 0 }
      for (const option of Array.from(el.options)) {
        const optionText = option.text.trim().toLowerCase()
        if (!optionText) continue
        const score = words.filter((w) => optionText.includes(w)).length / words.length
        if (score > best.score) best = { option, score }
      }
      if (best.score >= 0.4 && best.option) match = best.option
    }
  }

  if (match) {
    el.value = match.value
  }

  dispatchChange(el)
  dispatchBlur(el)
}

export function fillRadioGroup(
  el: HTMLInputElement,
  value: string,
  aliases?: Record<string, string[]>
): void {
  const escaped = el.name.replace(/"/g, '\\"')
  const radios = Array.from(
    document.querySelectorAll<HTMLInputElement>(`input[type="radio"][name="${escaped}"]`)
  )
  if (radios.length === 0) return

  const normalized = value.trim().toLowerCase()
  const candidates: string[] = [normalized]
  if (aliases) {
    for (const [canonical, aliasList] of Object.entries(aliases)) {
      if (canonical.trim().toLowerCase() === normalized) {
        candidates.push(...aliasList.map((a) => a.toLowerCase()))
        break
      }
    }
  }

  function getRadioLabel(radio: HTMLInputElement): string {
    if (radio.id) {
      const labelEl = document.querySelector<HTMLLabelElement>(`label[for="${radio.id}"]`)
      if (labelEl) return labelEl.textContent?.trim().toLowerCase() ?? ''
    }
    const parent = radio.closest('label')
    if (parent) return parent.textContent?.trim().toLowerCase() ?? ''
    return radio.value.trim().toLowerCase()
  }

  let match: HTMLInputElement | null = null

  for (const radio of radios) {
    const labelText = getRadioLabel(radio)
    const radioValue = radio.value.trim().toLowerCase()
    const found = candidates.some(
      (c) =>
        labelText === c ||
        radioValue === c ||
        labelText.includes(c) ||
        (labelText !== '' && c.includes(labelText))
    )
    if (found) {
      match = radio
      break
    }
  }

  // Word-overlap fallback
  if (!match) {
    const words = candidates[0].split(/\s+/).filter((w) => w.length > 2)
    if (words.length > 0) {
      let best = { radio: null as HTMLInputElement | null, score: 0 }
      for (const radio of radios) {
        const labelText = getRadioLabel(radio)
        const score = words.filter((w) => labelText.includes(w)).length / words.length
        if (score > best.score) best = { radio, score }
      }
      if (best.score >= 0.4 && best.radio) match = best.radio
    }
  }

  if (match) {
    match.focus()
    dispatchFocus(match)
    match.checked = true
    dispatchSyntheticInput(match)
    dispatchChange(match)
    dispatchBlur(match)
  }
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

  // Pass 1: exact match
  for (const option of options) {
    const text = (option.textContent ?? '').trim().toLowerCase()
    if (text === target) return option
  }
  // Pass 2: substring match (either direction)
  for (const option of options) {
    const text = (option.textContent ?? '').trim().toLowerCase()
    if (text.includes(target) || (target.length > 4 && target.includes(text))) return option
  }
  // Pass 3: word-overlap fallback (≥50% of query words found in option text)
  const words = target.split(/\s+/).filter((w) => w.length > 2)
  if (words.length > 0) {
    let best = { option: null as HTMLElement | null, score: 0 }
    for (const option of options) {
      const text = (option.textContent ?? '').trim().toLowerCase()
      if (!text) continue
      const score = words.filter((w) => text.includes(w)).length / words.length
      if (score > best.score) best = { option, score }
    }
    if (best.score >= 0.5 && best.option) return best.option
  }
  return null
}

export async function fillComboboxField(
  el: HTMLInputElement,
  value: string,
  { openDelayMs = 300 }: { openDelayMs?: number } = {}
): Promise<void> {
  el.focus()
  dispatchFocus(el)

  // Click the React Select control wrapper to open the dropdown, not just the inner input
  const control = el.closest('[class*="__control"], [class*="select-shell"], [class*="select__"]') ?? el
  control.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }))
  control.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true }))

  await new Promise((resolve) => setTimeout(resolve, 80))

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
