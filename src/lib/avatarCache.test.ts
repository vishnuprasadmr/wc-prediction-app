import { describe, expect, it } from 'vitest'
import {
  clearAvatarCacheForTests,
  getCachedAvatarUrlSync,
  resolveCachedAvatarUrl,
} from './avatarCache'
import { getDailyLeaderPrompt } from './dailyLeaderPrompt'
import { buildLeaderShareText } from './shareLeaderCard'
import type { LeaderboardEntry } from './types'

describe('getDailyLeaderPrompt', () => {
  it('returns a prompt for a fixed IST day', () => {
    const prompt = getDailyLeaderPrompt(Date.UTC(2026, 5, 17, 6, 30))
    expect(prompt.length).toBeGreaterThan(5)
  })
})

describe('buildLeaderShareText', () => {
  it('includes top 3 and daily prompt', () => {
    const entries: LeaderboardEntry[] = [
      { user_id: '1', display_name: 'Alex', total_points: 50, exact_scores: 3, predictions_made: 10, rank: 1 },
      { user_id: '2', display_name: 'Sam', total_points: 42, exact_scores: 2, predictions_made: 9, rank: 2 },
      { user_id: '3', display_name: 'Jo', total_points: 38, exact_scores: 1, predictions_made: 8, rank: 3 },
    ]
    const text = buildLeaderShareText(entries, 'Simelabs league', 'Can anyone catch them?')
    expect(text).toContain('Can anyone catch them?')
    expect(text).toContain('Alex')
    expect(text).toContain('Sam')
    expect(text).toContain('Jo')
  })
})

describe('avatarCache', () => {
  it('returns null when url missing', async () => {
    clearAvatarCacheForTests()
    expect(getCachedAvatarUrlSync(null)).toBeNull()
    await expect(resolveCachedAvatarUrl(null)).resolves.toBeNull()
  })
})
