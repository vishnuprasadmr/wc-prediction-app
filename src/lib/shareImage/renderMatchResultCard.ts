import { canvasToBlob, ensureShareFonts, roundRect } from './canvasUtils'
import type { MatchResultCardInput } from './matchResultTypes'
import {
  CARD_H,
  CARD_W,
  C,
  F,
  drawFlagChip,
  drawHeroBackdrop,
  drawShareFooter,
  drawShareFrame,
  drawShareBranding,
  truncate,
  wrapTextLines,
} from './shareCardCommon'

const HERO_TOP = 40
const HERO_H = 500
const PANEL_TOP = 560
const PANEL_BOTTOM = CARD_H - 96
const PANEL_H = PANEL_BOTTOM - PANEL_TOP
/** Keep flags & score left of the QR column (QR starts ~x860). */
const LAYOUT_RIGHT = 820

const SCORE_STRIP_GAP = 56

async function drawScoreStrip(
  ctx: CanvasRenderingContext2D,
  input: MatchResultCardInput,
  centerY: number,
): Promise<void> {
  const { result } = input
  const flagW = 108
  const flagH = 72
  const stripLeft = 72
  const stripWidth = LAYOUT_RIGHT - stripLeft

  const scoreText = `${result.homeScore} – ${result.awayScore}`
  ctx.font = F.score
  const scoreW = ctx.measureText(scoreText).width

  const totalW = flagW + SCORE_STRIP_GAP + scoreW + SCORE_STRIP_GAP + flagW
  const startX = stripLeft + Math.max(0, (stripWidth - totalW) / 2)

  const homeX = startX
  const scoreX = startX + flagW + SCORE_STRIP_GAP + scoreW / 2
  const awayX = startX + flagW + SCORE_STRIP_GAP + scoreW + SCORE_STRIP_GAP
  const flagY = centerY - flagH / 2

  await drawFlagChip(ctx, result.homeTeam, homeX, flagY, flagW, flagH)
  await drawFlagChip(ctx, result.awayTeam, awayX, flagY, flagW, flagH)

  ctx.font = F.score
  ctx.fillStyle = C.text
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(scoreText, scoreX, centerY)
  ctx.textBaseline = 'alphabetic'

  ctx.font = '600 20px Inter, system-ui, sans-serif'
  ctx.fillStyle = C.textSubtle
  ctx.textAlign = 'center'
  const nameY = flagY + flagH + 28
  ctx.fillText(truncate(ctx, result.homeTeam, 140), homeX + flagW / 2, nameY)
  ctx.fillText(truncate(ctx, result.awayTeam, 140), awayX + flagW / 2, nameY)
}

function drawContentPanel(ctx: CanvasRenderingContext2D): void {
  roundRect(ctx, 56, PANEL_TOP, CARD_W - 112, PANEL_H, 28)
  ctx.fillStyle = C.panel
  ctx.fill()
  ctx.strokeStyle = C.panelBorder
  ctx.lineWidth = 2
  ctx.stroke()
}

function drawWinnerBanner(ctx: CanvasRenderingContext2D, input: MatchResultCardInput, y: number): number {
  const { result } = input

  ctx.font = F.headingSm
  ctx.fillStyle = result.isDraw ? C.textMuted : result.isCleanSheet ? C.gold : C.accent
  ctx.textAlign = 'center'
  ctx.fillText(result.winnerLabel, CARD_W / 2, y + 44)

  if (result.isCleanSheet) {
    const chipW = 180
    const chipX = CARD_W / 2 - chipW / 2
    const chipY = y + 58
    roundRect(ctx, chipX, chipY, chipW, 34, 17)
    ctx.fillStyle = C.goldGlow
    ctx.fill()
    ctx.strokeStyle = C.gold
    ctx.lineWidth = 2
    ctx.stroke()
    ctx.font = '800 17px Inter, system-ui, sans-serif'
    ctx.fillStyle = C.gold
    ctx.fillText('CLEAN SHEET', CARD_W / 2, chipY + 22)
    return y + 108
  }

  return y + 72
}

