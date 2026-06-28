'use client'

import { useI18n } from '@/lib/i18n'
import { getRank } from '@/types'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import type { User } from '@/types'

interface Props {
  profile: User | null
  stats: { wins: number; losses: number; total: number }
  isGuest: boolean
}

function Countdown({ targetDate }: { targetDate: Date }) {
  const [time, setTime] = useState({ h: '00', m: '00', s: '00' })

  useEffect(() => {
    function update() {
      const diff = targetDate.getTime() - Date.now()
      if (diff <= 0) { setTime({ h: '00', m: '00', s: '00' }); return }
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setTime({
        h: String(h).padStart(2, '0'),
        m: String(m).padStart(2, '0'),
        s: String(s).padStart(2, '0'),
      })
    }
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [targetDate])

  return (
    <span className="font-black text-white tracking-widest">
      {time.h}:{time.m}:{time.s}
    </span>
  )
}

export default function HomeClient({ profile, stats, isGuest }: Props) {
  const { tr, lang, setLang } = useI18n()
  const router = useRouter()
  const supabase = createClient()

  const rating = profile?.rating ?? 1000
  const rank = getRank(rating)
  const winRate = stats.total > 0 ? Math.round((stats.wins / stats.total) * 100) : 0

  // 次回大会（仮：24時間後）
  const nextTournament = new Date(Date.now() + 1000 * 60 * 60 * 24)

  async function handleLogout() {
    await supabase.auth.signOut()
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-[#050508] flex flex-col text-white overflow-x-hidden">

      {/* ヒーローバナー */}
      <div className="relative w-full" style={{ aspectRatio: '16/9', maxHeight: '52vw' }}>
        <Image
          src="/keyvisual/WORLDJANKENLEAGUE.png"
          alt="World Janken League"
          fill
          className="object-cover object-top"
          priority
        />
        {/* グラデーションオーバーレイ */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-[#050508]" />

        {/* 右上：言語 + ログイン */}
        <div className="absolute top-3 right-3 flex items-center gap-2">
          <div className="flex gap-1 text-xs bg-black/50 backdrop-blur rounded-full px-2 py-1">
            <button
              onClick={() => setLang('ja')}
              className={`px-2 py-0.5 rounded-full transition-colors ${lang === 'ja' ? 'bg-white/20 text-white' : 'text-white/50'}`}
            >JP</button>
            <button
              onClick={() => setLang('en')}
              className={`px-2 py-0.5 rounded-full transition-colors ${lang === 'en' ? 'bg-white/20 text-white' : 'text-white/50'}`}
            >EN</button>
          </div>
          {profile ? (
            <button onClick={handleLogout} className="text-xs text-white/50 hover:text-white bg-black/40 backdrop-blur px-2 py-1 rounded-full">
              logout
            </button>
          ) : (
            <button onClick={() => router.push('/login')} className="text-xs text-yellow-400 bg-black/50 backdrop-blur px-3 py-1 rounded-full font-semibold">
              {tr('login.title')}
            </button>
          )}
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="flex flex-col gap-4 px-4 pb-6 -mt-2 max-w-md mx-auto w-full">

        {/* プレイヤーカード */}
        {profile && (
          <div
            className="rounded-2xl p-4 border"
            style={{ background: 'linear-gradient(135deg, #0a0a1a 0%, #0d0d20 100%)', borderColor: '#1a1a3a' }}
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="font-black text-lg leading-tight">{profile.display_name}</p>
                <p className="text-sm font-bold" style={{ color: '#A64CFF' }}>{rank}</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-black text-white">{rating.toLocaleString()}</p>
                <p className="text-white/40 text-xs">{tr('home.rating')}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                { value: stats.wins, label: tr('home.wins'), color: '#0D6EFD' },
                { value: stats.losses, label: tr('home.losses'), color: '#FF3B30' },
                { value: `${winRate}%`, label: tr('home.winrate'), color: '#A64CFF' },
              ].map(({ value, label, color }) => (
                <div key={label} className="bg-white/5 rounded-xl py-2">
                  <p className="font-black text-lg" style={{ color }}>{value}</p>
                  <p className="text-white/40 text-xs">{label}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 対戦ボタン */}
        <button
          onClick={() => router.push('/match')}
          className="w-full py-5 rounded-2xl text-xl font-black tracking-wider transition-all active:scale-95 shadow-lg"
          style={{
            background: 'linear-gradient(135deg, #C8A951 0%, #FFD700 50%, #C8A951 100%)',
            color: '#0a0a00',
            boxShadow: '0 0 30px rgba(200,169,81,0.4)',
          }}
        >
          {tr('home.play')}
        </button>

        {/* vs CPU */}
        <button
          onClick={() => router.push('/match?mode=cpu&format=BO1')}
          className="w-full py-3 rounded-2xl text-sm font-semibold transition-all border border-white/10 text-white/60 hover:text-white hover:border-white/20 bg-white/5"
        >
          🤖 vs CPU で練習する
        </button>

        {isGuest && (
          <p className="text-white/30 text-xs text-center">{tr('login.guest.note')}</p>
        )}

        {/* 次回大会ウィジェット */}
        <div
          className="rounded-2xl p-4 border"
          style={{ background: 'linear-gradient(135deg, #0f0a00 0%, #1a1000 100%)', borderColor: '#3a2a00' }}
        >
          <p className="text-xs font-semibold tracking-widest mb-1" style={{ color: '#C8A951' }}>
            NEXT TOURNAMENT
          </p>
          <p className="font-black text-lg mb-2" style={{ color: '#FFD700' }}>
            🏆 JANKEN CUP
          </p>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/40 text-xs mb-1">開催まで</p>
              <div className="text-2xl font-black tracking-widest">
                <Countdown targetDate={nextTournament} />
              </div>
            </div>
            <div className="text-right">
              <p className="text-white/40 text-xs mb-1">PRIZE POOL</p>
              <p className="text-xl font-black" style={{ color: '#FFD700' }}>¥ 324,680</p>
            </div>
          </div>
        </div>

        {/* キャラクター3体カード */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { move: 'ROCK', jp: 'グー', emoji: '✊', color: '#0D6EFD', bg: 'rgba(13,110,253,0.1)', border: 'rgba(13,110,253,0.3)' },
            { move: 'PAPER', jp: 'パー', emoji: '🖐️', color: '#A64CFF', bg: 'rgba(166,76,255,0.1)', border: 'rgba(166,76,255,0.3)' },
            { move: 'SCISSORS', jp: 'チョキ', emoji: '✌️', color: '#FF3B30', bg: 'rgba(255,59,48,0.1)', border: 'rgba(255,59,48,0.3)' },
          ].map(({ move, jp, emoji, color, bg, border }) => (
            <div
              key={move}
              className="rounded-xl p-3 text-center"
              style={{ background: bg, border: `1px solid ${border}` }}
            >
              <p className="text-3xl mb-1">{emoji}</p>
              <p className="text-xs font-black" style={{ color }}>{move}</p>
              <p className="text-white/40 text-xs">{jp}</p>
            </div>
          ))}
        </div>

        {/* ボトムナビ */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => router.push('/ranking')}
            className="py-4 rounded-2xl font-bold text-sm flex flex-col items-center gap-1 border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
          >
            <span className="text-xl">🏆</span>
            <span className="text-white/70">{tr('home.ranking')}</span>
          </button>
          <button
            onClick={() => router.push('/tournament')}
            className="py-4 rounded-2xl font-bold text-sm flex flex-col items-center gap-1 border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
          >
            <span className="text-xl">🥊</span>
            <span className="text-white/70">{tr('home.tournament')}</span>
          </button>
        </div>

        {/* フッタータグライン */}
        <p className="text-center text-white/20 text-xs pb-2">
          今日の一手が、世界を動かす。
        </p>
      </div>
    </div>
  )
}
