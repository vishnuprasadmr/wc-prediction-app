export type MatchStatus = 'scheduled' | 'live' | 'finished' | 'postponed'
export type ScoreSource = 'api' | 'manual' | null
export type MatchStage = 'Group' | 'Round of 32' | 'Round of 16' | 'Quarter-final' | 'Semi-final' | 'Third place' | 'Final'

export interface League {
  id: string
  name: string
  invite_code: string
}

export interface Profile {
  id: string
  display_name: string
  league_id: string
  is_admin: boolean
  created_at: string
}

export interface Match {
  id: string
  api_fixture_id: number | null
  stage: MatchStage
  group_name: string | null
  home_team: string
  away_team: string
  home_flag: string
  away_flag: string
  kickoff_at: string
  status: MatchStatus
  home_score: number | null
  away_score: number | null
  score_source: ScoreSource
  manual_override: boolean
}

export interface Prediction {
  id: string
  user_id: string
  match_id: string
  home_pred: number
  away_pred: number
  points_earned: number | null
  first_bonus?: number
  locked_at: string | null
  created_at: string
  updated_at: string
}

export interface LeaderboardEntry {
  user_id: string
  display_name: string
  total_points: number
  exact_scores: number
  early_bonuses?: number
  predictions_made: number
  rank: number
}

export interface PredictionWithMatch extends Prediction {
  match: Match
}