function drawHeroHeadline(ctx: CanvasRenderingContext2D, input: MatchResultCardInput, y: number): number {
  const hero = input.result.hero

  ctx.font = '700 18px Inter, system-ui, sans-serif'
  ctx.fillStyle = C.accent
  ctx.textAlign = 'left'
  ctx.fillText('MATCH HERO', 88, y + 20)

  ctx.font = '800 38px "Plus Jakarta Sans", Inter, system-ui, sans-serif'
  ctx.fillStyle = C.text
  const headlineLines = wrapTextLines(ctx, hero.headline, CARD_W - 176, 2)
  let cy = y + 58
  for (const line of headlineLines) {
    ctx.fillText(line, 88, cy)
    cy += 44
  }

  if (hero.subline) {
    ctx.font = '500 22px Inter, system-ui, sans-serif'
    ctx.fillStyle = C.textMuted
    const subLines = wrapTextLines(ctx, hero.subline, CARD_W - 176, 2)
    for (const line of subLines) {
      ctx.fillText(line, 88, cy)
      cy += 30
    }
  }

  return cy + 12
}

function drawScorersPanel(ctx: CanvasRenderingContext2D, input: MatchResultCardInput, y: number, maxY: number): number {
  const scorers = input.result.scorers.slice(0, 6)
  if (scorers.length === 0) return y

  const boxX = 80
  const boxW = CARD_W - 160
  const headerY = y + 8

  ctx.font = '700 18px Inter, system-ui, sans-serif'
  ctx.fillStyle = C.textMuted
  ctx.textAlign = 'left'
  ctx.fillText('GOAL SCORERS', boxX, headerY)

  const rowsTop = headerY + 28
  const rowsBottom = maxY - 12
  const rowH = Math.min(58, Math.max(46, (rowsBottom - rowsTop) / scorers.length))

  let cy = rowsTop + 34
  for (const scorer of scorers) {
    const rowY = cy - 34
    roundRect(ctx, boxX, rowY, boxW, rowH - 8, 14)
    ctx.fillStyle = C.chipBg
    ctx.fill()
    ctx.strokeStyle = C.panelBorder
    ctx.lineWidth = 1
    ctx.stroke()

    const mins = scorer.minutes.join(', ')
    const suffix =
      scorer.goalCount >= 3 ? ' · hat-trick' : scorer.goalCount === 2 ? ' · brace' : scorer.isPenalty ? ' (pen)' : ''

    ctx.font = '700 24px Inter, system-ui, sans-serif'
    ctx.fillStyle = C.text
    ctx.fillText(scorer.playerName, boxX + 20, cy)

    ctx.font = '600 22px Inter, system-ui, sans-serif'
    ctx.fillStyle = C.accent
    ctx.textAlign = 'right'
    ctx.fillText(`${mins}${suffix}`, boxX + boxW - 20, cy)
    ctx.textAlign = 'left'

    cy += rowH
  }

  return cy + 8
}

function drawStage(ctx: CanvasRenderingContext2D, input: MatchResultCardInput, y: number): void {
  ctx.font = F.caption
  ctx.fillStyle = C.textMuted
  ctx.textAlign = 'center'
  ctx.fillText(input.result.stageLabel, CARD_W / 2, y)
}

export async function renderMatchResultCanvas(input: MatchResultCardInput): Promise<HTMLCanvasElement> {
  await ensureShareFonts()

  const canvas = document.createElement('canvas')
  canvas.width = CARD_W
  canvas.height = CARD_H
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas not supported')

  const hero = input.result.hero
  await drawHeroBackdrop(ctx, hero.pictureUrl, hero.backdropTeam ?? hero.teamName, HERO_TOP + HERO_H)
  drawShareFrame(ctx)
  await drawShareBranding(ctx)

  ctx.font = F.headingSm
  ctx.fillStyle = C.text
  ctx.textAlign = 'left'
  ctx.fillText('FULL TIME', 72, 168)

  const scoreCenterY = HERO_TOP + HERO_H - 72
  await drawScoreStrip(ctx, input, scoreCenterY)

  drawContentPanel(ctx)

  let y = PANEL_TOP + 28
  y = drawWinnerBanner(ctx, input, y)
  y = drawHeroHeadline(ctx, input, y)
  y = drawScorersPanel(ctx, input, y, PANEL_BOTTOM - 36)
  drawStage(ctx, input, PANEL_BOTTOM - 16)

  drawShareFooter(ctx, input.dateLabel)

  return canvas
}

export async function renderMatchResultBlob(input: MatchResultCardInput): Promise<Blob> {
  return canvasToBlob(await renderMatchResultCanvas(input))
}
