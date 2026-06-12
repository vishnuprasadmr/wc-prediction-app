import { motion } from 'framer-motion'
import { getFlagUrl } from '../lib/flags'

interface TeamFlagProps {
  team: string
  emoji?: string
  size?: 'xs' | 'sm' | 'md' | 'lg'
}

const SIZES = {
  xs: 'h-4 w-4',
  sm: 'h-6 w-6',
  md: 'h-9 w-9 sm:h-10 sm:w-10',
  lg: 'h-12 w-12',
} as const

export function TeamFlag({ team, emoji, size = 'md' }: TeamFlagProps) {
  const url = getFlagUrl(team)
  const sizeClass = SIZES[size]

  if (!url) {
    return (
      <span className={`flex shrink-0 items-center justify-center text-2xl leading-none ${sizeClass}`}>
        {emoji || '🏳️'}
      </span>
    )
  }

  return (
    <motion.img
      src={url}
      alt=""
      loading="lazy"
      initial={{ scale: 0.85, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 22 }}
      className={`shrink-0 object-cover shadow-sm ring-1 ring-black/10 dark:ring-white/10 ${
        size === 'xs' ? 'rounded-[3px]' : 'rounded-md'
      } ${sizeClass}`}
    />
  )
}
