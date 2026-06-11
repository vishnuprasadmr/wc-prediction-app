/**
 * UI sounds via Web Audio — no asset files, works offline in PWA.
 * Uses a master bus + silent unlock so taps work after the welcome screen.
 */

export type SoundId = 'kick' | 'impact' | 'goalUp' | 'goalDown' | 'swipe' | 'select' | 'save'

const STORAGE_KEY = 'wc-sounds-enabled'

let audioContext: AudioContext | null = null
let masterGain: GainNode | null = null
let unlocked = false

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return true
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function areSoundsEnabled(): boolean {
  if (prefersReducedMotion()) return false
  if (typeof window === 'undefined') return false
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === '0') return false
  } catch {
    /* ignore */
  }
  return true
}

export function setSoundsEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY, enabled ? '1' : '0')
  } catch {
    /* ignore */
  }
}

/** Call once at app boot — keeps AudioContext unlocked on every tap. */
export function installSoundUnlock(): void {
  if (typeof document === 'undefined') return

  const unlock = () => {
    primeAudio()
  }

  document.addEventListener('pointerdown', unlock, { passive: true })
  document.addEventListener('touchstart', unlock, { passive: true })
  document.addEventListener('keydown', unlock, { passive: true })
}

/** Synchronous unlock — call inside click handlers before any await. */
export function primeAudio(): AudioContext | null {
  if (!areSoundsEnabled()) return null
  if (typeof window === 'undefined') return null

  const Ctx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctx) return null

  if (!audioContext || audioContext.state === 'closed') {
    audioContext = new Ctx()
    masterGain = null
    unlocked = false
  }

  if (!masterGain || masterGain.context !== audioContext) {
    masterGain = audioContext.createGain()
    masterGain.gain.value = 0.9
    masterGain.connect(audioContext.destination)
  }

  if (!unlocked || audioContext.state !== 'running') {
    try {
      const buffer = audioContext.createBuffer(1, 1, audioContext.sampleRate)
      const source = audioContext.createBufferSource()
      source.buffer = buffer
      source.connect(masterGain)
      source.start(0)
      unlocked = true
    } catch {
      /* ignore */
    }
    void audioContext.resume()
  }

  return audioContext
}

function getMaster(ctx: AudioContext): GainNode {
  if (!masterGain || masterGain.context !== ctx) {
    masterGain = ctx.createGain()
    masterGain.gain.value = 0.9
    masterGain.connect(ctx.destination)
  }
  return masterGain
}

function tone(
  ctx: AudioContext,
  {
    freq,
    freqEnd,
    duration,
    type = 'sine',
    gain = 0.2,
    when = 0,
  }: {
    freq: number
    freqEnd?: number
    duration: number
    type?: OscillatorType
    gain?: number
    when?: number
  },
) {
  const t0 = ctx.currentTime + when
  const osc = ctx.createOscillator()
  const amp = ctx.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t0)
  if (freqEnd !== undefined) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(freqEnd, 1), t0 + duration)
  }
  amp.gain.setValueAtTime(0.0001, t0)
  amp.gain.exponentialRampToValueAtTime(gain, t0 + 0.008)
  amp.gain.exponentialRampToValueAtTime(0.0001, t0 + duration)
  osc.connect(amp)
  amp.connect(getMaster(ctx))
  osc.start(t0)
  osc.stop(t0 + duration + 0.05)
}

function noiseBurst(ctx: AudioContext, duration: number, gain = 0.15, when = 0) {
  const t0 = ctx.currentTime + when
  const bufferSize = Math.max(1, Math.floor(ctx.sampleRate * duration))
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < bufferSize; i += 1) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize)
  }
  const source = ctx.createBufferSource()
  source.buffer = buffer
  const filter = ctx.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.value = 900
  filter.Q.value = 0.6
  const amp = ctx.createGain()
  amp.gain.setValueAtTime(gain, t0)
  amp.gain.exponentialRampToValueAtTime(0.0001, t0 + duration)
  source.connect(filter)
  filter.connect(amp)
  amp.connect(getMaster(ctx))
  source.start(t0)
  source.stop(t0 + duration + 0.05)
}

