/** Fixed share-card palette — always dark Simelabs WC theme (not user light/dark mode). */
export const SHARE_IMAGE = {
  width: 1080,
  height: 1080,
  colors: {
    bg: '#000000',
    panel: '#0d0d0d',
    panelBorder: 'rgba(38, 203, 153, 0.35)',
    accent: '#26cb99',
    accentDark: '#009688',
    accentGlow: 'rgba(38, 203, 153, 0.22)',
    gold: '#fbbf24',
    goldGlow: 'rgba(251, 191, 36, 0.25)',
    text: '#ffffff',
    textMuted: '#a0b0a8',
    textSubtle: '#d0e8e0',
    chipBg: '#161616',
  },
  fonts: {
    heading: '700 52px "Plus Jakarta Sans", Inter, system-ui, sans-serif',
    headingSm: '700 36px "Plus Jakarta Sans", Inter, system-ui, sans-serif',
    score: '800 88px "Plus Jakarta Sans", Inter, system-ui, sans-serif',
    label: '600 24px Inter, system-ui, sans-serif',
    caption: '500 22px Inter, system-ui, sans-serif',
    overline: '700 26px Inter, system-ui, sans-serif',
    stat: '800 56px "Plus Jakarta Sans", Inter, system-ui, sans-serif',
    name: '700 40px "Plus Jakarta Sans", Inter, system-ui, sans-serif',
  },
  brand: {
    line1: 'SIMELABS',
    line2: 'WC PREDICT 26',
  },
  footer: 'Join the league · Predict every match',
  qr: {
    src: '/share-qr.png',
    size: 132,
    label: 'Scan to join',
  },
} as const

export type ShareImageVariant = 'standings' | 'match-result' | 'oracle'

export const VARIANT_HEADLINE: Record<ShareImageVariant, string> = {
  standings: 'MY STANDINGS',
  'match-result': 'FULL TIME',
  oracle: 'EXACT SCORE',
}
