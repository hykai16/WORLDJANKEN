'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useI18n } from '@/lib/i18n'
import { calcElo, getRank } from '@/types'
import type { Move, MatchFormat } from '@/types'
import MoveButton from '@/components/game/MoveButton'
import Timer from '@/components/game/Timer'
import OpponentHistory from '@/components/game/OpponentHistory'

const CPU_RATING = 1000
const CPU_NAME = 'CPU'
const MOVES: Move[] = ['rock', 'scissors', 'paper']

function randomMove(): Move {
  return MOVES[Math.floor(Math.random() * 3)]
}

function judge(my: Move, opp: Move): 'win' | 'lose' | 'draw' {
  if (my === opp) return 'draw'
  if (
    (my === 'rock' && opp === 'scissors') ||
    (my === 'scissors' && opp === 'paper') ||
    (my === 'paper' && opp === 'rock')
  ) return 'win'
  return 'lose'
}

type Phase = 'choosing' | 'waiting_cpu' | 'revealing' | 'result'

interface Props {
  userId: string
  userRating: number
  userName: string
  format: MatchFormat
}

export default function CpuMatchRoom({ userId, userRating, userName, format }: Props) {
  const { tr } = useI18n()
  const router = useRouter()
  const supabase = createClient()

  const [phase, setPhase] = useState<Phase>('choosing')
  const [myMove, setMyMove] = useState<Move | null>(null)
  const [cpuMove, setCpuMove] = useState<Move | null>(null)
  const [roundResult, setRoundResult] = useState<'win' | 'lose' | 'draw' | null>(null)
  const [myWins, setMyWins] = useState(0)
  const [cpuWins, setCpuWins] = useState(0)
  const [round, setRound] = useState(1)
  const [matchResult, setMatchResult] = useState<'win' | 'lose' | null>(null)
  const [ratingDelta, setRatingDelta] = useState(0)
  const [currentRating, setCurrentRating] = useState(userRating)
  const [cpuHistory, setCpuHistory] = useState<Move[]>([])

  const timeUpCalled = useRef(false)

  const winsNeeded = format === 'BO1' ? 1 : format === 'BO3' ? 2 : 3

  // CPUの傾向（ランダムに偏らせる）
  const cpuStats = {
    rock: Math.floor(Math.random() * 20) + 30,
    scissors: Math.floor(Math.random() * 20) + 20,
    paper: 0,
    total: 0,
  }
  cpuStats.paper = 100 - cpuStats.rock - cpuStats.scissors
  cpuStats.total = 100

  const handleTimeUp = useCallback(() => {
    if (timeUpCalled.current || phase !== 'choosing') return
    timeUpCalled.current = true
    resolveRound('rock', true) // 時間切れ = 負け扱い（rock固定で相手有利）
  }, [phase]) // eslint-disable-line

  function selectMove(move: Move) {
    if (phase !== 'choosing') return
    setMyMove(move)
    setPhase('waiting_cpu')

    // CPUが考える時間（1〜3秒）
    const delay = 1000 + Math.random() * 2000
    setTimeout(() => {
      const cpu = randomMove()
      setCpuMove(cpu)
      resolveRound(move, false, cpu)
    }, delay)
  }

  function resolveRound(move: Move, forfeit: boolean, cpu?: Move) {
    const cpuSelected = cpu ?? randomMove()
    const result = forfeit ? 'lose' : judge(move, cpuSelected)

    setCpuMove(cpuSelected)
    setCpuHistory(prev => [cpuSelected, ...prev].slice(0, 10))
    setRoundResult(result)
    setPhase('revealing')

    if (result === 'draw') {
      setTimeout(() => {
        setMyMove(null)
        setCpuMove(null)
        setRoundResult(null)
        timeUpCalled.current = false
        setPhase('choosing')
      }, 1500)
      return
    }

    const newMyWins = result === 'win' ? myWins + 1 : myWins
    const newCpuWins = result === 'lose' ? cpuWins + 1 : cpuWins
    setMyWins(newMyWins)
    setCpuWins(newCpuWins)

    setTimeout(async () => {
      if (newMyWins >= winsNeeded || newCpuWins >= winsNeeded) {
        const won = newMyWins >= winsNeeded
        const newRating = calcElo(currentRating, CPU_RATING, won)
        const delta = newRating - currentRating
        setRatingDelta(delta)
        setCurrentRating(newRating)
        setMatchResult(won ? 'win' : 'lose')
        setPhase('result')
        // レート更新
        await supabase.from('users').update({ rating: newRating }).eq('id', userId)
      } else {
        setMyMove(null)
        setCpuMove(null)
        setRoundResult(null)
        timeUpCalled.current = false
        setRound(r => r + 1)
        setPhase('choosing')
      }
    }, 2000)
  }

  function resetMatch() {
    setPhase('choosing')
    setMyMove(null)
    setCpuMove(null)
    setRoundResult(null)
    setMyWins(0)
    setCpuWins(0)
    setRound(1)
    setMatchResult(null)
    setRatingDelta(0)
    timeUpCalled.current = false
  }

  if (phase === 'result') {
    const won = matchResult === 'win'
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center gap-6 px-4">
        <div className={`text-6xl ${won ? 'animate-bounce' : ''}`}>
          {won ? '🏆' : '😢'}
        </div>
        <h2 className={`text-4xl font-black ${won ? 'text-violet-400' : 'text-zinc-400'}`}>
          {won ? tr('match.win') : tr('match.lose')}
        </h2>
        <div className="bg-zinc-900 rounded-2xl px-8 py-4 text-center border border-zinc-800">
          <p className="text-zinc-400 text-sm mb-1">{tr('home.rating')}</p>
          <p className="text-white font-bold text-2xl">{currentRating}</p>
          <p className={`font-semibold text-sm ${ratingDelta >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {ratingDelta >= 0 ? '+' : ''}{ratingDelta}
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={resetMatch} className="px-6 py-3 bg-violet-600 hover:bg-violet-500 rounded-xl font-bold transition-colors">
            {tr('match.rematch')}
          </button>
          <button onClick={() => router.push('/')} className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl font-bold transition-colors">
            {tr('match.home')}
          </button>
        </div>
      </div>
    )
  }

  const moveEmoji = (m: Move | null) =>
    m === 'rock' ? '✊' : m === 'scissors' ? '✌️' : m === 'paper' ? '🖐️' : '？'

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col px-4 py-6 max-w-md mx-auto">
      {/* CPU情報 */}
      <div className="flex items-center justify-between mb-4 bg-zinc-900 rounded-xl px-4 py-3 border border-zinc-800">
        <div>
          <p className="font-bold">🤖 {CPU_NAME}</p>
          <p className="text-zinc-400 text-xs">Beginner · {CPU_RATING}</p>
        </div>
        {format !== 'BO1' && (
          <div className="text-center">
            <p className="text-lg font-black text-white">{cpuWins} — {myWins}</p>
            <p className="text-zinc-500 text-xs">{format}</p>
          </div>
        )}
      </div>

      {/* CPU傾向 */}
      <div className="mb-4">
        <OpponentHistory
          stats={cpuHistory.length > 0 ? (() => {
            const s = { rock: 0, scissors: 0, paper: 0, total: cpuHistory.length }
            cpuHistory.forEach(m => s[m]++)
            return s
          })() : null}
          last10={cpuHistory}
        />
      </div>

      {/* タイマー＆状態 */}
      <div className="flex flex-col items-center gap-2 my-4">
        {phase === 'choosing' && (
          <Timer key={round} seconds={10} onTimeUp={handleTimeUp} running />
        )}

        {phase === 'waiting_cpu' && (
          <div className="flex flex-col items-center gap-2">
            <div className="w-10 h-10 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-zinc-400 text-sm">CPUが考えています...</p>
          </div>
        )}

        {phase === 'revealing' && roundResult && (
          <div className="text-center">
            <p className="text-3xl mb-1">
              {moveEmoji(myMove)} vs {moveEmoji(cpuMove)}
            </p>
            <p className={`font-bold text-lg ${
              roundResult === 'win' ? 'text-green-400' :
              roundResult === 'lose' ? 'text-red-400' : 'text-yellow-400'
            }`}>
              {roundResult === 'draw' ? tr('match.draw') :
               roundResult === 'win' ? tr('match.win') : tr('match.lose')}
            </p>
          </div>
        )}

        {phase === 'choosing' && (
          <p className="text-zinc-300 text-sm font-semibold">{tr('match.choose')}</p>
        )}
      </div>

      {/* 手選択 */}
      <div className="grid grid-cols-3 gap-3 mt-auto">
        {MOVES.map(move => (
          <MoveButton
            key={move}
            move={move}
            selected={myMove === move}
            disabled={phase !== 'choosing'}
            onClick={selectMove}
          />
        ))}
      </div>

      {/* 自分の情報 */}
      <div className="flex items-center justify-between mt-4 px-1">
        <p className="font-bold text-sm">{userName}</p>
        <p className="text-zinc-400 text-xs">{getRank(currentRating)} · {currentRating}</p>
      </div>
    </div>
  )
}
