import type { ShootoutKickOutcome, ShootoutZone } from './types'

export function resolveKickOutcome(
  shotZone: ShootoutZone,
  diveZone: ShootoutZone,
): ShootoutKickOutcome {
  return shotZone === diveZone ? 'save' : 'goal'
}

export function isShootoutComplete(
  kickNumber: number,
  challengerScore: number,
  opponentScore: number,
): boolean {
  if (kickNumber < 10) return false
  if (challengerScore !== opponentScore) return true
  if (kickNumber > 10 && kickNumber % 2 === 0 && challengerScore !== opponentScore) return true
  return false
}

export function shootoutWinnerId(
  challengerId: string,
  opponentId: string,
  challengerScore: number,
  opponentScore: number,
): string | null {
  if (challengerScore === opponentScore) return null
  return challengerScore > opponentScore ? challengerId : opponentId
}

export function kickerIdForKick(
  kickNumber: number,
  challengerId: string,
  opponentId: string,
): string {
  return kickNumber % 2 === 1 ? challengerId : opponentId
}

export function keeperIdForKick(
  kickNumber: number,
  challengerId: string,
  opponentId: string,
): string {
  return kickNumber % 2 === 1 ? opponentId : challengerId
}
