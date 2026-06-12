import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import {
  getStoredLeaderboardRank,
  leaderboardRankKey,
  setStoredLeaderboardRank,
} from '../lib/leaderboardRankMemory'
import { primeAudio, playSound } from '../lib/sounds'
import type { LeaderboardEntry } from '../lib/types'

export type RankReveal = 'up' | 'down' | 'same' | 'debut'

/**
 * On visiting the point table: compare rank to last visit, play mood sound,
 * and expose animation direction for the current user's row.
 */
export function useLeaderboardReveal(
  entries: LeaderboardEntry[],
  loading: boolean,
  rankingsAvailable: boolean,
  stageKey: string,
) {
  const { user } = useAuth()
  const [reveal, setReveal] = useState<RankReveal | null>(null)
  const lastStageRef = useRef(stageKey)
  const playedForStageRef = useRef<string | null>(null)

  const myEntry = user ? entries.find((e) => e.user_id === user.id) : undefined
  const myRank = myEntry?.rank
  const myUserId = user?.id

  useEffect(() => {
    if (lastStageRef.current !== stageKey) {
      playedForStageRef.current = null
      lastStageRef.current = stageKey
      setReveal(null)
    }
  }, [stageKey])

  useEffect(() => {
    if (loading || !rankingsAvailable || !myUserId || myRank === undefined) {
      setReveal(null)
      return
    }

    const playKey = `${stageKey}:${myRank}:${entries.length}`
    if (playedForStageRef.current === playKey) return

    const storageKey = leaderboardRankKey(myUserId, stageKey)
    const previousRank = getStoredLeaderboardRank(storageKey)
    let mood: RankReveal = 'same'

    if (previousRank === null) {
      mood = 'debut'
      primeAudio()
      playSound(myRank <= Math.ceil(entries.length / 2) ? 'standingsHappy' : 'standingsSad')
    } else if (myRank < previousRank) {
      mood = 'up'
      primeAudio()
      playSound('standingsHappy')
    } else if (myRank > previousRank) {
      mood = 'down'
      primeAudio()
      playSound('standingsSad')
    }

    setStoredLeaderboardRank(storageKey, myRank)
    setReveal(mood)
    playedForStageRef.current = playKey
  }, [loading, rankingsAvailable, myUserId, myRank, entries.length, stageKey])

  return {
    reveal,
    myEntry,
    myRank: myEntry?.rank ?? null,
  }
}
