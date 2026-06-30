import type { MatchStatus } from '../types'

/** Aspect ratios most useful for daily social reels. */
export type VideoAspectRatio = '9:16' | '1:1' | '16:9'

/** A player featured in the standings, with an optional reference into `assets`. */
export interface VideoBriefPlayer {
  rank: number
  userId: string
  name: string
  points: number
  exactScores: number
  predictionsMade: number
  avatarUrl: string | null
  /** Reference into VideoBrief.assets for the player's profile picture, when available. */
  assetRef: string | null
}

/** Crowd prediction split for a single match. */
export interface VideoBriefCrowd {
  homeWinPct: number
  drawPct: number
  awayWinPct: number
  totalPicks: number
  label: string
}

/** A match the league "fought" — today's fixtures (or recent results as fallback). */
export interface VideoBriefMatch {
  matchId: string
  stageLabel: string
  homeTeam: string
  awayTeam: string
  homeFlag: string
  awayFlag: string
  status: MatchStatus
  homeScore: number | null
  awayScore: number | null
  wentToShootout: boolean
  homePenalties: number | null
  awayPenalties: number | null
  /** Display-ready outcome, e.g. "Brazil 2–1 Morocco" or "Kicks off 19:30 IST". */
  resultLabel: string
  kickoffLabel: string
  crowd: VideoBriefCrowd | null
}

/** The "leader vs chasers" rivalry framing derived from the standings. */
export interface VideoBriefFaceOff {
  leader: VideoBriefPlayer
  challengers: VideoBriefPlayer[]
  gapToSecond: number | null
  narrative: string
}

/** Prediction storyline: the sharpest forecaster + per-match crowd splits. */
export interface VideoBriefPredictions {
  sharpestPredictor: VideoBriefPlayer | null
  matchCrowd: VideoBriefMatch[]
}

/** One storyboard beat for the AI video generator. */
export interface VideoBriefScene {
  id: string
  title: string
  /** Voiceover / narration line for this beat. */
  narration: string
  /** Text overlays that should appear on screen. */
  onScreenText: string[]
  /** Natural-language description of the visuals for the AI. */
  visual: string
  durationSec: number
  /** Asset refs (profile pictures) used in this scene. */
  assetRefs: string[]
}

/** A downloadable/linkable image asset (a player's Google profile picture). */
export interface VideoBriefAsset {
  ref: string
  userId: string
  name: string
  imageUrl: string | null
  /** Optional inlined base64 data URL (only populated when explicitly embedded). */
  imageDataUrl?: string | null
}

export interface VideoBriefMeta {
  title: string
  aspectRatio: VideoAspectRatio
  targetDurationSec: number
  style: string
  musicMood: string
}

/**
 * The full machine-readable brief handed to a video AI tool (Gemini / Veo).
 * Pair with `buildVideoPrompt()` for the copy-paste text prompt.
 */
export interface VideoBrief {
  generatedAt: string
  dateLabel: string
  leagueLabel: string
  videoMeta: VideoBriefMeta
  standings: {
    topThree: VideoBriefPlayer[]
    topTen: VideoBriefPlayer[]
    totalPlayers: number
  }
  faceOff: VideoBriefFaceOff | null
  matches: VideoBriefMatch[]
  predictions: VideoBriefPredictions
  scenes: VideoBriefScene[]
  assets: VideoBriefAsset[]
}

export interface BuildVideoBriefOptions {
  leagueLabel: string
  /** Pre-ranked leaderboard entries (rank 1 first). */
  entries: import('../types').LeaderboardEntry[]
  matches: import('../types').Match[]
  /** How many players to include in the standings table. */
  topN?: number
  /** Crowd sentiment keyed by match id, fetched separately via RPC. */
  crowdByMatchId?: Record<string, VideoBriefCrowd>
  aspectRatio?: VideoAspectRatio
  targetDurationSec?: number
  now?: number
}