type Player = (ctx: AudioContext, when: number) => void

function playKick(ctx: AudioContext, when: number) {
  tone(ctx, { freq: 180, freqEnd: 55, duration: 0.16, type: 'sine', gain: 0.35, when })
  noiseBurst(ctx, 0.1, 0.22, when + 0.01)
  tone(ctx, { freq: 95, freqEnd: 45, duration: 0.24, type: 'triangle', gain: 0.14, when: when + 0.02 })
}

function playImpact(ctx: AudioContext, when: number) {
  noiseBurst(ctx, 0.2, 0.18, when)
  tone(ctx, { freq: 220, freqEnd: 80, duration: 0.22, type: 'sine', gain: 0.2, when })
  tone(ctx, { freq: 520, duration: 0.1, type: 'triangle', gain: 0.1, when: when + 0.04 })
}

function playGoalUp(ctx: AudioContext, when: number) {
  tone(ctx, { freq: 440, freqEnd: 880, duration: 0.1, type: 'sine', gain: 0.28, when })
  tone(ctx, { freq: 1100, duration: 0.08, type: 'triangle', gain: 0.14, when: when + 0.06 })
  noiseBurst(ctx, 0.04, 0.06, when + 0.02)
}

function playGoalDown(ctx: AudioContext, when: number) {
  tone(ctx, { freq: 360, freqEnd: 220, duration: 0.09, type: 'sine', gain: 0.2, when })
}

function playSwipe(ctx: AudioContext, when: number) {
  const duration = 0.16
  const t0 = ctx.currentTime + when
  const bufferSize = Math.max(1, Math.floor(ctx.sampleRate * duration))
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < bufferSize; i += 1) {
    data[i] = Math.random() * 2 - 1
  }
  const source = ctx.createBufferSource()
  source.buffer = buffer
  const filter = ctx.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.setValueAtTime(320, t0)
  filter.frequency.exponentialRampToValueAtTime(2800, t0 + duration)
  filter.Q.value = 1
  const amp = ctx.createGain()
  amp.gain.setValueAtTime(0.0001, t0)
  amp.gain.linearRampToValueAtTime(0.22, t0 + 0.015)
  amp.gain.exponentialRampToValueAtTime(0.0001, t0 + duration)
  source.connect(filter)
  filter.connect(amp)
  amp.connect(getMaster(ctx))
  source.start(t0)
  source.stop(t0 + duration + 0.05)
}

function playSelect(ctx: AudioContext, when: number) {
  tone(ctx, { freq: 720, freqEnd: 960, duration: 0.07, type: 'sine', gain: 0.22, when })
}

function playSave(ctx: AudioContext, when: number) {
  tone(ctx, { freq: 392, duration: 0.12, type: 'sine', gain: 0.24, when })
  tone(ctx, { freq: 523, duration: 0.14, type: 'sine', gain: 0.26, when: when + 0.1 })
  tone(ctx, { freq: 659, duration: 0.18, type: 'triangle', gain: 0.18, when: when + 0.2 })
}

const PLAYERS: Record<SoundId, Player> = {
  kick: playKick,
  impact: playImpact,
  goalUp: playGoalUp,
  goalDown: playGoalDown,
  swipe: playSwipe,
  select: playSelect,
  save: playSave,
}

/**
 * Play a UI sound. Optional `delaySec` schedules on the audio clock (use for
 * delayed effects still tied to the same user gesture, e.g. splash impact).
 */
export function playSound(id: SoundId, delaySec = 0): void {
  try {
    const ctx = primeAudio()
    if (!ctx) return
    PLAYERS[id](ctx, Math.max(0, delaySec))
  } catch {
    /* never break the app */
  }
}
