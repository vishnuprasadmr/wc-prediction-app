import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { OracleMomentData } from '../hooks/useOracleMoment'
import { fireCelebration } from '../lib/confetti'
import { primeAudio, playSound } from '../lib/sounds'
import { useAuth } from '../contexts/AuthContext'
import { resolveUserAvatarUrl } from '../lib/avatarUrl'
import { shareWithEngagementBonus } from '../lib/engagementBonuses'
import { buildReferralUrl } from '../lib/referral'
import { shareStandingsWithImage } from '../lib/shareStandings'
import { TeamLabel } from './TeamLabel'

interface OracleMomentOverlayProps {
  moment: OracleMomentData | null
  onDismiss: () => void
  rank?: number
  totalPoints?: number
  exactScores?: number
  displayName?: string
}

export function OracleMomentOverlay({
  moment,
  onDismiss,
  rank = 0,
  totalPoints = 0,
  exactScores = 0,
  displayName = 'Player',
}: OracleMomentOverlayProps) {
  const { user, profile } = useAuth()
  const avatarUrl = profile?.avatar_url ?? resolveUserAvatarUrl(user)

  useEffect(() => {
    if (!moment) return
    primeAudio()
    playSound('goalUp')
    fireCelebration('exact')
  }, [moment])

  const handleShare = async () => {
    if (!moment) return
    const m = moment.match
    const inviteUrl = user?.id ? buildReferralUrl(user.id) : undefined
    await shareWithEngagementBonus(() =>
      shareStandingsWithImage({
        variant: 'oracle',
        displayName,
        avatarUrl,
        rank,
        totalPoints,
        exactScores,
        lastMatch: {
          home: m.home_team,
          away: m.away_team,
          score: `${m.home_score ?? 0}-${m.away_score ?? 0}`,
          points: moment.prediction.points_earned,
          homePred: moment.prediction.home_pred,
          awayPred: moment.prediction.away_pred,
          firstBonus: moment.prediction.first_bonus ?? 0,
          shootoutBonus: moment.prediction.shootout_bonus ?? 0,
        },
        inviteUrl,
      }),
    )
  }

  return (
    <AnimatePresence>
      {moment && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[300] flex items-center justify-center bg-black/75 p-4 backdrop-blur-md"
          onClick={onDismiss}
        >
          <motion.div
            initial={{ scale: 0.85, y: 24 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 26 }}
            className="w-full max-w-sm rounded-3xl border border-simelabs/40 bg-card p-6 text-center shadow-glow"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="type-overline !text-simelabs">Oracle moment</p>
            <p className="mt-2 text-4xl">🎯</p>
            <h2 className="type-section-title mt-2">Exact score!</h2>
            <p className="type-body-sm mt-2 text-muted">You called it perfectly.</p>

            <div className="mt-5 flex items-start justify-center gap-2">
              <TeamLabel team={moment.match.home_team} emoji={moment.match.home_flag} flagSize="sm" />
              <div className="shrink-0 self-center px-1">
                <p className="font-heading text-2xl font-black tabular-nums">
                  {moment.match.home_score} – {moment.match.away_score}
                </p>
                <p className="type-caption mt-1">
                  Your pick {moment.prediction.home_pred}–{moment.prediction.away_pred}
                </p>
              </div>
              <TeamLabel team={moment.match.away_team} emoji={moment.match.away_flag} flagSize="sm" />
            </div>

            <p className="mt-4 text-lg font-bold text-simelabs">
              +{moment.prediction.points_earned} pts
            </p>

            <div className="mt-6 flex gap-2">
              <button
                type="button"
                onClick={() => void handleShare()}
                className="flex-1 rounded-xl border border-simelabs/40 py-2.5 text-sm font-semibold text-simelabs"
              >
                Share
              </button>
              <button
                type="button"
                onClick={onDismiss}
                className="flex-1 rounded-xl bg-simelabs py-2.5 text-sm font-semibold text-simelabs-foreground"
              >
                Nice!
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
