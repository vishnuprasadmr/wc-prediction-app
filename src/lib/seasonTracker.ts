import type { Match } from './types'
import type { SeasonAnswers } from './seasonQuestions'

const KNOCKOUT_STAGES = new Set([
  'Round of 32',
  'Round of 16',
  'Quarter-final',
  'Semi-final',
  'Third place',
  'Final',
])

function teamEliminated(team: string, matches: Match[]): boolean {
  const played = matches.filter(
    (m) =>
      m.status === 'finished' &&
      (m.home_team === team || m.away_team === team),
  )
  if (played.length === 0) return false

  const last = [...played].sort(
    (a, b) => new Date(b.kickoff_at).getTime() - new Date(a.kickoff_at).getTime(),
  )[0]

  if (!KNOCKOUT_STAGES.has(last.stage)) {
    return false
  }

  const home = last.home_score ?? 0
  const away = last.away_score ?? 0
  if (home === away) return false

  const winner = home > away ? last.home_team : last.away_team
  return winner !== team
}

export interface SeasonPickStatus {
  key: string
  label: string
  pick: string
  status: 'alive' | 'out' | 'pending' | 'settled'
}

export function trackSeasonPicks(
  answers: SeasonAnswers,
  matches: Match[],
  officialWinner?: string | null,
): SeasonPickStatus[] {
  const items: { key: keyof SeasonAnswers; label: string }[] = [
    { key: 'heart_team', label: 'Your team' },
    { key: 'world_cup_winner', label: 'World Cup winner' },
    { key: 'runner_up', label: 'Runner-up' },
    { key: 'dark_horse', label: 'Dark horse' },
  ]

  return items
    .filter((i) => answers[i.key])
    .map((i) => {
      const pick = answers[i.key]!
      if (officialWinner && i.key === 'world_cup_winner') {
        return {
          key: i.key,
          label: i.label,
          pick,
          status: pick === officialWinner ? 'settled' : 'out',
        } as SeasonPickStatus
      }
      if (i.key === 'heart_team') {
        return {
          key: i.key,
          label: i.label,
          pick,
          status: teamEliminated(pick, matches) ? 'out' : 'alive',
        } as SeasonPickStatus
      }
      const eliminated = teamEliminated(pick, matches)
      return {
        key: i.key,
        label: i.label,
        pick,
        status: eliminated ? 'out' : 'pending',
      } as SeasonPickStatus
    })
}
