import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { createClient } = vi.hoisted(() => ({
  createClient: vi.fn(),
}))

vi.mock('@/lib/supabase/client', () => ({
  createClient,
}))

import { SignInButton } from '@/components/auth/SignInButton'

describe('SignInButton', () => {
  beforeEach(() => {
    createClient.mockReset()
    vi.restoreAllMocks()
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://ekrohnxccdxpnpctzlst.supabase.co'
    process.env.NEXT_PUBLIC_WEBAPP_URL = ''
    window.history.replaceState(null, '', '/login')
  })

  it('shows an auth configuration error when Supabase Auth is unreachable', async () => {
    const signInWithOAuth = vi.fn()
    createClient.mockReturnValue({ auth: { signInWithOAuth } })
    vi.spyOn(global, 'fetch').mockRejectedValue(new TypeError('DNS address could not be found'))

    render(<SignInButton />)
    fireEvent.click(screen.getByRole('button', { name: /continue with google/i }))

    expect(await screen.findByText(/auth service is not reachable/i)).toBeInTheDocument()
    expect(signInWithOAuth).not.toHaveBeenCalled()
  })

  it('starts Google OAuth when Supabase Auth is reachable', async () => {
    const signInWithOAuth = vi.fn().mockResolvedValue({ data: {}, error: null })
    createClient.mockReturnValue({ auth: { signInWithOAuth } })
    vi.spyOn(global, 'fetch').mockResolvedValue({ ok: true } as Response)

    render(<SignInButton />)
    fireEvent.click(screen.getByRole('button', { name: /continue with google/i }))

    await waitFor(() => {
      expect(signInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: expect.objectContaining({
          redirectTo: 'http://localhost:3000/api/auth/callback',
        }),
      })
    })
  })
})
