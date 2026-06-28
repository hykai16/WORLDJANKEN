import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

const statusLabel: Record<string, { label: string; color: string }> = {
  upcoming:    { label: '開催予定', color: 'text-zinc-400 bg-zinc-800' },
  entry_open:  { label: 'エントリー受付中', color: 'text-green-400 bg-green-950' },
  in_progress: { label: '開催中', color: 'text-yellow-400 bg-yellow-950' },
  completed:   { label: '終了', color: 'text-zinc-500 bg-zinc-800' },
}

export default async function TournamentPage() {
  const supabase = await createClient()

  const { data: tournaments } = await supabase
    .from('tournaments')
    .select('*')
    .neq('status', 'completed')
    .order('start_at', { ascending: true })
    .limit(20)

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      <header className="flex items-center gap-3 px-4 py-4 border-b border-zinc-800">
        <Link href="/" className="text-zinc-400 hover:text-white text-sm">← Back</Link>
        <h1 className="font-black text-lg">🥊 Tournament</h1>
      </header>

      <main className="flex-1 max-w-xl mx-auto w-full px-4 py-6 flex flex-col gap-4">
        {tournaments && tournaments.length > 0 ? (
          tournaments.map(t => {
            const s = statusLabel[t.status] ?? statusLabel.upcoming
            const start = new Date(t.start_at).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
            return (
              <div key={t.id} className="bg-zinc-900 rounded-2xl p-5 border border-zinc-800">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h2 className="font-bold text-white">{t.title}</h2>
                  <span className={`text-xs px-2 py-1 rounded-full font-semibold whitespace-nowrap ${s.color}`}>
                    {s.label}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs mb-4">
                  <div className="bg-zinc-800 rounded-lg py-2">
                    <p className="text-white font-bold">{t.match_format}</p>
                    <p className="text-zinc-500">形式</p>
                  </div>
                  <div className="bg-zinc-800 rounded-lg py-2">
                    <p className="text-white font-bold">{t.max_participants}</p>
                    <p className="text-zinc-500">定員</p>
                  </div>
                  <div className="bg-zinc-800 rounded-lg py-2">
                    <p className="text-yellow-400 font-bold">¥{t.prize_pool.toLocaleString()}</p>
                    <p className="text-zinc-500">賞金</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-zinc-500 text-xs">開始: {start}</p>
                  {t.status === 'entry_open' && (
                    <button className="px-4 py-2 bg-violet-600 hover:bg-violet-500 rounded-xl text-sm font-bold transition-colors">
                      エントリー
                    </button>
                  )}
                </div>
              </div>
            )
          })
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center py-20">
            <p className="text-5xl">🏟️</p>
            <p className="text-white font-bold text-lg">大会は近日開催予定です</p>
            <p className="text-zinc-500 text-sm">Daily Cup・Weekly Cupなど準備中</p>
          </div>
        )}
      </main>
    </div>
  )
}
