import { createClient } from '@/lib/supabase/server'
import { getRank } from '@/types'
import Link from 'next/link'

const FLAG: Record<string, string> = {
  JP: '🇯🇵', US: '🇺🇸', KR: '🇰🇷', CN: '🇨🇳', GB: '🇬🇧',
  DE: '🇩🇪', FR: '🇫🇷', BR: '🇧🇷', AU: '🇦🇺', CA: '🇨🇦',
}

export default async function RankingPage() {
  const supabase = await createClient()

  const { data: players } = await supabase
    .from('users')
    .select('id, display_name, country, rating, is_guest')
    .eq('is_guest', false)
    .order('rating', { ascending: false })
    .limit(100)

  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      <header className="flex items-center gap-3 px-4 py-4 border-b border-zinc-800">
        <Link href="/" className="text-zinc-400 hover:text-white text-sm">← Back</Link>
        <h1 className="font-black text-lg">🏆 World Ranking</h1>
      </header>

      <main className="flex-1 max-w-xl mx-auto w-full px-4 py-6">
        <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
          <div className="grid grid-cols-[48px_1fr_auto] px-4 py-2 text-xs text-zinc-500 border-b border-zinc-800 font-semibold">
            <span>Rank</span>
            <span>Player</span>
            <span>Rating</span>
          </div>

          {players && players.length > 0 ? (
            players.map((p, i) => {
              const isMe = p.id === user?.id
              const rank = getRank(p.rating)
              return (
                <div
                  key={p.id}
                  className={`grid grid-cols-[48px_1fr_auto] items-center px-4 py-3 border-b border-zinc-800/50 last:border-0 ${isMe ? 'bg-violet-950/40' : 'hover:bg-zinc-800/30'}`}
                >
                  <span className={`text-sm font-bold ${i < 3 ? ['text-yellow-400', 'text-zinc-300', 'text-amber-600'][i] : 'text-zinc-500'}`}>
                    #{i + 1}
                  </span>
                  <div className="min-w-0">
                    <p className={`font-semibold text-sm truncate ${isMe ? 'text-violet-300' : 'text-white'}`}>
                      {FLAG[p.country ?? ''] ?? '🌍'} {p.display_name}
                      {isMe && <span className="text-xs text-violet-400 ml-1">（あなた）</span>}
                    </p>
                    <p className="text-zinc-500 text-xs">{rank}</p>
                  </div>
                  <span className="text-white font-bold text-sm">{p.rating}</span>
                </div>
              )
            })
          ) : (
            <div className="py-12 text-center text-zinc-500">
              まだプレイヤーがいません
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
