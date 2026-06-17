import { pushGameNotification, type GameNotificationKind } from './gameNotificationBus'

export const NOTIFICATION_THEME = {
  brand: 'WC Predict',
  accent: '#26cb99',
  icon: '/pwa-192x192.png',
  badge: '/notification-badge.png',
} as const

const KIND_ICON: Record<GameNotificationKind, string> = {
  lock: '⏱️',
  result: '🎯',
  predict: '⚽',
  leaderboard: '🏆',
  meal: '🍽️',
}

const KIND_VIBRATE: Record<GameNotificationKind, number[]> = {
  lock: [90, 45, 90],
  result: [120, 60, 120, 60, 120],
  predict: [80, 40, 80],
  leaderboard: [100, 50, 100],
  meal: [100, 40, 100, 40, 100],
}

type SwNotificationOptions = NotificationOptions & {
  color?: string
  vibrate?: number[]
  renotify?: boolean
}

export function formatNotificationTitle(title: string, kind: GameNotificationKind): string {
  return `${KIND_ICON[kind]} ${title}`
}

function buildNotificationOptions(
  body: string,
  tag: string,
  kind: GameNotificationKind,
  url?: string,
): SwNotificationOptions {
  return {
    body,
    tag,
    icon: NOTIFICATION_THEME.icon,
    badge: NOTIFICATION_THEME.badge,
    color: NOTIFICATION_THEME.accent,
    vibrate: KIND_VIBRATE[kind],
    renotify: true,
    data: { url: url ?? '/', kind },
    silent: false,
  }
}

export interface ShowGameNotificationInput {
  title: string
  body: string
  tag: string
  kind: GameNotificationKind
  url?: string
  /** Show an in-app toast when the tab is visible (instead of a system banner). */
  whenVisible?: boolean
}

export async function showGameNotification({
  title,
  body,
  tag,
  kind,
  url,
  whenVisible = false,
}: ShowGameNotificationInput): Promise<void> {
  if (typeof window === 'undefined' || !('Notification' in window)) return
  if (Notification.permission !== 'granted') return

  const brandedTitle = formatNotificationTitle(title, kind)

  if (!document.hidden && whenVisible) {
    pushGameNotification({ title: brandedTitle, body, url, kind })
    return
  }

  if (!document.hidden) return

  const options = buildNotificationOptions(body, tag, kind, url)

  try {
    const reg = await navigator.serviceWorker?.getRegistration()
    if (reg) {
      await reg.showNotification(brandedTitle, options)
      return
    }
  } catch {
    /* fall through */
  }

  new Notification(brandedTitle, options)
}

/** @deprecated Use showGameNotification */
export async function maybeShowSystemNotification(
  title: string,
  body: string,
  tag: string,
  options?: { whenVisible?: boolean },
): Promise<void> {
  await showGameNotification({
    title,
    body,
    tag,
    kind: 'predict',
    whenVisible: options?.whenVisible,
  })
}
