import type { MealChallengeAcceptanceView } from '../hooks/useMealChallenges'
import { acceptorBetLine, type MealClaimOutcome } from '../lib/mealChallenges'
import type { Match } from '../lib/types'
import { formatKickoffTimeIst } from '../lib/timezone'
import { LeaderboardAvatar } from './LeaderboardAvatar'

const STATUS_LABEL: Record<string, string> = {
  active: 'Open',
  won: 'Won pts',
  lost: 'Lost pts',
}

export function MealChallengeAcceptancesDetail({
  acceptances,
  totalPointsStaked,
  backedOutcome,
  match,
  showEmpty = true,
}: {
  acceptances: MealChallengeAcceptanceView[]
  totalPointsStaked: number
  backedOutcome?: MealClaimOutcome
  match?: Pick<Match, 'home_team' | 'away_team'>
  showEmpty?: boolean
}) {
  if (acceptances.length === 0) {
    if (!showEmpty) return null
    return (
      <p className="mt-3 rounded-xl border border-dashed border-default bg-muted/20 px-3 py-2 text-xs text-muted">
        No point bets yet — waiting for someone to accept.
      </p>
    )
  }

  return (
    <div className="mt-3 overflow-hidden rounded-xl border border-default bg-muted/30">
      <div className="flex items-center justify-between border-b border-default px-3 py-2">
        <p className="text-[10px] font-bold uppercase tracking-wide text-muted">
          Who bet ({acceptances.length})
        </p>
        <p className="text-xs font-semibold text-amber-300">{totalPointsStaked} pts total</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[320px] text-left text-xs">
          <thead>
            <tr className="border-b border-default/60 text-muted">
              <th className="px-3 py-2 font-medium">Player</th>
              <th className="px-3 py-2 font-medium">Stake</th>
              {backedOutcome && <th className="px-3 py-2 font-medium">Pick · bet</th>}
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium">Accepted</th>
              <th className="px-3 py-2 text-right font-medium">Result</th>
            </tr>
          </thead>
          <tbody>
            {acceptances.map((a) => (
              <tr key={a.id} className="border-b border-default/40 last:border-0">
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <LeaderboardAvatar name={a.display_name} size="sm" />
                    <span className="font-medium text-theme">{a.display_name}</span>
                  </div>
                </td>
                <td className="px-3 py-2 font-semibold text-amber-300">{a.points_staked} pts</td>
                {backedOutcome && (
                  <td className="max-w-[140px] px-3 py-2 text-muted">
                    {acceptorBetLine({
                      backedOutcome,
                      match,
                      homePred: a.home_pred,
                      awayPred: a.away_pred,
                    })}
                  </td>
                )}
                <td className="px-3 py-2 text-muted">{STATUS_LABEL[a.status] ?? a.status}</td>
                <td className="px-3 py-2 text-muted">
                  {formatKickoffTimeIst(a.created_at)} IST
                </td>
                <td className="px-3 py-2 text-right font-semibold">
                  {a.points_delta !== null ? (
                    <span className={a.points_delta >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                      {a.points_delta > 0 ? '+' : ''}
                      {a.points_delta}
                    </span>
                  ) : (
                    <span className="text-muted">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
