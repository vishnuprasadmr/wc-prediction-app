import { formatStageLabel, wentToShootout } from '../matchUtils'
import { formatKickoffTimeIst, formatShareDateIst, toIstDateKey } from '../timezone'
import type { LeaderboardEntry, Match } from '../types'
import type {
  BuildVideoBriefOptions,
  VideoBrief,
  VideoBriefAsset,
  VideoBriefFaceOff,
  VideoBriefMatch,
  VideoBriefPlayer,
  VideoBriefScene,
} from './types'

const DEFAULT_TOP_N = 10
const DEFAULT_DURATION_SEC = 45
const MAX_FALLBACK_MATCHES = 6

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return `${n}${s[(v - 20) % 10] ?? s[v] ?? s[0]}`
}

function assetRefForRank(rank: number): string {
  return `player-${rank}`
}

function toPlayer(entry: LeaderboardEntry, withAsset: boolean): VideoBriefPlayer {
  return {
    rank: entry.rank,
    userId: entry.user_id,
    name: entry.display_name,
    points: entry.total_points,
    exactScores: entry.exact_scores,
    predictionsMade: entry.predictions_made,
    avatarUrl: entry.avatar_url ?? null,
    assetRef: withAsset && entry.avatar_url ? assetRefForRank(entry.rank) : null,
  }
}

/** Today's fixtures (IST); falls back to the most recent finished matches. */
function selectDayMatches(matches: Match[], now: number): Match[] {
  const todayKey = toIstDateKey(new Date(now).toISOString())
  const today = matches
    .filter((m) => toIstDateKey(m.kickoff_at) === todayKey)
    .sort((a, b) => new Date(a.kickoff_at).getTime() - new Date(b.kickoff_at).getTime())

  if (today.length > 0) return today

  return matches
    .filter((m) => m.status === 'finished' && m.home_score != null && m.away_score != null)
    .sort((a, b) => new Date(b.kickoff_at).getTime() - new Date(a.kickoff_at).getTime())
    .slice(0, MAX_FALLBACK_MATCHES)
}

function resultLabel(match: Match): string {
  if (match.status === 'finished' && match.home_score != null && match.away_score != null) {
    const base = `${match.home_team} ${match.home_score}–${match.away_score} ${match.away_team}`
    if (wentToShootout(match)) {
      return `${base} (${match.home_penalties}–${match.away_penalties} pens)`
    }
    return base
  }
  if (match.status === 'live') {
    const score =
      match.home_score != null && match.away_score != null
        ? ` ${match.home_score}–${match.away_score}`
        : ''
    return `LIVE${score}: ${match.home_team} vs ${match.away_team}`
  }
  return `Kicks off ${formatKickoffTimeIst(match.kickoff_at)} IST`
}

function toBriefMatch(
  match: Match,
  crowdByMatchId: Record<string, VideoBriefMatch['crowd']>,
): VideoBriefMatch {
  return {
    matchId: match.id,
    stageLabel: formatStageLabel(match.stage, match.group_name),
    homeTeam: match.home_team,
    awayTeam: match.away_team,
    homeFlag: match.home_flag,
    awayFlag: match.away_flag,
    status: match.status,
    homeScore: match.home_score,
    awayScore: match.away_score,
    wentToShootout: wentToShootout(match),
    homePenalties: match.home_penalties ?? null,
    awayPenalties: match.away_penalties ?? null,
    resultLabel: resultLabel(match),
    kickoffLabel: `${formatKickoffTimeIst(match.kickoff_at)} IST`,
    crowd: crowdByMatchId[match.id] ?? null,
  }
}

