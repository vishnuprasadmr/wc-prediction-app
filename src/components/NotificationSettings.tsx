import { useEngagementPrompt } from '../hooks/useEngagementPrompt'

export function NotificationSettings() {
  const { requestNotifications, notificationsSupported, notificationsEnabled } =
    useEngagementPrompt()

  if (!notificationsSupported) return null

  return (
    <div className="overflow-hidden rounded-xl border border-simelabs/25 bg-card">
      <div className="h-0.5 bg-gradient-to-r from-simelabs via-simelabs-light to-simelabs" />
      <div className="p-4">
        <div className="flex items-start gap-3">
          <img
            src="/pwa-192x192.png"
            alt=""
            className="h-10 w-10 shrink-0 rounded-xl ring-1 ring-simelabs/25"
          />
          <div className="min-w-0 flex-1">
            <p className="type-label mb-1">🔔 Match alerts</p>
            <p className="type-caption text-pretty text-muted">
              Simelabs-themed alerts for lock warnings, full-time scores, and your points.
            </p>
            {notificationsEnabled ? (
              <p className="mt-2 text-sm font-semibold text-simelabs">Enabled ✓</p>
            ) : (
              <button
                type="button"
                onClick={() => void requestNotifications()}
                className="mt-3 rounded-xl bg-simelabs px-4 py-2 text-xs font-semibold text-simelabs-foreground transition hover:bg-simelabs-dark"
              >
                Enable alerts
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
