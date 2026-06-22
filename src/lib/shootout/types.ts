import type { PlayerRole } from '../formations'

export const SHOOTOUT_ZONES = ['far_left', 'left', 'center', 'right', 'far_right'] as const
export type ShootoutZone = (typeof SHOOTOUT_ZONES)[number]

export type ShootoutChallengeStatus =
  | 'pending'
  | 'active'
  | 'completed'
  | 'declined'
  | 'cancelled'
  | 'expired'

export type ShootoutPhase = 'keeper_dive' | 'shooter_shoot' | 'completed'

export type ShootoutKickOutcome = 'goal' | 'save'

export interface ArenaHero {
  team: string
  name: string
  number: number
  role: PlayerRole
}

export interface ShootoutChallenge {
  id: string
  challenger_id: string
  opponent_id: string
  status: ShootoutChallengeStatus
  phase: ShootoutPhase
  kick_number: number
  challenger_score: number
  opponent_score: number
  active_kicker_id: string
  active_keeper_id: string
  turn_user_id: string
  winner_id: string | null
  challenger_hero: ArenaHero | null
  opponent_hero: ArenaHero | null
  taunt_text: string | null
  created_at: string
  updated_at: string
  expires_at: string
  completed_at: string | null
}

export interface ShootoutKick {
  id: string
  challenge_id: string
  kick_number: number
  kicker_id: string
  keeper_id: string
  dive_zone: ShootoutZone | null
  shot_zone: ShootoutZone | null
  outcome: ShootoutKickOutcome | null
  banter_line: string | null
  created_at: string
  resolved_at: string | null
}

export const SHOOTOUT_TAUNTS = [
  'Easy win.',
  'No mercy.',
  'For the mandi.',
  'Top bin incoming.',
  'Read you like a book.',
] as const
