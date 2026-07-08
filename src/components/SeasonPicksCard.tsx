import { SEASON_QUESTIONS } from '../lib/seasonQuestions'
import type { SeasonAnswers } from '../lib/seasonQuestions'
import { TeamFlag } from './TeamFlag'

interface SeasonPicksCardProps {
  answers: SeasonAnswers | null | undefined
  pointsEarned?: number | null
  loading?: boolean
  onComplete?: () => void
  onEdit?: () => void
  canEdit?: boolean
  isLocked?: boolean
}

export function SeasonPicksCard({
  answers,
  pointsEarned,
  loading,
  onComplete,
  onEdit,
  canEdit = false,
  isLocked = false,
}: SeasonPicksCardProps) {
  if (loading) {
    return <div className="h-32 animate-pulse rounded-2xl bg-card" />
  }

  if (!answers || Object.keys(answers).length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-amber-500/30 bg-card/50 p-4">
        <p className="type-label">Season specials</p>
        <p className="type-caption mt-1 text-pretty">
          {isLocked
            ? 'Pre-tournament picks are locked — group stage has ended (Round of 32 started).'
            : 'Golden Boot, winner, dark horse & more — required before match predictions.'}
        </p>
        {!isLocked && onComplete && (
          <button
            type="button"
            onClick={onComplete}
            className="mt-3 w-full rounded-xl bg-simelabs py-2.5 text-sm font-semibold text-simelabs-foreground transition hover:bg-simelabs-dark"
          >
            Complete season picks
          </button>
        )}
      </div>
    )
  }

  const heart = answers.heart_team

  return (
    <div className="rounded-2xl border border-default bg-card p-4 shadow-card">
      <div className="flex items-center justify-between gap-2">
        <p className="type-label">Season specials</p>
        {pointsEarned != null && (
          <span className="rounded-full bg-simelabs/15 px-2.5 py-0.5 text-xs font-bold text-simelabs">
            +{pointsEarned} season pts
          </span>
        )}
        {pointsEarned === null && !canEdit && (
          <span className="type-caption font-medium text-muted">Settled after Final</span>
        )}
        {canEdit && (
          <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-bold text-amber-400">
            QF edit open
          </span>
        )}
      </div>

      {heart && (
        <div className="mt-3 flex items-center gap-2 rounded-xl bg-simelabs/10 px-3 py-2">
          <TeamFlag team={heart} emoji="" size="sm" />
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-simelabs">
              Your team
            </p>
            <p className="text-sm font-semibold">{heart}</p>
          </div>
        </div>
      )}

      <ul className="mt-3 space-y-2">
        {SEASON_QUESTIONS.filter((q) => q.key !== 'heart_team').map((q) => {
          const val = answers[q.key]
          if (!val) return null
          const isTeam = q.type === 'team'
          return (
            <li
              key={q.key}
              className="flex items-center justify-between gap-2 rounded-lg bg-muted/60 px-3 py-2 text-sm"
            >
              <span className="type-caption shrink-0 font-medium">
                {q.icon} {q.title}
              </span>
              <span className="flex min-w-0 items-center gap-1.5 font-medium">
                {isTeam && <TeamFlag team={val} emoji="" size="sm" />}
                <span className="truncate">{val}</span>
                {q.points > 0 && (
                  <span className="shrink-0 text-[10px] text-muted">+{q.points}</span>
                )}
              </span>
            </li>
          )
        })}
      </ul>

      {canEdit && onEdit && (
        <button
          type="button"
          onClick={onEdit}
          className="mt-3 w-full rounded-xl border border-simelabs/40 bg-simelabs/10 py-2.5 text-sm font-semibold text-simelabs transition hover:bg-simelabs/20"
        >
          Edit season picks before QF
        </button>
      )}
    </div>
  )
}
