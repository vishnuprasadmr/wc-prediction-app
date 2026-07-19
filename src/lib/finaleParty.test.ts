import { describe, expect, it } from 'vitest'
import {
  awardDisplayTitle,
  awardsReadyToPublish,
  buildFinaleSuggestions,
  FINALE_POOL_TOTAL_INR,
  FINALE_SLOT_DEFS,
  finaleCelebrateStorageKey,
  isFinalMatchFinished,
  playerFinaleHomeMode,
  publicAwardsLeakCodes,
  resolveFinaleHomePhase,
  toPublicAward,
  type FinalePartyConfig,
  type FinalePrizeAwardAdmin,
} from './finaleParty'
import { getActionableMatches, getPredictableMatches } from './matchUtils'
import type { LeaderboardEntry, Match } from './types'

function entry(partial: Partial<LeaderboardEntry> & { user_id: string }): LeaderboardEntry {
  return {
    display_name: partial.display_name ?? 'P',
    total_points: partial.total_points ?? 0,
    exact_scores: partial.exact_scores ?? 0,
    predictions_made: partial.predictions_made ?? 0,
    rank: partial.rank ?? 1,
    ...partial,
  }
}

function match(partial: Partial<Match> & Pick<Match, 'stage' | 'status'>): Match {
  return {
    id: partial.id ?? 'm1',
    api_fixture_id: null,
    group_name: null,
    home_team: 'A',
    away_team: 'B',
    home_flag: '',
    away_flag: '',
    kickoff_at: partial.kickoff_at ?? '2026-07-19T19:00:00Z',
    home_score: null,
    away_score: null,
    score_source: null,
    manual_override: false,
    ...partial,
  }
}

function config(status: FinalePartyConfig['status']): FinalePartyConfig {
  return {
    status,
    anticipation_headline: 'Anticipation',
    anticipation_body: 'Soon',
    published_headline: 'Party',
    published_body: 'Done',
    published_at: status === 'published' ? '2026-07-19T20:00:00Z' : null,
  }
}

function fullAwards(
  patch?: Partial<FinalePrizeAwardAdmin>,
): FinalePrizeAwardAdmin[] {
  return FINALE_SLOT_DEFS.map((def, i) => ({
    id: `award-${i}`,
    slot_key: def.slot_key,
    title: def.title,
    amount_inr: def.amount_inr,
    night_label: def.defaultNightLabel ?? null,
    user_id: `user-${i}`,
    zomato_code: `CODE-${i}`,
    suggested_user_id: null,
    revealed_at: null,
    sort_order: i + 1,
    ...patch,
  }))
}

describe('finaleParty — phases after Final', () => {
  it('sums prize pool to ₹5,000 across 9 slots', () => {
    expect(FINALE_SLOT_DEFS).toHaveLength(9)
    expect(FINALE_POOL_TOTAL_INR).toBe(5000)
  })

  it('stays tournament while Final is still live/scheduled', () => {
    expect(
      resolveFinaleHomePhase([match({ stage: 'Final', status: 'live' })], config('off')),
    ).toBe('tournament')
    expect(
      resolveFinaleHomePhase([match({ stage: 'Final', status: 'scheduled' })], null),
    ).toBe('tournament')
  })

  it('ignores Third place finished — only Final finished flips anticipation', () => {
    const matches = [
      match({ id: 'tp', stage: 'Third place', status: 'finished' }),
      match({ id: 'f', stage: 'Final', status: 'scheduled' }),
    ]
    expect(isFinalMatchFinished(matches)).toBe(false)
    expect(resolveFinaleHomePhase(matches, config('off'))).toBe('tournament')
  })

  it('enters anticipation when Final finished and not published', () => {
    const matches = [match({ stage: 'Final', status: 'finished' })]
    expect(resolveFinaleHomePhase(matches, null)).toBe('anticipation')
    expect(resolveFinaleHomePhase(matches, config('off'))).toBe('anticipation')
    expect(resolveFinaleHomePhase(matches, config('anticipation'))).toBe('anticipation')
  })

  it('published wins even if Final somehow not finished', () => {
    expect(
      resolveFinaleHomePhase(
        [match({ stage: 'Final', status: 'live' })],
        config('published'),
      ),
    ).toBe('published')
  })

  it('celebration storage key is stable per published_at', () => {
    expect(finaleCelebrateStorageKey('2026-07-19T20:00:00Z')).toBe(
      'wc-finale-celebrated:2026-07-19T20:00:00Z',
    )
    expect(finaleCelebrateStorageKey(null)).toBe('wc-finale-celebrated:none')
  })
})

