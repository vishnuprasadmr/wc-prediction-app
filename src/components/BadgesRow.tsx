import { motion } from 'framer-motion'
import type { Badge } from '../lib/badges'

export function BadgesRow({ badges }: { badges: Badge[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {badges.map((b, i) => (
        <motion.span
          key={b.id}
          initial={b.earned ? { scale: 0.85, opacity: 0 } : false}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: b.earned ? i * 0.05 : 0, type: 'spring', stiffness: 400 }}
          title={b.label}
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
            b.earned
              ? 'bg-simelabs/15 text-simelabs ring-1 ring-simelabs/30'
              : 'bg-muted text-muted opacity-60'
          }`}
        >
          <span>{b.icon}</span>
          <span>{b.label}</span>
        </motion.span>
      ))}
    </div>
  )
}
