import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useMatches } from './useMatches'
import { ensureUserProfile, formatSupabaseError } from '../lib/ensureProfile'
import { supabase } from '../lib/supabase'
import type { SeasonAnswers } from '../lib/seasonQuestions'
import { isSeasonAnswersComplete } from '../lib/seasonQuestions'
import { isSeasonQuestionnaireLocked } from '../lib/seasonQuestionnaireLock'

export interface SeasonPredictionRow {
  user_id: string
  answers: SeasonAnswers
  points_earned: number | null
  submitted_at: string | null
}

function isRowComplete(row: SeasonPredictionRow | null): boolean {
  if (!row?.answers) return false
  return isSeasonAnswersComplete(row.answers)
}

export function useSeasonQuestionnaire() {
  const { user, profile, refreshProfile } = useAuth()
  const { matches } = useMatches()
  const [row, setRow] = useState<SeasonPredictionRow | null>(null)
  const [ready, setReady] = useState(false)
  const [unavailable, setUnavailable] = useState(false)
  const fetchedForUser = useRef<string | null>(null)

  const fetchRow = useCallback(async () => {
    if (!user) {
      setRow(null)
      setReady(true)
      fetchedForUser.current = null
      return
    }

    const isFirstFetch = fetchedForUser.current !== user.id
    if (isFirstFetch) setReady(false)

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

    fetchedForUser.current = user.id
    setReady(true)
  }, [user])

  useEffect(() => {
    void fetchRow()
  }, [fetchRow])

  const isLocked = isSeasonQuestionnaireLocked(matches)

  const rowComplete = isRowComplete(row)
  const hasSubmitted = rowComplete && Boolean(profile?.questionnaire_completed_at ?? row?.submitted_at)

  const needsSeasonPicks = !unavailable && ready && !hasSubmitted && !isLocked

  const shouldAutoShowQuestionnaire =
    needsSeasonPicks && !profile?.questionnaire_skipped_at

  const gateBlocking = Boolean(user) && !ready && !unavailable

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
      .update({
        questionnaire_completed_at: now,
        questionnaire_skipped_at: null,
      })
      .eq('id', user.id)

    if (profileError) {
      throw formatSupabaseError(profileError, 'Could not save picks')
    }

    await refreshProfile()
    await fetchRow()
  }

  const skipForNow = async () => {
    if (!user) return

    const now = new Date().toISOString()
    const { error } = await supabase
      .from('profiles')
      .update({ questionnaire_skipped_at: now })
      .eq('id', user.id)

    if (error) {
      throw formatSupabaseError(error, 'Could not save your choice')
    }

    await refreshProfile()
  }

  return {
    row,
    ready,
    gateBlocking,
    unavailable,
    isLocked,
    hasSubmitted,
    needsSeasonPicks,
    shouldAutoShowQuestionnaire,
    submit,
    skipForNow,
    refetch: fetchRow,
  }
}
