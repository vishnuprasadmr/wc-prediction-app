import type { MealChallengeView } from '../hooks/useMealChallenges'
import type { LeaderboardEntry, Match } from './types'
import { formatShareDateIst } from './timezone'
import { renderGameSnapshotBlob } from './shareImage/renderGameSnapshotCard'
import type { GameSnapshotInput, GameSnapshotMealRow } from './shareImage/gameSnapshotTypes'
import { shareStandings, type ShareResult } from './shareStandings'
import { downloadShareImage } from './shareDownload'

function mealRowsFromChallenges(
  live: MealChallengeView[],
  settled: MealChallengeView[],
): GameSnapshotMealRow[] {
  const rows: GameSnapshotMealRow[] = []

  for (const c of live.slice(0, 2)) {
    const match = c.match
    rows.push({
      kind: 'live',
      matchLabel: match ? `${match.home_team} vs ${match.away_team}` : 'Match TBC',
      line: `${c.creator_name}: “${c.claim_text}”`,
      subline:
        c.acceptances.length > 0
          ? `${c.acceptances.length} accepted · ${c.total_points_staked} pts on the line`
          : 'Open for point bets',
    })
  }

  for (const c of settled.slice(0, 3)) {
    const match = c.match
    const score =
      match?.home_score != null && match?.away_score != null
        ? ` · ${match.home_score}–${match.away_score}`
        : ''
    rows.push({
      kind: 'settled',
      matchLabel: match ? `${match.home_team} vs ${match.away_team}${score}` : 'Settled bet',
      line: `${c.creator_name}: “${c.claim_text}”`,
      subline: c.winner_name
        ? `🍽️ ${c.winner_name} wins — ${c.stake_text}`
        : (c.winner_note ?? c.stake_text),
    })
  }

  return rows
}

export function buildGameSnapshotInput(params: {
  entries: LeaderboardEntry[]
  leagueLabel: string
  lastMatch?: Match | null
  liveMealBets: MealChallengeView[]
  settledMealBets: MealChallengeView[]
  finishedMatchCount: number
}): GameSnapshotInput {
  const { entries, leagueLabel, lastMatch, liveMealBets, settledMealBets, finishedMatchCount } =
    params

  return {
    leagueLabel,
    dateLabel: formatShareDateIst(),
    finishedMatchCount,
    liveMealCount: liveMealBets.length,
    settledMealCount: settledMealBets.length,
    topThree: entries.slice(0, 3),
    lastMatchLabel:
      lastMatch != null ? `${lastMatch.home_team} vs ${lastMatch.away_team}` : undefined,
    lastMatchScore:
      lastMatch?.home_score != null && lastMatch?.away_score != null
        ? `${lastMatch.home_score}–${lastMatch.away_score}`
        : undefined,
    mealRows: mealRowsFromChallenges(liveMealBets, settledMealBets),
  }
}

export function buildGameSnapshotShareText(input: GameSnapshotInput): string {
  const lines = [
    '⚽ Simelabs WC 2026 — Game snapshot',
    input.leagueLabel,
    `${input.finishedMatchCount} matches played · ${input.liveMealCount} live meal bets`,
    '',
    'Top 3',
  ]

  for (const e of input.topThree) {
    lines.push(`#${e.rank} ${e.display_name} — ${e.total_points} pts`)
  }

  if (input.lastMatchLabel && input.lastMatchScore) {
    lines.push('', `Latest: ${input.lastMatchLabel} ${input.lastMatchScore}`)
  }

  if (input.mealRows.length > 0) {
    lines.push('', 'Meal bets')
    for (const row of input.mealRows) {
      lines.push(`• ${row.matchLabel}: ${row.line}`)
      if (row.subline) lines.push(`  ${row.subline}`)
    }
  }

  lines.push('', 'Join the league · Predict every match')
  return lines.join('\n')
}

export function prepareGameSnapshotBlob(input: GameSnapshotInput): Promise<Blob> {
  return renderGameSnapshotBlob(input)
}

export async function shareGameSnapshotWithImage(
  input: GameSnapshotInput,
  preparedBlob?: Blob | null,
): Promise<ShareResult> {
  const text = buildGameSnapshotShareText(input)
  try {
    const blob = preparedBlob ?? (await renderGameSnapshotBlob(input))
    return shareStandings(text, blob)
  } catch {
    return shareStandings(text)
  }
}

export async function downloadGameSnapshotImage(
  input: GameSnapshotInput,
  preparedBlob?: Blob | null,
): Promise<boolean> {
  try {
    const blob = preparedBlob ?? (await renderGameSnapshotBlob(input))
    return downloadShareImage(blob, 'wc-game-snapshot.png')
  } catch {
    return false
  }
}
