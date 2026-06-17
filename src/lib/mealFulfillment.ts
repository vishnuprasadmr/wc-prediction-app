import type { MealChallenge } from './mealChallenges'
import { isClaimCorrect } from './mealChallenges'
import type { Match } from './types'
import { supabase } from './supabase'

export interface MealFulfillmentChallenge extends MealChallenge {
  creator_id: string
  creator_name: string
  winner_name?: string | null
  match?: Match
  acceptances: { display_name: string; points_delta: number | null }[]
  total_points_staked: number
}

const BUCKET = 'meal-fulfillment'
const MAX_BYTES = 5 * 1024 * 1024

export function resolveClaimCorrect(
  challenge: Pick<MealChallenge, 'claim_correct' | 'backed_outcome' | 'status'>,
  match?: Match,
): boolean | null {
  if (challenge.claim_correct !== null && challenge.claim_correct !== undefined) {
    return challenge.claim_correct
  }
  if (challenge.status !== 'settled' || !match) return null
  return isClaimCorrect(match, challenge.backed_outcome)
}

export function creatorOwesMealFulfillment(
  challenge: Pick<MealChallenge, 'status' | 'claim_correct' | 'backed_outcome'>,
  match?: Match,
): boolean {
  if (challenge.status !== 'settled') return false
  const correct = resolveClaimCorrect(challenge, match)
  return correct === false
}

export function canPostMealFulfillment(
  challenge: MealFulfillmentChallenge,
  userId?: string,
): boolean {
  if (!userId || challenge.creator_id !== userId) return false
  return creatorOwesMealFulfillment(challenge, challenge.match)
}

function extensionForFile(file: File): string {
  const type = file.type.toLowerCase()
  if (type.includes('png')) return 'png'
  if (type.includes('webp')) return 'webp'
  return 'jpg'
}

export async function uploadMealFulfillmentPhoto(
  challengeId: string,
  userId: string,
  file: File,
): Promise<{ ok: true; publicUrl: string } | { ok: false; message: string }> {
  if (!file.type.startsWith('image/')) {
    return { ok: false, message: 'Please choose a photo' }
  }
  if (file.size > MAX_BYTES) {
    return { ok: false, message: 'Photo must be under 5 MB' }
  }

  const path = `${userId}/${challengeId}.${extensionForFile(file)}`
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type || 'image/jpeg' })

  if (uploadError) {
    return { ok: false, message: uploadError.message }
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  if (!data.publicUrl) {
    return { ok: false, message: 'Could not get photo URL' }
  }

  const { data: rpcData, error: rpcError } = await supabase.rpc('post_meal_fulfillment', {
    p_challenge_id: challengeId,
    p_photo_url: data.publicUrl,
  })

  if (rpcError) {
    return { ok: false, message: rpcError.message }
  }

  const result = rpcData as { ok?: boolean; message?: string }
  if (!result?.ok) {
    return { ok: false, message: result?.message ?? 'Could not save meal proof' }
  }

  return { ok: true, publicUrl: data.publicUrl }
}
