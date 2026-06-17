import { buildCaptainSpotlight, type CaptainSpotlight } from './captainSpotlight'
import type { FifaMatchDetails } from './fifaMatchDetails'
import { formatPredictionLockTimeIst, formatStageLabel } from './matchUtils'
import { buildCrowdSentimentLabel, type CrowdSentiment } from './pickCrowdSentiment'
import { formatKickoffIst, formatIstDateHeader, toIstDateKey } from './timezone'
import { formatVenueLabel, getMatchVenueCity } from './venues'
import type { Match } from './types'

export interface UpcomingMatchShare {
  homeTeam: string
  awayTeam: string
  kickoffLabel: string
  kickoffDayLabel: string
  lockTimeLabel: string
  stageLabel: string
  venueLabel?: string
  homeCaptain: CaptainSpotlight
  awayCaptain: CaptainSpotlight
  crowdSentiment?: CrowdSentiment
  crowdLabel?: string
  /** Hero photo — home captain, with away as fallback backdrop team */
  hero: {
    playerName: string
    teamName: string
    pictureUrl?: string
    headline: string
    subline: string
    backdropTeam: string
  }
  ctaLine: string
}

export function buildUpcomingMatchShare(
  match: Match,
  details: FifaMatchDetails | null,
  crowdSentiment?: CrowdSentiment | null,
): UpcomingMatchShare {
  const players = details?.players
  const homeCaptain =
    buildCaptainSpotlight(match.home_team, players) ??
    ({ name: match.home_team, teamName: match.home_team, number: 0 } as CaptainSpotlight)
  const awayCaptain =
    buildCaptainSpotlight(match.away_team, players) ??
    ({ name: match.away_team, teamName: match.away_team, number: 0 } as CaptainSpotlight)

  const kickoffLabel = formatKickoffIst(match.kickoff_at)
  const kickoffDayLabel = formatIstDateHeader(toIstDateKey(match.kickoff_at))
  const lockTimeLabel = formatPredictionLockTimeIst(match.kickoff_at)
  const venueCity = getMatchVenueCity(match)

  const heroPhoto =
    homeCaptain.pictureUrl ??
    awayCaptain.pictureUrl ??
    findFifaPlayerPhotoFromDetails(details, homeCaptain.name, match.home_team)

  const crowdLabel = crowdSentiment
    ? buildCrowdSentimentLabel(crowdSentiment, match.home_team, match.away_team)
    : undefined

  return {
    homeTeam: match.home_team,
    awayTeam: match.away_team,
    kickoffLabel,
    kickoffDayLabel,
    lockTimeLabel,
    stageLabel: formatStageLabel(match.stage, match.group_name),
    venueLabel: venueCity ? formatVenueLabel(venueCity) : undefined,
    homeCaptain,
    awayCaptain,
    crowdSentiment: crowdSentiment ?? undefined,
    crowdLabel,
    hero: {
      playerName: homeCaptain.name,
      teamName: match.home_team,
      pictureUrl: heroPhoto,
      headline: `${homeCaptain.name} leads ${match.home_team}`,
      subline: `Captain vs ${awayCaptain.name} · ${match.away_team}`,
      backdropTeam: match.home_team,
    },
    ctaLine: 'Have your say before predictions lock!',
  }
}

function findFifaPlayerPhotoFromDetails(
  details: FifaMatchDetails | null,
  name: string,
  team: string,
): string | undefined {
  if (!details?.players.size) return undefined
  for (const player of details.players.values()) {
    if (player.teamName === team && player.name.toLowerCase().includes(name.split(' ').pop()!.toLowerCase())) {
      return player.pictureUrl
    }
  }
  return undefined
}
