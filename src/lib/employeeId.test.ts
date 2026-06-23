import { describe, expect, it } from 'vitest'
import {
  canViewSimelabsLeaderboard,
  isSimelabsEmployee,
  validateEmployeeId,
} from './employeeId'
import type { Profile } from './types'

function profile(overrides: Partial<Profile> = {}): Profile {
  return {
    id: 'user-1',
    display_name: 'Test',
    league_id: 'league-1',
    is_admin: false,
    created_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

describe('employeeId leaderboard access', () => {
  it('accepts normalized and compact SML IDs', () => {
    expect(validateEmployeeId('SML 457').valid).toBe(true)
    expect(validateEmployeeId('SML457').valid).toBe(true)
    expect(validateEmployeeId('sml 12').valid).toBe(true)
  })

  it('treats verified employees as Simelabs members', () => {
    expect(isSimelabsEmployee(profile({ employee_id: 'SML 457' }))).toBe(true)
    expect(isSimelabsEmployee(profile({ employee_id: 'SML457' }))).toBe(true)
    expect(isSimelabsEmployee(profile({ employee_id: null }))).toBe(false)
  })

  it('lets admins view the Simelabs table without an employee ID', () => {
    expect(canViewSimelabsLeaderboard(profile({ is_admin: true }))).toBe(true)
    expect(canViewSimelabsLeaderboard(profile({ is_admin: false }))).toBe(false)
    expect(
      canViewSimelabsLeaderboard(profile({ is_admin: false, employee_id: 'SML 1' })),
    ).toBe(true)
  })
})
