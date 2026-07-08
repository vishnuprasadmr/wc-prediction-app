import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useMatches } from './useMatches'
import { formatSupabaseError } from '../lib/ensureProfile'
import { supabase } from '../lib/supabase'
import {
  DEFAULT_SEASON_EDIT_POLL_QUESTION,
  isSeasonEditWindowExpired,
  tallySeasonEditVotes,
  type SeasonEditPollConfig,
  type SeasonEditPollVote,
  type SeasonEditPollVoteRow,
} from '../lib/seasonEditPoll'

const EMPTY_CONFIG: SeasonEditPollConfig = {
  id: true,
  status: 'closed',
  question: DEFAULT_SEASON_EDIT_POLL_QUESTION,
  edit_window_open: false,
  published_at: null,
  edit_opened_at: null,
  edit_closed_at: null,
  updated_at: new Date(0).toISOString(),
}

export function useSeasonEditPoll() {
  const { user, profile } = useAuth()
  const { matches } = useMatches()
  const [config, setConfig] = useState<SeasonEditPollConfig | null>(null)
  const [votes, setVotes] = useState<SeasonEditPollVoteRow[]>([])
  const [myVote, setMyVote] = useState<SeasonEditPollVote | null>(null)
  const [ready, setReady] = useState(false)
  const [unavailable, setUnavailable] = useState(false)
  const [saving, setSaving] = useState(false)

  const fetchAll = useCallback(async () => {
    const [pollRes, votesRes] = await Promise.all([
      supabase.from('season_edit_poll').select('*').eq('id', true).maybeSingle(),
      supabase.from('season_edit_poll_votes').select('user_id, vote, created_at, updated_at'),
    ])

    if (pollRes.error) {
      if (pollRes.error.code === '42P01' || pollRes.error.message.includes('season_edit_poll')) {
        setUnavailable(true)
        setConfig(null)
        setVotes([])
        setMyVote(null)
        setReady(true)
        return
      }
    }

    setUnavailable(false)
    setConfig((pollRes.data as SeasonEditPollConfig | null) ?? EMPTY_CONFIG)
    const voteRows = (votesRes.data as SeasonEditPollVoteRow[] | null) ?? []
    setVotes(voteRows)
    setMyVote(user?.id ? (voteRows.find((v) => v.user_id === user.id)?.vote ?? null) : null)
    setReady(true)
  }, [user?.id])

  useEffect(() => {
    void fetchAll()
  }, [fetchAll])

  useEffect(() => {
    if (unavailable) return

    const channel = supabase
      .channel('season-edit-poll')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'season_edit_poll' }, () => {
        void fetchAll()
      })
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'season_edit_poll_votes' },
        () => {
          void fetchAll()
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [fetchAll, unavailable])

  const tallies = useMemo(() => tallySeasonEditVotes(votes), [votes])
  const poll = config ?? EMPTY_CONFIG
  const qfExpired = isSeasonEditWindowExpired(matches)

  const canVote = poll.status === 'open' && Boolean(user)
  const showPollCard = !unavailable && ready && poll.status === 'open'
  const showPublishedReveal =
    !unavailable && ready && poll.status === 'published' && Boolean(poll.published_at)

  const editAllowed =
    !unavailable &&
    ready &&
    poll.edit_window_open &&
    !qfExpired &&
    Boolean(user)

  const castVote = async (vote: SeasonEditPollVote) => {
    if (!user || !canVote) throw new Error('Poll is not open for voting.')
    setSaving(true)
    try {
      const now = new Date().toISOString()
      const { error } = await supabase.from('season_edit_poll_votes').upsert(
        {
          user_id: user.id,
          vote,
          updated_at: now,
        },
        { onConflict: 'user_id' },
      )
      if (error) throw formatSupabaseError(error, 'Could not save your vote')
      setMyVote(vote)
      await fetchAll()
    } finally {
      setSaving(false)
    }
  }

  const adminUpdate = async (patch: Partial<SeasonEditPollConfig>) => {
    if (!profile?.is_admin) throw new Error('Admin only')
    setSaving(true)
    try {
      const now = new Date().toISOString()
      const { error } = await supabase.from('season_edit_poll').upsert(
        {
          ...poll,
          ...patch,
          id: true,
          updated_at: now,
        },
        { onConflict: 'id' },
      )
      if (error) throw formatSupabaseError(error, 'Could not update poll')
      await fetchAll()
    } finally {
      setSaving(false)
    }
  }

  const openPoll = () => adminUpdate({ status: 'open', edit_window_open: false })
  const closePoll = () => adminUpdate({ status: 'closed', edit_window_open: false })
  const publishResults = () =>
    adminUpdate({
      status: 'published',
      published_at: new Date().toISOString(),
      edit_window_open: true,
      edit_opened_at: new Date().toISOString(),
      edit_closed_at: null,
    })
  const openEditWindow = () =>
    adminUpdate({
      edit_window_open: true,
      edit_opened_at: new Date().toISOString(),
      edit_closed_at: null,
    })
  const closeEditWindow = () =>
    adminUpdate({
      edit_window_open: false,
      edit_closed_at: new Date().toISOString(),
    })

  return {
    ready,
    unavailable,
    saving,
    poll,
    tallies,
    myVote,
    canVote,
    showPollCard,
    showPublishedReveal,
    editAllowed,
    qfExpired,
    castVote,
    openPoll,
    closePoll,
    publishResults,
    openEditWindow,
    closeEditWindow,
    refetch: fetchAll,
    isAdmin: Boolean(profile?.is_admin),
  }
}
