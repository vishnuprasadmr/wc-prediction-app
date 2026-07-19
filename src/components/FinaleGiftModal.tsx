import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  fetchFinaleGiftCode,
  markFinaleGiftRevealed,
} from '../hooks/useFinaleParty'
import { fireCelebration } from '../lib/confetti'
import {
  awardDisplayTitle,
  type FinalePrizeAwardPublic,
} from '../lib/finaleParty'
import { formatInr } from '../lib/prizes'
import { playSound, primeAudio } from '../lib/sounds'

interface FinaleGiftModalProps {
  award: FinalePrizeAwardPublic | null
  onClose: () => void
  onRevealed: () => void
}

export function FinaleGiftModal({ award, onClose, onRevealed }: FinaleGiftModalProps) {
  const [phase, setPhase] = useState<'closed' | 'opening' | 'code'>('closed')
  const [code, setCode] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!award) {
      setPhase('closed')
      setCode(null)
      setError(null)
      setCopied(false)
      return
    }
    setPhase('opening')
    primeAudio()
    playSound('finaleParty')
    fireCelebration('podium')
  }, [award])

  const openGift = async () => {
    if (!award || busy) return
    setBusy(true)
    setError(null)
    try {
      const giftCode = await fetchFinaleGiftCode(award.id)
      setCode(giftCode)
      await markFinaleGiftRevealed(award.id)
      setPhase('code')
      playSound('save')
      fireCelebration('exact')
      onRevealed()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not open gift')
    } finally {
      setBusy(false)
    }
  }

  const copyCode = async () => {
    if (!code) return
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      playSound('select')
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setError('Could not copy — long-press the code instead.')
    }
  }

  const downloadCard = () => {
    if (!award || !code) return
    const title = awardDisplayTitle(award)
    const lines = [
      'WC Prediction League — Zomato gift',
      title,
      formatInr(award.amount_inr),
      '',
      `Code: ${code}`,
      '',
      'Redeem in the Zomato app.',
    ]
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `zomato-${award.slot_key}.txt`
    a.click()
    URL.revokeObjectURL(url)
    playSound('select')
  }

  return (
    <AnimatePresence>
      {award && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[290] flex items-end justify-center bg-black/55 p-4 pb-28 backdrop-blur-sm sm:items-center sm:pb-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 80, scale: 0.94 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 22 }}
            className="w-full max-w-sm overflow-hidden rounded-2xl border border-simelabs/40 bg-card p-6 text-center shadow-glow"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="type-overline !text-simelabs">Your gift</p>
            <h3 className="type-section-title mt-1">{awardDisplayTitle(award)}</h3>
            <p className="mt-1 font-heading text-2xl font-black text-simelabs">
              {formatInr(award.amount_inr)}
            </p>

            {phase === 'opening' && (
              <>
                <motion.div
                  className="mx-auto mt-6 flex h-24 w-24 items-center justify-center rounded-2xl bg-simelabs/15 text-5xl ring-2 ring-simelabs/35"
                  animate={{ rotate: [0, -6, 6, 0], scale: [1, 1.05, 1] }}
                  transition={{ duration: 1.4, repeat: Infinity }}
                >
                  🎁
                </motion.div>
                <p className="type-caption mt-4 text-muted">
                  A Zomato e-gift card is waiting inside.
                </p>
                <button
                  type="button"
                  onClick={() => void openGift()}
                  disabled={busy}
                  className="mt-5 w-full rounded-xl bg-simelabs py-2.5 text-sm font-semibold text-simelabs-foreground disabled:opacity-50"
                >
                  {busy ? 'Opening…' : 'Open gift'}
                </button>
              </>
            )}

            {phase === 'code' && code && (
              <>
                <p className="mt-5 text-sm font-semibold text-theme">Your Zomato code</p>
                <p className="mt-2 break-all rounded-xl border border-simelabs/30 bg-simelabs/10 px-3 py-3 font-mono text-lg font-bold tracking-wide text-simelabs">
                  {code}
                </p>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => void copyCode()}
                    className="rounded-xl bg-simelabs py-2.5 text-sm font-semibold text-simelabs-foreground"
                  >
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                  <button
                    type="button"
                    onClick={downloadCard}
                    className="rounded-xl border border-default py-2.5 text-sm font-semibold"
                  >
                    Download
                  </button>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="mt-3 w-full text-sm font-medium text-muted hover:text-theme"
                >
                  Done
                </button>
              </>
            )}

            {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
