import { useCallback, useEffect, useState } from 'react'
import type { RealtimeChannel } from '@supabase/supabase-js'
import type {
  MealChallenge,
  MealChallengeAcceptance,
  MealChallengePointStake,
  MealChallengeStatus,
} from '../lib/mealChallenges'
import { findMealChallengeWinners, isClaimCorrect } from '../lib/mealChallenges'
import type { Match } from '../lib/types'
import { supabase } from '../lib/supabase'

export interface MealChallengeAcceptanceView extends MealChallengeAcceptance {
  display_name: string
}

export interface MealChallengeView extends MealChallenge {
  creator_name: string
  winner_name?: string | null
  match?: Match
  acceptances: MealChallengeAcceptanceView[]
  total_points_staked: number
}

/** One realtime channel shared across all useMealChallenges() callers. */
const mealChallengeListeners = new Set<() => void>()
let mealChallengeChannel: RealtimeChannel | null = null

function notifyMealChallengeListeners() {
  for (const listener of mealChallengeListeners) {
    listener()
  }
}

function attachMealChallengeRealtime(listener: () => void) {
  mealChallengeListeners.add(listener)

  if (!mealChallengeChannel) {
    mealChallengeChannel = supabase
      .channel('meal-challenges')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'meal_challenges' }, () => {
        notifyMealChallengeListeners()
      })
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'meal_challenge_acceptances' },
        () => {
          notifyMealChallengeListeners()
        },
      )
      .subscribe()
  }

  return () => {
    mealChallengeListeners.delete(listener)
    if (mealChallengeListeners.size === 0 && mealChallengeChannel) {
      void supabase.removeChannel(mealChallengeChannel)
      mealChallengeChannel = null
    }
  }
}

async function fetchProfileNames(ids: string[]): Promise<Map<string, string>> {
  const unique = [...new Set(ids.filter(Boolean))]
  if (unique.length === 0) return new Map()

  const { data } = await supabase.from('profiles').select('id, display_name').in('id', unique)
  const map = new Map<string, string>()
  for (const row of data ?? []) {
    map.set(row.id, row.display_name)
  }
  return map
}

function enrichRows(
  rows: MealChallenge[],
  names: Map<string, string>,
  matches: Match[],
  acceptances: MealChallengeAcceptance[],
): MealChallengeView[] {
  const matchMap = new Map(matches.map((m) => [m.id, m]))
  return rows.map((row) => {
    const rowAcceptances = acceptances.filter((a) => a.challenge_id === row.id)
    return {
      ...row,
      backed_outcome: row.backed_outcome ?? 'home_win',
      creator_name: names.get(row.creator_id) ?? 'Player',
      winner_name: row.winner_user_id ? names.get(row.winner_user_id) ?? null : null,
      match: matchMap.get(row.match_id),
      acceptances: rowAcceptances.map((a) => ({
        ...a,
        display_name: names.get(a.user_id) ?? 'Player',
      })),
      total_points_staked: rowAcceptances.reduce((sum, a) => sum + a.points_staked, 0),
    }
  })
}

