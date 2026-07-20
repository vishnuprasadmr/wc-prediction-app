import { useEffect, useMemo, useState } from 'react'
import { useFinaleParty } from '../hooks/useFinaleParty'
import { maskGiftCardNumber } from '../lib/finaleParty'
import { formatInr } from '../lib/prizes'
import {
  buildPrizeWinnerInput,
  downloadPrizeWinnerImage,
  sharePrizeWinnerWithImage,
} from '../lib/sharePrizeWinner'
import { resolveCachedAvatarUrl } from '../lib/avatarCache'
import { supabase } from '../lib/supabase'
import { LeaderboardAvatar } from './LeaderboardAvatar'

export function AdminPrizeWinnerShare() {
  const { adminAwards, awards: publicAwards, loading, config } = useFinaleParty({ admin: true })
  const [profiles, setProfiles] = useState<
    Record<string, { display_name: string; avatar_url: string | null }>
  >({})
  const [busyId, setBusyId] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)

  const rows = useMemo(() => {
    const list = adminAwards.length > 0 ? adminAwards : publicAwards
    return list.filter((a) => a.user_id && !String(a.slot_key).startsWith('matchday_hero'))
  }, [adminAwards, publicAwards])

  useEffect(() => {
    const ids = [...new Set(rows.map((r) => r.user_id).filter(Boolean))] as string[]
    if (ids.length === 0) {
      setProfiles({})
      return
    }
    void (async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .in('id', ids)
      const map: Record<string, { display_name: string; avatar_url: string | null }> = {}
      for (const p of data ?? []) {
        map[p.id as string] = {
          display_name: (p.display_name as string) || 'Winner',
          avatar_url: (p.avatar_url as string | null) ?? null,
        }
      }
      setProfiles(map)
      for (const p of Object.values(map)) {
        if (p.avatar_url) void resolveCachedAvatarUrl(p.avatar_url)
      }
    })()
  }, [rows])

  if (loading) return <div className="h-24 animate-pulse rounded-2xl bg-muted" />
  if (rows.length === 0) return null

  return (
    <div className="rounded-2xl border border-[#E23744]/35 bg-[#E23744]/5 p-4">
      <h4 className="text-sm font-bold">Winner share posters</h4>
      <p className="type-caption mt-1 text-muted">
        Download or share a poster for each prize — avatar + masked Zomato card (PIN hidden).
        {config?.status === 'published' ? ' Results are published.' : ''}
      </p>
      {status && <p className="mt-2 text-sm text-simelabs">{status}</p>}

      <ul className="mt-4 space-y-3">
        {rows.map((award) => {
          if (!award.user_id) return null
          const profile = profiles[award.user_id]
          const zomatoCode =
            'zomato_code' in award && typeof award.zomato_code === 'string'
              ? award.zomato_code
              : null
          const input = buildPrizeWinnerInput({
            ...award,
            winner_display_name:
              award.winner_display_name ?? profile?.display_name ?? 'Winner',
            winner_avatar_url: award.winner_avatar_url ?? profile?.avatar_url ?? null,
            masked_card: award.masked_card ?? maskGiftCardNumber(zomatoCode),
          })
          const busy = busyId === award.id

          return (
            <li
              key={award.id}
              className="flex flex-wrap items-center gap-3 rounded-xl border border-default bg-card px-3 py-3"
            >
              <LeaderboardAvatar
                name={input.winnerName}
                avatarUrl={input.winnerAvatarUrl}
                size="md"
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold uppercase tracking-wide text-[#E23744]">
                  {input.prizeTitle}
                </p>
                <p className="font-semibold">{input.winnerName}</p>
                <p className="text-sm text-simelabs">
                  {formatInr(award.amount_inr)}
                  {input.maskedCard ? ` · ${input.maskedCard}` : ''}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    setBusyId(award.id)
                    setStatus(null)
                    void downloadPrizeWinnerImage(input)
                      .then((ok) =>
                        setStatus(ok ? `Downloaded ${input.prizeTitle}` : 'Download failed'),
                      )
                      .finally(() => setBusyId(null))
                  }}
                  className="rounded-lg bg-muted px-3 py-2 text-xs font-semibold disabled:opacity-50"
                >
                  Download
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    setBusyId(award.id)
                    setStatus(null)
                    void sharePrizeWinnerWithImage(input)
                      .then((r) => setStatus(r.ok ? `Shared ${input.prizeTitle}` : 'Share failed'))
                      .finally(() => setBusyId(null))
                  }}
                  className="rounded-lg bg-simelabs px-3 py-2 text-xs font-semibold text-simelabs-foreground disabled:opacity-50"
                >
                  Share
                </button>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
