import { motion } from 'framer-motion'
import { playSound, primeAudio } from '../lib/sounds'

interface ScoreStepperProps {
  value: number
  onChange: (value: number) => void
  disabled?: boolean
  label: string
}

export function ScoreStepper({ value, onChange, disabled, label }: ScoreStepperProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      <span className="type-caption max-w-[7rem] text-center text-balance font-medium leading-tight break-words sm:max-w-[9rem]">
        {label}
      </span>
      <div className="flex items-center gap-3">
        <motion.button
          whileTap={{ scale: 0.9 }}
          type="button"
          disabled={disabled || value <= 0}
          onPointerDown={() => primeAudio()}
          onClick={() => {
            if (value > 0) playSound('goalDown')
            onChange(Math.max(0, value - 1))
          }}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-lg font-bold text-theme transition disabled:opacity-30"
        >
          −
        </motion.button>
        <motion.span
          key={value}
          initial={{ scale: 1.3, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="type-stat w-10 text-center"
        >
          {value}
        </motion.span>
        <motion.button
          whileTap={{ scale: 0.9 }}
          type="button"
          disabled={disabled || value >= 15}
          onPointerDown={() => primeAudio()}
          onClick={() => {
            if (value < 15) playSound('goalUp')
            onChange(Math.min(15, value + 1))
          }}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-lg font-bold text-theme transition disabled:opacity-30"
        >
          +
        </motion.button>
      </div>
    </div>
  )
}
