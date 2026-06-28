'use client'

import { useI18n } from '@/lib/i18n'
import { getRank } from '@/types'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@/types'

interface Props {
  profile: User | null
  stats: { wins: number; losses: number; total: number }
  isGuest: boolean
}

export default function HomeClient({ profile, stats, isGuest }: Props) {
  const { tr, lang, setLang } = useI18n()
  const router = useRouter()
  const supabase = createClient()

  const rating = profile?.rating ?? 1000
  const rank = getRank(rating)
  const winRate = stats.total > 0 ? Math.round((stats.wins / stats.total) * 100) : 0

  async function handleLogout() {
    await supabase.auth.signOut()
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      {/* ヘッダー */}
      <header className="flex items-center justify-between px-4 py-4 border-b border-zinc-800">
        <h1 className="text-lg font-black tracking-tight">✊ WJL</h1>
        <div className="flex items-center gap-3">
          <div className="flex gap-1 text-xs">
            <button
              onClick={() => setLang('ja')}
              className={`px-2 py-1 rounded ${lang === 'ja' ? 'bg-violet-600 text-white' : 'text-zinc-400'}`}
            >JP</button>
            <button
              onClick={() => setLang('en')}
              className={`px-2 py-1 rounded ${lang === 'en' ? 'bg-violet-600 text-white' : 'text-zinc-400'}`}
            >EN</button>
          </div>
          {profile ? (
            <button onClick={handleLogout} className="text-xs text-zinc-500 hover:text-white">
              logout
            </button>
          ) : (
            <button onClick={() => router.push('/login')} className="text-xs text-violet-400 hover:text-violet-300">
              {tr('login.title')}
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center px-4 py-8 gap-6 max-w-md mx-auto w-full">
        {/* タグライン */}
        <div className="text-center mb-2">
          <p className="text-zinc-400 text-sm">{tr('app.tagline')}</p>
        </div>

        {/* プレイヤーカード */}
        {profile && (
          <div className="w-full bg-zinc-900 rounded-2xl p-5 border border-zinc-800">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-bold text-lg">{profile.display_name}</p>
                <p className="text-violet-400 text-sm font-semibold">{rank}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-black text-white">{rating}</p>
                <p className="text-zinc-500 text-xs">{tr('home.rating')}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-zinc-800 rounded-xl p-3">
                <p className="text-green-400 font-bold text-lg">{stats.wins}</p>
                <p className="text-zinc-500 text-xs">{tr('home.wins')}</p>
              </div>
              <div className="bg-zinc-800 rounded-xl p-3">
                <p className="text-red-400 font-bold text-lg">{stats.losses}</p>
                <p className="text-zinc-500 text-xs">{tr('home.losses')}</p>
              </div>
              <div className="bg-zinc-800 rounded-xl p-3">
                <p className="text-white font-bold text-lg">{winRate}%</p>
                <p className="text-zinc-500 text-xs">{tr('home.winrate')}</p>
              </div>
            </div>
          </div>
        )}

        {/* 対戦ボタン */}
        <button
          onClick={() => router.push('/match')}
          className="w-full py-5 bg-violet-600 hover:bg-violet-500 active:bg-violet-700 rounded-2xl text-xl font-black tracking-wide transition-colors shadow-lg shadow-violet-900/40"
        >
          {tr('home.play')}
        </button>

        {isGuest && (
          <p className="text-zinc-500 text-xs text-center">
            {tr('login.guest.note')}
          </p>
        )}

        {/* ナビゲーション */}
        <div className="grid grid-cols-2 gap-3 w-full">
          <button
            onClick={() => router.push('/ranking')}
            className="py-4 bg-zinc-900 hover:bg-zinc-800 rounded-2xl font-semibold border border-zinc-800 transition-colors"
          >
            🏆 {tr('home.ranking')}
          </button>
          <button
            onClick={() => router.push('/tournament')}
            className="py-4 bg-zinc-900 hover:bg-zinc-800 rounded-2xl font-semibold border border-zinc-800 transition-colors"
          >
            🥊 {tr('home.tournament')}
          </button>
        </div>
      </main>
    </div>
  )
}