function buildFaceOff(topThree: VideoBriefPlayer[]): VideoBriefFaceOff | null {
  const leader = topThree[0]
  if (!leader) return null

  const challengers = topThree.slice(1)
  const second = challengers[0]
  const gapToSecond = second ? leader.points - second.points : null

  let narrative: string
  if (!second) {
    narrative = `${leader.name} stands alone at the top with ${leader.points} points.`
  } else if (gapToSecond === 0) {
    narrative = `${leader.name} and ${second.name} are locked together on ${leader.points} points — too close to call.`
  } else {
    const lead = gapToSecond ?? 0
    narrative = `${leader.name} leads by ${lead} point${lead === 1 ? '' : 's'} over ${second.name}${
      challengers[1] ? `, with ${challengers[1].name} hunting in ${ordinal(challengers[1].rank)}` : ''
    }.`
  }

  return { leader, challengers, gapToSecond, narrative }
}

function sharpestPredictor(entries: LeaderboardEntry[]): VideoBriefPlayer | null {
  const ranked = [...entries]
    .filter((e) => e.predictions_made > 0)
    .sort((a, b) => b.exact_scores - a.exact_scores || a.rank - b.rank)
  const top = ranked[0]
  if (!top || top.exact_scores <= 0) return null
  return toPlayer(top, false)
}

function buildScenes(args: {
  leagueLabel: string
  dateLabel: string
  topThree: VideoBriefPlayer[]
  topTen: VideoBriefPlayer[]
  faceOff: VideoBriefFaceOff | null
  matches: VideoBriefMatch[]
  sharpest: VideoBriefPlayer | null
}): VideoBriefScene[] {
  const { leagueLabel, dateLabel, topThree, topTen, faceOff, matches, sharpest } = args
  const scenes: VideoBriefScene[] = []

  scenes.push({
    id: 'intro',
    title: 'Intro sting',
    narration: `This is your ${leagueLabel} daily report for ${dateLabel}.`,
    onScreenText: [leagueLabel.toUpperCase(), 'DAILY STANDINGS', dateLabel],
    visual:
      'High-energy sports broadcast open: stadium floodlights, fast camera push toward a glowing leaderboard hologram, brand colours.',
    durationSec: 4,
    assetRefs: [],
  })

  if (matches.length > 0) {
    const finished = matches.filter((m) => m.status === 'finished')
    const lines = matches.map((m) => m.resultLabel)
    scenes.push({
      id: 'matches',
      title: 'Who fought today',
      narration:
        finished.length > 0
          ? `On the pitch: ${finished.map((m) => m.resultLabel).join('; ')}.`
          : `Coming up: ${matches.map((m) => `${m.homeTeam} vs ${m.awayTeam}`).join('; ')}.`,
      onScreenText: lines,
      visual:
        'Split-screen national flags clashing with a spark in the middle; scorelines stamp onto the screen with impact.',
      durationSec: 9,
      assetRefs: [],
    })
  }

  if (faceOff) {
    scenes.push({
      id: 'faceoff',
      title: 'Leader vs chasers',
      narration: faceOff.narrative,
      onScreenText: [
        `#1 ${faceOff.leader.name} — ${faceOff.leader.points} pts`,
        ...faceOff.challengers.map((c) => `#${c.rank} ${c.name} — ${c.points} pts`),
      ],
      visual:
        'Boxing-style face-off: the leader on one side, challengers on the other, profile pictures lit dramatically, lightning between them.',
      durationSec: 8,
      assetRefs: [faceOff.leader, ...faceOff.challengers]
        .map((p) => p.assetRef)
        .filter((r): r is string => Boolean(r)),
    })
  }

  if (topThree.length > 0) {
    scenes.push({
      id: 'top3',
      title: 'Podium — Top 3',
      narration: `On the podium: ${topThree
        .map((p) => `${ordinal(p.rank)}, ${p.name} with ${p.points} points`)
        .join('; ')}.`,
      onScreenText: topThree.map((p) => `#${p.rank} ${p.name} · ${p.points} pts`),
      visual:
        'Three-tier winners podium rising from the floor, gold/silver/bronze glow, confetti on the #1 spot; round profile pictures float above each plinth.',
      durationSec: 9,
      assetRefs: topThree.map((p) => p.assetRef).filter((r): r is string => Boolean(r)),
    })
  }

  if (topTen.length > 0) {
    scenes.push({
      id: 'top10',
      title: 'Top 10 table',
      narration: `Here's the full top ${topTen.length} on the table.`,
      onScreenText: topTen.map((p) => `${p.rank}. ${p.name} — ${p.points} pts`),
      visual:
        'Clean animated leaderboard list scrolling in, each row sliding from the right with the player\'s profile picture as a row avatar.',
      durationSec: 9,
      assetRefs: topTen.map((p) => p.assetRef).filter((r): r is string => Boolean(r)),
    })
  }

  const crowdLines = matches
    .filter((m) => m.crowd)
    .map((m) => `${m.homeTeam} vs ${m.awayTeam}: ${m.crowd!.label}`)
  if (sharpest || crowdLines.length > 0) {
    scenes.push({
      id: 'predictions',
      title: 'Prediction watch',
      narration: sharpest
        ? `${sharpest.name} is the sharpest forecaster with ${sharpest.exactScores} exact scoreline${
            sharpest.exactScores === 1 ? '' : 's'
          }.`
        : 'The crowd has spoken on today\'s fixtures.',
      onScreenText: [
        ...(sharpest ? [`Sharpest: ${sharpest.name} (${sharpest.exactScores} exact)`] : []),
        ...crowdLines,
      ],
      visual:
        'Data-viz overlay: animated percentage bars and a crystal-ball motif for predictions, crowd split bars filling up.',
      durationSec: 6,
      assetRefs: [],
    })
  }

  scenes.push({
    id: 'outro',
    title: 'Outro',
    narration: 'Make your picks before lock and climb the table. See you tomorrow!',
    onScreenText: ['PREDICT.', 'CLIMB.', 'REPEAT.'],
    visual:
      'Logo resolve on brand colour, call-to-action lower third, quick confetti burst then fade to black.',
    durationSec: 4,
    assetRefs: [],
  })

  return scenes
}

