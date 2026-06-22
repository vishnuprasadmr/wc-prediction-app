import { getTeamSquad, type SquadPlayer } from '../../data/teamSquads'
import type { ArenaHero } from './types'
import type { PlayerRole } from '../formations'

export function squadPlayerToHero(team: string, player: SquadPlayer): ArenaHero {
  return {
    team,
    name: player.name,
    number: player.number,
    role: player.role,
  }
}

export function heroLabel(hero: ArenaHero | null | undefined): string {
  if (!hero) return 'Your player'
  return `${hero.name} #${hero.number}`
}

export function heroShort(hero: ArenaHero | null | undefined): string {
  if (!hero) return 'Player'
  const parts = hero.name.split(' ')
  const last = parts[parts.length - 1] ?? hero.name
  return `${last} #${hero.number}`
}

export function listHeroOptions(team: string): ArenaHero[] {
  const squad = getTeamSquad(team)
  return [...squad.players, ...squad.bench].map((p) => squadPlayerToHero(team, p))
}

export function defaultHeroForTeam(team: string): ArenaHero | null {
  const options = listHeroOptions(team)
  const forward = options.find((h) => h.role === 'FWD')
  return forward ?? options[0] ?? null
}

export function parseArenaHero(raw: unknown): ArenaHero | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  if (typeof o.team !== 'string' || typeof o.name !== 'string') return null
  if (typeof o.number !== 'number') return null
  const role = o.role as PlayerRole
  if (!['GK', 'DEF', 'MID', 'FWD'].includes(role)) return null
  return { team: o.team, name: o.name, number: o.number, role }
}
