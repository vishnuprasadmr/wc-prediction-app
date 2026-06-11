import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  PREDICTION_LOCK_BUFFER_MINUTES,
  canPredictMatch,
  formatCountdown,
  formatLockCountdown,
  formatLockCountdownLive,
  formatStageLabel,
  getMsUntilPredictionLock,
  isLockWarningWindow,
  LOCK_WARNING_MINUTES,
  getMatchFilterStatus,
  getNextPredictableMatch,
  getPredictionLockAt,
  getLiveMatches,
  isInScoreSyncWindow,
  isMatchLocked,
  shouldPollLiveScores,
  statusLabel,
} from './matchUtils'
import { makeMatch, resetFixtureCounters } from '../test/fixtures'

describe('matchUtils', () => {
  beforeEach(() => {
    resetFixtureCounters()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-15T12:00:00.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('getPredictionLockAt', () => {
    it('locks predictions 15 minutes before kickoff', () => {
      const kickoff = '2026-06-15T14:00:00.000Z'
      const lockAt = getPredictionLockAt(kickoff)
      expect(lockAt.toISOString()).toBe('2026-06-15T13:45:00.000Z')
      expect(PREDICTION_LOCK_BUFFER_MINUTES).toBe(15)
    })
  })

  describe('isMatchLocked', () => {
    it('returns false before the lock window', () => {
      const match = makeMatch({ kickoff_at: '2026-06-15T14:00:00.000Z' })
      expect(isMatchLocked(match)).toBe(false)
    })

    it('returns true inside the lock window', () => {
      vi.setSystemTime(new Date('2026-06-15T13:50:00.000Z'))
      const match = makeMatch({ kickoff_at: '2026-06-15T14:00:00.000Z' })
      expect(isMatchLocked(match)).toBe(true)
    })

    it('returns true for live matches', () => {
      const match = makeMatch({ status: 'live', kickoff_at: '2026-06-20T14:00:00.000Z' })
      expect(isMatchLocked(match)).toBe(true)
    })

    it('returns true for finished matches', () => {
      const match = makeMatch({ status: 'finished' })
      expect(isMatchLocked(match)).toBe(true)
    })
  })

  describe('live scores', () => {
    it('getLiveMatches returns non-finished live filter matches', () => {
      const live = makeMatch({ status: 'live', home_score: 1, away_score: 0 })
      const finished = makeMatch({ id: 'done', status: 'finished', home_score: 2, away_score: 1 })
      expect(getLiveMatches([live, finished])).toHaveLength(1)
      expect(getLiveMatches([live, finished])[0].id).toBe(live.id)
    })

    it('shouldPollLiveScores when a match is live', () => {
      const live = makeMatch({ status: 'live', kickoff_at: '2026-06-15T12:00:00.000Z' })
      expect(shouldPollLiveScores([live])).toBe(true)
    })

    it('isInScoreSyncWindow after kickoff', () => {
      vi.setSystemTime(new Date('2026-06-15T14:30:00.000Z'))
      const match = makeMatch({ kickoff_at: '2026-06-15T14:00:00.000Z', status: 'scheduled' })
      expect(isInScoreSyncWindow(match)).toBe(true)
    })
  })

  describe('getNextPredictableMatch', () => {
    it('returns the earliest unlocked scheduled match', () => {
      const later = makeMatch({
        id: 'later',
        kickoff_at: '2026-06-16T14:00:00.000Z',
      })
      const sooner = makeMatch({
        id: 'sooner',
        kickoff_at: '2026-06-15T18:00:00.000Z',
      })
      const locked = makeMatch({
        id: 'locked',
        kickoff_at: '2026-06-15T12:10:00.000Z',
      })

      expect(getNextPredictableMatch([later, locked, sooner])?.id).toBe('sooner')
    })

    it('returns null when every match is locked or not scheduled', () => {
      const finished = makeMatch({ status: 'finished' })
      const locked = makeMatch({ kickoff_at: '2026-06-15T12:10:00.000Z' })
      expect(getNextPredictableMatch([finished, locked])).toBeNull()
    })
  })

  describe('canPredictMatch', () => {
    it('allows only the next predictable match', () => {
      const next = makeMatch({ kickoff_at: '2026-06-15T18:00:00.000Z' })
      const later = makeMatch({ kickoff_at: '2026-06-16T14:00:00.000Z' })
      const matches = [next, later]

      expect(canPredictMatch(next, matches)).toBe(true)
      expect(canPredictMatch(later, matches)).toBe(false)
    })
  })

  describe('getMatchFilterStatus', () => {
    it('maps finished and live statuses', () => {
      expect(getMatchFilterStatus(makeMatch({ status: 'finished' }))).toBe('finished')
      expect(getMatchFilterStatus(makeMatch({ status: 'live' }))).toBe('live')
    })

    it('treats locked scheduled matches as live', () => {
      vi.setSystemTime(new Date('2026-06-15T13:50:00.000Z'))
      const match = makeMatch({ kickoff_at: '2026-06-15T14:00:00.000Z' })
      expect(getMatchFilterStatus(match)).toBe('live')
    })

    it('treats open scheduled matches as upcoming', () => {
      const match = makeMatch({ kickoff_at: '2026-06-15T18:00:00.000Z' })
      expect(getMatchFilterStatus(match)).toBe('upcoming')
    })
  })

  describe('formatLockCountdown', () => {
    it('returns null after lock', () => {
      vi.setSystemTime(new Date('2026-06-15T13:50:00.000Z'))
      expect(formatLockCountdown('2026-06-15T14:00:00.000Z')).toBeNull()
    })

    it('shows minutes and seconds under one hour', () => {
      vi.setSystemTime(new Date('2026-06-15T13:30:00.000Z'))
      expect(formatLockCountdown('2026-06-15T14:00:00.000Z')).toBe('15:00')
    })

    it('detects the fifteen-minute warning window', () => {
      vi.setSystemTime(new Date('2026-06-15T13:35:00.000Z'))
      expect(isLockWarningWindow('2026-06-15T14:00:00.000Z')).toBe(true)
      expect(getMsUntilPredictionLock('2026-06-15T14:00:00.000Z')).toBe(10 * 60 * 1000)
      expect(LOCK_WARNING_MINUTES).toBe(15)
    })

    it('formatLockCountdownLive ticks with seconds under one hour', () => {
      vi.setSystemTime(new Date('2026-06-15T13:30:00.000Z'))
      expect(formatLockCountdownLive('2026-06-15T14:00:00.000Z')).toBe('15:00')
    })

    it('formatLockCountdownLive uses H:MM:SS under twenty-four hours', () => {
      vi.setSystemTime(new Date('2026-06-15T12:00:00.000Z'))
      expect(formatLockCountdownLive('2026-06-15T14:00:00.000Z')).toBe('1:45:00')
    })
  })

  describe('formatCountdown', () => {
    it('returns null after kickoff', () => {
      expect(formatCountdown('2026-06-15T11:00:00.000Z')).toBeNull()
    })

    it('formats minutes under one hour', () => {
      expect(formatCountdown('2026-06-15T12:45:00.000Z')).toBe('45m')
    })

    it('formats hours and minutes', () => {
      expect(formatCountdown('2026-06-15T15:30:00.000Z')).toBe('3h 30m')
    })

    it('formats days when more than 48 hours away', () => {
      expect(formatCountdown('2026-06-18T12:00:00.000Z')).toBe('3d 0h')
    })
  })

  describe('formatStageLabel', () => {
    it('includes group name for group stage matches', () => {
      expect(formatStageLabel('Group', 'C')).toBe('First Stage · Group C')
    })

    it('maps knockout stages', () => {
      expect(formatStageLabel('Final', null)).toBe('Final')
      expect(formatStageLabel('Semi-final', null)).toBe('Semi-finals')
    })
  })

  describe('statusLabel', () => {
    it('returns labels for match statuses', () => {
      expect(statusLabel('live')).toBe('LIVE')
      expect(statusLabel('finished')).toBe('FT')
      expect(statusLabel('postponed')).toBe('PPD')
      expect(statusLabel('scheduled')).toBe('')
    })
  })
})
