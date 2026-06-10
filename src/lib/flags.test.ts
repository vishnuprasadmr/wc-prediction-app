import { describe, expect, it } from 'vitest'
import { getFifaCountryCode, getFlagUrl } from './flags'

describe('flags', () => {
  it('maps known teams to FIFA codes', () => {
    expect(getFifaCountryCode('Brazil')).toBe('BRA')
    expect(getFifaCountryCode('England')).toBe('ENG')
    expect(getFifaCountryCode('USA')).toBe('USA')
  })

  it('returns null for unknown teams', () => {
    expect(getFifaCountryCode('Atlantis')).toBeNull()
  })

  it('builds local flag URLs', () => {
    expect(getFlagUrl('Argentina')).toBe('/flags/ARG.png')
    expect(getFlagUrl('Unknown')).toBeNull()
  })
})
