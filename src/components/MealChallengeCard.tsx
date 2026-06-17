import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import type { MealChallengeView } from '../hooks/useMealChallenges'
import {
  acceptorBetLine,
  mealChallengeWinLabel,
  mealClaimOutcomeLabel,
} from '../lib/mealChallenges'
import { formatKickoffIst } from '../lib/timezone'
import { formatPredictionLockTimeIst, isMatchLocked } from '../lib/matchUtils'
import { MealChallengeAcceptancesDetail } from './MealChallengeAcceptancesDetail'
import { LockCountdown } from './LockCountdown'
import { LeaderboardAvatar } from './LeaderboardAvatar'

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-400/15 text-amber-300',
  approved: 'bg-simelabs/15 text-simelabs',
  rejected: 'bg-red-500/15 text-red-400',
  settled: 'bg-emerald-500/15 text-emerald-400',
  cancelled: 'bg-muted text-muted',
}

export function MealChallengeCard({
  challenge,
  showCreator = true,
  detailed = false,
  actions,
}: {
  challenge: MealChallengeView
  showCreator?: boolean
  detailed?: boolean
  actions?: ReactNode
}) {
  const match = challenge.match
  const claimLabel = mealClaimOutcomeLabel(challenge.backed_outcome, match)
  const locked = match ? isMatchLocked(match) : false

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-default bg-card p-4 shadow-card"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <span
          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${STATUS_STYLES[challenge.status] ?? STATUS_STYLES.pending}`}
        >
          {challenge.status}
        </span>
        <div className="flex flex-wrap justify-end gap-1.5">
          <span className="rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-semibold text-theme">
            {claimLabel}
          </span>
          <span className="text-[10px] font-semibold uppercase text-muted">
            {mealChallengeWinLabel(challenge.win_condition)}
          </span>
        </div>
      </div>

      {match && (
        <p className="mt-3 text-sm font-semibold text-theme">
          {match.home_team} vs {match.away_team}
          <span className="ml-2 font-normal text-muted">{formatKickoffIst(match.kickoff_at)}</span>
        </p>
      )}

      <p className="mt-3 text-base font-bold leading-snug text-theme">
        “{challenge.claim_text}”
      </p>
      <p className="mt-2 text-sm text-pretty text-muted">
        Or else: <span className="font-semibold text-theme">{challenge.stake_text}</span>
      </p>

      {challenge.status === 'approved' && match && (
        <div className="mt-3">
          {locked ? (
            <p className="text-xs font-medium text-muted">
              Point bets locked · closed at {formatPredictionLockTimeIst(match.kickoff_at)} IST
            </p>
          ) : (
            <>
              <LockCountdown kickoffAt={match.kickoff_at} variant="chip" />
              <p className="mt-1 text-[10px] text-muted">
                Locks with predictions · {formatPredictionLockTimeIst(match.kickoff_at)} IST
              </p>
            </>
          )}
        </div>
      )}

      {challenge.status === 'approved' &&
        (detailed ? (
          <MealChallengeAcceptancesDetail
            acceptances={challenge.acceptances}
            totalPointsStaked={challenge.total_points_staked}
            backedOutcome={challenge.backed_outcome}
            match={match}
          />
        ) : (
          challenge.acceptances.length > 0 && (
            <div className="mt-3 rounded-xl border border-default bg-muted/40 px-3 py-2">
              <p className="text-[10px] font-bold uppercase tracking-wide text-muted">
                Point bets ({challenge.total_points_staked} pts on the line)
              </p>
              <ul className="mt-1.5 space-y-1.5">
                {challenge.acceptances.map((a) => (
                  <li key={a.id} className="text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-theme">{a.display_name}</span>
                      <span className="shrink-0 font-semibold text-amber-300">
                        {a.points_staked} pts
                      </span>
                    </div>
                    <p className="mt-0.5 text-[11px] text-pretty text-muted">
                      {acceptorBetLine({
                        backedOutcome: challenge.backed_outcome,
                        match,
                        homePred: a.home_pred,
                        awayPred: a.away_pred,
                      })}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          )
        ))}

      {challenge.status === 'settled' && detailed && challenge.acceptances.length > 0 && (
        <MealChallengeAcceptancesDetail
          acceptances={challenge.acceptances}
          totalPointsStaked={challenge.total_points_staked}
          backedOutcome={challenge.backed_outcome}
          match={match}
          showEmpty={false}
        />
      )}

      {challenge.status === 'settled' && (
        <div className="mt-4 space-y-2">
          <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-sm">
            {challenge.winner_name ? (
              <>
                🍽️ <span className="font-semibold">{challenge.winner_name}</span> wins the meal
              </>
            ) : (
              <span className="text-muted">{challenge.winner_note ?? 'No meal winner'}</span>
            )}
          </div>
          {challenge.acceptances.length > 0 && !detailed && (
            <div className="rounded-xl border border-default bg-muted/30 px-3 py-2 text-xs">
              <p className="font-semibold text-theme">Point results</p>
              <ul className="mt-1 space-y-0.5 text-muted">
                {challenge.acceptances.map((a) => (
                  <li key={a.id}>
                    <span className="font-medium text-theme">{a.display_name}</span>
                    {': '}
                    <span className={a.points_delta && a.points_delta > 0 ? 'text-emerald-400' : 'text-red-400'}>
                      {a.points_delta && a.points_delta > 0 ? '+' : ''}
                      {a.points_delta ?? 0} pts
                    </span>
                    <span className="block text-[10px] text-muted">
                      {acceptorBetLine({
                        backedOutcome: challenge.backed_outcome,
                        match,
                        homePred: a.home_pred,
                        awayPred: a.away_pred,
                      })}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {showCreator && (
        <div className="mt-4 flex items-center gap-2">
          <LeaderboardAvatar name={challenge.creator_name} size="sm" />
          <p className="text-xs text-muted">
            Proposed by <span className="font-medium text-theme">{challenge.creator_name}</span>
          </p>
        </div>
      )}

      {challenge.status === 'rejected' && challenge.reject_reason && (
        <p className="mt-3 text-xs text-red-400">Admin: {challenge.reject_reason}</p>
      )}

      {actions && <div className="mt-4 flex flex-wrap gap-2">{actions}</div>}
    </motion.article>
  )
}
