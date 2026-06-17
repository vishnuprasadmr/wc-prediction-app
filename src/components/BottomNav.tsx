import { createPortal } from 'react-dom'
import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useLockDrama } from '../hooks/useLockDrama'
import { MOBILE_NAV_ITEMS } from '../lib/navItems'
import { primeAudio } from '../lib/sounds'

interface BottomNavProps {
  onOpenMenu?: () => void
}

function MoreIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden>
      <circle cx="6" cy="12" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="18" cy="12" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function BottomNav({ onOpenMenu }: BottomNavProps) {
  const { urgentUnpickedCount } = useLockDrama()

  return createPortal(
    <nav
      aria-label="Main navigation"
      className="bottom-nav-shell pointer-events-none fixed inset-x-0 bottom-0 z-50 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1.5"
    >
      <div className="pointer-events-auto mx-auto flex max-w-lg items-stretch gap-0.5 rounded-2xl border border-default bg-card/98 p-1 shadow-[0_-4px_24px_rgb(0_0_0/0.18),0_8px_32px_rgb(38_203_153/0.12)] backdrop-blur-xl dark:shadow-[0_-4px_28px_rgb(0_0_0/0.55),0_0_0_1px_rgb(38_203_153/0.08),0_8px_32px_rgb(38_203_153/0.1)]">
        {MOBILE_NAV_ITEMS.map(({ to, label, ariaLabel, Icon, end, urgentKey }) => {
          const showUrgent = urgentKey === 'predict' && urgentUnpickedCount > 0

          return (
            <NavLink
              key={to}
              to={to}
              end={end}
              aria-label={ariaLabel}
              title={label}
              onClick={() => {
                if (to === '/leaderboard') primeAudio()
              }}
              className="relative flex min-h-[46px] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-0.5 py-1 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-simelabs/50"
            >
              {({ isActive }) => (
                <>
                  {showUrgent && (
                    <motion.span
                      animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
                      transition={{ duration: 1.2, repeat: Infinity }}
                      className="absolute right-2 top-1 z-20 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white"
                    >
                      {urgentUnpickedCount}
                    </motion.span>
                  )}
                  {isActive && (
                    <motion.div
                      layoutId="bottom-nav-pill"
                      className={`absolute inset-0 rounded-xl ring-1 ${
                        showUrgent
                          ? 'bg-red-500/10 ring-red-500/40'
                          : 'bg-simelabs/14 ring-simelabs/35 dark:bg-simelabs/18'
                      }`}
                      transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                      aria-hidden
                    />
                  )}
                  <Icon
                    className={`relative z-10 h-[18px] w-[18px] shrink-0 transition-colors ${
                      isActive || showUrgent ? 'text-simelabs' : 'text-theme/55 dark:text-white/50'
                    }`}
                  />
                  <span
                    aria-hidden
                    className={`relative z-10 max-w-full truncate text-[10px] font-medium leading-none tracking-tight transition-colors ${
                      isActive || showUrgent ? 'text-simelabs' : 'text-theme/55 dark:text-white/50'
                    }`}
                  >
                    {label}
                  </span>
                </>
              )}
            </NavLink>
          )
        })}

        <button
          type="button"
          aria-label="More navigation"
          title="More"
          onClick={onOpenMenu}
          className="relative flex min-h-[46px] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-0.5 py-1 text-theme/55 outline-none transition-colors hover:text-simelabs focus-visible:ring-2 focus-visible:ring-simelabs/50 dark:text-white/50"
        >
          <MoreIcon className="h-[18px] w-[18px] shrink-0" />
          <span className="text-[10px] font-medium leading-none">More</span>
        </button>
      </div>
    </nav>,
    document.body,
  )
}
