import { useCallback, useEffect, useState } from 'react'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { parseArenaHero } from '../lib/shootout/hero'
import type {
  ArenaHero,
  ShootoutChallenge,
  ShootoutKick,
  ShootoutZone,
} from '../lib/shootout/types'

export interface ShootoutProfile {
  id: string
  display_name: string
  avatar_url?: string | null
}

export interface ShootoutChallengeView extends ShootoutChallenge {
  challenger_name: string
  opponent_name: string
  winner_name?: string | null
  challenger_avatar?: string | null
  opponent_avatar?: string | null
  challenger_hero: ArenaHero | null
  opponent_hero: ArenaHero | null
  kicks: ShootoutKick[]
}

const listeners = new Set<() => void>()
let channel: RealtimeChannel | null = null

function notify() {
  for (const l of listeners) l()
}

function attachRealtime(listener: () => void) {
  listeners.add(listener)
  if (!channel) {
    channel = supabase
      .channel('shootout-arena')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shootout_challenges' }, notify)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shootout_kicks' }, notify)
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') notify()
      })
  }
  return () => {
    listeners.delete(listener)
    if (listeners.size === 0 && channel) {
      void supabase.removeChannel(channel)
      channel = null
    }
  }
}

async function fetchProfiles(ids: string[]): Promise<Map<string, ShootoutProfile>> {
  const unique = [...new Set(ids.filter(Boolean))]
  if (unique.length === 0) return new Map()
  const { data } = await supabase
    .from('profiles')
    .select('id, display_name, avatar_url')
    .in('id', unique)
  const map = new Map<string, ShootoutProfile>()
  for (const row of data ?? []) {
    map.set(row.id as string, {
      id: row.id as string,
      display_name: row.display_name as string,
      avatar_url: row.avatar_url as string | null,
    })
  }
  return map
}

function enrich(
  rows: ShootoutChallenge[],
  kicks: ShootoutKick[],
  profiles: Map<string, ShootoutProfile>,
): ShootoutChallengeView[] {
  return rows.map((row) => {
    const challenger = profiles.get(row.challenger_id)
    const opponent = profiles.get(row.opponent_id)
    return {
      ...row,
      challenger_hero: parseArenaHero(row.challenger_hero),
      opponent_hero: parseArenaHero(row.opponent_hero),
      challenger_name: challenger?.display_name ?? 'Player',
      opponent_name: opponent?.display_name ?? 'Player',
      challenger_avatar: challenger?.avatar_url,
      opponent_avatar: opponent?.avatar_url,
      winner_name: row.winner_id ? profiles.get(row.winner_id)?.display_name ?? null : null,
      kicks: kicks.filter((k) => k.challenge_id === row.id).sort((a, b) => a.kick_number - b.kick_number),
    }
  })
}

export function useShootoutChallenges(userId?: string) {
  const [challenges, setChallenges] = useState<ShootoutChallengeView[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAll = useCallback(async () => {
    setError(null)
    const [cRes, kRes] = await Promise.all([
      supabase.from('shootout_challenges').select('*').order('created_at', { ascending: false }),
      supabase.from('shootout_kicks').select('*').order('kick_number', { ascending: true }),
    ])

    if (cRes.error) {
      setError(cRes.error.message)
      setChallenges([])
      setLoading(false)
      return
    }

    const rows = (cRes.data as ShootoutChallenge[]) ?? []
    const kicks = (kRes.data as ShootoutKick[]) ?? []
    const ids = rows.flatMap((r) => [r.challenger_id, r.opponent_id, r.winner_id].filter(Boolean) as string[])
    const profiles = await fetchProfiles(ids)
    setChallenges(enrich(rows, kicks, profiles))
    setLoading(false)
  }, [])

  useEffect(() => {
    setLoading(true)
    void fetchAll()
    return attachRealtime(() => void fetchAll())
  }, [fetchAll])

  const mine = userId
    ? challenges.filter((c) => c.challenger_id === userId || c.opponent_id === userId)
    : challenges

  const pendingIncoming = mine.filter(
    (c) => c.status === 'pending' && c.opponent_id === userId,
  )
  const pendingOutgoing = mine.filter(
    (c) => c.status === 'pending' && c.challenger_id === userId,
  )
  const active = mine.filter((c) => c.status === 'active')
  const completed = mine.filter((c) => c.status === 'completed')
  const myTurn = userId
    ? active.filter((c) => c.turn_user_id === userId)
    : []

  return {
    challenges,
    loading,
    error,
    refetch: fetchAll,
    mine,
    pendingIncoming,
    pendingOutgoing,
    active,
    completed,
    myTurn,
    recentCompleted: completed.slice(0, 10),
    allCompleted: challenges.filter((c) => c.status === 'completed'),
  }
}

export async function createShootoutChallenge(
  opponentId: string,
  taunt?: string,
): Promise<{ ok: true; challengeId?: string } | { ok: false; message: string }> {
  const { data, error } = await supabase.rpc('create_shootout_challenge', {
    p_opponent_id: opponentId,
    p_taunt: taunt ?? null,
  })
  if (error) return { ok: false, message: error.message }
  const result = data as { ok?: boolean; message?: string; challenge_id?: string }
  if (!result?.ok) return { ok: false, message: result?.message ?? 'Could not create challenge' }
  return { ok: true, challengeId: result.challenge_id }
}

export async function respondShootoutChallenge(
  challengeId: string,
  accept: boolean,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const { data, error } = await supabase.rpc('respond_shootout_challenge', {
    p_challenge_id: challengeId,
    p_accept: accept,
  })
  if (error) return { ok: false, message: error.message }
  const result = data as { ok?: boolean; message?: string }
  if (!result?.ok) return { ok: false, message: result?.message ?? 'Could not respond' }
  return { ok: true }
}

export async function submitShootoutDive(
  challengeId: string,
  zone: ShootoutZone,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const { data, error } = await supabase.rpc('submit_shootout_dive', {
    p_challenge_id: challengeId,
    p_zone: zone,
  })
  if (error) return { ok: false, message: error.message }
  const result = data as { ok?: boolean; message?: string }
  if (!result?.ok) return { ok: false, message: result?.message ?? 'Could not submit dive' }
  return { ok: true }
}

export async function submitShootoutShot(
  challengeId: string,
  zone: ShootoutZone,
  banter?: string,
): Promise<
  | { ok: true; outcome?: string; completed?: boolean }
  | { ok: false; message: string }
> {
  const { data, error } = await supabase.rpc('submit_shootout_shot', {
    p_challenge_id: challengeId,
    p_zone: zone,
    p_banter: banter ?? null,
  })
  if (error) return { ok: false, message: error.message }
  const result = data as {
    ok?: boolean
    message?: string
    outcome?: string
    completed?: boolean
  }
  if (!result?.ok) return { ok: false, message: result?.message ?? 'Could not submit shot' }
  return { ok: true, outcome: result.outcome, completed: result.completed }
}
