const PREFIX = 'wc-leaderboard-rank:'

export function leaderboardRankKey(userId: string, stage: string): string {
  return `${PREFIX}${userId}:${stage}`
}

export function getStoredLeaderboardRank(key: string): number | null {
  try {
    const raw = sessionStorage.getItem(key)
    if (raw === null) return null
    const n = Number(raw)
    return Number.isFinite(n) && n > 0 ? n : null
  } catch {
    return null
  }
}

export function setStoredLeaderboardRank(key: string, rank: number): void {
  try {
    sessionStorage.setItem(key, String(rank))
  } catch {
    /* private browsing */
  }
}
