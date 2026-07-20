import { useCallback, useEffect, useId, useRef, useState } from 'react'
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

/** Split stored "Card: …\nPIN: …" (or plain code) for clearer display. */
export function parseGiftCodeParts(raw: string): {
  card: string | null
  pin: string | null
  plain: string
} {
  const text = raw.trim()
  const cardMatch = text.match(/Card:\s*([^\n\r]+)/i)
  const pinMatch = text.match(/PIN:\s*([^\n\r]+)/i)
  if (cardMatch || pinMatch) {
    return {
      card: cardMatch?.[1]?.trim() || null,
      pin: pinMatch?.[1]?.trim() || null,
      plain: text,
    }
  }
  return { card: null, pin: null, plain: text }
}

export function FinaleGiftModal({ award, onClose, onRevealed }: FinaleGiftModalProps) {
  const titleId = useId()
  const loadedForId = useRef<string | null>(null)
  const onRevealedRef = useRef(onRevealed)
  onRevealedRef.current = onRevealed

  const [code, setCode] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [busy, setBusy] = useState(false)

  const loadGift = useCallback(async (awardId: string, celebrate: boolean) => {
    setBusy(true)
    setError(null)
    try {
      if (celebrate) {
        primeAudio()
        playSound('finaleParty')
        fireCelebration('podium')
      }
      const giftCode = await fetchFinaleGiftCode(awardId)
      if (!giftCode.trim()) {
        throw new Error('Gift code is empty — ask the host to re-save your prize.')
      }
      setCode(giftCode.trim())
      try {
        await markFinaleGiftRevealed(awardId)
      } catch {
        // Code is already shown; reveal stamp is best-effort.
      }
      playSound('save')
      if (celebrate) fireCelebration('exact')
      onRevealedRef.current()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not open gift')
    } finally {
      setBusy(false)
    }
  }, [])

  useEffect(() => {
    if (!award) {
      loadedForId.current = null
      setCode(null)
      setError(null)
      setCopied(false)
      setBusy(false)
      return
    }

    // Only load once per award open — parent refetch after reveal must not reset UI.
    if (loadedForId.current === award.id) return
    loadedForId.current = award.id
    setCode(null)
    setError(null)
    setCopied(false)
    void loadGift(award.id, true)
  }, [award, loadGift])

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
    const parts = parseGiftCodeParts(code)
    const lines = [
      'WC Prediction League — Zomato gift',
      title,
      formatInr(award.amount_inr),
      '',
      parts.card ? `Card: ${parts.card}` : `Code: ${parts.plain}`,
      parts.pin ? `PIN: ${parts.pin}` : null,
      '',
      'Redeem in the Zomato app (Online orders).',
    ].filter((line): line is string => line != null)
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `zomato-${award.slot_key}.txt`
    a.click()
    URL.revokeObjectURL(url)
    playSound('select')
  }

  const parts = code ? parseGiftCodeParts(code) : null

  return (
    <AnimatePresence>
      {award && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[290] flex items-end justify-center bg-black/55 p-4 pb-28 backdrop-blur-sm sm:items-center sm:pb-4"
          onClick={onClose}
          role="presentation"
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            initial={{ y: 80, scale: 0.94 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 22 }}
            className="w-full max-w-sm overflow-hidden rounded-2xl border border-simelabs/40 bg-card p-6 text-center shadow-glow"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="type-overline !text-simelabs">Your gift</p>
            <h3 id={titleId} className="type-section-title mt-1">
              {awardDisplayTitle(award)}
            </h3>
            <p className="mt-1 font-heading text-2xl font-black text-simelabs">
              {formatInr(award.amount_inr)}
            </p>

            {busy && !code && (
              <>
                <motion.div
                  className="mx-auto mt-6 h-20 w-16 rounded-md bg-gradient-to-b from-simelabs/40 to-simelabs/10 ring-1 ring-simelabs/35"
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                />
                <p className="type-caption mt-4 text-muted">Unlocking your Zomato e-gift…</p>
              </>
            )}

            {code && parts && (
              <>
                <p className="mt-5 text-sm font-semibold text-theme">Your Zomato e-gift</p>
                {parts.card ? (
                  <div className="mt-3 space-y-2 text-left">
                    <div className="rounded-xl border border-simelabs/30 bg-simelabs/10 px-3 py-3">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-muted">
                        Card number
                      </p>
                      <p className="mt-1 break-all font-mono text-base font-bold tracking-wide text-simelabs">
                        {parts.card}
                      </p>
                    </div>
                    {parts.pin && (
                      <div className="rounded-xl border border-simelabs/30 bg-simelabs/10 px-3 py-3">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-muted">
                          PIN
                        </p>
                        <p className="mt-1 break-all font-mono text-base font-bold tracking-wide text-simelabs">
                          {parts.pin}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="mt-2 break-all rounded-xl border border-simelabs/30 bg-simelabs/10 px-3 py-3 font-mono text-lg font-bold tracking-wide text-simelabs">
                    {parts.plain}
                  </p>
                )}
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => void copyCode()}
                    className="rounded-xl bg-simelabs py-2.5 text-sm font-semibold text-simelabs-foreground"
                  >
                    {copied ? 'Copied!' : 'Copy all'}
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

            {error && (
              <div className="mt-4 space-y-3">
                <p className="text-sm text-red-400">{error}</p>
                <button
                  type="button"
                  onClick={() => {
                    if (!award) return
                    void loadGift(award.id, false)
                  }}
                  disabled={busy}
                  className="w-full rounded-xl bg-simelabs py-2.5 text-sm font-semibold text-simelabs-foreground disabled:opacity-50"
                >
                  {busy ? 'Retrying…' : 'Try again'}
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
