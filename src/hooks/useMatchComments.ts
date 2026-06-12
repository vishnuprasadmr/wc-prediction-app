import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

export interface MatchComment {
  user_id: string
  display_name: string
  comment: string
  created_at: string
  is_mine: boolean
}

export function useMatchComments(matchId: string | undefined, enabled: boolean) {
  const { user } = useAuth()
  const [comments, setComments] = useState<MatchComment[]>([])
  const [loading, setLoading] = useState(false)

  const fetchComments = useCallback(async () => {
    if (!matchId || !enabled) {
      setComments([])
      return
    }

    setLoading(true)
    const { data } = await supabase
      .from('match_comments')
      .select('user_id, comment, created_at, profiles(display_name)')
      .eq('match_id', matchId)
      .order('created_at', { ascending: true })
      .limit(40)

    const rows: MatchComment[] = (data ?? []).map((row) => {
      const raw = row.profiles as { display_name: string } | { display_name: string }[] | null
      const profile = Array.isArray(raw) ? raw[0] : raw
      return {
        user_id: row.user_id,
        display_name: profile?.display_name ?? 'Player',
        comment: row.comment,
        created_at: row.created_at,
        is_mine: user?.id === row.user_id,
      }
    })

    setComments(rows)
    setLoading(false)
  }, [matchId, enabled, user?.id])

  useEffect(() => {
    void fetchComments()
  }, [fetchComments])

  const submitComment = async (text: string) => {
    if (!user || !matchId) return false
    const comment = text.trim().slice(0, 120)
    if (!comment) return false

    const { error } = await supabase.from('match_comments').upsert(
      { match_id: matchId, user_id: user.id, comment },
      { onConflict: 'match_id,user_id' },
    )

    if (!error) await fetchComments()
    return !error
  }

  return { comments, loading, submitComment, refetch: fetchComments }
}
