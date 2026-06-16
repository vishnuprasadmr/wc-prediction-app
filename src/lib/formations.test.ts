import { describe, expect, it } from 'vitest'
import {
  assignPlayersToFormation,
  playerDisplayName,
  type FormationCode,
  type SquadPlayerRef,
} from './formations'

const xi: SquadPlayerRef[] = [
  { name: 'Keeper', number: 1, role: 'GK' },
  { name: 'Left Back', number: 2, role: 'DEF' },
  { name: 'Centre Back A', number: 3, role: 'DEF' },
  { name: 'Centre Back B', number: 4, role: 'DEF' },
  { name: 'Right Back', number: 5, role: 'DEF' },
  { name: 'Mid A', number: 6, role: 'MID' },
  { name: 'Mid B', number: 7, role: 'MID' },
  { name: 'Mid C', number: 8, role: 'MID' },
  { name: 'Striker A', number: 9, role: 'FWD' },
  { name: 'Striker B', number: 10, role: 'FWD' },
  { name: 'Striker C', number: 11, role: 'FWD' },
]

describe('assignPlayersToFormation', () => {
  it('fills every slot for 4-3-3', () => {
    const result = assignPlayersToFormation('4-3-3', xi)
    expect(result).toHaveLength(11)
    expect(result.every((r) => r.player !== null)).toBe(true)
    expect(result[0]?.player?.role).toBe('GK')
    expect(result.filter((r) => r.slot.role === 'DEF')).toHaveLength(4)
    expect(result.filter((r) => r.slot.role === 'MID')).toHaveLength(3)
    expect(result.filter((r) => r.slot.role === 'FWD')).toHaveLength(3)
  })

  it('fills 4-2-3-1 with available role pools', () => {
    const result = assignPlayersToFormation('4-2-3-1', xi)
    expect(result).toHaveLength(11)
    expect(result[0]?.player?.name).toBe('Keeper')
    expect(result.filter((r) => r.slot.role === 'DEF').every((r) => r.player)).toBe(true)
    expect(result.find((r) => r.slot.id === 'st')?.player?.name).toBe('Striker A')
    const amSlots = result.filter((r) => ['lam', 'cam', 'ram'].includes(r.slot.id))
    expect(amSlots.some((r) => r.player === null)).toBe(true)
  })

  it('leaves slots empty when players are missing', () => {
    const partial: SquadPlayerRef[] = [{ name: 'Only GK', number: 1, role: 'GK' }]
    const result = assignPlayersToFormation('4-3-3' as FormationCode, partial)
    expect(result[0]?.player?.name).toBe('Only GK')
    expect(result.filter((r) => r.player === null).length).toBeGreaterThan(0)
  })
})

describe('playerDisplayName', () => {
  it('uses last name when multiple parts', () => {
    expect(playerDisplayName('Lionel Messi')).toBe('Messi')
  })

  it('keeps single names', () => {
    expect(playerDisplayName('Neymar')).toBe('Neymar')
  })
})
