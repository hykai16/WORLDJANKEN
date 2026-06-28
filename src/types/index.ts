export type Move = 'rock' | 'scissors' | 'paper'
export type MatchFormat = 'BO1' | 'BO3' | 'BO5'
export type MatchStatus = 'in_progress' | 'completed' | 'cancelled'
export type RoundResult = 'player1_win' | 'player2_win' | 'draw'
export type TournamentFormat = 'single_elimination' | 'swiss'
export type TournamentStatus = 'upcoming' | 'entry_open' | 'in_progress' | 'completed'
export type SeasonStatus = 'upcoming' | 'active' | 'ended'

export interface User {
  id: string
  display_name: string
  country: string | null
  area: string | null
  language: string
  avatar_id: string | null
  rating: number
  is_guest: boolean
  created_at: string
}

export interface Match {
  id: string
  player1_id: string
  player2_id: string
  winner_id: string | null
  match_format: MatchFormat
  player1_rating_before: number
  player1_rating_after: number | null
  player2_rating_before: number
  player2_rating_after: number | null
  status: MatchStatus
  created_at: string
  completed_at: string | null
}

export interface MatchRound {
  id: string
  match_id: string
  round_number: number
  player1_move: Move | null
  player2_move: Move | null
  result: RoundResult | null
  created_at: string
}

export interface Season {
  id: string
  name: string
  status: SeasonStatus
  start_at: string
  end_at: string
  created_at: string
}

export interface Tournament {
  id: string
  season_id: string | null
  title: string
  format: TournamentFormat
  match_format: MatchFormat
  status: TournamentStatus
  prize_pool: number
  max_participants: number
  min_rating: number | null
  entry_requires_login: boolean
  start_at: string
  end_at: string
  created_at: string
}

export interface TournamentEntry {
  id: string
  tournament_id: string
  user_id: string
  seed_rating: number
  result_rank: number | null
  created_at: string
}

export interface TournamentRound {
  id: string
  tournament_id: string
  round_number: number
  round_name: string
  status: 'pending' | 'in_progress' | 'completed'
  created_at: string
}

export interface TournamentMatch {
  id: string
  tournament_id: string
  tournament_round_id: string
  bracket_position: number
  match_id: string | null
  player1_id: string | null
  player2_id: string | null
  winner_id: string | null
  created_at: string
}

// レートからランクを計算
export function getRank(rating: number): string {
  if (rating >= 2500) return 'Janken King'
  if (rating >= 2200) return 'World Class'
  if (rating >= 2000) return 'Grand Master'
  if (rating >= 1800) return 'Master'
  if (rating >= 1750) return 'Diamond I'
  if (rating >= 1700) return 'Diamond II'
  if (rating >= 1650) return 'Diamond III'
  if (rating >= 1600) return 'Platinum I'
  if (rating >= 1550) return 'Platinum II'
  if (rating >= 1500) return 'Platinum III'
  if (rating >= 1450) return 'Gold I'
  if (rating >= 1400) return 'Gold II'
  if (rating >= 1350) return 'Gold III'
  if (rating >= 1300) return 'Silver I'
  if (rating >= 1250) return 'Silver II'
  if (rating >= 1200) return 'Silver III'
  if (rating >= 1150) return 'Bronze I'
  if (rating >= 1100) return 'Bronze II'
  if (rating >= 1050) return 'Bronze III'
  return 'Beginner'
}

// Eloレーティング計算（K=32）
export function calcElo(myRating: number, opponentRating: number, win: boolean): number {
  const K = 32
  const expected = 1 / (1 + Math.pow(10, (opponentRating - myRating) / 400))
  const score = win ? 1 : 0
  return Math.round(myRating + K * (score - expected))
}
