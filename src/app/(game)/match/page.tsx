import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import MatchRoom from './MatchRoom'

export default async function MatchPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('rating, display_name, is_guest')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/')

  return (
    <MatchRoom
      userId={user.id}
      userRating={profile.rating}
      userName={profile.display_name}
    />
  )
}
