import { describe, expect, it } from 'vitest'
import {
  isShootoutComplete,
  kickerIdForKick,
  keeperIdForKick,
  resolveKickOutcome,
  shootoutWinnerId,
} from './resolveKick'

describe('resolveKickOutcome', () => {
  it('saves when zones match', () => {
    expect(resolveKickOutcome('center', 'center')).toBe('save')
  })

  it('scores when zones differ', () => {
    expect(resolveKickOutcome('left', 'right')).toBe('goal')
  })
})

describe('shootout progression', () => {
  const challenger = 'c'
  const opponent = 'o'

  it('alternates kicker each kick', () => {
    expect(kickerIdForKick(1, challenger, opponent)).toBe(challenger)
    expect(kickerIdForKick(2, challenger, opponent)).toBe(opponent)
    expect(keeperIdForKick(1, challenger, opponent)).toBe(opponent)
  })

  it('completes after 10 kicks when scores differ', () => {
    expect(isShootoutComplete(9, 3, 2)).toBe(false)
    expect(isShootoutComplete(10, 3, 2)).toBe(true)
  })

  it('continues sudden death when tied after 10', () => {
    expect(isShootoutComplete(10, 3, 3)).toBe(false)
    expect(isShootoutComplete(12, 4, 3)).toBe(true)
  })

  it('picks winner by score', () => {
    expect(shootoutWinnerId(challenger, opponent, 4, 3)).toBe(challenger)
    expect(shootoutWinnerId(challenger, opponent, 2, 5)).toBe(opponent)
    expect(shootoutWinnerId(challenger, opponent, 3, 3)).toBeNull()
  })
})
