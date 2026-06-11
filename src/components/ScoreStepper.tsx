import { motion } from 'framer-motion'
import { TruncatedText } from './TruncatedText'

interface ScoreStepperProps {
  value: number
  onChange: (value: number) => void
  disabled?: boolean
  label: string
}

export function ScoreStepper({ value, onChange, disabled, label }: ScoreStepperProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      <TruncatedText
        text={label}
        className="type-caption max-w-[5.5rem] text-center font-medium"
      />
      <div className="flex items-center gap-3">
        <motion.button
          whileTap={{ scale: 0.9 }}
          type="button"
          disabled={disabled || value <= 0}
          onClick={() => onChange(Math.max(0, value - 1))}
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
          onClick={() => onChange(Math.min(15, value + 1))}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-lg font-bold text-theme transition disabled:opacity-30"
        >
          +
        </motion.button>
      </div>
    </div>
  )
}