export function useMealChallenges(matches: Match[]) {
  const [challenges, setChallenges] = useState<MealChallengeView[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAll = useCallback(async () => {
    setError(null)
    const [challengeRes, acceptanceRes] = await Promise.all([
      supabase.from('meal_challenges').select('*').order('created_at', { ascending: false }),
      supabase.from('meal_challenge_acceptances').select('*').order('created_at', { ascending: true }),
    ])

    if (challengeRes.error) {
      setError(challengeRes.error.message)
      setChallenges([])
      setLoading(false)
      return
    }

    const rows = (challengeRes.data as MealChallenge[]) ?? []
    const acceptances = (acceptanceRes.data as MealChallengeAcceptance[]) ?? []
    const nameIds = [
      ...rows.flatMap((r) => [r.creator_id, r.winner_user_id].filter(Boolean) as string[]),
      ...acceptances.map((a) => a.user_id),
    ]
    const names = await fetchProfileNames(nameIds)
    setChallenges(enrichRows(rows, names, matches, acceptances))
    setLoading(false)
  }, [matches])

  useEffect(() => {
    setLoading(true)
    void fetchAll()
    return attachMealChallengeRealtime(() => {
      void fetchAll()
    })
  }, [fetchAll])

  const byStatus = (statuses: MealChallengeStatus[]) =>
    challenges.filter((c) => statuses.includes(c.status))

  return {
    challenges,
    loading,
    error,
    refetch: fetchAll,
    live: byStatus(['approved']),
    pending: byStatus(['pending']),
    settled: byStatus(['settled']),
    mine: (userId?: string) =>
      userId ? challenges.filter((c) => c.creator_id === userId) : [],
  }
}

export async function createMealChallenge(input: {
  match_id: string
  creator_id: string
  claim_text: string
  stake_text: string
  backed_outcome: MealChallenge['backed_outcome']
  win_condition: MealChallenge['win_condition']
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const { error } = await supabase.from('meal_challenges').insert({
    ...input,
    claim_text: input.claim_text.trim(),
    stake_text: input.stake_text.trim(),
    status: 'pending',
  })

  if (error) return { ok: false, message: error.message }
  return { ok: true }
}

export async function acceptMealChallenge(
  challengeId: string,
  pointsStaked: MealChallengePointStake,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const { data, error } = await supabase.rpc('accept_meal_challenge', {
    p_challenge_id: challengeId,
    p_points_staked: pointsStaked,
  })

  if (error) return { ok: false, message: error.message }

  const result = data as { ok?: boolean; message?: string }
  if (!result?.ok) {
    return { ok: false, message: result?.message ?? 'Could not accept challenge' }
  }
  return { ok: true }
}

export async function approveMealChallenge(id: string, adminId: string) {
  return supabase
    .from('meal_challenges')
    .update({
      status: 'approved',
      approved_by: adminId,
      approved_at: new Date().toISOString(),
      reject_reason: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('status', 'pending')
}

export async function rejectMealChallenge(id: string, reason: string) {
  return supabase
    .from('meal_challenges')
    .update({
      status: 'rejected',
      reject_reason: reason.trim() || 'Not approved',
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('status', 'pending')
}

export async function cancelMealChallenge(id: string) {
  return supabase
    .from('meal_challenges')
    .update({
      status: 'cancelled',
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('status', 'pending')
}

export async function settleMealChallenge(
  challenge: MealChallengeView,
  match: Match,
  _adminId: string,
) {
  const { data, error: predError } = await supabase
    .from('predictions')
    .select('user_id, home_pred, away_pred, created_at')
    .eq('match_id', match.id)

  if (predError) return { error: predError.message }

  const userIds = (data ?? []).map((row) => row.user_id as string)
  const { data: profileRows } = await supabase
    .from('profiles')
    .select('id, display_name')
    .in('id', userIds)

  const nameMap = new Map((profileRows ?? []).map((p) => [p.id, p.display_name]))

  const picks =
    data?.map((row) => ({
      user_id: row.user_id as string,
      display_name: nameMap.get(row.user_id as string) ?? 'Player',
      home_pred: row.home_pred as number,
      away_pred: row.away_pred as number,
      created_at: row.created_at as string,
    })) ?? []

  const winners = findMealChallengeWinners(match, picks, challenge.win_condition)
  const winner = winners[0]
  const winnerNote = winner
    ? winners.length > 1
      ? `${winner.display_name} wins (${winners.length} tied — earliest pick)`
      : null
    : 'No qualifying predictions for this challenge'

  const claimCorrect = isClaimCorrect(match, challenge.backed_outcome ?? 'home_win')

  const { data: finalizeData, error } = await supabase.rpc('finalize_meal_challenge', {
    p_challenge_id: challenge.id,
    p_winner_user_id: winner?.user_id ?? null,
    p_winner_note: winnerNote,
    p_claim_correct: claimCorrect,
  })

  if (error) return { error: error.message }

  const result = finalizeData as { ok?: boolean; message?: string; creator_points_delta?: number }
  if (!result?.ok) {
    return { error: result?.message ?? 'Settlement failed' }
  }

  return {
    winner: winner?.display_name ?? null,
    claimCorrect,
    creatorPointsDelta: result.creator_points_delta ?? 0,
    acceptorCount: challenge.acceptances.length,
  }
}
