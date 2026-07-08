import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { RealtimeChannel } from '@supabase/supabase-js'
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

function isMissingPollRelation(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false
  const message = error.message ?? ''
  return (
    error.code === '42P01' ||
    error.code === 'PGRST205' ||
    message.includes('season_edit_poll')
  )
}

/** One realtime channel shared across all useSeasonEditPoll() callers. */
const pollListeners = new Set<() => void>()
let pollChannel: RealtimeChannel | null = null

function notifyPollListeners() {
  for (const listener of pollListeners) listener()
}

function attachSeasonEditPollRealtime(listener: () => void) {
  pollListeners.add(listener)

  if (!pollChannel) {
    pollChannel = supabase
      .channel('season-edit-poll')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'season_edit_poll' }, () => {
        notifyPollListeners()
      })
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'season_edit_poll_votes' },
        () => {
          notifyPollListeners()
        },
      )
      .subscribe()
  }

  return () => {
    pollListeners.delete(listener)
    if (pollListeners.size === 0 && pollChannel) {
      void supabase.removeChannel(pollChannel)
      pollChannel = null
    }
  }
}

export interface SeasonEditPollApi {
  ready: boolean
  unavailable: boolean
  saving: boolean
  poll: SeasonEditPollConfig
  tallies: ReturnType<typeof tallySeasonEditVotes>
  myVote: SeasonEditPollVote | null
  canVote: boolean
  showPollCard: boolean
  showPublishedReveal: boolean
  editAllowed: boolean
  qfExpired: boolean
  castVote: (vote: SeasonEditPollVote) => Promise<void>
  openPoll: () => Promise<void>
  closePoll: () => Promise<void>
  publishResults: () => Promise<void>
  openEditWindow: () => Promise<void>
  closeEditWindow: () => Promise<void>
  refetch: () => Promise<void>
  isAdmin: boolean
}

const SeasonEditPollContext = createContext<SeasonEditPollApi | null>(null)

