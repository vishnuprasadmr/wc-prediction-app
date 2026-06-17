import { describe, expect, it } from 'vitest'
import { buildCaptainSpotlight, getTeamCaptain } from './captainSpotlight'

describe('captainSpotlight', () => {
  it('returns known captain for Argentina', () => {
    const captain = getTeamCaptain('Argentina')
    expect(captain?.name).toBe('Lionel Messi')
  })

  it('falls back to jersey #10 for teams without explicit captain map', () => {
    const captain = getTeamCaptain('Japan')
    expect(captain?.number).toBe(10)
  })

  it('builds spotlight with team name', () => {
    const spotlight = buildCaptainSpotlight('England')
    expect(spotlight?.name).toBe('Harry Kane')
    expect(spotlight?.teamName).toBe('England')
  })
})
