import { describe, expect, it } from 'vitest'
import {
  buildReferralUrl,
  captureReferralFromUrl,
  consumeStoredReferral,
  isReferralUserId,
  peekStoredReferral,
} from './referral'
import { combineShareStatus } from './engagementBonuses'

describe('referral', () => {
  const userId = 'a1b2c3d4-e5f6-4789-a012-3456789abcde'

  beforeEach(() => {
    localStorage.clear()
  })

  it('validates referral user ids', () => {
    expect(isReferralUserId(userId)).toBe(true)
    expect(isReferralUserId('not-a-uuid')).toBe(false)
  })

  it('captures and consumes referral from url', () => {
    captureReferralFromUrl(`?ref=${userId}`)
    expect(peekStoredReferral()).toBe(userId)
    expect(consumeStoredReferral()).toBe(userId)
    expect(peekStoredReferral()).toBeNull()
  })

  it('builds register links with ref param', () => {
    expect(buildReferralUrl(userId)).toContain(`/register?ref=${userId}`)
  })
})

describe('combineShareStatus', () => {
  it('appends bonus message when share and claim succeed', () => {
    const text = combineShareStatus(
      { ok: true, method: 'native' },
      { ok: true, points: 1 },
      'Shared!',
    )
    expect(text).toContain('Shared!')
    expect(text).toContain('+1 pt')
  })

  it('keeps base message when bonus already claimed', () => {
    const text = combineShareStatus(
      { ok: true, method: 'download' },
      { ok: false, already_claimed: true },
      'Downloaded!',
    )
    expect(text).toBe('Downloaded!')
  })
})
