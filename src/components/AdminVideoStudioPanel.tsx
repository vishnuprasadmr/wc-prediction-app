import { useEffect, useMemo, useState } from 'react'
import { useMatches } from '../hooks/useMatches'
import { useLeaderboard } from '../hooks/useLeaderboard'
import { fetchMatchPickPreview } from '../lib/fetchMatchPickPreview'
import { buildCrowdSentimentLabel } from '../lib/pickCrowdSentiment'
import { resolveCachedAvatarUrl } from '../lib/avatarCache'
import {
  buildVideoBrief,
  buildVideoPrompt,
  type VideoAspectRatio,
  type VideoBrief,
  type VideoBriefCrowd,
} from '../lib/videoBrief'
import { LeaderboardAvatar } from './LeaderboardAvatar'

const TOP_N_OPTIONS = [5, 10, 15] as const
const ASPECT_OPTIONS: { id: VideoAspectRatio; label: string }[] = [
  { id: '9:16', label: 'Reel · 9:16' },
  { id: '1:1', label: 'Square · 1:1' },
  { id: '16:9', label: 'Wide · 16:9' },
]

const LEAGUE_LABEL = 'Global league'

function downloadTextFile(content: string, filename: string, type = 'application/json'): boolean {
  try {
    const blob = new Blob([content], { type })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.rel = 'noopener'
    link.style.display = 'none'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.setTimeout(() => URL.revokeObjectURL(url), 2000)
    return true
  } catch {
    return false
  }
}

function safeFileName(name: string): string {
  return name.replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase() || 'player'
}

async function dataUrlToBlob(dataUrl: string): Promise<Blob | null> {
  try {
    const res = await fetch(dataUrl)
    return await res.blob()
  } catch {
    return null
  }
}

