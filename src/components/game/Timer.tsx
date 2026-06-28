'use client'

import { useEffect, useState } from 'react'

interface Props {
  seconds: number
  onTimeUp: () => void
  running: boolean
}

export default function Timer({ seconds, onTimeUp, running }: Props) {
  const [remaining, setRemaining] = useState(seconds)

  useEffect(() => {
    setRemaining(seconds)
  }, [seconds])

  useEffect(() => {
    if (!running) return
    if (remaining <= 0) {
      onTimeUp()
      return
    }
    const id = setTimeout(() => setRemaining(r => r - 1), 1000)
    return () => clearTimeout(id)
  }, [remaining, running, onTimeUp])

  const pct = (remaining / seconds) * 100
  const color = remaining > 5 ? '#8b5cf6' : remaining > 3 ? '#f59e0b' : '#ef4444'

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-16 h-16">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
          <circle cx="18" cy="18" r="15.9" fill="none" stroke="#27272a" strokeWidth="3" />
          <circle
            cx="18" cy="18" r="15.9"
            fill="none"
            stroke={color}
            strokeWidth="3"
            strokeDasharray={`${pct} 100`}
            strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 0.9s linear, stroke 0.3s' }}
          />
        </svg>
        <span
          className="absolute inset-0 flex items-center justify-center text-xl font-black"
          style={{ color }}
        >
          {remaining}
        </span>
      </div>
    </div>
  )
}
