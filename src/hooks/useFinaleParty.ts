import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import {
  type FinalePartyConfig,
  type FinalePrizeAwardAdmin,
  type FinalePrizeAwardPublic,
} from '../lib/finaleParty'
import { supabase } from '../lib/supabase'

interface UseFinalePartyOptions {
  /** When true, load admin rows including zomato_code from base table. */
  admin?: boolean
}

export function useFinaleParty(options: UseFinalePartyOptions = {}) {
  const { admin = false } = options
  const { profile } = useAuth()
  const isAdmin = Boolean(profile?.is_admin)
  const loadAdmin = admin && isAdmin

  const [config, setConfig] = useState<FinalePartyConfig | null>(null)
  const [awards, setAwards] = useState<FinalePrizeAwardPublic[]>([])
  const [adminAwards, setAdminAwards] = useState<FinalePrizeAwardAdmin[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    setLoading(true)
    setError(null)

    const { data: configRow, error: configError } = await supabase
      .from('finale_party_config')
      .select(
        'status, anticipation_headline, anticipation_body, published_headline, published_body, published_at, updated_at',
      )
      .eq('id', true)
      .maybeSingle()

    if (configError) {
      setError(configError.message)
      setLoading(false)
      return
    }

    setConfig((configRow as FinalePartyConfig | null) ?? null)

    if (loadAdmin) {
      const { data, error: awardsError } = await supabase
        .from('finale_prize_awards')
        .select(
          'id, slot_key, title, amount_inr, night_label, user_id, zomato_code, suggested_user_id, revealed_at, sort_order, created_at, updated_at',
        )
        .order('sort_order', { ascending: true })

      if (awardsError) {
        setError(awardsError.message)
        setAdminAwards([])
      } else {
        setAdminAwards((data as FinalePrizeAwardAdmin[]) ?? [])
        setAwards(
          ((data as FinalePrizeAwardAdmin[]) ?? []).map(({ zomato_code: _c, ...rest }) => rest),
        )
      }
    } else {
      const { data, error: awardsError } = await supabase
        .from('finale_prize_awards_public')
        .select(
          'id, slot_key, title, amount_inr, night_label, user_id, suggested_user_id, revealed_at, sort_order, created_at, updated_at, winner_display_name, winner_avatar_url, masked_card',
        )
        .order('sort_order', { ascending: true })

      if (awardsError) {
        // Table/view may not exist yet locally — soft fail
        setError(awardsError.message)
        setAwards([])
      } else {
        setAwards((data as FinalePrizeAwardPublic[]) ?? [])
      }
      setAdminAwards([])
    }

    setLoading(false)
  }, [loadAdmin])

  useEffect(() => {
    void refetch()
  }, [refetch])

  const myAwards = awards.filter((a) => a.user_id && a.user_id === profile?.id)

  return {
    config,
    awards,
    adminAwards,
    myAwards,
    loading,
    error,
    refetch,
    isAdmin,
  }
}

export async function fetchFinaleGiftCode(awardId: string): Promise<string> {
  const { data, error } = await supabase.rpc('get_finale_gift_code', {
    p_award_id: awardId,
  })
  if (error) throw new Error(error.message)
  return String(data ?? '')
}

export async function markFinaleGiftRevealed(awardId: string): Promise<string> {
  const { data, error } = await supabase.rpc('mark_finale_gift_revealed', {
    p_award_id: awardId,
  })
  if (error) throw new Error(error.message)
  return String(data ?? '')
}
