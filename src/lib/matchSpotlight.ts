export type SpotlightSurface = 'predict' | 'fixtures'

const KEYS: Record<SpotlightSurface, string> = {
  predict: 'wc-predict-spotlight-seen',
  fixtures: 'wc-fixtures-spotlight-seen',
}

export function hasSeenMatchSpotlight(surface: SpotlightSurface): boolean {
  try {
    return localStorage.getItem(KEYS[surface]) === '1'
  } catch {
    return false
  }
}

export function markMatchSpotlightSeen(surface: SpotlightSurface): void {
  try {
    localStorage.setItem(KEYS[surface], '1')
  } catch {
    /* private browsing */
  }
}
