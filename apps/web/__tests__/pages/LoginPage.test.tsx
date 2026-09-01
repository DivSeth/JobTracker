import { render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import LoginPage from '@/app/(auth)/login/page'

it('renders value props without leaking icon ligature text', () => {
  render(<LoginPage />)

  expect(screen.getByText('Auto-fill any ATS form in one click')).toBeInTheDocument()
  expect(screen.queryByText('check_circle')).not.toBeInTheDocument()
})
