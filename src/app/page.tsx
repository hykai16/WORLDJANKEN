import { createClient } from '@/lib/supabase/server'
import HomeClient from './HomeClient'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let profile = null
  let stats = { wins: 0, losses: 0, total: 0 }

  if (user) {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()
    profile = data

    const { count: wins } = await supabase
      .from('matches')
      .select('*', { count: 'exact', head: true })
      .eq('winner_id', user.id)
      .eq('status', 'completed')

    const { count: total } = await supabase
      .from('matches')
      .select('*', { count: 'exact', head: true })
      .or(`player1_id.eq.${user.id},player2_id.eq.${user.id}`)
      .eq('status', 'completed')

    stats = {
      wins: wins ?? 0,
      losses: (total ?? 0) - (wins ?? 0),
      total: total ?? 0,
    }
  }

  return <HomeClient profile={profile} stats={stats} isGuest={!user || profile?.is_guest} />
}
