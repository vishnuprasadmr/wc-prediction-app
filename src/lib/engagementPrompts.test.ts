import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  clearEngagementDismissal,
  dismissEngagementPrompt,
  getLeaderboardPromptMessage,
  getPredictPromptMessage,
  getIstDayLabel,
  resolveEngagementPrompt,
} from './engagementPrompts'
import { makeMatch, makePrediction, resetFixtureCounters } from '../test/fixtures'

describe('engagementPrompts', () => {
  beforeEach(() => {
    resetFixtureCounters()
    localStorage.clear()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-15T06:00:00.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('getIstDayLabel', () => {
    it('labels today and tomorrow in IST', () => {
      expect(getIstDayLabel('2026-06-15T14:00:00.000Z')).toBe('Today')
      expect(getIstDayLabel('2026-06-16T14:00:00.000Z')).toBe('Tomorrow')
    })
  })

  describe('resolveEngagementPrompt', () => {
    it('prompts to predict when the next match has no prediction', () => {
      const match = makeMatch({
        id: 'next-1',
        kickoff_at: '2026-06-15T18:00:00.000Z',
      })

      const prompt = resolveEngagementPrompt({
        matches: [match],
        predictions: {},
        pathname: '/',
      })

      expect(prompt?.kind).toBe('predict')
      expect(prompt?.key).toBe('predict:next-1')
    })

    it('does not prompt on the predict page', () => {
      const match = makeMatch({ kickoff_at: '2026-06-15T18:00:00.000Z' })
      const prompt = resolveEngagementPrompt({
        matches: [match],
        predictions: {},
        pathname: '/predict',
      })
      expect(prompt).toBeNull()
    })

    it('does not prompt when the user already predicted', () => {
      const match = makeMatch({ id: 'next-1', kickoff_at: '2026-06-15T18:00:00.000Z' })
      const prompt = resolveEngagementPrompt({
        matches: [match],
        predictions: {
          'next-1': makePrediction({ match_id: 'next-1' }),
        },
        pathname: '/',
      })
      expect(prompt).toBeNull()
    })

    it('respects dismissed predict prompts', () => {
      const match = makeMatch({ id: 'next-1', kickoff_at: '2026-06-15T18:00:00.000Z' })
      dismissEngagementPrompt('predict:next-1')

      const prompt = resolveEngagementPrompt({
        matches: [match],
        predictions: {},
        pathname: '/',
      })
      expect(prompt).toBeNull()
    })

    it('marks urgent prompts inside fifteen minutes of lock', () => {
      vi.setSystemTime(new Date('2026-06-15T17:35:00.000Z'))
      const match = makeMatch({
        id: 'urgent-1',
        kickoff_at: '2026-06-15T18:00:00.000Z',
      })

      const prompt = resolveEngagementPrompt({
        matches: [match],
        predictions: {},
        pathname: '/',
      })

      expect(prompt?.kind).toBe('predict')
      if (prompt?.kind === 'predict') {
        expect(prompt.urgent).toBe(true)
      }
    })

    it('does not mark urgent when more than fifteen minutes remain', () => {
      vi.setSystemTime(new Date('2026-06-15T16:00:00.000Z'))
      const match = makeMatch({
        id: 'calm-1',
        kickoff_at: '2026-06-15T18:00:00.000Z',
      })

      const prompt = resolveEngagementPrompt({
        matches: [match],
        predictions: {},
        pathname: '/',
      })

      expect(prompt?.kind).toBe('predict')
      if (prompt?.kind === 'predict') {
        expect(prompt.urgent).toBe(false)
      }
    })

    it('prompts leaderboard after a finished match with a prediction', () => {
      const finished = makeMatch({
        id: 'done-1',
        status: 'finished',
        home_score: 2,
        away_score: 1,
        kickoff_at: '2026-06-14T18:00:00.000Z',
      })

      const prompt = resolveEngagementPrompt({
        matches: [finished],
        predictions: {
          'done-1': makePrediction({
            match_id: 'done-1',
            home_pred: 2,
            away_pred: 1,
            points_earned: 5,
          }),
        },
        pathname: '/',
      })

      expect(prompt?.kind).toBe('leaderboard')
      expect(prompt?.key).toBe('leaderboard:done-1')
    })

    it('does not prompt leaderboard on the leaderboard page', () => {
      const finished = makeMatch({
        id: 'done-1',
        status: 'finished',
        kickoff_at: '2026-06-14T18:00:00.000Z',
      })

      const prompt = resolveEngagementPrompt({
        matches: [finished],
        predictions: {
          'done-1': makePrediction({ match_id: 'done-1' }),
        },
        pathname: '/leaderboard',
      })

      expect(prompt).toBeNull()
    })

    it('prioritises predict prompts over leaderboard prompts', () => {
      const upcoming = makeMatch({
        id: 'next-1',
        kickoff_at: '2026-06-15T18:00:00.000Z',
      })
      const finished = makeMatch({
        id: 'done-1',
        status: 'finished',
        kickoff_at: '2026-06-14T18:00:00.000Z',
      })

      const prompt = resolveEngagementPrompt({
        matches: [upcoming, finished],
        predictions: {
          'done-1': makePrediction({ match_id: 'done-1' }),
        },
        pathname: '/',
      })

      expect(prompt?.kind).toBe('predict')
    })

    it('can clear a dismissal', () => {
      const match = makeMatch({ id: 'next-1', kickoff_at: '2026-06-15T18:00:00.000Z' })
      dismissEngagementPrompt('predict:next-1')
      clearEngagementDismissal('predict:next-1')

      const prompt = resolveEngagementPrompt({
        matches: [match],
        predictions: {},
        pathname: '/',
      })

      expect(prompt?.kind).toBe('predict')
    })
  })

  describe('prompt messages', () => {
    it('builds today predict copy', () => {
      const match = makeMatch({
        home_team: 'Brazil',
        away_team: 'Argentina',
        kickoff_at: '2026-06-15T14:00:00.000Z',
      })

      const message = getPredictPromptMessage({
        kind: 'predict',
        key: 'predict:1',
        match,
        dayLabel: 'Today',
        lockTime: '19:15',
        urgent: false,
      })

      expect(message.title).toBe("Today's match — did you predict?")
      expect(message.body).toContain('Brazil vs Argentina')
    })

    it('builds urgent predict copy', () => {
      const message = getPredictPromptMessage({
        kind: 'predict',
        key: 'predict:1',
        match: makeMatch(),
        dayLabel: 'Today',
        lockTime: '19:15',
        urgent: true,
      })

      expect(message.title).toBe('15 minutes until lock!')
    })

    it('builds leaderboard copy with points', () => {
      const message = getLeaderboardPromptMessage({
        kind: 'leaderboard',
        key: 'leaderboard:1',
        match: makeMatch({
          home_team: 'Brazil',
          away_team: 'Argentina',
          home_score: 2,
          away_score: 1,
        }),
        points: 5,
        userPrediction: '2-1',
      })

      expect(message.title).toBe('Full time! Check the table')
      expect(message.body).toContain('Brazil 2-1 Argentina')
      expect(message.body).toContain('You scored 5 pts')
    })
  })
})
