import { describe, expect, it } from 'vitest'
import {
  APP_TIMEZONE,
  formatIstDateHeader,
  formatKickoffIst,
  formatKickoffTimeIst,
  toIstDateKey,
} from './timezone'

describe('timezone', () => {
  it('uses Asia/Kolkata', () => {
    expect(APP_TIMEZONE).toBe('Asia/Kolkata')
  })

  it('formats IST date keys', () => {
    expect(toIstDateKey('2026-06-15T20:30:00.000Z')).toBe('2026-06-16')
  })

  it('formats kickoff time in 24-hour IST', () => {
    expect(formatKickoffTimeIst('2026-06-15T14:00:00.000Z')).toBe('19:30')
  })

  it('appends IST to full kickoff labels', () => {
    expect(formatKickoffIst('2026-06-15T14:00:00.000Z')).toContain('IST')
  })

  it('formats fixture group headers', () => {
    expect(formatIstDateHeader('2026-06-15')).toMatch(/June/)
  })
})
