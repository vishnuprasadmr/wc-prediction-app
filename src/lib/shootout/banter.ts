import type { ShootoutKickOutcome } from './types'

const GOAL_LINES = [
  'TOP BIN! 🎯',
  'UNSTOPPABLE!',
  'BANGERS ONLY!',
  'CLINICAL!',
  'Pick a side next time.',
  'Keeper was on holiday.',
]

const SAVE_LINES = [
  'WHAT A SAVE! 🧤',
  'NOT TODAY.',
  'READ YOU LIKE A BOOK.',
  'TOO PREDICTABLE.',
  'IS THAT ALL YOU\'VE GOT?',
  'MY GRANDMA SAVES THAT.',
]

const MISS_LINES = ['OVER THE BAR!', 'WAY OFF!', 'NOWHERE CLOSE!']

export function randomBanter(outcome: ShootoutKickOutcome, asKeeper: boolean): string {
  const pool = outcome === 'goal' ? (asKeeper ? SAVE_LINES : GOAL_LINES) : SAVE_LINES
  return pool[Math.floor(Math.random() * pool.length)]
}

export function victoryTaunt(winnerName: string): string {
  const lines = [
    `${winnerName} takes the Arena!`,
    `${winnerName} — penalty king!`,
    `Arena belongs to ${winnerName}!`,
  ]
  return lines[Math.floor(Math.random() * lines.length)]
}

export function defeatLine(): string {
  const lines = [
    'Better luck in predictions.',
    'Rematch?',
    'The table remembers.',
    'Next time…',
  ]
  return lines[Math.floor(Math.random() * lines.length)]
}

export function getMissLine(): string {
  return MISS_LINES[Math.floor(Math.random() * MISS_LINES.length)]
}
