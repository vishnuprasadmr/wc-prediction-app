import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'

type IconProps = { className?: string }

function FixturesIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden>
      <rect x="3" y="4" width="18" height="17" rx="2.5" />
      <path d="M3 9h18M8 2.5v3M16 2.5v3" strokeLinecap="round" />
      <circle cx="8" cy="14" r="1.25" fill="currentColor" stroke="none" />
      <circle cx="12" cy="14" r="1.25" fill="currentColor" stroke="none" />
      <circle cx="16" cy="14" r="1.25" fill="currentColor" stroke="none" />
      <circle cx="8" cy="17.5" r="1.25" fill="currentColor" stroke="none" />
      <circle cx="12" cy="17.5" r="1.25" fill="currentColor" stroke="none" />
    </svg>
  )
}

function PredictIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="1.25" fill="currentColor" stroke="none" />
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2" strokeLinecap="round" />
    </svg>
  )
}

function LeaderboardIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden>
      <path d="M7 21V10M12 21V4M17 21v-7" strokeLinecap="round" />
      <path d="M4 21h16" strokeLinecap="round" />
      <path d="M5 10l2-3 2 1.5L12 6l3 2.5 2-1.5 2 3" strokeLinejoin="round" />
    </svg>
  )
}

function ProfileIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden>
      <circle cx="12" cy="8" r="4" />
      <path d="M5 20.5c1.2-3.5 4-5.5 7-5.5s5.8 2 7 5.5" strokeLinecap="round" />
    </svg>
  )
}

const links = [
  { to: '/', label: 'Fixtures', ariaLabel: 'Fixtures', Icon: FixturesIcon },
  { to: '/predict', label: 'Predict', ariaLabel: 'Predict scores', Icon: PredictIcon },
  { to: '/leaderboard', label: 'Table', ariaLabel: 'Leaderboard', Icon: LeaderboardIcon },
  { to: '/profile', label: 'Profile', ariaLabel: 'Profile', Icon: ProfileIcon },
] as const

export function BottomNav() {
  return (
    <nav
      aria-label="Main navigation"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-50 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1.5"
    >
      <div className="pointer-events-auto mx-auto flex max-w-lg items-stretch gap-0.5 rounded-2xl border border-default bg-card/98 p-1 shadow-[0_-4px_24px_rgb(0_0_0/0.18),0_8px_32px_rgb(38_203_153/0.12)] backdrop-blur-xl dark:shadow-[0_-4px_28px_rgb(0_0_0/0.55),0_0_0_1px_rgb(38_203_153/0.08),0_8px_32px_rgb(38_203_153/0.1)]">
        {links.map(({ to, label, ariaLabel, Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            aria-label={ariaLabel}
            title={label}
            className="relative flex min-h-[46px] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-0.5 py-1 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-simelabs/50"
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.div
                    layoutId="bottom-nav-pill"
                    className="absolute inset-0 rounded-xl bg-simelabs/14 ring-1 ring-simelabs/35 dark:bg-simelabs/18"
                    transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                    aria-hidden
                  />
                )}
                <Icon
                  className={`relative z-10 h-[18px] w-[18px] shrink-0 transition-colors ${
                    isActive ? 'text-simelabs' : 'text-theme/55 dark:text-white/50'
                  }`}
                />
                <span
                  aria-hidden
                  className={`relative z-10 max-w-full truncate text-[10px] font-medium leading-none tracking-tight transition-colors ${
                    isActive ? 'text-simelabs' : 'text-theme/55 dark:text-white/50'
                  }`}
                >
                  {label}
                </span>
                {isActive && (
                  <motion.span
                    layoutId="bottom-nav-dot"
                    className="absolute bottom-1 left-1/2 z-10 h-0.5 w-0.5 -translate-x-1/2 rounded-full bg-simelabs"
                    transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                    aria-hidden
                  />
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
