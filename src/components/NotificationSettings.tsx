import { useEngagementPrompt } from '../hooks/useEngagementPrompt'

export function NotificationSettings() {
  const { requestNotifications, notificationsSupported, notificationsEnabled } =
    useEngagementPrompt()

  if (!notificationsSupported) return null

  return (
    <div className="rounded-xl bg-card p-4">
      <p className="type-label mb-1">🔔 Match notifications</p>
      <p className="type-caption text-pretty text-muted">
        Get alerts when picks are about to lock and when your matches finish.
      </p>
      {notificationsEnabled ? (
        <p className="mt-2 text-sm font-medium text-simelabs">Notifications enabled</p>
      ) : (
        <button
          type="button"
          onClick={() => void requestNotifications()}
          className="mt-2 rounded-lg bg-simelabs px-3 py-1.5 text-xs font-semibold text-simelabs-foreground"
        >
          Enable notifications
        </button>
      )}
    </div>
  )
}
