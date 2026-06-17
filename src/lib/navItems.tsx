import type { ReactNode } from 'react'

export type NavIconProps = { className?: string }

function FixturesIcon({ className }: NavIconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden>
      <rect x="3" y="4" width="18" height="17" rx="2.5" />
      <path d="M3 9h18M8 2.5v3M16 2.5v3" strokeLinecap="round" />
      <circle cx="8" cy="14" r="1.25" fill="currentColor" stroke="none" />
      <circle cx="12" cy="14" r="1.25" fill="currentColor" stroke="none" />
      <circle cx="16" cy="14" r="1.25" fill="currentColor" stroke="none" />
    </svg>
  )
}

function PredictIcon({ className }: NavIconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="1.25" fill="currentColor" stroke="none" />
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2" strokeLinecap="round" />
    </svg>
  )
}

function GroupsIcon({ className }: NavIconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden>
      <rect x="3" y="3" width="8" height="8" rx="1.5" />
      <rect x="13" y="3" width="8" height="8" rx="1.5" />
      <rect x="3" y="13" width="8" height="8" rx="1.5" />
      <rect x="13" y="13" width="8" height="8" rx="1.5" />
    </svg>
  )
}

function ResultsIcon({ className }: NavIconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden>
      <path d="M4 6h16M4 12h10M4 18h14" strokeLinecap="round" />
      <path d="M18 10l2 2-4 4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function TeamsIcon({ className }: NavIconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <circle cx="8" cy="10" r="2" />
      <circle cx="16" cy="8" r="2" />
      <circle cx="12" cy="14" r="2" />
      <path d="M2 12h20" strokeOpacity="0.35" />
    </svg>
  )
}

function LeaderboardIcon({ className }: NavIconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden>
      <path d="M7 21V10M12 21V4M17 21v-7" strokeLinecap="round" />
      <path d="M4 21h16" strokeLinecap="round" />
      <path d="M5 10l2-3 2 1.5L12 6l3 2.5 2-1.5 2 3" strokeLinejoin="round" />
    </svg>
  )
}

function ProfileIcon({ className }: NavIconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden>
      <circle cx="12" cy="8" r="4" />
      <path d="M5 20.5c1.2-3.5 4-5.5 7-5.5s5.8 2 7 5.5" strokeLinecap="round" />
    </svg>
  )
}

function WidgetIcon({ className }: NavIconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden>
      <rect x="5" y="2" width="14" height="20" rx="2.5" />
      <path d="M9 18h6" strokeLinecap="round" />
    </svg>
  )
}

function AdminIcon({ className }: NavIconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v2M12 20v-2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h-2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" strokeLinecap="round" />
    </svg>
  )
}

function PrizesIcon({ className }: NavIconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden>
      <path d="M8 21h8M12 17v4M7 4h10l1 4H6l1-4z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 8h6v5a3 3 0 01-6 0V8z" strokeLinejoin="round" />
    </svg>
  )
}

function MealBetsIcon({ className }: NavIconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden>
      <path d="M12 3c-2 2-4 4.5-4 7a4 4 0 108 0c0-2.5-2-5-4-7z" strokeLinejoin="round" />
      <path d="M8 21h8M10 18h4" strokeLinecap="round" />
    </svg>
  )
}

export interface NavItem {
  to: string
  label: string
  ariaLabel: string
  Icon: (props: NavIconProps) => ReactNode
  end?: boolean
  urgentKey?: 'predict'
  adminOnly?: boolean
  /** Shown to players only when prize page is published; admins always see it */
  prizesGated?: boolean
}

export interface NavSection {
  title: string
  items: NavItem[]
}

export const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Play',
    items: [
      { to: '/', label: 'Fixtures', ariaLabel: 'Fixtures', Icon: FixturesIcon, end: true },
      { to: '/predict', label: 'Predict', ariaLabel: 'Predict scores', Icon: PredictIcon, urgentKey: 'predict' },
      { to: '/meals', label: 'Meal bets', ariaLabel: 'Meal challenges', Icon: MealBetsIcon },
    ],
  },
  {
    title: 'Tournament',
    items: [
      { to: '/groups', label: 'Groups', ariaLabel: 'Group standings', Icon: GroupsIcon },
      { to: '/results', label: 'Results', ariaLabel: 'Match results', Icon: ResultsIcon },
      { to: '/teams', label: 'Teams', ariaLabel: 'Team squads and formations', Icon: TeamsIcon },
      { to: '/leaderboard', label: 'Point table', ariaLabel: 'Leaderboard', Icon: LeaderboardIcon },
      { to: '/prizes', label: 'Prizes', ariaLabel: 'Prize pool', Icon: PrizesIcon, prizesGated: true },
    ],
  },
  {
    title: 'You',
    items: [
      { to: '/profile', label: 'Profile', ariaLabel: 'Profile', Icon: ProfileIcon },
      { to: '/widget', label: 'Home widget', ariaLabel: 'Home screen widget', Icon: WidgetIcon },
      { to: '/admin', label: 'Admin', ariaLabel: 'Admin panel', Icon: AdminIcon, adminOnly: true },
    ],
  },
]

export const MOBILE_NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Fixtures', ariaLabel: 'Fixtures', Icon: FixturesIcon, end: true },
  { to: '/predict', label: 'Predict', ariaLabel: 'Predict scores', Icon: PredictIcon, urgentKey: 'predict' },
  { to: '/leaderboard', label: 'Table', ariaLabel: 'Leaderboard', Icon: LeaderboardIcon },
  { to: '/profile', label: 'Profile', ariaLabel: 'Profile', Icon: ProfileIcon },
]
