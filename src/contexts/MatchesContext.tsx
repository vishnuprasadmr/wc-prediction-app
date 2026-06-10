import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useAuth } from './AuthContext'
import { supabase } from '../lib/supabase'
import type { Match, Prediction } from '../lib/types'

interface MatchesContextValue {
  matches: Match[]
  predictions: Record<string, Prediction>
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

const MatchesContext = createContext<MatchesContextValue | null>(null)

export function MatchesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const userId = user?.id

  const [matches, setMatches] = useState<Match[]>([])
  const [predictions, setPredictions] = useState<Record<string, Prediction>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setError(null)
    const { data: matchData, error: matchError } = await supabase
      .from('matches')
      .select('*')
      .order('kickoff_at', { ascending: true })

    if (matchError) {
      setError(matchError.message)
      setLoading(false)
      return
    }

    setMatches((matchData as Match[]) ?? [])

    if (userId) {
      const { data: predData, error: predError } = await supabase
        .from('predictions')
        .select('*')
        .eq('user_id', userId)

      if (!predError && predData) {
        const map: Record<string, Prediction> = {}
        for (const p of predData as Prediction[]) {
          map[p.match_id] = p
        }
        setPredictions(map)
      } else {
        setPredictions({})
      }
    } else {
      setPredictions({})
    }

    setLoading(false)
  }, [userId])

  useEffect(() => {
    setLoading(true)
    void fetchData()

    const channelName = `matches-sync-${userId ?? 'anon'}`
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, () => {
        void fetchData()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'predictions' }, () => {
        void fetchData()
      })
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [fetchData, userId])

  const value = useMemo(
    () => ({ matches, predictions, loading, error, refetch: fetchData }),
    [matches, predictions, loading, error, fetchData],
  )

  return <MatchesContext.Provider value={value}>{children}</MatchesContext.Provider>
}

export function useMatches() {
  const ctx = useContext(MatchesContext)
  if (!ctx) throw new Error('useMatches must be used within MatchesProvider')
  return ctx
}