export function AdminVideoStudioPanel() {
  const { matches } = useMatches()
  const { entries, loading } = useLeaderboard('all', 'global')

  const [topN, setTopN] = useState<number>(10)
  const [aspectRatio, setAspectRatio] = useState<VideoAspectRatio>('9:16')
  const [embedImages, setEmbedImages] = useState(false)
  const [crowdMap, setCrowdMap] = useState<Record<string, VideoBriefCrowd>>({})
  const [status, setStatus] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  // Build once without crowd to learn which matches are featured today.
  const baseBrief = useMemo(
    () => buildVideoBrief({ leagueLabel: LEAGUE_LABEL, entries, matches, topN, aspectRatio }),
    [entries, matches, topN, aspectRatio],
  )

  const featuredMatchKey = baseBrief.matches.map((m) => m.matchId).join(',')

  useEffect(() => {
    let cancelled = false
    const ids = featuredMatchKey ? featuredMatchKey.split(',') : []
    if (ids.length === 0) {
      setCrowdMap({})
      return
    }

    void (async () => {
      const next: Record<string, VideoBriefCrowd> = {}
      for (const m of baseBrief.matches) {
        const sentiment = await fetchMatchPickPreview(m.matchId)
        if (sentiment) {
          next[m.matchId] = {
            homeWinPct: sentiment.homeWinPct,
            drawPct: sentiment.drawPct,
            awayWinPct: sentiment.awayWinPct,
            totalPicks: sentiment.totalPicks,
            label: buildCrowdSentimentLabel(sentiment, m.homeTeam, m.awayTeam),
          }
        }
      }
      if (!cancelled) setCrowdMap(next)
    })()

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [featuredMatchKey])

  const brief = useMemo(
    () =>
      buildVideoBrief({
        leagueLabel: LEAGUE_LABEL,
        entries,
        matches,
        topN,
        aspectRatio,
        crowdByMatchId: crowdMap,
      }),
    [entries, matches, topN, aspectRatio, crowdMap],
  )

  const prompt = useMemo(() => buildVideoPrompt(brief), [brief])

  useEffect(() => {
    for (const asset of brief.assets) {
      if (asset.imageUrl) void resolveCachedAvatarUrl(asset.imageUrl)
    }
  }, [brief.assets])

  const flash = (msg: string) => {
    setStatus(msg)
    window.setTimeout(() => setStatus(null), 3000)
  }

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(prompt)
      flash('Prompt copied — paste into your video AI tool.')
    } catch {
      flash('Copy failed — select and copy manually.')
    }
  }

  const buildExportBrief = async (): Promise<VideoBrief> => {
    if (!embedImages) return brief
    const assets = await Promise.all(
      brief.assets.map(async (a) => ({
        ...a,
        imageDataUrl: a.imageUrl ? await resolveCachedAvatarUrl(a.imageUrl) : null,
      })),
    )
    return { ...brief, assets }
  }

  const handleDownloadJson = async () => {
    setBusy(true)
    setStatus('Preparing JSON…')
    const exportBrief = await buildExportBrief()
    const ok = downloadTextFile(
      JSON.stringify(exportBrief, null, 2),
      `daily-video-brief-${brief.dateLabel.replace(/\s+/g, '-')}.json`,
    )
    setBusy(false)
    flash(ok ? 'JSON downloaded.' : 'Download failed.')
  }

  const handleCopyJson = async () => {
    const exportBrief = await buildExportBrief()
    try {
      await navigator.clipboard.writeText(JSON.stringify(exportBrief, null, 2))
      flash('JSON copied.')
    } catch {
      flash('Copy failed.')
    }
  }

  const handleDownloadAvatars = async () => {
    if (brief.assets.length === 0) {
      flash('No profile pictures to download.')
      return
    }
    setBusy(true)
    setStatus('Fetching profile pictures…')
    let count = 0
    for (const asset of brief.assets) {
      if (!asset.imageUrl) continue
      const dataUrl = await resolveCachedAvatarUrl(asset.imageUrl)
      if (!dataUrl) continue
      const blob = await dataUrlToBlob(dataUrl)
      if (!blob) continue
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      const ext = blob.type.includes('png') ? 'png' : 'jpg'
      link.download = `${asset.ref}-${safeFileName(asset.name)}.${ext}`
      link.rel = 'noopener'
      link.style.display = 'none'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.setTimeout(() => URL.revokeObjectURL(url), 2000)
      count += 1
      // Stagger so browsers don't block the multi-file download burst.
      await new Promise((r) => setTimeout(r, 350))
    }
    setBusy(false)
    flash(count > 0 ? `Downloaded ${count} profile picture${count === 1 ? '' : 's'}.` : 'No images available.')
  }

  return (
    <div className="mb-6 rounded-2xl border border-default bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="type-section-title">AI video studio</h3>
          <p className="type-caption mt-0.5 text-muted">
            Daily standings reel brief — copy the prompt &amp; assets into Google&apos;s video AI
            tool.
          </p>
        </div>
        {status && <span className="text-sm text-simelabs">{status}</span>}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <select
          value={topN}
          onChange={(e) => setTopN(Number(e.target.value))}
          className="rounded-lg bg-muted px-3 py-2 text-sm outline-none"
        >
          {TOP_N_OPTIONS.map((n) => (
            <option key={n} value={n}>
              Top {n}
            </option>
          ))}
        </select>
        <select
          value={aspectRatio}
          onChange={(e) => setAspectRatio(e.target.value as VideoAspectRatio)}
          className="rounded-lg bg-muted px-3 py-2 text-sm outline-none"
        >
          {ASPECT_OPTIONS.map((a) => (
            <option key={a.id} value={a.id}>
              {a.label}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-sm">
          <input
            type="checkbox"
            checked={embedImages}
            onChange={(e) => setEmbedImages(e.target.checked)}
            className="rounded"
          />
          Embed pictures in JSON
        </label>
      </div>

      {loading ? (
        <div className="mt-4 h-40 animate-pulse rounded-xl bg-muted" />
      ) : entries.length === 0 ? (
        <p className="mt-4 text-sm text-muted">No leaderboard entries yet.</p>
      ) : (
        <>
          {/* Meta */}
          <div className="mt-4 rounded-xl border border-default p-4">
            <p className="text-xs font-semibold uppercase text-muted">{brief.videoMeta.title}</p>
            <p className="mt-1 text-sm text-subtle">
              {brief.videoMeta.aspectRatio} · ~{brief.videoMeta.targetDurationSec}s ·{' '}
              {brief.standings.totalPlayers} players · {brief.matches.length} match
              {brief.matches.length === 1 ? '' : 'es'}
            </p>

            {brief.faceOff && (
              <p className="mt-3 rounded-lg bg-muted/40 px-3 py-2 text-sm italic text-theme">
                {brief.faceOff.narrative}
              </p>
            )}

            {/* Top players */}
            <div className="mt-4 space-y-1.5">
              {brief.standings.topTen.map((p) => (
                <div key={p.userId} className="flex items-center gap-2 text-sm">
                  <span className="w-6 font-mono text-muted">{p.rank}</span>
                  <LeaderboardAvatar name={p.name} avatarUrl={p.avatarUrl} size="sm" />
                  <span className="flex-1 truncate font-medium">{p.name}</span>
                  <span className="font-semibold text-simelabs">{p.points} pts</span>
                </div>
              ))}
            </div>

            {/* Matches */}
            {brief.matches.length > 0 && (
              <div className="mt-4 border-t border-default pt-3">
                <p className="text-xs font-semibold uppercase text-muted">Who fought</p>
                <ul className="mt-1 space-y-1 text-sm">
                  {brief.matches.map((m) => (
                    <li key={m.matchId}>
                      <span className="text-theme">{m.resultLabel}</span>
                      {m.crowd && <span className="ml-1 text-muted">· {m.crowd.label}</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Storyboard scenes */}
          <div className="mt-3 space-y-2">
            <p className="text-xs font-semibold uppercase text-muted">Storyboard</p>
            {brief.scenes.map((scene, i) => (
              <div key={scene.id} className="rounded-xl border border-default bg-muted/20 p-3">
                <p className="text-sm font-semibold text-theme">
                  {i + 1}. {scene.title}{' '}
                  <span className="font-normal text-muted">~{scene.durationSec}s</span>
                </p>
                <p className="mt-1 text-sm text-subtle">“{scene.narration}”</p>
                {scene.onScreenText.length > 0 && (
                  <p className="mt-1 text-xs text-muted">
                    On-screen: {scene.onScreenText.join(' · ')}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Prompt preview */}
          <div className="mt-3">
            <p className="text-xs font-semibold uppercase text-muted">Generated prompt</p>
            <pre className="mt-1 max-h-48 overflow-auto whitespace-pre-wrap rounded-xl border border-default bg-muted/30 p-3 text-xs text-subtle">
              {prompt}
            </pre>
          </div>

          {/* Actions */}
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void handleCopyPrompt()}
              className="rounded-xl bg-simelabs px-4 py-2.5 text-sm font-semibold text-simelabs-foreground"
            >
              Copy prompt
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void handleDownloadJson()}
              className="rounded-xl border border-default px-4 py-2.5 text-sm font-medium disabled:opacity-50"
            >
              Download JSON
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void handleCopyJson()}
              className="rounded-xl border border-default px-4 py-2.5 text-sm font-medium disabled:opacity-50"
            >
              Copy JSON
            </button>
            <button
              type="button"
              disabled={busy || brief.assets.length === 0}
              onClick={() => void handleDownloadAvatars()}
              className="rounded-xl border border-default px-4 py-2.5 text-sm font-medium disabled:opacity-50"
            >
              Download avatars ({brief.assets.length})
            </button>
          </div>
        </>
      )}
    </div>
  )
}
