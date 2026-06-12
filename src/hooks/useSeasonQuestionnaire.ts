import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useMatches } from './useMatches'
import { ensureUserProfile, formatSupabaseError } from '../lib/ensureProfile'
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

    if (!profile?.questionnaire_completed_at && row === null) {
      setLoading(true)
    }
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
  }, [user, profile?.questionnaire_completed_at, row])

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

  /** Only block the shell on the very first questionnaire check */
  const gateBlocking =
    loading && !profile?.questionnaire_completed_at && row === null && !unavailable

  const submit = async (answers: SeasonAnswers) => {
    if (!user || !isSeasonAnswersComplete(answers)) {
      throw new Error('Please answer every question.')
    }

    try {
      await ensureUserProfile(user)
    } catch (err) {
      throw formatSupabaseError(err, 'Could not verify your league profile.')
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

    if (predError) {
      throw formatSupabaseError(predError, 'Could not save picks')
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .update({ questionnaire_completed_at: now })
      .eq('id', user.id)

    if (profileError) {
      throw formatSupabaseError(profileError, 'Could not save picks')
    }

    await refreshProfile()
    await fetchRow()
  }

  return {
    row,
    loading,
    gateBlocking,
    unavailable,
    isLocked,
    hasSubmitted,
    needsQuestionnaire,
    submit,
    refetch: fetchRow,
  }
}
