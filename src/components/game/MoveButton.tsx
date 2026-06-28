'use client'

import type { Move } from '@/types'
import { useI18n } from '@/lib/i18n'

const moveConfig: Record<Move, { emoji: string; color: string; bg: string }> = {
  rock:     { emoji: '✊', color: 'text-blue-400',   bg: 'bg-blue-950/60 border-blue-600 hover:bg-blue-900/80' },
  paper:    { emoji: '🖐️', color: 'text-purple-400', bg: 'bg-purple-950/60 border-purple-600 hover:bg-purple-900/80' },
  scissors: { emoji: '✌️', color: 'text-red-400',    bg: 'bg-red-950/60 border-red-600 hover:bg-red-900/80' },
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
