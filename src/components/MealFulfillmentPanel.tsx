import { useRef, useState } from 'react'
import type { MealChallengeView } from '../hooks/useMealChallenges'
import { canPostMealFulfillment, uploadMealFulfillmentPhoto } from '../lib/mealFulfillment'
import {
  buildMealFulfillmentShare,
  shareMealFulfillmentWithImage,
} from '../lib/shareMealChallenge'
import { shareResultMessage } from '../lib/shareStandings'
import { playSound, primeAudio } from '../lib/sounds'

export function MealFulfillmentPanel({
  challenge,
  userId,
  onPosted,
}: {
  challenge: MealChallengeView
  userId: string
  onPosted: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [sharing, setSharing] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    challenge.fulfillment_photo_url,
  )

  if (!canPostMealFulfillment(challenge, userId)) return null

  const acceptorsWon = challenge.acceptances.filter((a) => (a.points_delta ?? 0) > 0)
  const owedLine =
    challenge.winner_name != null
      ? `You owe ${challenge.winner_name} the meal — `
      : acceptorsWon.length > 0
        ? `${acceptorsWon.length} colleague(s) won the point bet — `
        : 'Your claim did not hold — '

  const handleFile = async (file: File | null) => {
    if (!file) return
    setBusy(true)
    setMessage(null)

    const localPreview = URL.createObjectURL(file)
    setPreviewUrl(localPreview)

    const result = await uploadMealFulfillmentPhoto(challenge.id, userId, file)
    setBusy(false)

    if (!result.ok) {
      setMessage(result.message)
      setPreviewUrl(challenge.fulfillment_photo_url)
      URL.revokeObjectURL(localPreview)
      return
    }

    setPreviewUrl(result.publicUrl)
    setMessage('Photo saved! Share your proof card below.')
    onPosted()
  }

  const handleShare = async () => {
    setSharing(true)
    primeAudio()
    setMessage(null)

    const updated = { ...challenge, fulfillment_photo_url: previewUrl }
    const result = await shareMealFulfillmentWithImage(updated)
    if (result.ok) playSound('save')
    setMessage(shareResultMessage(result, 'Could not share meal card'))
    setSharing(false)
  }

  const sharePreview = buildMealFulfillmentShare({
    ...challenge,
    fulfillment_photo_url: previewUrl,
  })

  return (
    <div className="mt-3 space-y-3 rounded-xl border border-[#E23744]/30 bg-[#E23744]/5 p-3">
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-[#E23744]">Pay up &amp; share</p>
        <p className="mt-1 text-[11px] text-pretty text-muted">
          {owedLine}snap a photo of the meal you bought and post the card to the group.
        </p>
      </div>

      {previewUrl && (
        <img
          src={previewUrl}
          alt="Meal you bought for the bet"
          className="max-h-48 w-full rounded-xl object-cover ring-1 ring-default"
        />
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0] ?? null
          void handleFile(file)
          e.target.value = ''
        }}
      />

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className="flex-1 rounded-lg border border-[#E23744]/40 bg-card py-2 text-xs font-semibold text-theme disabled:opacity-50"
        >
          {busy ? 'Uploading…' : previewUrl ? 'Retake photo' : '📷 Add meal photo'}
        </button>
        <button
          type="button"
          disabled={sharing || !sharePreview}
          onClick={() => void handleShare()}
          className="flex-1 rounded-lg bg-[#E23744] py-2 text-xs font-bold text-white disabled:opacity-50"
        >
          {sharing ? 'Creating…' : '📤 Share proof card'}
        </button>
      </div>

      {message && <p className="text-center text-[11px] text-simelabs">{message}</p>}
    </div>
  )
}
