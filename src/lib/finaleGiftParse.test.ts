import { describe, expect, it } from 'vitest'
import { parseGiftCodeParts } from '../components/FinaleGiftModal'

describe('parseGiftCodeParts', () => {
  it('splits Card + PIN lines', () => {
    const parts = parseGiftCodeParts('Card: 6004860043036503\nPIN: 196431')
    expect(parts.card).toBe('6004860043036503')
    expect(parts.pin).toBe('196431')
  })

  it('keeps plain codes as-is', () => {
    const parts = parseGiftCodeParts('ABC-123')
    expect(parts.card).toBeNull()
    expect(parts.pin).toBeNull()
    expect(parts.plain).toBe('ABC-123')
  })
})
