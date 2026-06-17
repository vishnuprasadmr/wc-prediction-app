import { useMemo, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { resolveUserAvatarUrl } from '../lib/avatarUrl'
import { shareWithEngagementBonus } from '../lib/engagementBonuses'
import { buildReferralUrl } from '../lib/referral'
import { useLeaderboard } from '../hooks/useLeaderboard'
import { shareStandingsWithImage } from '../lib/shareStandings'
import { isExactScorePoints } from '../lib/scoring'
import type { Match, Prediction } from '../lib/types'
import { playSound, primeAudio } from '../lib/sounds'

export function ShareMatchButton({ match, prediction }: { match: Match; prediction: Prediction }) {
  const { user, profile } = useAuth()
  const avatarUrl = profile?.avatar_url ?? resolveUserAvatarUrl(user)
  const { entries } = useLeaderboard()
  const [sharing, setSharing] = useState(false)

  const myEntry = useMemo(
    () => entries.find((e) => e.user_id === profile?.id),
    [entries, profile?.id],
  )

  const handleShare = async () => {
    if (prediction.points_earned === null) return
    setSharing(true)
    primeAudio()

    const exact = isExactScorePoints(prediction.points_earned, prediction.first_bonus ?? 0)
    const inviteUrl = user?.id ? buildReferralUrl(user.id) : undefined
    const { share: result } = await shareWithEngagementBonus(() =>
      shareStandingsWithImage({
        variant: exact ? 'oracle' : 'match-result',
        displayName: profile?.display_name ?? 'Player',
        avatarUrl,
        rank: myEntry?.rank ?? 0,
        totalPoints: myEntry?.total_points ?? 0,
        exactScores: myEntry?.exact_scores ?? 0,
        lastMatch: {
          home: match.home_team,
          away: match.away_team,
          score: `${match.home_score ?? 0}-${match.away_score ?? 0}`,
          points: prediction.points_earned,
          homePred: prediction.home_pred,
          awayPred: prediction.away_pred,
          firstBonus: prediction.first_bonus ?? 0,
        },
        inviteUrl,
      }),
    )

    if (result.ok) playSound('save')
    setSharing(false)
  }

  return (
    <button
      type="button"
      disabled={sharing}
      onClick={() => void handleShare()}
      className="text-xs font-semibold text-simelabs transition hover:text-simelabs-light disabled:opacity-50"
    >
      {sharing ? 'Creating…' : '📤 Share result'}
    </button>
  )
}
