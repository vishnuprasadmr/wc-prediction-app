import { motion } from 'framer-motion'
import {
  assignPlayersToFormation,
  FORMATION_LABELS,
  playerDisplayName,
  ROLE_COLORS,
  type FormationCode,
  type SquadPlayerRef,
} from '../lib/formations'

interface FormationPitchProps {
  formation: FormationCode
  players: SquadPlayerRef[]
  teamName?: string
}

export function FormationPitch({ formation, players, teamName }: FormationPitchProps) {
  const assignments = assignPlayersToFormation(formation, players)

  return (
    <div className="overflow-hidden rounded-2xl border border-default bg-card shadow-card">
      <div className="flex items-center justify-between border-b border-default px-4 py-2.5">
        <p className="type-label text-simelabs">Formation</p>
        <span className="rounded-full bg-simelabs/12 px-2.5 py-0.5 text-[11px] font-bold text-simelabs">
          {FORMATION_LABELS[formation]}
        </span>
      </div>

      <div className="relative aspect-[3/4] w-full max-h-[520px] sm:aspect-[4/5]">
        <svg
          viewBox="0 0 100 100"
          className="h-full w-full"
          role="img"
          aria-label={teamName ? `${teamName} formation ${formation}` : `Formation ${formation}`}
        >
          <defs>
            <linearGradient id="pitch-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#1a6b3c" />
              <stop offset="50%" stopColor="#1e7a45" />
              <stop offset="100%" stopColor="#1a6b3c" />
            </linearGradient>
            <pattern id="pitch-stripes" width="10" height="100" patternUnits="userSpaceOnUse">
              <rect width="5" height="100" fill="rgba(255,255,255,0.04)" />
            </pattern>
          </defs>

          <rect width="100" height="100" fill="url(#pitch-gradient)" />
          <rect width="100" height="100" fill="url(#pitch-stripes)" />

          {/* Outer boundary */}
          <rect
            x="4"
            y="4"
            width="92"
            height="92"
            fill="none"
            stroke="rgba(255,255,255,0.55)"
            strokeWidth="0.35"
          />
          {/* Halfway */}
          <line x1="4" y1="50" x2="96" y2="50" stroke="rgba(255,255,255,0.45)" strokeWidth="0.3" />
          <circle cx="50" cy="50" r="8" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="0.3" />
          <circle cx="50" cy="50" r="0.6" fill="rgba(255,255,255,0.6)" />

          {/* Penalty areas */}
          <rect
            x="22"
            y="4"
            width="56"
            height="14"
            fill="none"
            stroke="rgba(255,255,255,0.4)"
            strokeWidth="0.3"
          />
          <rect
            x="22"
            y="82"
            width="56"
            height="14"
            fill="none"
            stroke="rgba(255,255,255,0.4)"
            strokeWidth="0.3"
          />
          {/* Six-yard boxes */}
          <rect
            x="34"
            y="4"
            width="32"
            height="6"
            fill="none"
            stroke="rgba(255,255,255,0.35)"
            strokeWidth="0.25"
          />
          <rect
            x="34"
            y="90"
            width="32"
            height="6"
            fill="none"
            stroke="rgba(255,255,255,0.35)"
            strokeWidth="0.25"
          />

          {/* Attack direction */}
          <text x="50" y="2.5" textAnchor="middle" fill="rgba(255,255,255,0.35)" fontSize="2.2" fontWeight="600">
            ATTACK ↑
          </text>

          {assignments.map(({ slot, player }, index) => (
            <PitchNode key={slot.id} slot={slot} player={player} index={index} />
          ))}
        </svg>
      </div>
    </div>
  )
}

function PitchNode({
  slot,
  player,
  index,
}: {
  slot: { x: number; y: number; label: string; role: keyof typeof ROLE_COLORS }
  player: SquadPlayerRef | null
  index: number
}) {
  const color = ROLE_COLORS[slot.role]
  const label = player ? playerDisplayName(player.name) : slot.label
  const number = player?.number

  return (
    <motion.g
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.04, type: 'spring', stiffness: 380, damping: 24 }}
    >
      <circle
        cx={slot.x}
        cy={slot.y}
        r="4.2"
        fill={color}
        stroke="rgba(0,0,0,0.35)"
        strokeWidth="0.25"
      />
      {number != null && (
        <text
          x={slot.x}
          y={slot.y + 0.9}
          textAnchor="middle"
          fill="#fff"
          fontSize="2.6"
          fontWeight="700"
        >
          {number}
        </text>
      )}
      <text
        x={slot.x}
        y={slot.y + 7.2}
        textAnchor="middle"
        fill="rgba(255,255,255,0.95)"
        fontSize="2.1"
        fontWeight="600"
      >
        {label.length > 11 ? `${label.slice(0, 10)}…` : label}
      </text>
      {!player && (
        <text
          x={slot.x}
          y={slot.y + 0.9}
          textAnchor="middle"
          fill="rgba(255,255,255,0.85)"
          fontSize="2"
          fontWeight="600"
        >
          {slot.label}
        </text>
      )}
    </motion.g>
  )
}
