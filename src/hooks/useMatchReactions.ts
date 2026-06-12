import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

export type ReactionEmoji = 'fire' | 'heart' | 'skull' | 'clap'

export const REACTION_OPTIONS: { emoji: ReactionEmoji; label: string; icon: string }[] = [
  { emoji: 'fire', label: 'Fire', icon: '🔥' },
  { emoji: 'heart', label: 'Love', icon: '❤️' },
  { emoji: 'clap', label: 'Clap', icon: '👏' },
  { emoji: 'skull', label: 'RIP', icon: '💀' },
]

export function useMatchReactions(matchId: string | undefined, enabled: boolean) {
  const { user } = useAuth()
  const [counts, setCounts] = useState<Record<ReactionEmoji, number>>({
    fire: 0,
    heart: 0,
    skull: 0,
    clap: 0,
  })
  const [mine, setMine] = useState<ReactionEmoji | null>(null)

  const fetchReactions = useCallback(async () => {
    if (!matchId || !enabled) return

    const { data } = await supabase
      .from('match_reactions')
      .select('emoji, user_id')
      .eq('match_id', matchId)

    const next: Record<ReactionEmoji, number> = { fire: 0, heart: 0, skull: 0, clap: 0 }
    let myEmoji: ReactionEmoji | null = null

    for (const row of data ?? []) {
      const e = row.emoji as ReactionEmoji
      if (e in next) next[e] += 1
      if (user && row.user_id === user.id) myEmoji = e
    }

    setCounts(next)
    setMine(myEmoji)
  }, [matchId, enabled, user])

  useEffect(() => {
    void fetchReactions()
  }, [fetchReactions])

  const react = async (emoji: ReactionEmoji) => {
    if (!user || !matchId) return

    if (mine === emoji) {
      await supabase.from('match_reactions').delete().eq('match_id', matchId).eq('user_id', user.id)
    } else {
      await supabase.from('match_reactions').upsert(
        { match_id: matchId, user_id: user.id, emoji },
        { onConflict: 'match_id,user_id' },
      )
    }
    await fetchReactions()
  }

  return { counts, mine, react }
}
