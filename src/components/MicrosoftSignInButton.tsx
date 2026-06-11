import { motion } from 'framer-motion'

interface MicrosoftSignInButtonProps {
  onClick: () => void
  disabled?: boolean
  loading?: boolean
  label?: string
}

export function MicrosoftSignInButton({
  onClick,
  disabled,
  loading,
  label = 'Continue with Microsoft',
}: MicrosoftSignInButtonProps) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      disabled={disabled || loading}
      className="flex w-full items-center justify-center gap-3 rounded-xl border border-default bg-card py-3.5 text-sm font-semibold text-theme shadow-card transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
      aria-label={label}
    >
      <svg className="h-5 w-5 shrink-0" viewBox="0 0 21 21" aria-hidden>
        <rect x="1" y="1" width="9" height="9" fill="#f25022" />
        <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
        <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
        <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
      </svg>
      <span>{loading ? 'Redirecting…' : label}</span>
    </motion.button>
  )
}

export function AuthDivider() {
  return (
    <div className="relative my-5">
      <div className="absolute inset-0 flex items-center" aria-hidden>
        <div className="w-full border-t border-default" />
      </div>
      <p className="relative mx-auto w-fit bg-page px-3 type-caption font-medium">or</p>
    </div>
  )
}
