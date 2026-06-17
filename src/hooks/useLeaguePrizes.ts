import { useCallback, useEffect, useState } from 'react'
import type { LeaguePrize, LeaguePrizeConfig } from '../lib/prizes'
import { supabase } from '../lib/supabase'

export function useLeaguePrizes() {
  const [config, setConfig] = useState<LeaguePrizeConfig | null>(null)
  const [prizes, setPrizes] = useState<LeaguePrize[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    setError(null)

    const [configRes, prizesRes] = await Promise.all([
      supabase.from('league_prize_config').select('*').eq('id', true).maybeSingle(),
      supabase.from('league_prizes').select('*').order('sort_order', { ascending: true }),
    ])

    if (configRes.error) {
      setError(configRes.error.message)
      setConfig(null)
      setPrizes([])
      setLoading(false)
      return
    }

    if (prizesRes.error) {
      setError(prizesRes.error.message)
    }

    if (configRes.data) {
      setConfig({
        published: configRes.data.published,
        headline: configRes.data.headline,
        intro: configRes.data.intro,
        total_inr: configRes.data.total_inr,
        footer_note: configRes.data.footer_note,
        updated_at: configRes.data.updated_at,
      })
    } else {
      setConfig(null)
    }

    setPrizes((prizesRes.data as LeaguePrize[] | null) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    void fetchAll()
  }, [fetchAll])

  return {
    config,
    prizes,
    loading,
    error,
    refetch: fetchAll,
    published: Boolean(config?.published),
  }
}
