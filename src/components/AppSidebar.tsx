import { NavLink } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useLockDrama } from '../hooks/useLockDrama'
import { useUnseenMealBetCount } from '../hooks/useMealBetNotifications'
import { useAuth } from '../contexts/AuthContext'
import { useLeaguePrizes } from '../hooks/useLeaguePrizes'
import { NAV_SECTIONS, type NavItem } from '../lib/navItems'
import { primeAudio } from '../lib/sounds'

interface AppSidebarProps {
  mobileOpen: boolean
  onClose: () => void
}

function NavItemLink({
  item,
  urgentCount,
  mealBetCount,
  onNavigate,
  compact,
}: {
  item: NavItem
  urgentCount: number
  mealBetCount: number
  onNavigate?: () => void
  compact?: boolean
}) {
  const showPredictUrgent = item.urgentKey === 'predict' && urgentCount > 0
  const showMealBadge = item.urgentKey === 'meals' && mealBetCount > 0
  const badgeCount = showPredictUrgent ? urgentCount : showMealBadge ? mealBetCount : 0
  const showBadge = badgeCount > 0

  return (
    <NavLink
      to={item.to}
      end={item.end}
      aria-label={item.ariaLabel}
      title={item.label}
      onClick={() => {
        if (item.to === '/leaderboard') primeAudio()
        onNavigate?.()
      }}
      className={({ isActive }) =>
        `group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-simelabs/50 ${
          isActive
            ? 'bg-simelabs/15 text-simelabs ring-1 ring-simelabs/30'
            : 'text-muted hover:bg-muted hover:text-theme'
        }`
      }
    >
      {({ isActive }) => (
        <>
          {showBadge && (
            <span
              className={`absolute right-2 top-2 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold text-white ${
                showMealBadge ? 'bg-[#E23744]' : 'bg-red-500'
              }`}
            >
              {badgeCount}
            </span>
          )}
          <item.Icon
            className={`h-[18px] w-[18px] shrink-0 ${isActive ? 'text-simelabs' : 'text-theme/55'}`}
          />
          {!compact && <span className="truncate">{item.label}</span>}
        </>
      )}
    </NavLink>
  )
}

function SidebarPanel({
  onNavigate,
  className = '',
}: {
  onNavigate?: () => void
  className?: string
}) {
  const { profile } = useAuth()
  const { urgentUnpickedCount } = useLockDrama()
  const unseenMealBets = useUnseenMealBetCount()
  const { published: prizesPublished } = useLeaguePrizes()
  const isAdmin = Boolean(profile?.is_admin)

  return (
    <aside className={`flex h-full flex-col ${className}`}>
      <div className="border-b border-default px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-simelabs to-simelabs-dark text-sm font-bold text-simelabs-foreground shadow-glow-sm">
            WC
          </div>
          <div className="min-w-0">
            <p className="type-page-title leading-tight">
              <span className="text-simelabs">Simelabs</span>{' '}
              <span className="text-theme">WC 26</span>
            </p>
            <p className="type-caption text-muted">Prediction League</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Sidebar">
        {NAV_SECTIONS.map((section) => {
          const items = section.items.filter((item) => {
            if (item.adminOnly && !isAdmin) return false
            if (item.prizesGated && !prizesPublished && !isAdmin) return false
            return true
          })
          if (items.length === 0) return null

          return (
            <div key={section.title} className="mb-5 last:mb-0">
              <p className="type-overline mb-2 px-3 !text-[10px] text-muted">{section.title}</p>
              <ul className="space-y-1">
                {items.map((item) => (
                  <li key={item.to}>
                    <NavItemLink
                      item={item}
                      urgentCount={urgentUnpickedCount}
                      mealBetCount={unseenMealBets}
                      onNavigate={onNavigate}
                    />
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </nav>

      <div className="border-t border-default px-4 py-3">
        <p className="type-caption text-center text-muted">All kickoffs · IST</p>
      </div>
    </aside>
  )
}

export function AppSidebar({ mobileOpen, onClose }: AppSidebarProps) {
  return (
    <>
      {/* Desktop sidebar */}
      <div className="page-content hidden w-60 shrink-0 border-r border-default bg-elevated/95 backdrop-blur-md lg:flex lg:flex-col">
        <SidebarPanel className="sticky top-0 h-dvh" />
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.button
              type="button"
              aria-label="Close menu"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] bg-black/55 backdrop-blur-sm lg:hidden"
              onClick={onClose}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 380, damping: 36 }}
              className="page-content fixed inset-y-0 left-0 z-[70] w-[min(18rem,88vw)] border-r border-default bg-elevated shadow-2xl lg:hidden"
            >
              <SidebarPanel onNavigate={onClose} className="h-full" />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
