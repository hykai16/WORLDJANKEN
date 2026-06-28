import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import MatchRoom from './MatchRoom'
import CpuMatchRoom from './CpuMatchRoom'
import type { MatchFormat } from '@/types'

export default async function MatchPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; format?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('rating, display_name, is_guest')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/')

  const params = await searchParams
  const isCpu = params.mode === 'cpu'
  const format = (['BO1', 'BO3', 'BO5'].includes(params.format ?? '') ? params.format : 'BO1') as MatchFormat

  if (isCpu) {
    return (
      <CpuMatchRoom
        userId={user.id}
        userRating={profile.rating}
        userName={profile.display_name}
        format={format}
      />
    )
  }

  return (
    <MatchRoom
      userId={user.id}
      userRating={profile.rating}
      userName={profile.display_name}
    />
  )
}
