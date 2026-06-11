import { MAX_SEASON_BONUS, SCORED_SEASON_QUESTIONS, SEASON_QUESTIONS } from './seasonQuestions'

export const SEASON_SCORING_RULES = [
  ...SCORED_SEASON_QUESTIONS.map((q) => ({
    label: q.title,
    points: q.points,
    description: q.hint ?? q.subtitle,
    badge: q.badge,
  })),
  {
    label: 'Your team',
    points: 0,
    description: 'Fan pick for your profile — no points, just pride.',
    badge: 'Fan pick',
  },
  {
    label: 'When settled',
    points: '—',
    description: `Up to ${MAX_SEASON_BONUS} bonus pts added after the Final. Anyone can still win the league.`,
    badge: 'Season finale',
  },
  {
    label: 'Tiebreaker',
    points: '—',
    description: 'Season bonuses count toward total points and rank tiebreaks.',
    badge: 'Table',
  },
] as const

export function getSeasonQuestionLabel(key: string): string {
  return SEASON_QUESTIONS.find((q) => q.key === key)?.title ?? key
}