function useSeasonEditPollState(): SeasonEditPollApi {
  const { user, profile } = useAuth()
  const { matches } = useMatches()
  const [config, setConfig] = useState<SeasonEditPollConfig | null>(null)
  const [votes, setVotes] = useState<SeasonEditPollVoteRow[]>([])
  const [myVote, setMyVote] = useState<SeasonEditPollVote | null>(null)
  const [ready, setReady] = useState(false)
  const [unavailable, setUnavailable] = useState(false)
  const [saving, setSaving] = useState(false)

  const fetchAll = useCallback(async () => {
    try {
      const [pollRes, votesRes] = await Promise.all([
        supabase.from('season_edit_poll').select('*').eq('id', true).maybeSingle(),
        supabase.from('season_edit_poll_votes').select('user_id, vote, created_at, updated_at'),
      ])

      if (pollRes.error || votesRes.error) {
        const err = pollRes.error ?? votesRes.error
        if (isMissingPollRelation(err)) {
          setUnavailable(true)
          setConfig(null)
          setVotes([])
          setMyVote(null)
          setReady(true)
          return
        }
        // Non-fatal (RLS / network) — keep app usable with closed defaults
        console.warn('season edit poll fetch failed', err)
        setUnavailable(false)
        setConfig(EMPTY_CONFIG)
        setVotes([])
        setMyVote(null)
        setReady(true)
        return
      }

      setUnavailable(false)
      setConfig((pollRes.data as SeasonEditPollConfig | null) ?? EMPTY_CONFIG)
      const voteRows = (votesRes.data as SeasonEditPollVoteRow[] | null) ?? []
      setVotes(voteRows)
      setMyVote(user?.id ? (voteRows.find((v) => v.user_id === user.id)?.vote ?? null) : null)
      setReady(true)
    } catch (err) {
      console.warn('season edit poll unexpected error', err)
      setUnavailable(true)
      setConfig(null)
      setVotes([])
      setMyVote(null)
      setReady(true)
    }
  }, [user?.id])

  useEffect(() => {
    void fetchAll()
  }, [fetchAll])

  useEffect(() => {
    if (unavailable) return
    return attachSeasonEditPollRealtime(() => {
      void fetchAll()
    })
  }, [fetchAll, unavailable])

  const tallies = useMemo(() => tallySeasonEditVotes(votes), [votes])
  const poll = config ?? EMPTY_CONFIG
  const qfExpired = isSeasonEditWindowExpired(matches)

  const canVote = poll.status === 'open' && Boolean(user) && !myVote
  // One vote only — hide the card once the player has cast yes/no
  const showPollCard = !unavailable && ready && poll.status === 'open' && !myVote
  const showPublishedReveal =
    !unavailable && ready && poll.status === 'published' && Boolean(poll.published_at)

  const editAllowed =
    !unavailable && ready && poll.edit_window_open && !qfExpired && Boolean(user)

  const castVote = useCallback(
    async (vote: SeasonEditPollVote) => {
      if (!user || poll.status !== 'open') throw new Error('Poll is not open for voting.')
      if (myVote) throw new Error('You already voted — one vote only.')
      setSaving(true)
      try {
        const now = new Date().toISOString()
        const { error } = await supabase.from('season_edit_poll_votes').insert({
          user_id: user.id,
          vote,
          updated_at: now,
        })
        if (error) {
          // Unique violation if they already voted (race / refresh)
          if (error.code === '23505') {
            throw new Error('You already voted — one vote only.')
          }
          throw formatSupabaseError(error, 'Could not save your vote')
        }
        setMyVote(vote)
        await fetchAll()
      } finally {
        setSaving(false)
      }
    },
    [user, poll.status, myVote, fetchAll],
  )

  const adminUpdate = useCallback(
    async (patch: Partial<SeasonEditPollConfig>) => {
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
    },
    [profile?.is_admin, poll, fetchAll],
  )

  const openPoll = useCallback(
    () => adminUpdate({ status: 'open', edit_window_open: false }),
    [adminUpdate],
  )
  const closePoll = useCallback(
    () => adminUpdate({ status: 'closed', edit_window_open: false }),
    [adminUpdate],
  )
  const publishResults = useCallback(
    () =>
      adminUpdate({
        status: 'published',
        published_at: new Date().toISOString(),
        edit_window_open: true,
        edit_opened_at: new Date().toISOString(),
        edit_closed_at: null,
      }),
    [adminUpdate],
  )
  const openEditWindow = useCallback(
    () =>
      adminUpdate({
        edit_window_open: true,
        edit_opened_at: new Date().toISOString(),
        edit_closed_at: null,
      }),
    [adminUpdate],
  )
  const closeEditWindow = useCallback(
    () =>
      adminUpdate({
        edit_window_open: false,
        edit_closed_at: new Date().toISOString(),
      }),
    [adminUpdate],
  )

  return useMemo(
    () => ({
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
    }),
    [
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
      fetchAll,
      profile?.is_admin,
    ],
  )
}

export function SeasonEditPollProvider({ children }: { children: ReactNode }) {
  const value = useSeasonEditPollState()
  return (
    <SeasonEditPollContext.Provider value={value}>{children}</SeasonEditPollContext.Provider>
  )
}

const FALLBACK_API: SeasonEditPollApi = {
  ready: true,
  unavailable: true,
  saving: false,
  poll: EMPTY_CONFIG,
  tallies: { yes: 0, no: 0, total: 0, yesPct: 0, noPct: 0 },
  myVote: null,
  canVote: false,
  showPollCard: false,
  showPublishedReveal: false,
  editAllowed: false,
  qfExpired: false,
  castVote: async () => {
    throw new Error('Season edit poll is unavailable')
  },
  openPoll: async () => undefined,
  closePoll: async () => undefined,
  publishResults: async () => undefined,
  openEditWindow: async () => undefined,
  closeEditWindow: async () => undefined,
  refetch: async () => undefined,
  isAdmin: false,
}

export function useSeasonEditPoll(): SeasonEditPollApi {
  return useContext(SeasonEditPollContext) ?? FALLBACK_API
}
