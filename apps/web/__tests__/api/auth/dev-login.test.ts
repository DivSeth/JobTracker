import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const signInWithPassword = vi.fn()
const listUsers = vi.fn()
const updateUserById = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { signInWithPassword },
  }),
}))

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn().mockReturnValue({
    auth: {
      admin: {
        listUsers,
        updateUserById,
      },
    },
  }),
}))

describe('GET /api/auth/dev-login', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    delete process.env.ENABLE_DEV_LOGIN
    delete process.env.DEV_LOGIN_EMAIL
    delete process.env.DEV_LOGIN_PASSWORD
  })

  it('returns 404 unless explicitly enabled', async () => {
    const { GET } = await import('@/app/api/auth/dev-login/route')

    const response = await GET(new NextRequest('http://127.0.0.1:3000/api/auth/dev-login'))

    expect(response.status).toBe(404)
    expect(signInWithPassword).not.toHaveBeenCalled()
  })

  it('updates a local user password, signs in, and redirects home when enabled', async () => {
    process.env.ENABLE_DEV_LOGIN = 'true'
    process.env.DEV_LOGIN_EMAIL = 'seth.divyaansh@gmail.com'
    process.env.DEV_LOGIN_PASSWORD = 'local-dev-password'
    process.env.NEXT_PUBLIC_WEBAPP_URL = 'http://127.0.0.1:3000'
    listUsers.mockResolvedValue({
      data: {
        users: [
          { id: 'user-1', email: 'seth.divyaansh@gmail.com' },
        ],
      },
      error: null,
    })
    updateUserById.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null })
    signInWithPassword.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null })
    const { GET } = await import('@/app/api/auth/dev-login/route')

    const response = await GET(new NextRequest('http://127.0.0.1:3000/api/auth/dev-login'))

    expect(response.status).toBe(302)
    expect(response.headers.get('location')).toBe('http://127.0.0.1:3000/')
    expect(updateUserById).toHaveBeenCalledWith('user-1', {
      password: 'local-dev-password',
      email_confirm: true,
    })
    expect(signInWithPassword).toHaveBeenCalledWith({
      email: 'seth.divyaansh@gmail.com',
      password: 'local-dev-password',
    })
  })
})
