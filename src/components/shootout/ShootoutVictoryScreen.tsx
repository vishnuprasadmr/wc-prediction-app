import { motion } from 'framer-motion'
import { LeaderboardAvatar } from '../LeaderboardAvatar'
import type { ShootoutChallengeView } from '../../hooks/useShootoutChallenges'
import { defeatLine, victoryTaunt } from '../../lib/shootout/banter'
import { heroShort } from '../../lib/shootout/hero'
import { downloadShootoutVictoryImage, shareShootoutVictoryWithImage } from '../../lib/shareShootoutVictory'
import { buildShootoutVictoryInput } from '../../lib/shareShootoutVictory'

interface ShootoutVictoryScreenProps {
  challenge: ShootoutChallengeView
  userId: string
  onClose: () => void
}

export function ShootoutVictoryScreen({ challenge, userId, onClose }: ShootoutVictoryScreenProps) {
  const won = challenge.winner_id === userId
  const winnerId = challenge.winner_id
  const winnerName =
    winnerId === challenge.challenger_id ? challenge.challenger_name : challenge.opponent_name
  const loserName =
    winnerId === challenge.challenger_id ? challenge.opponent_name : challenge.challenger_name
  const winnerAvatar =
    winnerId === challenge.challenger_id ? challenge.challenger_avatar : challenge.opponent_avatar
  const loserAvatar =
    winnerId === challenge.challenger_id ? challenge.opponent_avatar : challenge.challenger_avatar
  const winnerHero =
    winnerId === challenge.challenger_id ? challenge.challenger_hero : challenge.opponent_hero
  const loserHero =
    winnerId === challenge.challenger_id ? challenge.opponent_hero : challenge.challenger_hero

  const shareInput = buildShootoutVictoryInput(challenge)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[270] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md"
    >
      <motion.div
        initial={{ scale: 0.85, y: 40 }}
        animate={{ scale: 1, y: 0 }}
        className={`w-full max-w-md rounded-3xl border p-6 text-center ${
          won
            ? 'border-simelabs/50 bg-gradient-to-b from-simelabs/25 via-card to-card'
            : 'border-default bg-card'
        }`}
      >
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted">Arena result</p>

        <motion.div
          animate={won ? { scale: [1, 1.05, 1] } : { opacity: [1, 0.85, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="mt-4"
        >
          <LeaderboardAvatar
            name={winnerName}
            avatarUrl={winnerAvatar}
            size="xl"
            ringClassName={won ? 'ring-4 ring-simelabs' : 'ring-2 ring-muted'}
          />
        </motion.div>

        <h2 className="mt-3 text-2xl font-black text-theme">{won ? 'You won!' : 'You lost'}</h2>
        <p className="mt-1 text-lg font-bold tabular-nums text-simelabs">
          {challenge.challenger_score} – {challenge.opponent_score}
        </p>
        <p className="mt-2 text-sm font-semibold">{winnerName}</p>
        <p className="text-xs text-muted">{heroShort(winnerHero)}</p>
        <p className="mt-2 text-sm italic text-muted">
          {won ? victoryTaunt(winnerName) : defeatLine()}
        </p>

        <div className="mt-4 flex items-center justify-center gap-3 opacity-70">
          <LeaderboardAvatar name={loserName} avatarUrl={loserAvatar} size="sm" />
          <span className="text-xs text-muted">{loserName} · {heroShort(loserHero)}</span>
        </div>

        <div className="mt-6 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => void shareShootoutVictoryWithImage(shareInput)}
            className="rounded-xl bg-simelabs py-3 text-sm font-semibold text-simelabs-foreground"
          >
            Share victory poster
          </button>
          <button
            type="button"
            onClick={() => void downloadShootoutVictoryImage(shareInput)}
            className="rounded-xl border border-default py-3 text-sm font-medium"
          >
            Download PNG
          </button>
          <button type="button" onClick={onClose} className="rounded-xl py-2 text-sm text-muted">
            Back to Arena
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
