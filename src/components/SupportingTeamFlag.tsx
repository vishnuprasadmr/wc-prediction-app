import { TeamFlag } from './TeamFlag'

interface SupportingTeamFlagProps {
  team: string | null | undefined
  /** Pin on avatar corner vs inline chip beside a name */
  variant?: 'avatar' | 'inline'
  className?: string
}

/** Heart-team flag from the season questionnaire — subtle Simelabs styling */
export function SupportingTeamFlag({
  team,
  variant = 'inline',
  className = '',
}: SupportingTeamFlagProps) {
  if (!team) return null

  if (variant === 'avatar') {
    return (
      <span
        className={`absolute -bottom-0.5 -left-1 z-10 flex h-[1.125rem] w-[1.125rem] items-center justify-center overflow-hidden rounded-[4px] bg-card/95 ring-1 ring-simelabs/30 shadow-sm backdrop-blur-sm sm:h-5 sm:w-5 ${className}`}
        title={`Backing ${team}`}
        aria-label={`Backing ${team}`}
      >
        <TeamFlag team={team} size="xs" />
      </span>
    )
  }

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-[4px] bg-simelabs/8 p-0.5 ring-1 ring-simelabs/15 ${className}`}
      title={`Backing ${team}`}
      aria-label={`Backing ${team}`}
    >
      <TeamFlag team={team} size="xs" />
    </span>
  )
}
