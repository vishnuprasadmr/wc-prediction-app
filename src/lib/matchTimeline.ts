import type { PickStatRow } from '../hooks/useMatchPickStats'
import type { Match, Prediction } from './types'

function getResult(home: number, away: number): 'home' | 'away' | 'draw' {
  if (home > away) return 'home'
  if (away > home) return 'away'
  return 'draw'
}

export interface TimelineStep {
  label: string
  detail: string
  highlight?: boolean
}

export function buildMatchTimeline(
  match: Match,
  prediction: Prediction,
  pickStats: PickStatRow[],
): TimelineStep[] {
  const home = match.home_score ?? 0
  const away = match.away_score ?? 0
  const actual = getResult(home, away)
  const pred = getResult(prediction.home_pred, prediction.away_pred)

  const totalPicks = pickStats.reduce((s, r) => s + Number(r.pick_count), 0)
  let crowdPct = 0
  if (totalPicks > 0) {
    const sameResult = pickStats.filter((r) => getResult(r.home_pred, r.away_pred) === actual)
    const count = sameResult.reduce((s, r) => s + Number(r.pick_count), 0)
    crowdPct = Math.round((count / totalPicks) * 100)
  }

  const steps: TimelineStep[] = [
    {
      label: 'Full time',
      detail: `${match.home_team} ${home}–${away} ${match.away_team}`,
    },
    {
      label: 'Your pick',
      detail: `${prediction.home_pred}–${prediction.away_pred}`,
    },
  ]

  if (totalPicks > 0) {
    steps.push({
      label: 'Crowd result',
      detail: `${crowdPct}% picked the ${actual === 'draw' ? 'draw' : actual + ' win'}`,
      highlight: pred === actual,
    })
  }

  const topPick = pickStats[0]
  if (topPick && totalPicks > 0) {
    const pct = Math.round((Number(topPick.pick_count) / totalPicks) * 100)
    steps.push({
      label: 'Most popular score',
      detail: `${topPick.home_pred}–${topPick.away_pred} (${pct}% of picks)`,
    })
  }

  if (prediction.points_earned !== null) {
    steps.push({
      label: 'Points',
      detail: `+${prediction.points_earned} pts`,
      highlight: prediction.points_earned > 0,
    })
  }

  return steps
}
