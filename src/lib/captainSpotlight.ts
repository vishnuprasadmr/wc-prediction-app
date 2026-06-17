import { getTeamSquad, type SquadPlayer } from '../data/teamSquads'
import type { FifaPlayerInfo } from './fifaMatchDetails'

/** Known captains — falls back to #10 or first midfielder in squad data. */
const TEAM_CAPTAINS: Partial<Record<string, string>> = {
  Argentina: 'Lionel Messi',
  Brazil: 'Casemiro',
  France: 'Kylian Mbappé',
  England: 'Harry Kane',
  Germany: 'İlkay Gündoğan',
  Spain: 'Álvaro Morata',
  Portugal: 'Cristiano Ronaldo',
  Netherlands: 'Virgil van Dijk',
  Belgium: 'Kevin De Bruyne',
  USA: 'Christian Pulisic',
  Mexico: 'Guillermo Ochoa',
  Croatia: 'Luka Modrić',
  Morocco: 'Romain Saïss',
  Japan: 'Maya Yoshida',
  Uruguay: 'Diego Godín',
  Colombia: 'James Rodríguez',
  Switzerland: 'Granit Xhaka',
  Senegal: 'Kalidou Koulibaly',
  Australia: 'Mathew Ryan',
  Canada: 'Alphonso Davies',
  Türkiye: 'Hakan Çalhanoğlu',
  Scotland: 'Andrew Robertson',
  Ecuador: 'Enner Valencia',
}

function normalizeName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
}

export function getTeamCaptain(team: string): SquadPlayer | null {
  const squad = getTeamSquad(team)
  const captainName = TEAM_CAPTAINS[team]
  if (captainName) {
    const norm = normalizeName(captainName)
    const found = squad.players.find((p) => normalizeName(p.name) === norm)
    if (found) return found
  }

  return (
    squad.players.find((p) => p.number === 10) ??
    squad.players.find((p) => p.role === 'MID') ??
    squad.players[0] ??
    null
  )
}

export function findFifaPlayerPhoto(
  players: Map<string, FifaPlayerInfo> | undefined,
  playerName: string,
  teamName: string,
): string | undefined {
  if (!players?.size) return undefined

  const target = normalizeName(playerName)
  const lastToken = target.split(/\s+/).pop() ?? target

  for (const player of players.values()) {
    if (player.teamName !== teamName) continue
    const names = [player.name, player.shortName].filter(Boolean).map((n) => normalizeName(n!))
    if (names.some((n) => n === target || n.endsWith(` ${lastToken}`) || n.includes(lastToken))) {
      return player.pictureUrl
    }
  }

  return undefined
}

export interface CaptainSpotlight {
  name: string
  teamName: string
  number: number
  pictureUrl?: string
}

export function buildCaptainSpotlight(
  team: string,
  players?: Map<string, FifaPlayerInfo>,
): CaptainSpotlight | null {
  const captain = getTeamCaptain(team)
  if (!captain) return null

  return {
    name: captain.name,
    teamName: team,
    number: captain.number,
    pictureUrl: findFifaPlayerPhoto(players, captain.name, team),
  }
}
