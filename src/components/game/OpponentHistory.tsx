'use client'

import { useI18n } from '@/lib/i18n'
import type { Move } from '@/types'

const moveEmoji: Record<Move, string> = {
  rock: '✊',
  scissors: '✌️',
  paper: '🖐️',
}

interface Props {
  stats: { rock: number; scissors: number; paper: number; total: number } | null
  last10: Move[]
}

export default function OpponentHistory({ stats, last10 }: Props) {
  const { tr } = useI18n()

  if (!stats || stats.total === 0) {
    return (
      <div className="bg-zinc-900 rounded-xl p-3 border border-zinc-800 text-center text-zinc-500 text-xs">
        {tr('opponent.history')} — no data
      </div>
    )
  }

  const pct = (n: number) => Math.round((n / stats.total) * 100)

  return (
    <div className="bg-zinc-900 rounded-xl p-3 border border-zinc-800 text-xs">
      <p className="text-zinc-400 font-semibold mb-2">{tr('opponent.history')}</p>
      <div className="flex gap-3 mb-2">
        {(['rock', 'scissors', 'paper'] as Move[]).map(m => (
          <div key={m} className="flex-1 text-center">
            <div className="text-base">{moveEmoji[m]}</div>
            <div className="font-bold text-white">{pct(stats[m])}%</div>
          </div>
        ))}
      </div>
      {last10.length > 0 && (
        <>
          <p className="text-zinc-400 font-semibold mb-1">{tr('opponent.last10')}</p>
          <div className="flex flex-wrap gap-1">
            {last10.map((m, i) => (
              <span key={i} className="text-sm">{moveEmoji[m]}</span>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
