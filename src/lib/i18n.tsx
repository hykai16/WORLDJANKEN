'use client'

import { createContext, useContext, useState } from 'react'

export type Lang = 'ja' | 'en'

const t = {
  ja: {
    'app.title': 'World Janken League',
    'app.tagline': '運だけなのに、本気になる。',
    'home.play': '今すぐ対戦',
    'home.ranking': 'ランキング',
    'home.tournament': '大会',
    'home.rating': 'レーティング',
    'home.rank': 'ランク',
    'home.wins': '勝利',
    'home.losses': '敗北',
    'home.winrate': '勝率',
    'match.finding': '対戦相手を探しています...',
    'match.found': '対戦相手が見つかりました！',
    'match.choose': '手を選んでください',
    'match.timeup': '時間切れ',
    'match.win': '勝利！',
    'match.lose': '敗北...',
    'match.draw': 'あいこ — 再戦！',
    'match.forfeit': '不戦勝',
    'match.rematch': 'もう一度',
    'match.home': 'ホームへ',
    'move.rock': 'グー',
    'move.scissors': 'チョキ',
    'move.paper': 'パー',
    'opponent.history': '相手の傾向',
    'opponent.last10': '直近10手',
    'login.title': 'ログイン',
    'login.google': 'Googleでログイン',
    'login.guest': 'ゲストとして遊ぶ',
    'login.guest.note': '※ゲストはランクマッチ・大会に参加できません',
    'rank.beginner': 'Beginner',
  },
  en: {
    'app.title': 'World Janken League',
    'app.tagline': 'Pure luck. Real competition.',
    'home.play': 'Play Now',
    'home.ranking': 'Ranking',
    'home.tournament': 'Tournament',
    'home.rating': 'Rating',
    'home.rank': 'Rank',
    'home.wins': 'Wins',
    'home.losses': 'Losses',
    'home.winrate': 'Win Rate',
    'match.finding': 'Finding opponent...',
    'match.found': 'Opponent found!',
    'match.choose': 'Choose your move',
    'match.timeup': 'Time\'s up!',
    'match.win': 'You Win!',
    'match.lose': 'You Lose...',
    'match.draw': 'Draw — Rematch!',
    'match.forfeit': 'Forfeit Win',
    'match.rematch': 'Play Again',
    'match.home': 'Home',
    'move.rock': 'Rock',
    'move.scissors': 'Scissors',
    'move.paper': 'Paper',
    'opponent.history': 'Opponent Tendencies',
    'opponent.last10': 'Last 10 Moves',
    'login.title': 'Login',
    'login.google': 'Continue with Google',
    'login.guest': 'Play as Guest',
    'login.guest.note': '※ Guests cannot join ranked matches or tournaments',
    'rank.beginner': 'Beginner',
  },
} as const

type TranslationKey = keyof typeof t.ja

interface I18nContextType {
  lang: Lang
  setLang: (lang: Lang) => void
  tr: (key: TranslationKey) => string
}

import React from 'react'

export const I18nContext = createContext<I18nContextType>({
  lang: 'ja',
  setLang: () => {},
  tr: (key) => t.ja[key],
})

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>('ja')
  const tr = (key: TranslationKey) => t[lang][key] ?? t.ja[key]
  return (
    <I18nContext.Provider value={{ lang, setLang, tr }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  return useContext(I18nContext)
}
