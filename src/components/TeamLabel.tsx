import { Link } from 'react-router-dom'
import { TeamFlag } from './TeamFlag'

interface TeamLabelProps {
  team: string
  emoji?: string
  flagSize?: 'xs' | 'sm' | 'md' | 'lg'
  className?: string
  nameClassName?: string
  /** Link to team squad page */
  to?: string
}

/** Flag on top, full team name below — wraps instead of truncating on narrow screens. */
export function TeamLabel({
  team,
  emoji,
  flagSize = 'md',
  className = '',
  nameClassName = '',
  to,
}: TeamLabelProps) {
  const content = (
    <>
      <TeamFlag team={team} emoji={emoji} size={flagSize} />
      <span
        className={`w-full text-center text-balance break-words text-[11px] font-semibold leading-snug text-theme sm:text-sm ${nameClassName} ${to ? 'group-hover:text-simelabs' : ''}`}
      >
        {team}
      </span>
    </>
  )

  const baseClass = `flex min-w-0 flex-1 flex-col items-center gap-1.5 px-0.5 ${className}`

  if (to) {
    return (
      <Link to={to} className={`group ${baseClass} rounded-lg transition hover:bg-muted/40`} aria-label={`${team} squad`}>
        {content}
      </Link>
    )
  }

  return <div className={baseClass}>{content}</div>
}
