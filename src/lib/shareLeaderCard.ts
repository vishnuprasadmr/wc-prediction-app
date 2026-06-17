import type { LeaderboardEntry } from './types'
import { getDailyLeaderPrompt } from './dailyLeaderPrompt'
import { formatShareDateIst } from './timezone'
import { renderLeaderCardBlob } from './shareImage/renderLeaderCard'
import type { LeaderCardInput } from './shareImage/leaderCardTypes'
import { shareStandings, type ShareResult } from './shareStandings'
import { downloadShareImage } from './shareDownload'

export function buildLeaderShareText(  entries: LeaderboardEntry[],
  leagueLabel: string,
  dailyPrompt = getDailyLeaderPrompt(),
): string {
  const lines = ['⚽ Simelabs WC 2026 — Top Predictors', dailyPrompt, '', leagueLabel]

  for (const e of entries.slice(0, 3)) {
    lines.push(`#${e.rank} ${e.display_name} — ${e.total_points} pts · ${e.exact_scores} exact`)
  }

  lines.push('', 'Join the league and predict every match!')
  return lines.join('\n')
}

function buildLeaderCardInput(
  entries: LeaderboardEntry[],
  leagueLabel: string,
): LeaderCardInput {
  return {
    entries: entries.slice(0, 3),
    leagueLabel,
    dateLabel: formatShareDateIst(),
    dailyPrompt: getDailyLeaderPrompt(),
  }
}

export function prepareLeaderCardBlob(
  entries: LeaderboardEntry[],
  leagueLabel: string,
): Promise<Blob> {
  return renderLeaderCardBlob(buildLeaderCardInput(entries, leagueLabel))
}

export async function shareLeaderWithImage(
  entries: LeaderboardEntry[],
  leagueLabel: string,
  preparedBlob?: Blob | null,
): Promise<ShareResult> {
  const payload = buildLeaderCardInput(entries, leagueLabel)
  const text = buildLeaderShareText(payload.entries, leagueLabel, payload.dailyPrompt)

  try {
    const blob = preparedBlob ?? (await renderLeaderCardBlob(payload))
    return shareStandings(text, blob)
  } catch {
    return shareStandings(text)
  }
}

export async function downloadLeaderImage(
  entries: LeaderboardEntry[],
  leagueLabel: string,
  preparedBlob?: Blob | null,
): Promise<boolean> {
  try {
    const blob = preparedBlob ?? (await renderLeaderCardBlob(buildLeaderCardInput(entries, leagueLabel)))
    return downloadShareImage(blob, 'wc-leader-share.png')
  } catch {
    return false
  }
}