export type GameNotificationKind = 'lock' | 'result' | 'predict' | 'leaderboard' | 'meal' | 'bonus'

export interface GameNotification {
  id: string
  title: string
  body: string
  url?: string
  kind: GameNotificationKind
  action?: 'open-season-questionnaire' | 'open-season-edit'
}

type Listener = (items: GameNotification[]) => void

let items: GameNotification[] = []
const listeners = new Set<Listener>()

function emit() {
  for (const listener of listeners) listener([...items])
}

export function subscribeGameNotifications(listener: Listener): () => void {
  listeners.add(listener)
  listener([...items])
  return () => listeners.delete(listener)
}

export function pushGameNotification(notification: Omit<GameNotification, 'id'>): void {
  const id = `${notification.kind}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
  items = [{ ...notification, id }, ...items].slice(0, 3)
  emit()

  window.setTimeout(() => {
    items = items.filter((item) => item.id !== id)
    emit()
  }, 7000)
}

export function dismissGameNotification(id: string): void {
  items = items.filter((item) => item.id !== id)
  emit()
}
