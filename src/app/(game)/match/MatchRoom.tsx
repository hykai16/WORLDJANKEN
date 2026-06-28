'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useI18n } from '@/lib/i18n'
import { calcElo, getRank } from '@/types'
import type { Move, MatchFormat } from '@/types'
import MoveButton from '@/components/game/MoveButton'
import Timer from '@/components/game/Timer'
import OpponentHistory from '@/components/game/OpponentHistory'

type Phase =
  | 'finding'
  | 'choosing'
  | 'waiting'
  | 'revealing'
  | 'result'

interface MatchState {
  matchId: string
  opponentId: string
  opponentName: string
  opponentRating: number
  myRating: number
  format: MatchFormat
  // BO用スコア
  myWins: number
  opponentWins: number
  roundNumber: number
}

interface RoundResult {
  myMove: Move
  opponentMove: Move
  result: 'win' | 'lose' | 'draw'
  ratingDelta?: number
}

export default function MatchRoom({
  userId,
  userRating,
  userName,
}: {
  userId: string
  userRating: number
  userName: string
}) {
  const { tr } = useI18n()
  const router = useRouter()
  const supabase = createClient()

  const [phase, setPhase] = useState<Phase>('finding')
  const [match, setMatch] = useState<MatchState | null>(null)
  const [selectedMove, setSelectedMove] = useState<Move | null>(null)
  const [roundResult, setRoundResult] = useState<RoundResult | null>(null)
  const [matchResult, setMatchResult] = useState<'win' | 'lose' | null>(null)
  const [opponentHistory, setOpponentHistory] = useState<{
    stats: { rock: number; scissors: number; paper: number; total: number } | null
    last10: Move[]
  }>({ stats: null, last10: [] })
  const [ratingDelta, setRatingDelta] = useState(0)

  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const myMoveRef = useRef<Move | null>(null)
  const timeUpCalledRef = useRef(false)

  // マッチング処理
  useEffect(() => {
    let cancelled = false

    async function findMatch() {
      // キューに入る
      const { error: qErr } = await supabase.from('matchmaking_queue').upsert(
        { user_id: userId, rating: userRating, match_format: 'BO1' },
        { onConflict: 'user_id' }
      )
      if (qErr || cancelled) return

      // 自分以外の待機プレイヤーを探す
      const { data: others } = await supabase
        .from('matchmaking_queue')
        .select('user_id, rating')
        .neq('user_id', userId)
        .order('created_at', { ascending: true })
        .limit(1)

      if (cancelled) return

      if (others && others.length > 0) {
        // 自分がマッチを作る側
        const opponent = others[0]
        await createMatch(opponent.user_id, opponent.rating, 'BO1')
      } else {
        // 誰かが自分を見つけてマッチを作るのを待つ
        const sub = supabase
          .channel(`queue:${userId}`)
          .on('broadcast', { event: 'match_created' }, async ({ payload }) => {
            if (cancelled) return
            await joinMatch(payload.matchId)
          })
          .subscribe()

        return () => { sub.unsubscribe() }
      }
    }

    findMatch()
    return () => { cancelled = true }
  }, [userId]) // eslint-disable-line

  async function createMatch(opponentId: string, opponentRating: number, format: MatchFormat) {
    // 両者をキューから削除
    await supabase.from('matchmaking_queue').delete().in('user_id', [userId, opponentId])

    // 相手情報取得
    const { data: oppUser } = await supabase
      .from('users')
      .select('display_name, rating')
      .eq('id', opponentId)
      .single()

    // matchを作成
    const { data: newMatch } = await supabase
      .from('matches')
      .insert({
        player1_id: userId,
        player2_id: opponentId,
        match_format: format,
        player1_rating_before: userRating,
        player2_rating_before: opponentRating,
        status: 'in_progress',
      })
      .select('id')
      .single()

    if (!newMatch) return

    // 相手に通知
    await supabase.channel(`queue:${opponentId}`).send({
      type: 'broadcast',
      event: 'match_created',
      payload: { matchId: newMatch.id },
    })

    await loadOpponentHistory(opponentId)

    setMatch({
      matchId: newMatch.id,
      opponentId,
      opponentName: oppUser?.display_name ?? 'Opponent',
      opponentRating: oppUser?.rating ?? opponentRating,
      myRating: userRating,
      format,
      myWins: 0,
      opponentWins: 0,
      roundNumber: 1,
    })
    setPhase('choosing')
    subscribeToMatch(newMatch.id)
  }

  async function joinMatch(matchId: string) {
    const { data: matchData } = await supabase
      .from('matches')
      .select('*, player1:player1_id(display_name, rating)')
      .eq('id', matchId)
      .single()

    if (!matchData) return

    await supabase.from('matchmaking_queue').delete().eq('user_id', userId)

    const opponent = matchData.player1 as { display_name: string; rating: number }
    await loadOpponentHistory(matchData.player1_id)

    setMatch({
      matchId,
      opponentId: matchData.player1_id,
      opponentName: opponent?.display_name ?? 'Opponent',
      opponentRating: matchData.player1_rating_before,
      myRating: userRating,
      format: matchData.match_format,
      myWins: 0,
      opponentWins: 0,
      roundNumber: 1,
    })
    setPhase('choosing')
    subscribeToMatch(matchId)
  }

  function subscribeToMatch(matchId: string) {
    const channel = supabase
      .channel(`match:${matchId}`)
      .on('broadcast', { event: 'move_submitted' }, async ({ payload }) => {
        if (payload.userId !== userId && myMoveRef.current) {
          // 相手の手が届いた & 自分の手も出ている → 判定
          await resolveRound(matchId, myMoveRef.current, payload.move as Move)
        }
      })
      .subscribe()

    channelRef.current = channel
  }

  async function loadOpponentHistory(opponentId: string) {
    const { data: rounds } = await supabase
      .from('match_rounds')
      .select('player1_move, player2_move, matches!inner(player1_id, player2_id)')
      .or(`matches.player1_id.eq.${opponentId},matches.player2_id.eq.${opponentId}`)
      .not('player1_move', 'is', null)
      .order('created_at', { ascending: false })
      .limit(50)

    if (!rounds || rounds.length === 0) return

    const moves: Move[] = rounds.map(r => {
      const m = r.matches as unknown as { player1_id: string }
      return m.player1_id === opponentId
        ? (r.player1_move as Move)
        : (r.player2_move as Move)
    })

    const stats = { rock: 0, scissors: 0, paper: 0, total: moves.length }
    moves.forEach(m => { stats[m]++ })

    setOpponentHistory({ stats, last10: moves.slice(0, 10) })
  }

  const handleTimeUp = useCallback(async () => {
    if (timeUpCalledRef.current || !match) return
    timeUpCalledRef.current = true
    // 時間切れ = 相手の不戦勝
    await submitMove('rock') // ダミー送信（負けとして処理）
  }, [match]) // eslint-disable-line

  async function submitMove(move: Move) {
    if (!match || phase !== 'choosing') return
    myMoveRef.current = move
    setSelectedMove(move)
    setPhase('waiting')

    // DBに自分の手を保存（player1かplayer2かで分岐）
    const { data: existingRound } = await supabase
      .from('match_rounds')
      .select('id, player1_move, player2_move')
      .eq('match_id', match.matchId)
      .eq('round_number', match.roundNumber)
      .single()

    if (!existingRound) {
      // 自分が先に送信
      const isPlayer1 = await amIPlayer1(match.matchId)
      await supabase.from('match_rounds').insert({
        match_id: match.matchId,
        round_number: match.roundNumber,
        player1_move: isPlayer1 ? move : null,
        player2_move: isPlayer1 ? null : move,
      })
    } else {
      // 相手が先に送信していた → 手を更新して判定へ
      const isPlayer1 = await amIPlayer1(match.matchId)
      await supabase.from('match_rounds').update(
        isPlayer1
          ? { player1_move: move }
          : { player2_move: move }
      ).eq('id', existingRound.id)

      const opponentMove = isPlayer1 ? existingRound.player2_move : existingRound.player1_move
      if (opponentMove) {
        await resolveRound(match.matchId, move, opponentMove as Move)
        return
      }
    }

    // 相手にブロードキャスト
    await channelRef.current?.send({
      type: 'broadcast',
      event: 'move_submitted',
      payload: { userId, move },
    })
  }

  async function amIPlayer1(matchId: string): Promise<boolean> {
    const { data } = await supabase
      .from('matches')
      .select('player1_id')
      .eq('id', matchId)
      .single()
    return data?.player1_id === userId
  }

  async function resolveRound(matchId: string, myMove: Move, opponentMove: Move) {
    const result = judgeMove(myMove, opponentMove)

    if (result === 'draw') {
      // あいこ → 再戦
      setRoundResult({ myMove, opponentMove, result: 'draw' })
      setPhase('revealing')
      setTimeout(() => {
        setSelectedMove(null)
        myMoveRef.current = null
        timeUpCalledRef.current = false
        setRoundResult(null)
        setPhase('choosing')
      }, 1500)
      return
    }

    setMatch(prev => {
      if (!prev) return prev
      const newMyWins = result === 'win' ? prev.myWins + 1 : prev.myWins
      const newOppWins = result === 'lose' ? prev.opponentWins + 1 : prev.opponentWins
      return { ...prev, myWins: newMyWins, opponentWins: newOppWins, roundNumber: prev.roundNumber + 1 }
    })

    setRoundResult({ myMove, opponentMove, result })
    setPhase('revealing')

    // BO判定
    setTimeout(async () => {
      setMatch(prev => {
        if (!prev) return prev
        const winsNeeded = prev.format === 'BO1' ? 1 : prev.format === 'BO3' ? 2 : 3
        const newMyWins = result === 'win' ? prev.myWins + 1 : prev.myWins
        const newOppWins = result === 'lose' ? prev.opponentWins + 1 : prev.opponentWins

        if (newMyWins >= winsNeeded || newOppWins >= winsNeeded) {
          const won = newMyWins >= winsNeeded
          finishMatch(matchId, won, prev.opponentRating)
          return prev
        }

        // 続行
        setSelectedMove(null)
        myMoveRef.current = null
        timeUpCalledRef.current = false
        setRoundResult(null)
        setPhase('choosing')
        return { ...prev, myWins: newMyWins, opponentWins: newOppWins }
      })
    }, 2000)
  }

  async function finishMatch(matchId: string, won: boolean, opponentRating: number) {
    const newRating = calcElo(userRating, opponentRating, won)
    const delta = newRating - userRating
    setRatingDelta(delta)
    setMatchResult(won ? 'win' : 'lose')
    setPhase('result')

    const isPlayer1 = await amIPlayer1(matchId)
    await supabase.from('matches').update({
      winner_id: won ? userId : undefined,
      status: 'completed',
      completed_at: new Date().toISOString(),
      ...(isPlayer1
        ? { player1_rating_after: newRating }
        : { player2_rating_after: newRating }),
    }).eq('id', matchId)

    await supabase.from('users').update({ rating: newRating }).eq('id', userId)

    channelRef.current?.unsubscribe()
  }

  function judgeMove(my: Move, opp: Move): 'win' | 'lose' | 'draw' {
    if (my === opp) return 'draw'
    if (
      (my === 'rock' && opp === 'scissors') ||
      (my === 'scissors' && opp === 'paper') ||
      (my === 'paper' && opp === 'rock')
    ) return 'win'
    return 'lose'
  }

  // ---- レンダリング ----

  if (phase === 'finding') {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-zinc-400">{tr('match.finding')}</p>
      </div>
    )
  }

  if (phase === 'result' && match) {
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
          <p className="text-white font-bold text-2xl">{userRating + ratingDelta}</p>
          <p className={`font-semibold text-sm ${ratingDelta >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {ratingDelta >= 0 ? '+' : ''}{ratingDelta}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => { setPhase('finding'); setMatch(null); setMatchResult(null); setRatingDelta(0); }}
            className="px-6 py-3 bg-violet-600 hover:bg-violet-500 rounded-xl font-bold transition-colors"
          >
            {tr('match.rematch')}
          </button>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl font-bold transition-colors"
          >
            {tr('match.home')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col px-4 py-6 max-w-md mx-auto">
      {/* 相手情報 */}
      {match && (
        <div className="flex items-center justify-between mb-4 bg-zinc-900 rounded-xl px-4 py-3 border border-zinc-800">
          <div>
            <p className="font-bold">{match.opponentName}</p>
            <p className="text-zinc-400 text-xs">{getRank(match.opponentRating)} · {match.opponentRating}</p>
          </div>
          {match.format !== 'BO1' && (
            <div className="text-center">
              <p className="text-lg font-black text-white">
                {match.opponentWins} — {match.myWins}
              </p>
              <p className="text-zinc-500 text-xs">{match.format}</p>
            </div>
          )}
        </div>
      )}

      {/* 相手傾向 */}
      <div className="mb-4">
        <OpponentHistory stats={opponentHistory.stats} last10={opponentHistory.last10} />
      </div>

      {/* タイマー + 状態 */}
      <div className="flex flex-col items-center gap-2 my-4">
        {(phase === 'choosing' || phase === 'waiting') && (
          <Timer seconds={10} onTimeUp={handleTimeUp} running={phase === 'choosing'} />
        )}
        {phase === 'revealing' && roundResult && (
          <div className="text-center">
            <p className="text-3xl mb-1">
              {roundResult.result === 'win' ? '🎉' : roundResult.result === 'lose' ? '😞' : '🤝'}
            </p>
            <p className={`font-bold text-lg ${
              roundResult.result === 'win' ? 'text-green-400' :
              roundResult.result === 'lose' ? 'text-red-400' : 'text-yellow-400'
            }`}>
              {tr(`match.${roundResult.result === 'draw' ? 'draw' : roundResult.result === 'win' ? 'win' : 'lose'}` as Parameters<typeof tr>[0])}
            </p>
            <p className="text-zinc-400 text-sm">
              {roundResult.myMove === 'rock' ? '✊' : roundResult.myMove === 'scissors' ? '✌️' : '🖐️'}
              {' vs '}
              {roundResult.opponentMove === 'rock' ? '✊' : roundResult.opponentMove === 'scissors' ? '✌️' : '🖐️'}
            </p>
          </div>
        )}
        {phase === 'waiting' && (
          <p className="text-zinc-400 text-sm animate-pulse">相手を待っています...</p>
        )}
        {phase === 'choosing' && (
          <p className="text-zinc-300 text-sm font-semibold">{tr('match.choose')}</p>
        )}
      </div>

      {/* 手選択 */}
      <div className="grid grid-cols-3 gap-3 mt-auto">
        {(['rock', 'scissors', 'paper'] as Move[]).map(move => (
          <MoveButton
            key={move}
            move={move}
            selected={selectedMove === move}
            disabled={phase !== 'choosing'}
            onClick={submitMove}
          />
        ))}
      </div>

      {/* 自分の情報 */}
      <div className="flex items-center justify-between mt-4 px-1">
        <p className="font-bold text-sm">{userName}</p>
        <p className="text-zinc-400 text-xs">{getRank(userRating)} · {userRating}</p>
      </div>
    </div>
  )
}
