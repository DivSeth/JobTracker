import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { JobFilters } from '@/components/jobs/JobFilters'

describe('JobFilters', () => {
  it('renders all 4 filter tabs', () => {
    render(<JobFilters active="all" onChange={vi.fn()} />)
    expect(screen.getByText('All')).toBeInTheDocument()
    expect(screen.getByText('New Grad')).toBeInTheDocument()
    expect(screen.getByText('Internship')).toBeInTheDocument()
    expect(screen.getByText('Fulltime')).toBeInTheDocument()
  })

  it('calls onChange with correct value when a tab is clicked', () => {
    const onChange = vi.fn()
    render(<JobFilters active="all" onChange={onChange} />)
    fireEvent.click(screen.getByText('New Grad'))
    expect(onChange).toHaveBeenCalledWith('new_grad')
  })
})
