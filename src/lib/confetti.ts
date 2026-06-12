import confetti from 'canvas-confetti'

export function fireCelebration(kind: 'exact' | 'podium' | 'rankUp' = 'exact'): void {
  const colors = ['#22c55e', '#16a34a', '#86efac', '#ffffff']
  const base = { colors, disableForReducedMotion: true }

  if (kind === 'podium') {
    void confetti({ ...base, particleCount: 80, spread: 100, origin: { y: 0.65 } })
    return
  }

  if (kind === 'rankUp') {
    void confetti({ ...base, particleCount: 50, spread: 70, origin: { y: 0.7 } })
    return
  }

  void confetti({ ...base, particleCount: 60, spread: 80, origin: { y: 0.6 } })
}
