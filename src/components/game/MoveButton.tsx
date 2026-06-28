'use client'

import type { Move } from '@/types'
import { useI18n } from '@/lib/i18n'

const moveConfig: Record<Move, { emoji: string; color: string; bg: string }> = {
  rock:     { emoji: '✊', color: 'text-orange-400', bg: 'bg-orange-950 border-orange-700 hover:bg-orange-900' },
  scissors: { emoji: '✌️', color: 'text-yellow-400', bg: 'bg-yellow-950 border-yellow-700 hover:bg-yellow-900' },
  paper:    { emoji: '🖐️', color: 'text-blue-400',   bg: 'bg-blue-950 border-blue-700 hover:bg-blue-900' },
}

interface Props {
  move: Move
  selected?: boolean
  disabled?: boolean
  onClick: (move: Move) => void
}

export default function MoveButton({ move, selected, disabled, onClick }: Props) {
  const { tr } = useI18n()
  const config = moveConfig[move]

  return (
    <button
      onClick={() => !disabled && onClick(move)}
      disabled={disabled}
      className={`
        flex flex-col items-center justify-center gap-2
        w-full aspect-square rounded-2xl border-2 transition-all
        ${config.bg}
        ${selected ? 'ring-4 ring-violet-500 scale-105' : ''}
        ${disabled && !selected ? 'opacity-40 cursor-not-allowed' : 'active:scale-95'}
      `}
    >
      <span className="text-5xl">{config.emoji}</span>
      <span className={`text-sm font-bold ${config.color}`}>
        {tr(`move.${move}` as Parameters<typeof tr>[0])}
      </span>
    </button>
  )
}
