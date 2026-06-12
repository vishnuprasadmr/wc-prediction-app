import { describe, expect, it } from 'vitest'
import { shouldShowSplash, SPLASH_COOLDOWN_MS } from './splash'

describe('shouldShowSplash', () => {
  it('shows on first visit', () => {
    expect(shouldShowSplash(1_000_000)).toBe(true)
  })

  it('hides within cooldown window', () => {
    const now = 5_000_000
    localStorage.setItem('wc-splash-at', String(now - SPLASH_COOLDOWN_MS + 60_000))
    expect(shouldShowSplash(now)).toBe(false)
    localStorage.removeItem('wc-splash-at')
  })

  it('shows again after cooldown', () => {
    const now = 5_000_000
    localStorage.setItem('wc-splash-at', String(now - SPLASH_COOLDOWN_MS - 1))
    expect(shouldShowSplash(now)).toBe(true)
    localStorage.removeItem('wc-splash-at')
  })
})