describe('finaleParty — home feeds after all matches finished', () => {
  it('Next/actionable and predictable lists empty when everything is finished', () => {
    const matches = [
      match({ id: '1', stage: 'Semi-final', status: 'finished', kickoff_at: '2026-07-15T00:00:00Z' }),
      match({ id: '2', stage: 'Third place', status: 'finished', kickoff_at: '2026-07-18T00:00:00Z' }),
      match({ id: '3', stage: 'Final', status: 'finished', kickoff_at: '2026-07-19T00:00:00Z' }),
    ]
    expect(getActionableMatches(matches)).toHaveLength(0)
    expect(getPredictableMatches(matches)).toHaveLength(0)
    expect(resolveFinaleHomePhase(matches, config('off'))).toBe('anticipation')
  })
})

describe('finaleParty — player home modes', () => {
  const awards = [
    { user_id: 'winner-1' },
    { user_id: 'winner-2' },
    { user_id: null },
  ]

  it('hides party during tournament', () => {
    expect(playerFinaleHomeMode('tournament', 'winner-1', awards)).toBe('hidden')
  })

  it('shows anticipation for everyone before publish', () => {
    expect(playerFinaleHomeMode('anticipation', 'winner-1', awards)).toBe('anticipation')
    expect(playerFinaleHomeMode('anticipation', 'nobody', awards)).toBe('anticipation')
  })

  it('shows gift for winners and thanks for non-winners after publish', () => {
    expect(playerFinaleHomeMode('published', 'winner-1', awards)).toBe('gift')
    expect(playerFinaleHomeMode('published', 'nobody', awards)).toBe('thanks')
    expect(playerFinaleHomeMode('published', null, awards)).toBe('thanks')
  })

  it('same player with multiple awards still gets gift mode', () => {
    const multi = [{ user_id: 'ace' }, { user_id: 'ace' }, { user_id: 'other' }]
    expect(playerFinaleHomeMode('published', 'ace', multi)).toBe('gift')
  })
})

