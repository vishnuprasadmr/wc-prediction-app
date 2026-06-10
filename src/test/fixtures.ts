import type { Match, Prediction } from '../lib/types'

let matchCounter = 0
let predictionCounter = 0

export function makeMatch(overrides: Partial<Match> = {}): Match {
  matchCounter += 1
  return {
    id: `match-${matchCounter}`,
    api_fixture_id: 2000 + matchCounter,
    stage: 'Group',
    group_name: 'A',
    home_team: 'Brazil',
    away_team: 'Argentina',
    home_flag: '🇧🇷',
    away_flag: '🇦🇷',
    kickoff_at: '2026-06-15T14:00:00.000Z',
    status: 'scheduled',
    home_score: null,
    away_score: null,
    score_source: null,
    manual_override: false,
    ...overrides,
  }
}

export function makePrediction(overrides: Partial<Prediction> = {}): Prediction {
  predictionCounter += 1
  return {
    id: `pred-${predictionCounter}`,
    user_id: 'user-1',
    match_id: 'match-1',
    home_pred: 1,
    away_pred: 0,
    points_earned: null,
    locked_at: null,
    created_at: '2026-06-01T00:00:00.000Z',
    updated_at: '2026-06-01T00:00:00.000Z',
    ...overrides,
  }
}

export function resetFixtureCounters(): void {
  matchCounter = 0
  predictionCounter = 0
}
