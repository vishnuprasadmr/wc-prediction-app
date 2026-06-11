import { getWcTeams } from './flags'

export type SeasonQuestionKey =
  | 'heart_team'
  | 'golden_boot'
  | 'world_cup_winner'
  | 'runner_up'
  | 'dark_horse'
  | 'top_scoring_team'

export type SeasonQuestionType = 'team' | 'player'

export interface SeasonQuestion {
  key: SeasonQuestionKey
  type: SeasonQuestionType
  title: string
  subtitle: string
  icon: string
  badge: string
  points: number
  optional?: boolean
  hint?: string
}

export const SEASON_QUESTIONS: SeasonQuestion[] = [
  {
    key: 'heart_team',
    type: 'team',
    title: 'Your team',
    subtitle: 'Who are you backing all tournament?',
    icon: '❤️',
    badge: 'Fan pick',
    points: 0,
    optional: false,
    hint: 'Shown on your profile — no points, pure passion.',
  },
  {
    key: 'golden_boot',
    type: 'player',
    title: 'Golden Boot',
    subtitle: 'Who scores the most goals?',
    icon: '👟',
    badge: 'Orange Cap',
    points: 8,
    hint: 'Like IPL’s Orange Cap — top run-scorer, but for goals.',
  },
  {
    key: 'world_cup_winner',
    type: 'team',
    title: 'World Cup winner',
    subtitle: 'Who lifts the trophy?',
    icon: '🏆',
    badge: 'Champion',
    points: 15,
    hint: 'Biggest season bonus — can flip the table on the final day.',
  },
  {
    key: 'runner_up',
    type: 'team',
    title: 'Runner-up',
    subtitle: 'Who finishes second?',
    icon: '🥈',
    badge: 'Finalist',
    points: 6,
  },
  {
    key: 'dark_horse',
    type: 'team',
    title: 'Dark horse',
    subtitle: 'An outsider who reaches the semi-finals',
    icon: '🐴',
    badge: 'Purple Cap vibe',
    points: 6,
    hint: 'Pick a team you think will surprise everyone deep in the knockouts.',
  },
  {
    key: 'top_scoring_team',
    type: 'team',
    title: 'Top scoring team',
    subtitle: 'Which nation scores the most goals?',
    icon: '⚽',
    badge: 'Goal machine',
    points: 5,
  },
]

export const SCORED_SEASON_QUESTIONS = SEASON_QUESTIONS.filter((q) => q.points > 0)

export const MAX_SEASON_BONUS = SCORED_SEASON_QUESTIONS.reduce((sum, q) => sum + q.points, 0)

export const WC_TEAMS = getWcTeams()

/** Star players for Golden Boot picker */
export const GOLDEN_BOOT_CANDIDATES = [
  'Kylian Mbappé',
  'Erling Haaland',
  'Harry Kane',
  'Lamine Yamal',
  'Vinícius Júnior',
  'Lionel Messi',
  'Cristiano Ronaldo',
  'Neymar',
  'Mohamed Salah',
  'Robert Lewandowski',
  'Lautaro Martínez',
  'Julián Álvarez',
  'Phil Foden',
  'Bukayo Saka',
  'Florian Wirtz',
  'Jamal Musiala',
  'Rafael Leão',
  'Victor Osimhen',
  'Heung-min Son',
  'Christopher Nkunku',
  'Antoine Griezmann',
  'Ousmane Dembélé',
  'Rodrygo',
  'Richarlison',
  'Darwin Núñez',
  'Federico Valverde',
  'Bruno Fernandes',
  'Bernardo Silva',
  'Kevin De Bruyne',
  'Declan Rice',
].sort((a, b) => a.localeCompare(b))

export type SeasonAnswers = Partial<Record<SeasonQuestionKey, string>>

export function isSeasonAnswersComplete(answers: SeasonAnswers): boolean {
  return SEASON_QUESTIONS.every((q) => {
    const val = answers[q.key]?.trim()
    return Boolean(val)
  })
}

export const SEASON_OFFICIAL_KEYS = [
  'world_cup_winner',
  'runner_up',
  'golden_boot',
  'dark_horse',
  'top_scoring_team',
] as const

export type SeasonOfficialKey = (typeof SEASON_OFFICIAL_KEYS)[number]
