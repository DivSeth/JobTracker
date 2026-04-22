import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CountryCodeChipInput } from '@/components/profile/CountryCodeChipInput'

describe('CountryCodeChipInput', () => {
  it('renders existing codes as chips', () => {
    render(<CountryCodeChipInput value={['US', 'GB']} onChange={vi.fn()} />)
    expect(screen.getByText('United States')).toBeInTheDocument()
    expect(screen.getByText('United Kingdom')).toBeInTheDocument()
  })

  it('adds a code when the user picks from dropdown', () => {
    const onChange = vi.fn()
    render(<CountryCodeChipInput value={['US']} onChange={onChange} />)
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'IN' } })
    expect(onChange).toHaveBeenCalledWith(['US', 'IN'])
  })

  it('removes a code when the user clicks the × on a chip', () => {
    const onChange = vi.fn()
    render(<CountryCodeChipInput value={['US', 'GB']} onChange={onChange} />)
    fireEvent.click(screen.getByLabelText('Remove United States'))
    expect(onChange).toHaveBeenCalledWith(['GB'])
  })

  it('dedupes when adding an existing code', () => {
    const onChange = vi.fn()
    render(<CountryCodeChipInput value={['US']} onChange={onChange} />)
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'US' } })
    expect(onChange).toHaveBeenCalledWith(['US'])
  })
})
