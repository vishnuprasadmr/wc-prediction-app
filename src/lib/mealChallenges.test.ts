import { describe, expect, it } from 'vitest'
import {
  findMealChallengeWinners,
  filterPicksToMealParticipants,
  getMatchClaimOutcome,
  isClaimCorrect,
  canAcceptMealBet,
  mealChallengeParticipantIds,
  resolveMealChallengeWinner,
} from './mealChallenges'
import type { Match } from './types'

const finished: Pick<Match, 'home_score' | 'away_score' | 'status'> = {
  status: 'finished',
  home_score: 2,
  away_score: 1,
}

const picks = [
  {
    user_id: 'a',
    display_name: 'Alex',
    home_pred: 2,
    away_pred: 1,
    created_at: '2026-06-10T10:00:00Z',
  },
  {
    user_id: 'b',
    display_name: 'Blair',
    home_pred: 2,
    away_pred: 1,
    created_at: '2026-06-10T11:00:00Z',
  },
  {
    user_id: 'c',
    display_name: 'Casey',
    home_pred: 1,
    away_pred: 0,
    created_at: '2026-06-10T09:00:00Z',
  },
]

const acceptances = [{ user_id: 'b' }]

describe('findMealChallengeWinners', () => {
  it('picks exact scorers earliest first', () => {
    const winners = findMealChallengeWinners(finished, picks, 'exact_score')
    expect(winners.map((w) => w.user_id)).toEqual(['a', 'b'])
  })

  it('accepts correct result without exact line', () => {
    const winners = findMealChallengeWinners(finished, picks, 'correct_result')
    expect(winners.map((w) => w.user_id)).toEqual(['c', 'a', 'b'])
  })
})

describe('resolveMealChallengeWinner', () => {
  it('ignores non-participants even if they have the exact score', () => {
    const outsider = {
      user_id: 'z',
      display_name: 'Zoe',
      home_pred: 2,
      away_pred: 1,
      created_at: '2026-06-10T08:00:00Z',
    }
    const creatorPick = {
      user_id: 'creator',
      display_name: 'Creator',
      home_pred: 1,
      away_pred: 0,
      created_at: '2026-06-10T07:00:00Z',
    }
    const acceptorPick = {
      user_id: 'acceptor',
      display_name: 'Acceptor',
      home_pred: 3,
      away_pred: 0,
      created_at: '2026-06-10T09:00:00Z',
    }

    const result = resolveMealChallengeWinner(
      finished,
      [outsider, creatorPick, acceptorPick],
      'creator',
      [{ user_id: 'acceptor' }],
      'exact_score',
    )

    expect(result.winner).toBeNull()
    expect(result.winnerNote).toBe('No qualifying pick among meal bet participants')
  })

  it('picks an acceptor with exact score over a non-participant who picked earlier', () => {
    const outsider = {
      user_id: 'z',
      display_name: 'Zoe',
      home_pred: 2,
      away_pred: 1,
      created_at: '2026-06-10T08:00:00Z',
    }
    const acceptorPick = {
      user_id: 'acceptor',
      display_name: 'Acceptor',
      home_pred: 2,
      away_pred: 1,
      created_at: '2026-06-10T09:00:00Z',
    }

    const result = resolveMealChallengeWinner(
      finished,
      [outsider, acceptorPick],
      'creator',
      [{ user_id: 'acceptor' }],
      'exact_score',
    )

    expect(result.winner?.user_id).toBe('acceptor')
    expect(result.winnerNote).toBeNull()
  })

  it('includes the creator among eligible meal winners', () => {
    const creatorPick = {
      user_id: 'creator',
      display_name: 'Creator',
      home_pred: 2,
      away_pred: 1,
      created_at: '2026-06-10T10:00:00Z',
    }

    const result = resolveMealChallengeWinner(
      finished,
      [creatorPick],
      'creator',
      [],
      'exact_score',
    )

    expect(result.winner?.user_id).toBe('creator')
  })

  it('breaks ties among participants by earliest pick', () => {
    const result = resolveMealChallengeWinner(
      finished,
      picks,
      'a',
      acceptances,
      'exact_score',
    )

    expect(result.winner?.user_id).toBe('a')
    expect(result.winnerNote).toContain('2 tied among participants')
  })
})

describe('mealChallengeParticipantIds', () => {
  it('includes creator and acceptors only', () => {
    const ids = mealChallengeParticipantIds('creator', acceptances)
    expect([...ids].sort()).toEqual(['b', 'creator'])
  })

  it('filters picks to participants', () => {
    const filtered = filterPicksToMealParticipants(picks, 'a', acceptances)
    expect(filtered.map((p) => p.user_id)).toEqual(['a', 'b'])
  })
})

describe('claim outcome', () => {
  it('reads home win from scoreline', () => {
    expect(getMatchClaimOutcome(finished)).toBe('home_win')
    expect(isClaimCorrect(finished, 'home_win')).toBe(true)
    expect(isClaimCorrect(finished, 'away_win')).toBe(false)
  })
})

describe('canAcceptMealBet', () => {
  it('rejects live and locked scheduled matches', () => {
    const open = {
      id: 'm1',
      status: 'scheduled' as const,
      kickoff_at: new Date(Date.now() + 60 * 60_000).toISOString(),
    }
    const locked = {
      ...open,
      kickoff_at: new Date(Date.now() + 5 * 60_000).toISOString(),
    }
    expect(canAcceptMealBet(open as import('./types').Match)).toBe(true)
    expect(canAcceptMealBet(locked as import('./types').Match)).toBe(false)
    expect(canAcceptMealBet(undefined)).toBe(false)
  })
})

describe('acceptor display', () => {
  it('formats pick and claim line', async () => {
    const { formatAcceptorPick, acceptorBetLine } = await import('./mealChallenges')
    expect(formatAcceptorPick(2, 1)).toBe('2-1')
    expect(formatAcceptorPick(null, 1)).toBe('No pick yet')
    expect(
      acceptorBetLine({
        backedOutcome: 'home_win',
        match: { home_team: 'Brazil', away_team: 'France' },
        homePred: 1,
        awayPred: 1,
      }),
    ).toBe('1-1 · vs Brazil wins')
  })
})
