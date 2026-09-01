import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { NotificationBell } from '@/components/layout/NotificationBell'

describe('NotificationBell', () => {
  it('shows no unread dot when there are no alerts', () => {
    render(<NotificationBell alerts={[]} />)

    expect(screen.getByRole('button', { name: /notifications/i })).toBeInTheDocument()
    expect(screen.queryByText(/networking alerts/i)).not.toBeInTheDocument()
  })

  it('opens a menu with real network alerts', () => {
    render(
      <NotificationBell
        alerts={[
          {
            id: 'alert-1',
            message: 'You know someone connected to Nooks.',
            created_at: '2026-08-18T00:00:00.000Z',
          },
        ]}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /notifications/i }))

    expect(screen.getByText(/1 networking alert/i)).toBeInTheDocument()
    expect(screen.getByText(/connected to Nooks/i)).toBeInTheDocument()
  })
})
