import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { defaultHeroForTeam, parseArenaHero } from '../lib/shootout/hero'
import type { ArenaHero } from '../lib/shootout/types'

export function useArenaHero(userId?: string, heartTeam?: string | null) {
  const [hero, setHero] = useState<ArenaHero | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchHero = useCallback(async () => {
    if (!userId) {
      setHero(null)
      setLoading(false)
      return
    }
    const { data } = await supabase
      .from('profiles')
      .select('arena_hero')
      .eq('id', userId)
      .maybeSingle()
    const parsed = parseArenaHero(data?.arena_hero)
    setHero(parsed)
    setLoading(false)
  }, [userId])

  useEffect(() => {
    setLoading(true)
    void fetchHero()
  }, [fetchHero])

  const saveHero = async (next: ArenaHero): Promise<{ ok: boolean; message?: string }> => {
    if (!userId) return { ok: false, message: 'Sign in required' }
    const { error } = await supabase
      .from('profiles')
      .update({ arena_hero: next })
      .eq('id', userId)
    if (error) return { ok: false, message: error.message }
    setHero(next)
    return { ok: true }
  }

  const ensureDefault = async (): Promise<ArenaHero | null> => {
    if (hero) return hero
    if (!heartTeam || !userId) return null
    const fallback = defaultHeroForTeam(heartTeam)
    if (fallback) {
      await saveHero(fallback)
      return fallback
    }
    return null
  }

  return { hero, loading, saveHero, ensureDefault, refetch: fetchHero }
}