function buildAssets(topTen: VideoBriefPlayer[]): VideoBriefAsset[] {
  return topTen
    .filter((p) => p.assetRef && p.avatarUrl)
    .map((p) => ({
      ref: p.assetRef!,
      userId: p.userId,
      name: p.name,
      imageUrl: p.avatarUrl,
    }))
}

/**
 * Aggregate leaderboard + matches into a structured brief for an AI video tool.
 * Pure and deterministic given `now`.
 */
export function buildVideoBrief(options: BuildVideoBriefOptions): VideoBrief {
  const {
    leagueLabel,
    entries,
    matches,
    topN = DEFAULT_TOP_N,
    crowdByMatchId = {},
    aspectRatio = '9:16',
    targetDurationSec = DEFAULT_DURATION_SEC,
    now = Date.now(),
  } = options

  const ranked = [...entries].sort((a, b) => a.rank - b.rank)
  const topTen = ranked.slice(0, topN).map((e) => toPlayer(e, true))
  const topThree = topTen.slice(0, 3)

  const dayMatches = selectDayMatches(matches, now)
  const briefMatches = dayMatches.map((m) => toBriefMatch(m, crowdByMatchId))

  const faceOff = buildFaceOff(topThree)
  const sharpest = sharpestPredictor(ranked)
  const dateLabel = formatShareDateIst(now)

  const scenes = buildScenes({
    leagueLabel,
    dateLabel,
    topThree,
    topTen,
    faceOff,
    matches: briefMatches,
    sharpest,
  })

  return {
    generatedAt: new Date(now).toISOString(),
    dateLabel,
    leagueLabel,
    videoMeta: {
      title: `${leagueLabel} — Daily Standings (${dateLabel})`,
      aspectRatio,
      targetDurationSec,
      style: 'energetic sports broadcast, neon scoreboard graphics, dynamic camera moves',
      musicMood: 'upbeat stadium anthem with a driving beat',
    },
    standings: {
      topThree,
      topTen,
      totalPlayers: entries.length,
    },
    faceOff,
    matches: briefMatches,
    predictions: {
      sharpestPredictor: sharpest,
      matchCrowd: briefMatches.filter((m) => m.crowd),
    },
    scenes,
    assets: buildAssets(topTen),
  }
}
