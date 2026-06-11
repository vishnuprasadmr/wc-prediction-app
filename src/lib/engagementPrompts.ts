import type { Match, Prediction } from './types'
import {
  getPredictableMatches,
  formatPredictionLockTimeIst,
  formatLockCountdown,
  isLockWarningWindow,
  LOCK_WARNING_MINUTES,
} from './matchUtils'
import { addIstDays, formatKickoffTimeIst, toIstDateKey } from './timezone'

const STORAGE_KEY = 'wc-dismissed-engagement-prompts'

export type EngagementPromptKind = 'predict' | 'leaderboard'

export interface PredictPrompt {
  kind: 'predict'
  key: string
  match: Match
  dayLabel: string
  lockTime: string
  urgent: boolean
}

export interface LeaderboardPrompt {
  kind: 'leaderboard'
  key: string
  match: Match
  points: number | null
  userPrediction: string
}

export type EngagementPrompt = PredictPrompt | LeaderboardPrompt

function getDismissedKeys(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return new Set()
    const parsed = JSON.parse(raw) as string[]
    return new Set(Array.isArray(parsed) ? parsed : [])
  } catch {
    return new Set()
  }
}

export function dismissEngagementPrompt(key: string): void {
  try {
    const keys = [...getDismissedKeys(), key]
    localStorage.setItem(STORAGE_KEY, JSON.stringify(keys.slice(-120)))
  } catch {
    /* private browsing */
  }
}

export function clearEngagementDismissal(key: string): void {
  try {
    const keys = [...getDismissedKeys()].filter((k) => k !== key)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(keys))
  } catch {
    /* private browsing */
  }
}

export function getIstDayLabel(kickoffAt: string): string {
  const today = toIstDateKey(new Date().toISOString())
  const kickoffDay = toIstDateKey(kickoffAt)
  if (kickoffDay === today) return 'Today'
  if (kickoffDay === addIstDays(today, 1)) return 'Tomorrow'
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  }).format(new Date(kickoffAt))
}

function getLatestFinishedWithPrediction(
  matches: Match[],
  predictions: Record<string, Prediction>,
): { match: Match; prediction: Prediction } | null {
  const finished = matches
    .filter((m) => m.status === 'finished' && predictions[m.id])
    .sort((a, b) => new Date(b.kickoff_at).getTime() - new Date(a.kickoff_at).getTime())

  const top = finished[0]
  if (!top) return null
  return { match: top, prediction: predictions[top.id] }
}

export function resolveEngagementPrompt(input: {
  matches: Match[]
  predictions: Record<string, Prediction>
  pathname: string
}): EngagementPrompt | null {
  const { matches, predictions, pathname } = input
  const dismissed = getDismissedKeys()

  const nextMatch = getPredictableMatches(matches).find((m) => !predictions[m.id]) ?? null
  const lockWarning = nextMatch ? isLockWarningWindow(nextMatch.kickoff_at) : false
  if (
    nextMatch &&
    (pathname !== '/predict' || lockWarning)
  ) {
    const key = `predict:${nextMatch.id}`
    if (!dismissed.has(key)) {
      return {
        kind: 'predict',
        key,
        match: nextMatch,
        dayLabel: getIstDayLabel(nextMatch.kickoff_at),
        lockTime: formatPredictionLockTimeIst(nextMatch.kickoff_at),
        urgent: lockWarning,
      }
    }
  }

  const latestFinished = getLatestFinishedWithPrediction(matches, predictions)
  if (latestFinished && pathname !== '/leaderboard') {
    const { match, prediction } = latestFinished
    const key = `leaderboard:${match.id}`
    if (!dismissed.has(key)) {
      return {
        kind: 'leaderboard',
        key,
        match,
        points: prediction.points_earned,
        userPrediction: `${prediction.home_pred}-${prediction.away_pred}`,
      }
    }
  }

  return null
}

export function getPredictPromptMessage(prompt: PredictPrompt): { title: string; body: string } {
  const { home_team, away_team } = prompt.match
  const kickoffTime = formatKickoffTimeIst(prompt.match.kickoff_at)

  const lockCountdown = formatLockCountdown(prompt.match.kickoff_at)

  if (prompt.urgent) {
    return {
      title: `${LOCK_WARNING_MINUTES} minutes until lock!`,
      body: `${home_team} vs ${away_team} — ${lockCountdown ? `lock in ${lockCountdown}` : `lock closes at ${prompt.lockTime}`} IST. Make your pick now!`,
    }
  }

  if (prompt.dayLabel === 'Today') {
    return {
      title: "Today's match — did you predict?",
      body: `${home_team} vs ${away_team} is on today at ${kickoffTime} IST. Make your pick before ${prompt.lockTime}.`,
    }
  }

  return {
    title: 'Next match is coming up',
    body: `${prompt.dayLabel}: ${home_team} vs ${away_team}. Did you predict yet? Lock closes at ${prompt.lockTime} IST.`,
  }
}

export function getLeaderboardPromptMessage(prompt: LeaderboardPrompt): { title: string; body: string } {
  const { home_team, away_team, home_score, away_score } = prompt.match
  const score =
    home_score !== null && away_score !== null ? `${home_score}-${away_score}` : 'FT'

  const pointsLine =
    prompt.points !== null
      ? `You scored ${prompt.points} pts (your pick: ${prompt.userPrediction}).`
      : `Your pick was ${prompt.userPrediction}.`

  return {
    title: 'Full time! Check the table',
    body: `${home_team} ${score} ${away_team}. ${pointsLine} See where you stand on the leaderboard.`,
  }
}

export async function maybeShowSystemNotification(
  title: string,
  body: string,
  tag: string,
  options?: { whenVisible?: boolean },
): Promise<void> {
  if (typeof window === 'undefined' || !('Notification' in window)) return
  if (Notification.permission !== 'granted') return
  if (!document.hidden && !options?.whenVisible) return

  try {
    const reg = await navigator.serviceWorker?.getRegistration()
    if (reg) {
      await reg.showNotification(title, {
        body,
        tag,
        icon: '/favicon.svg',
        badge: '/favicon.svg',
      })
      return
    }
  } catch {
    /* fall through */
  }

  new Notification(title, { body, tag, icon: '/favicon.svg' })
}
