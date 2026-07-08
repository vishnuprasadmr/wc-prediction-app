import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  dismissGameNotification,
  subscribeGameNotifications,
  type GameNotification,
  type GameNotificationKind,
} from '../lib/gameNotificationBus'
import { useSeasonQuestionnaireContextOptional } from '../contexts/SeasonQuestionnaireContext'
import { NOTIFICATION_THEME } from '../lib/notificationTheme'
import { playSound, primeAudio } from '../lib/sounds'

const KIND_STYLES: Record<
  GameNotificationKind,
  { border: string; glow: string; bar: string }
> = {
  lock: {
    border: 'border-amber-500/40',
    glow: 'shadow-[0_8px_32px_rgb(0_0_0/0.25),0_0_20px_rgb(245_158_11/0.2)]',
    bar: 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500',
  },
  result: {
    border: 'border-simelabs/45',
    glow: 'shadow-[0_8px_32px_rgb(0_0_0/0.25),0_0_24px_rgb(38_203_153/0.22)]',
    bar: 'bg-gradient-to-r from-simelabs via-simelabs-light to-simelabs',
  },
  predict: {
    border: 'border-simelabs/35',
    glow: 'shadow-[0_8px_32px_rgb(0_0_0/0.25),0_0_20px_rgb(38_203_153/0.18)]',
    bar: 'bg-gradient-to-r from-simelabs via-simelabs-light to-simelabs',
  },
  leaderboard: {
    border: 'border-amber-400/35',
    glow: 'shadow-[0_8px_32px_rgb(0_0_0/0.25),0_0_20px_rgb(251_191_36/0.18)]',
    bar: 'bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400',
  },
  meal: {
    border: 'border-[#E23744]/40',
    glow: 'shadow-[0_8px_32px_rgb(0_0_0/0.25),0_0_20px_rgb(226_55_68/0.22)]',
    bar: 'bg-gradient-to-r from-[#E23744] via-[#ff6b6b] to-[#E23744]',
  },
  bonus: {
    border: 'border-emerald-500/40',
    glow: 'shadow-[0_8px_32px_rgb(0_0_0/0.25),0_0_20px_rgb(16_185_129/0.22)]',
    bar: 'bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-500',
  },
}

function ToastCard({
  item,
  onOpen,
  onDismiss,
}: {
  item: GameNotification
  onOpen: () => void
  onDismiss: () => void
}) {
  const styles = KIND_STYLES[item.kind]

  return (
    <motion.div
      role="button"
      tabIndex={0}
      layout
      initial={{ y: -24, opacity: 0, scale: 0.96 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      exit={{ y: -16, opacity: 0, scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 420, damping: 30 }}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onOpen()
        }
      }}
      className={`w-full cursor-pointer overflow-hidden rounded-2xl border bg-card text-left ${styles.border} ${styles.glow}`}
    >
      <div className="flex items-start gap-3 p-3.5">
        <img
          src={NOTIFICATION_THEME.icon}
          alt=""
          className="h-11 w-11 shrink-0 rounded-xl ring-1 ring-simelabs/25"
        />
        <div className="min-w-0 flex-1">
          <p className="type-overline !text-[10px] !text-simelabs">{NOTIFICATION_THEME.brand}</p>
          <p className="mt-0.5 text-sm font-semibold leading-snug text-theme text-balance">
            {item.title}
          </p>
          <p className="type-caption mt-1 text-pretty leading-relaxed text-muted">{item.body}</p>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onDismiss()
          }}
          aria-label="Dismiss"
          className="shrink-0 rounded-lg px-1.5 py-0.5 text-muted transition hover:bg-muted hover:text-theme"
        >
          ✕
        </button>
      </div>
      <div className={`h-0.5 ${styles.bar}`} />
    </motion.div>
  )
}

export function GameNotificationHost() {
  const navigate = useNavigate()
  const season = useSeasonQuestionnaireContextOptional()
  const [items, setItems] = useState<GameNotification[]>([])
  const prevCountRef = useRef(0)

  useEffect(() => subscribeGameNotifications(setItems), [])

  useEffect(() => {
    if (items.length > prevCountRef.current) {
      primeAudio()
      playSound('select')
    }
    prevCountRef.current = items.length
  }, [items.length])

  const open = (item: GameNotification) => {
    dismissGameNotification(item.id)
    if (item.action === 'open-season-questionnaire') {
      season?.openQuestionnaire()
      return
    }
    if (item.action === 'open-season-edit') {
      season?.openSeasonEdit()
      return
    }
    if (item.url) navigate(item.url)
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 top-[calc(0.75rem+env(safe-area-inset-top))] z-[240] px-3">
      <div className="pointer-events-auto mx-auto flex max-w-lg flex-col gap-2">
        <AnimatePresence mode="popLayout">
          {items.map((item) => (
            <ToastCard
              key={item.id}
              item={item}
              onOpen={() => open(item)}
              onDismiss={() => dismissGameNotification(item.id)}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
