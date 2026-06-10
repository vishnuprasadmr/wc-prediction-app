import fixturesData from '../data/wc2026-fixtures.json'
import type { Match } from './types'

const venueByApiId = new Map(
  fixturesData.map((f) => [f.api_fixture_id, f.venue_city as string]),
)

const STADIUM_LABEL: Record<string, string> = {
  'Mexico City': 'Mexico City Stadium',
  Guadalajara: 'Guadalajara Stadium',
  Toronto: 'Toronto Stadium',
  'Los Angeles': 'Los Angeles Stadium',
  Boston: 'Boston Stadium',
  Vancouver: 'Vancouver Stadium',
  'New York/New Jersey': 'New York/New Jersey Stadium',
  'San Francisco Bay Area': 'San Francisco Bay Area Stadium',
  Philadelphia: 'Philadelphia Stadium',
  Houston: 'Houston Stadium',
  Dallas: 'Dallas Stadium',
  Monterrey: 'Monterrey Stadium',
  Miami: 'Miami Stadium',
  Atlanta: 'Atlanta Stadium',
  Seattle: 'Seattle Stadium',
  'Kansas City': 'Kansas City Stadium',
}

export function getMatchVenueCity(match: Match): string | null {
  if (match.api_fixture_id) {
    return venueByApiId.get(match.api_fixture_id) ?? null
  }
  return null
}

export function formatVenueLabel(city: string): string {
  const stadium = STADIUM_LABEL[city] ?? `${city} Stadium`
  return `${stadium} (${city})`
}
