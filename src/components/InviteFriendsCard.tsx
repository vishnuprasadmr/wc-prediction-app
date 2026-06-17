import { useState } from 'react'
import { buildReferralUrl, MAX_REFERRAL_BONUSES } from '../lib/referral'
import { ENGAGEMENT_BONUS_RULES } from '../lib/engagementBonuses'

export function InviteFriendsCard({ userId }: { userId: string }) {
  const inviteUrl = buildReferralUrl(userId)
  const [status, setStatus] = useState<string | null>(null)

  const handleCopy = async () => {
    setStatus(null)
    try {
      await navigator.clipboard.writeText(inviteUrl)
      setStatus('Link copied!')
    } catch {
      setStatus('Could not copy — select the link below')
    }
    window.setTimeout(() => setStatus(null), 2500)
  }

  return (
    <div className="rounded-2xl border border-simelabs/25 bg-card p-4 shadow-card">
      <h3 className="type-section-title">Invite teammates</h3>
      <p className="type-body-sm mt-1 text-muted text-pretty">
        Share your link — when they sign up and make their first prediction, you earn{' '}
        <span className="font-semibold text-simelabs">+1 pt</span> (up to{' '}
        {MAX_REFERRAL_BONUSES} invites).
      </p>

      <div className="mt-3 space-y-2">
        {ENGAGEMENT_BONUS_RULES.map((rule) => (
          <div
            key={rule.label}
            className="flex items-center justify-between rounded-xl bg-muted/60 px-3 py-2 text-sm"
          >
            <span className="text-subtle">{rule.label}</span>
            <span className="font-semibold text-simelabs">{rule.points}</span>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => void handleCopy()}
        className="btn-primary mt-4 w-full"
      >
        Copy invite link
      </button>

      <p className="type-caption mt-2 break-all text-muted">{inviteUrl}</p>
      {status && <p className="type-caption mt-2 text-simelabs">{status}</p>}
    </div>
  )
}
