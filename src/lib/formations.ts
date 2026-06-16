export type PlayerRole = 'GK' | 'DEF' | 'MID' | 'FWD'

export type FormationCode = '4-3-3' | '4-4-2' | '3-5-2' | '4-2-3-1'

export interface PitchSlot {
  id: string
  role: PlayerRole
  label: string
  x: number
  y: number
}

/** Top-down pitch: y=0 is attacking end, y=100 is own goal line */
export const FORMATIONS: Record<FormationCode, PitchSlot[]> = {
  '4-3-3': [
    { id: 'gk', role: 'GK', label: 'GK', x: 50, y: 90 },
    { id: 'lb', role: 'DEF', label: 'LB', x: 14, y: 72 },
    { id: 'cb1', role: 'DEF', label: 'CB', x: 36, y: 76 },
    { id: 'cb2', role: 'DEF', label: 'CB', x: 64, y: 76 },
    { id: 'rb', role: 'DEF', label: 'RB', x: 86, y: 72 },
    { id: 'cm1', role: 'MID', label: 'CM', x: 28, y: 52 },
    { id: 'cm2', role: 'MID', label: 'CM', x: 50, y: 56 },
    { id: 'cm3', role: 'MID', label: 'CM', x: 72, y: 52 },
    { id: 'lw', role: 'FWD', label: 'LW', x: 18, y: 24 },
    { id: 'st', role: 'FWD', label: 'ST', x: 50, y: 16 },
    { id: 'rw', role: 'FWD', label: 'RW', x: 82, y: 24 },
  ],
  '4-4-2': [
    { id: 'gk', role: 'GK', label: 'GK', x: 50, y: 90 },
    { id: 'lb', role: 'DEF', label: 'LB', x: 14, y: 72 },
    { id: 'cb1', role: 'DEF', label: 'CB', x: 36, y: 76 },
    { id: 'cb2', role: 'DEF', label: 'CB', x: 64, y: 76 },
    { id: 'rb', role: 'DEF', label: 'RB', x: 86, y: 72 },
    { id: 'lm', role: 'MID', label: 'LM', x: 16, y: 48 },
    { id: 'cm1', role: 'MID', label: 'CM', x: 38, y: 52 },
    { id: 'cm2', role: 'MID', label: 'CM', x: 62, y: 52 },
    { id: 'rm', role: 'MID', label: 'RM', x: 84, y: 48 },
    { id: 'st1', role: 'FWD', label: 'ST', x: 38, y: 20 },
    { id: 'st2', role: 'FWD', label: 'ST', x: 62, y: 20 },
  ],
  '3-5-2': [
    { id: 'gk', role: 'GK', label: 'GK', x: 50, y: 90 },
    { id: 'cb1', role: 'DEF', label: 'CB', x: 26, y: 76 },
    { id: 'cb2', role: 'DEF', label: 'CB', x: 50, y: 78 },
    { id: 'cb3', role: 'DEF', label: 'CB', x: 74, y: 76 },
    { id: 'lwb', role: 'MID', label: 'LWB', x: 12, y: 54 },
    { id: 'cm1', role: 'MID', label: 'CM', x: 32, y: 52 },
    { id: 'cm2', role: 'MID', label: 'CM', x: 50, y: 48 },
    { id: 'cm3', role: 'MID', label: 'CM', x: 68, y: 52 },
    { id: 'rwb', role: 'MID', label: 'RWB', x: 88, y: 54 },
    { id: 'st1', role: 'FWD', label: 'ST', x: 38, y: 20 },
    { id: 'st2', role: 'FWD', label: 'ST', x: 62, y: 20 },
  ],
  '4-2-3-1': [
    { id: 'gk', role: 'GK', label: 'GK', x: 50, y: 90 },
    { id: 'lb', role: 'DEF', label: 'LB', x: 14, y: 72 },
    { id: 'cb1', role: 'DEF', label: 'CB', x: 36, y: 76 },
    { id: 'cb2', role: 'DEF', label: 'CB', x: 64, y: 76 },
    { id: 'rb', role: 'DEF', label: 'RB', x: 86, y: 72 },
    { id: 'dm1', role: 'MID', label: 'DM', x: 38, y: 58 },
    { id: 'dm2', role: 'MID', label: 'DM', x: 62, y: 58 },
    { id: 'lam', role: 'MID', label: 'AM', x: 22, y: 36 },
    { id: 'cam', role: 'MID', label: 'AM', x: 50, y: 32 },
    { id: 'ram', role: 'MID', label: 'AM', x: 78, y: 36 },
    { id: 'st', role: 'FWD', label: 'ST', x: 50, y: 14 },
  ],
}

export const FORMATION_LABELS: Record<FormationCode, string> = {
  '4-3-3': '4-3-3',
  '4-4-2': '4-4-2',
  '3-5-2': '3-5-2',
  '4-2-3-1': '4-2-3-1',
}

export const FORMATION_CODES = ['4-3-3', '4-4-2', '3-5-2', '4-2-3-1'] as const

export const ROLE_LABELS: Record<PlayerRole, string> = {
  GK: 'Goalkeeper',
  DEF: 'Defenders',
  MID: 'Midfielders',
  FWD: 'Forwards',
}

export const ROLE_COLORS: Record<PlayerRole, string> = {
  GK: '#eab308',
  DEF: '#3b82f6',
  MID: '#22c55e',
  FWD: '#ef4444',
}

export interface SquadPlayerRef {
  name: string
  number: number
  role: PlayerRole
}

export interface PitchAssignment {
  slot: PitchSlot
  player: SquadPlayerRef | null
}

/** Maps starting XI players onto formation slots by role order. */
export function assignPlayersToFormation(
  formation: FormationCode,
  players: SquadPlayerRef[],
): PitchAssignment[] {
  const slots = FORMATIONS[formation]
  const pools: Record<PlayerRole, SquadPlayerRef[]> = {
    GK: [],
    DEF: [],
    MID: [],
    FWD: [],
  }
  for (const player of players) {
    pools[player.role].push(player)
  }
  return slots.map((slot) => ({
    slot,
    player: pools[slot.role].shift() ?? null,
  }))
}

export function playerDisplayName(name: string): string {
  const parts = name.trim().split(/\s+/)
  return parts.length > 1 ? parts[parts.length - 1]! : name
}
