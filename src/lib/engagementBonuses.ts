import { supabase } from './supabase'
import type { ShareResult } from './shareStandings'
import { pushGameNotification } from './gameNotificationBus'

export const ENGAGEMENT_BONUS_RULES = [
  {
    label: 'First prediction',
    points: '+1',
    description: 'Make your first match pick — enough to join a 1-pt meal bet.',
    badge: 'Onboarding',
  },
  {
    label: 'Share the league',
    points: '+1',
    description: 'Share your standings or a result card once (native share or download).',
    badge: 'One-time',
  },
  {
    label: 'Invite a teammate',
    points: '+1',
    description: 'They join via your link and make their first prediction — you get 1 pt (max 5).',
    badge: 'Referral',
  },
] as const

export interface ShareBonusResult {
  ok: boolean
  already_claimed?: boolean
  points?: number
  message?: string
}

export async function claimShareBonus(): Promise<ShareBonusResult> {
  const { data, error } = await supabase.rpc('claim_share_bonus')

  if (error) {
    return { ok: false, message: error.message }
  }

  const payload = data as ShareBonusResult | null
  return payload ?? { ok: false, message: 'Could not claim share bonus' }
}

export function notifyFirstPredictionBonus(): void {
  pushGameNotification({
    kind: 'bonus',
    title: '+1 pt — first prediction!',
    body: 'Engagement bonus unlocked. You can now stake 1 pt on meal bets.',
    url: '/meals',
  })
}

export function formatShareBonusStatus(result: ShareBonusResult): string | null {
  if (result.ok) return '+1 pt for sharing!'
  if (result.already_claimed) return null
  return null
}

export async function shareWithEngagementBonus(
  share: () => Promise<ShareResult>,
): Promise<{ share: ShareResult; bonus: ShareBonusResult | null }> {
  const shareResult = await share()
  if (!shareResult.ok) {
    return { share: shareResult, bonus: null }
  }

  const bonus = await claimShareBonus()
  return { share: shareResult, bonus }
}

export function combineShareStatus(
  shareResult: ShareResult,
  bonus: ShareBonusResult | null,
  baseMessage: string,
): string {
  if (!shareResult.ok) {
    return shareResult.cancelled ? 'Share cancelled' : baseMessage
  }

  if (bonus?.ok) {
    return `${baseMessage} · +1 pt for sharing!`
  }

  return baseMessage
}
