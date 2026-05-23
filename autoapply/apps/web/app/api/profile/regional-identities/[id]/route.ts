import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { regionalIdentityUpdateSchema, type RegionalIdentityUpdate } from '@/lib/schemas/regional-identity'

type RouteParams = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, { params }: RouteParams) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let rawBody: unknown
  try {
    rawBody = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (typeof rawBody !== 'object' || rawBody === null || Object.keys(rawBody).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
  }

  let parsed: RegionalIdentityUpdate
  try {
    parsed = regionalIdentityUpdateSchema.parse(rawBody)
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 400 })
    }
    throw err
  }

  const { data, error } = await supabase
    .from('user_regional_identities')
    .update(parsed)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(data)
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { error } = await supabase
    .from('user_regional_identities')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
