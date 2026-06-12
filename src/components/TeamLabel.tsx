import { TeamFlag } from './TeamFlag'

interface TeamLabelProps {
  team: string
  emoji?: string
  flagSize?: 'xs' | 'sm' | 'md' | 'lg'
  className?: string
  nameClassName?: string
}

/** Flag on top, full team name below — wraps instead of truncating on narrow screens. */
export function TeamLabel({
  team,
  emoji,
  flagSize = 'md',
  className = '',
  nameClassName = '',
}: TeamLabelProps) {
  return (
    <div className={`flex min-w-0 flex-1 flex-col items-center gap-1.5 px-0.5 ${className}`}>
      <TeamFlag team={team} emoji={emoji} size={flagSize} />
      <span
        className={`w-full text-center text-balance break-words text-[11px] font-semibold leading-snug text-theme sm:text-sm ${nameClassName}`}
      >
        {team}
      </span>
    </div>
  )
}
