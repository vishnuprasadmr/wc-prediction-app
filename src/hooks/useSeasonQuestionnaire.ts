import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useMatches } from './useMatches'
import { supabase } from '../lib/supabase'
import type { SeasonAnswers } from '../lib/seasonQuestions'
import { isSeasonAnswersComplete } from '../lib/seasonQuestions'

export interface SeasonPredictionRow {
  user_id: string
  answers: SeasonAnswers
  points_earned: number | null
  submitted_at: string | null
}

export function useSeasonQuestionnaire() {
  const { user, profile, refreshProfile } = useAuth()
  const { matches } = useMatches()
  const [row, setRow] = useState<SeasonPredictionRow | null>(null)
  const [loading, setLoading] = useState(true)
  const [unavailable, setUnavailable] = useState(false)

  const fetchRow = useCallback(async () => {
    if (!user) {
      setRow(null)
      setLoading(false)
      return
    }

    setLoading(true)
    const { data, error } = await supabase
      .from('season_predictions')
      .select('user_id, answers, points_earned, submitted_at')
      .eq('user_id', user.id)
      .maybeSingle()

    if (error) {
      if (error.code === '42P01' || error.message.includes('season_predictions')) {
        setUnavailable(true)
      }
      setRow(null)
    } else {
      setRow(data as SeasonPredictionRow | null)
    }
    setLoading(false)
  }, [user])

  useEffect(() => {
    void fetchRow()
  }, [fetchRow])

  const firstKickoff = matches.length
    ? matches.reduce((earliest, m) => {
        const t = new Date(m.kickoff_at).getTime()
        return t < earliest ? t : earliest
      }, Infinity)
    : null

  const isLocked =
    firstKickoff !== null && !Number.isNaN(firstKickoff) && Date.now() >= firstKickoff

  const hasSubmitted = Boolean(profile?.questionnaire_completed_at ?? row?.submitted_at)

  const needsQuestionnaire = !unavailable && !loading && !hasSubmitted && !isLocked

  const submit = async (answers: SeasonAnswers) => {
    if (!user || !isSeasonAnswersComplete(answers)) {
      throw new Error('Please answer every question.')
    }

    const now = new Date().toISOString()
    const { error: predError } = await supabase.from('season_predictions').upsert(
      {
        user_id: user.id,
        answers,
        submitted_at: now,
        updated_at: now,
      },
      { onConflict: 'user_id' },
    )

    if (predError) throw predError

    const { error: profileError } = await supabase
      .from('profiles')
      .update({ questionnaire_completed_at: now })
      .eq('id', user.id)

    if (profileError) throw profileError

    await refreshProfile()
    await fetchRow()
  }

  return {
    row,
    loading,
    unavailable,
    isLocked,
    hasSubmitted,
    needsQuestionnaire,
    submit,
    refetch: fetchRow,
  }
}
