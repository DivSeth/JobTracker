import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { ApplicationDetail } from '@/components/applications/ApplicationDetail'

interface Props { params: Promise<{ id: string }> }

export default async function ApplicationDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data } = await supabase
    .from('applications')
    .select('*, job:jobs(*)')
    .eq('id', id)
    .eq('user_id', user!.id)
    .single()

  if (!data) notFound()

  return <ApplicationDetail application={data as any} />
}
