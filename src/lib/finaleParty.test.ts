import { describe, expect, it } from 'vitest'
import {
  awardDisplayTitle,
  awardsReadyToPublish,
  buildFinaleSuggestions,
  FINALE_POOL_TOTAL_INR,
  FINALE_SLOT_DEFS,
  finaleCelebrateStorageKey,
  isFinalMatchFinished,
  maskGiftCardNumber,
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

function fullAwards(patch?: Partial<FinalePrizeAwardAdmin>): FinalePrizeAwardAdmin[] {
  return FINALE_SLOT_DEFS.map((def, i) => ({
    id: `award-${i}`,
    slot_key: def.slot_key,
    title: def.title,
    amount_inr: def.amount_inr,
    night_label: null,
    user_id: `user-${i}`,
    zomato_code: `CODE-${i}`,
    suggested_user_id: null,
    revealed_at: null,
    sort_order: i + 1,
    ...patch,
  }))
}

describe('finaleParty — phases after Final', () => {
  it('sums prize pool to ₹4,300 across 6 slots (no matchday heroes)', () => {
    expect(FINALE_SLOT_DEFS).toHaveLength(6)
    expect(FINALE_SLOT_DEFS.some((s) => s.slot_key.startsWith('matchday_hero'))).toBe(false)
    expect(FINALE_POOL_TOTAL_INR).toBe(4300)
    expect(FINALE_SLOT_DEFS.find((s) => s.slot_key === 'lucky_draw')?.amount_inr).toBe(500)
  })

  it('stays tournament while Final is still live/scheduled', () => {
    expect(
      resolveFinaleHomePhase([match({ stage: 'Final', status: 'live' })], config('off')),
    ).toBe('tournament')
  })

  it('enters anticipation when Final finished and not published', () => {
    const matches = [match({ stage: 'Final', status: 'finished' })]
    expect(resolveFinaleHomePhase(matches, null)).toBe('anticipation')
  })

  it('published wins even if Final somehow not finished', () => {
    expect(
      resolveFinaleHomePhase([match({ stage: 'Final', status: 'live' })], config('published')),
    ).toBe('published')
  })

  it('celebration storage key is stable per published_at', () => {
    expect(finaleCelebrateStorageKey('2026-07-19T20:00:00Z')).toBe(
      'wc-finale-celebrated:2026-07-19T20:00:00Z',
    )
  })
})

describe('finaleParty — home feeds after all matches finished', () => {
  it('Next/actionable and predictable lists empty when everything is finished', () => {
    const matches = [
      match({ id: '1', stage: 'Semi-final', status: 'finished' }),
      match({ id: '3', stage: 'Final', status: 'finished' }),
    ]
    expect(getActionableMatches(matches)).toHaveLength(0)
    expect(getPredictableMatches(matches)).toHaveLength(0)
    expect(isFinalMatchFinished(matches)).toBe(true)
  })
})

describe('finaleParty — player home modes', () => {
  const awards = [{ user_id: 'winner-1' }, { user_id: 'winner-2' }, { user_id: null }]

  it('shows gift for winners and thanks for non-winners after publish', () => {
    expect(playerFinaleHomeMode('published', 'winner-1', awards)).toBe('gift')
    expect(playerFinaleHomeMode('published', 'nobody', awards)).toBe('thanks')
  })
})

describe('finaleParty — suggestions & publish gates', () => {
  it('builds podium and oracle suggestions without matchday heroes', () => {
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
    expect(s.bySlot.oracle).toBe('b')
    expect(s.bySlot.season_star).toBe('c')
    expect(s.bySlot.lucky_draw).toBeNull()
    expect(s.luckyEligibleIds).toEqual(['a'])
  })

  it('allows publish when all 6 slots have user + non-empty code', () => {
    expect(awardsReadyToPublish(fullAwards())).toBe(true)
    expect(awardsReadyToPublish(fullAwards().slice(0, 5))).toBe(false)
  })
})

describe('finaleParty — privacy & masking', () => {
  it('masks 16-digit card numbers and never leaks PIN digits into the mask', () => {
    const raw = 'Card: 6004860043036503\nPIN: 196431'
    expect(maskGiftCardNumber(raw)).toBe('6004 **** **** 6503')
    expect(maskGiftCardNumber(raw)?.includes('196431')).toBe(false)
  })

  it('strips zomato_code from public award payloads but keeps masked_card', () => {
    const admin = {
      ...fullAwards()[0]!,
      zomato_code: 'Card: 6004860043036503\nPIN: 196431',
    }
    const pub = toPublicAward(admin)
    expect(publicAwardsLeakCodes([pub])).toBe(false)
    expect('zomato_code' in pub).toBe(false)
    expect(pub.masked_card).toBe('6004 **** **** 6503')
  })

  it('formats award titles', () => {
    expect(awardDisplayTitle({ title: 'Champion', night_label: null })).toBe('Champion')
  })
})
