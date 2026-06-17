import { canvasToBlob, ensureShareFonts, roundRect } from './canvasUtils'
import type { UpcomingMatchCardInput } from './upcomingMatchTypes'
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
const HERO_H = 520
const PANEL_TOP = 580
const PANEL_BOTTOM = CARD_H - 96
const LAYOUT_RIGHT = 820
const VS_GAP = 48

async function drawFixtureStrip(
  ctx: CanvasRenderingContext2D,
  input: UpcomingMatchCardInput,
  centerY: number,
): Promise<void> {
  const { match } = input
  const flagW = 108
  const flagH = 72
  const stripLeft = 72
  const stripWidth = LAYOUT_RIGHT - stripLeft

  ctx.font = '800 40px "Plus Jakarta Sans", Inter, system-ui, sans-serif'
  ctx.fillStyle = C.accent
  const vsText = 'VS'
  const vsW = ctx.measureText(vsText).width

  const totalW = flagW + VS_GAP + vsW + VS_GAP + flagW
  const startX = stripLeft + Math.max(0, (stripWidth - totalW) / 2)

  const homeX = startX
  const vsX = startX + flagW + VS_GAP + vsW / 2
  const awayX = startX + flagW + VS_GAP + vsW + VS_GAP
  const flagY = centerY - flagH / 2

  await drawFlagChip(ctx, match.homeTeam, homeX, flagY, flagW, flagH)
  await drawFlagChip(ctx, match.awayTeam, awayX, flagY, flagW, flagH)

  ctx.font = '800 40px "Plus Jakarta Sans", Inter, system-ui, sans-serif'
  ctx.fillStyle = C.accent
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(vsText, vsX, centerY)
  ctx.textBaseline = 'alphabetic'

  ctx.font = '600 20px Inter, system-ui, sans-serif'
  ctx.fillStyle = C.textSubtle
  ctx.textAlign = 'center'
  const nameY = flagY + flagH + 28
  ctx.fillText(truncate(ctx, match.homeTeam, 140), homeX + flagW / 2, nameY)
  ctx.fillText(truncate(ctx, match.awayTeam, 140), awayX + flagW / 2, nameY)
}

function drawContentPanel(ctx: CanvasRenderingContext2D): void {
  const panelH = PANEL_BOTTOM - PANEL_TOP
  roundRect(ctx, 56, PANEL_TOP, CARD_W - 112, panelH, 28)
  ctx.fillStyle = C.panel
  ctx.fill()
  ctx.strokeStyle = C.panelBorder
  ctx.lineWidth = 2
  ctx.stroke()
}

function drawKickoffBlock(ctx: CanvasRenderingContext2D, input: UpcomingMatchCardInput, y: number): number {
  const { match } = input

  ctx.font = '700 18px Inter, system-ui, sans-serif'
  ctx.fillStyle = C.accent
  ctx.textAlign = 'center'
  ctx.fillText(match.kickoffDayLabel.toUpperCase(), CARD_W / 2, y + 28)

  ctx.font = '800 42px "Plus Jakarta Sans", Inter, system-ui, sans-serif'
  ctx.fillStyle = C.text
  const kickoffLines = wrapTextLines(ctx, match.kickoffLabel, CARD_W - 120, 2)
  let cy = y + 72
  for (const line of kickoffLines) {
    ctx.fillText(line, CARD_W / 2, cy)
    cy += 48
  }

  ctx.font = '600 22px Inter, system-ui, sans-serif'
  ctx.fillStyle = C.textMuted
  ctx.fillText(`Predictions lock ${match.lockTimeLabel} IST`, CARD_W / 2, cy + 8)

  return cy + 40
}

function drawCaptainRow(
  ctx: CanvasRenderingContext2D,
  label: string,
  name: string,
  number: number,
  y: number,
): number {
  const boxX = 80
  const boxW = CARD_W - 160
  const rowH = 64

  roundRect(ctx, boxX, y, boxW, rowH, 16)
  ctx.fillStyle = C.chipBg
  ctx.fill()
  ctx.strokeStyle = C.panelBorder
  ctx.lineWidth = 1
  ctx.stroke()

  ctx.font = '700 16px Inter, system-ui, sans-serif'
  ctx.fillStyle = C.textMuted
  ctx.textAlign = 'left'
  ctx.fillText(label, boxX + 20, y + 26)

  ctx.font = '800 26px Inter, system-ui, sans-serif'
  ctx.fillStyle = C.text
  ctx.fillText(truncate(ctx, name, boxW - 100), boxX + 20, y + 52)

  if (number > 0) {
    ctx.font = '800 22px Inter, system-ui, sans-serif'
    ctx.fillStyle = C.accent
    ctx.textAlign = 'right'
    ctx.fillText(`#${number}`, boxX + boxW - 20, y + 44)
  }

  return y + rowH + 12
}

function drawMeta(ctx: CanvasRenderingContext2D, input: UpcomingMatchCardInput, y: number): void {
  const { match } = input
  ctx.font = F.caption
  ctx.fillStyle = C.textMuted
  ctx.textAlign = 'center'

  const lines = [match.stageLabel]
  if (match.venueLabel) lines.push(match.venueLabel)
  lines.push(match.ctaLine)

  let cy = y
  for (const line of lines) {
    ctx.fillText(truncate(ctx, line, CARD_W - 120), CARD_W / 2, cy)
    cy += 26
  }
}

export async function renderUpcomingMatchCanvas(
  input: UpcomingMatchCardInput,
): Promise<HTMLCanvasElement> {
  await ensureShareFonts()

  const canvas = document.createElement('canvas')
  canvas.width = CARD_W
  canvas.height = CARD_H
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas not supported')

  const hero = input.match.hero
  await drawHeroBackdrop(ctx, hero.pictureUrl, hero.backdropTeam, HERO_TOP + HERO_H)
  drawShareFrame(ctx)
  await drawShareBranding(ctx)

  ctx.font = F.headingSm
  ctx.fillStyle = C.text
  ctx.textAlign = 'left'
  ctx.fillText('NEXT MATCH', 72, 168)

  ctx.font = '700 18px Inter, system-ui, sans-serif'
  ctx.fillStyle = C.accent
  ctx.textAlign = 'left'
  ctx.fillText('CAPTAIN SPOTLIGHT', 72, 200)

  ctx.font = '800 34px "Plus Jakarta Sans", Inter, system-ui, sans-serif'
  ctx.fillStyle = C.text
  const headlineLines = wrapTextLines(ctx, hero.headline, LAYOUT_RIGHT - 88, 2)
  let hy = 248
  for (const line of headlineLines) {
    ctx.fillText(line, 72, hy)
    hy += 40
  }

  const stripY = HERO_TOP + HERO_H - 88
  await drawFixtureStrip(ctx, input, stripY)

  drawContentPanel(ctx)

  let y = PANEL_TOP + 24
  y = drawKickoffBlock(ctx, input, y)
  y = drawCaptainRow(ctx, `${input.match.homeTeam} captain`, input.match.homeCaptain.name, input.match.homeCaptain.number, y)
  drawCaptainRow(ctx, `${input.match.awayTeam} captain`, input.match.awayCaptain.name, input.match.awayCaptain.number, y)
  drawMeta(ctx, input, PANEL_BOTTOM - 72)

  drawShareFooter(ctx, input.dateLabel)

  return canvas
}

export async function renderUpcomingMatchBlob(input: UpcomingMatchCardInput): Promise<Blob> {
  return canvasToBlob(await renderUpcomingMatchCanvas(input))
}
