import type { LeaderboardEntry, Match } from './types'
import { formatStageLabel, getLastFinishedMatch } from './matchUtils'
import { formatShareDateIst } from './timezone'
import { buildMatchHero, type MatchHeroShare } from './matchHeroStory'
import { fetchFifaMatchDetails } from './fifaMatchDetails'
import { renderLeagueTableBlob } from './shareImage/renderLeagueTableImage'
import type { LeagueTableShareInput } from './shareImage/leagueTableTypes'
import { shareStandings, type ShareResult } from './shareStandings'
import { downloadShareImage } from './shareDownload'

export function buildLeagueTableShareText(input: {
  entries: LeaderboardEntry[]
  hero?: MatchHeroShare
  lastMatch?: Match | null
  leagueLabel?: string
}): string {
  const lines = ['⚽ Simelabs WC 2026 Predictions — Leaderboard']

  if (input.hero) {
    lines.push(`${input.hero.headline}`)
    lines.push(input.hero.subline)
  } else if (input.lastMatch) {
    lines.push(
      `Last result: ${input.lastMatch.home_team} ${input.lastMatch.home_score}–${input.lastMatch.away_score} ${input.lastMatch.away_team}`,
    )
  }

  lines.push('')
  if (input.leagueLabel) lines.push(input.leagueLabel)
  lines.push('Rank · Player · Pts · Exact')
  for (const e of input.entries) {
    lines.push(`#${e.rank} ${e.display_name} — ${e.total_points} pts · ${e.exact_scores} exact`)
  }

  lines.push('')
  lines.push('Join the league and predict every match!')

  return lines.join('\n')
}

export function buildLeagueTableShareInput(input: {
  entries: LeaderboardEntry[]
  hero?: MatchHeroShare
  matches: Match[]
  leagueLabel?: string
  now?: number
}): LeagueTableShareInput {
  const last = getLastFinishedMatch(input.matches)
  const dateLabel = formatShareDateIst(input.now)

  return {
    entries: input.entries,
    hero: input.hero,
    dateLabel,
    leagueLabel: input.leagueLabel,
    lastMatch: last
      ? {
          homeTeam: last.home_team,
          awayTeam: last.away_team,
          homeScore: last.home_score!,
          awayScore: last.away_score!,
          stageLabel: formatStageLabel(last.stage, last.group_name),
        }
      : undefined,
  }
}

export async function resolveMatchHero(match: Match): Promise<MatchHeroShare> {
  const details = await fetchFifaMatchDetails(match)
  return buildMatchHero(match, details)
}

export function prepareLeagueTableBlob(payload: LeagueTableShareInput): Promise<Blob> {
  return renderLeagueTableBlob(payload)
}

export async function shareLeagueTableWithImage(input: {
  entries: LeaderboardEntry[]
  hero?: MatchHeroShare
  matches: Match[]
  leagueLabel?: string
  preparedBlob?: Blob | null
}): Promise<ShareResult> {
  const lastMatch = getLastFinishedMatch(input.matches)
  const hero =
    input.hero ??
    (!input.preparedBlob && lastMatch ? await resolveMatchHero(lastMatch) : undefined)
  const payload = buildLeagueTableShareInput({ ...input, hero })
  const text = buildLeagueTableShareText({
    entries: input.entries,
    hero,
    lastMatch,
    leagueLabel: input.leagueLabel,
  })

  try {
    const imageBlob = input.preparedBlob ?? (await renderLeagueTableBlob(payload))
    return shareStandings(text, imageBlob)
  } catch {
    return shareStandings(text)
  }
}

export async function downloadLeagueTableImage(
  input: Omit<LeagueTableShareInput, 'dateLabel'> & { now?: number },
  preparedBlob?: Blob | null,
): Promise<boolean> {
  try {
    const dateLabel = formatShareDateIst(input.now)
    const blob = preparedBlob ?? (await renderLeagueTableBlob({ ...input, dateLabel }))
    return downloadShareImage(blob, 'wc-leaderboard-share.png')
  } catch {
    return false
  }
}