describe('finaleParty — suggestions & publish gates', () => {
  it('builds podium, oracle, season star; leaves heroes/lucky null', () => {
    const entries = [
      entry({ user_id: 'a', rank: 1, exact_scores: 2 }),
      entry({ user_id: 'b', rank: 2, exact_scores: 9 }),
      entry({ user_id: 'c', rank: 3, exact_scores: 1 }),
    ]
    const s = buildFinaleSuggestions(
      entries,
      [{ user_id: 'c', points_earned: 40 }],
      [
        { user_id: 'a', count: 100 },
        { user_id: 'b', count: 50 },
      ],
      100,
    )
    expect(s.bySlot.champion).toBe('a')
    expect(s.bySlot.runner_up).toBe('b')
    expect(s.bySlot.bronze).toBe('c')
    expect(s.bySlot.oracle).toBe('b')
    expect(s.bySlot.season_star).toBe('c')
    expect(s.bySlot.matchday_hero_1).toBeNull()
    expect(s.bySlot.lucky_draw).toBeNull()
    expect(s.luckyEligibleIds).toEqual(['a'])
  })

  it('handles empty leaderboard and null season points', () => {
    const s = buildFinaleSuggestions([], [{ user_id: 'x', points_earned: null }], [], 104)
    expect(s.bySlot.champion).toBeNull()
    expect(s.bySlot.oracle).toBeNull()
    expect(s.bySlot.season_star).toBe('x')
    expect(s.luckyEligibleIds).toEqual([])
  })

  it('lucky draw threshold uses ceil(70%) and excludes below', () => {
    // 104 matches → ceil(72.8) = 73
    const s = buildFinaleSuggestions(
      [],
      [],
      [
        { user_id: 'eligible', count: 73 },
        { user_id: 'short', count: 72 },
      ],
      104,
    )
    expect(s.luckyEligibleIds).toEqual(['eligible'])
  })

  it('lucky draw with zero matches yields no eligibles', () => {
    const s = buildFinaleSuggestions([], [], [{ user_id: 'a', count: 999 }], 0)
    expect(s.luckyEligibleIds).toEqual([])
  })

  it('blocks publish when slots incomplete, missing user, or blank/whitespace code', () => {
    expect(awardsReadyToPublish([])).toBe(false)
    expect(awardsReadyToPublish(fullAwards().slice(0, 8))).toBe(false)
    expect(awardsReadyToPublish(fullAwards({ user_id: null }))).toBe(false)
    expect(awardsReadyToPublish(fullAwards({ zomato_code: '   ' }))).toBe(false)
    expect(awardsReadyToPublish(fullAwards({ zomato_code: '' }))).toBe(false)
  })

  it('allows publish when all 9 slots have user + non-empty code', () => {
    expect(awardsReadyToPublish(fullAwards())).toBe(true)
  })

  it('allows same player on multiple slots for publish readiness', () => {
    expect(awardsReadyToPublish(fullAwards({ user_id: 'same-person' }))).toBe(true)
  })
})

describe('finaleParty — privacy & display', () => {
  it('strips zomato_code from public award payloads', () => {
    const admin = fullAwards()[0]!
    const pub = toPublicAward(admin)
    expect(pub.user_id).toBe(admin.user_id)
    expect(publicAwardsLeakCodes([pub])).toBe(false)
    expect('zomato_code' in pub).toBe(false)
  })

  it('formats award titles with optional night labels', () => {
    expect(awardDisplayTitle({ title: 'Champion', night_label: null })).toBe('Champion')
    expect(awardDisplayTitle({ title: 'Matchday hero', night_label: '  Final week  ' })).toBe(
      'Matchday hero · Final week',
    )
    expect(awardDisplayTitle({ title: 'Oracle', night_label: '   ' })).toBe('Oracle')
  })
})

describe('finaleParty — end-to-end state machine', () => {
  it('walks tournament → anticipation → published gift/thanks without leaking codes', () => {
    const finalLive = [match({ stage: 'Final', status: 'live' })]
    const finalDone = [match({ stage: 'Final', status: 'finished' })]
    const adminRows = fullAwards()
    const publicRows = adminRows.map(toPublicAward)

    // Mid-final
    expect(resolveFinaleHomePhase(finalLive, config('off'))).toBe('tournament')
    expect(playerFinaleHomeMode('tournament', 'user-0', publicRows)).toBe('hidden')
    expect(getActionableMatches(finalLive)).toHaveLength(1)

    // Whistle — anticipation, still no codes in public payload
    const anticipation = resolveFinaleHomePhase(finalDone, config('off'))
    expect(anticipation).toBe('anticipation')
    expect(playerFinaleHomeMode(anticipation, 'user-0', publicRows)).toBe('anticipation')
    expect(playerFinaleHomeMode(anticipation, 'spectator', publicRows)).toBe('anticipation')
    expect(publicAwardsLeakCodes(publicRows)).toBe(false)
    expect(awardsReadyToPublish(adminRows)).toBe(true)

    // Publish
    const published = resolveFinaleHomePhase(finalDone, config('published'))
    expect(published).toBe('published')
    expect(playerFinaleHomeMode(published, 'user-0', publicRows)).toBe('gift')
    expect(playerFinaleHomeMode(published, 'spectator', publicRows)).toBe('thanks')
    expect(getActionableMatches(finalDone)).toHaveLength(0)
    expect(getPredictableMatches(finalDone)).toHaveLength(0)
  })
})
