import { canvasToBlob, ensureShareFonts, roundRect } from './canvasUtils'
import type { MatchdayCardInput } from './matchdayTypes'
import {
  CARD_H,
  CARD_W,
  C,
  F,
  drawFlagChip,
  drawShareFooter,
  drawShareFrame,
  drawShareBranding,
  truncate,
} from './shareCardCommon'

async function drawMatchRow(
  ctx: CanvasRenderingContext2D,
  row: MatchdayCardInput['matches'][number],
  y: number,
): Promise<number> {
  const rowH = 88
  const rowX = 72
  const rowW = CARD_W - 144

  roundRect(ctx, rowX, y, rowW, rowH, 16)
  ctx.fillStyle = C.panel
  ctx.fill()
  ctx.strokeStyle = C.panelBorder
  ctx.lineWidth = 2
  ctx.stroke()

  const flagW = 64
  const flagH = 42
  const midY = y + rowH / 2

  await drawFlagChip(ctx, row.homeTeam, rowX + 20, midY - flagH / 2, flagW, flagH)
  await drawFlagChip(ctx, row.awayTeam, rowX + rowW - 20 - flagW, midY - flagH / 2, flagW, flagH)

  ctx.font = '800 36px "Plus Jakarta Sans", Inter, system-ui, sans-serif'
  ctx.fillStyle = C.text
  ctx.textAlign = 'center'
  ctx.fillText(`${row.homeScore} – ${row.awayScore}`, CARD_W / 2, midY + 12)

  ctx.font = '500 18px Inter, system-ui, sans-serif'
  ctx.fillStyle = C.textMuted
  ctx.fillText(truncate(ctx, row.homeTeam, 100), rowX + 20 + flagW / 2, midY + flagH / 2 + 22)
  ctx.fillText(truncate(ctx, row.awayTeam, 100), rowX + rowW - 20 - flagW / 2, midY + flagH / 2 + 22)

  return y + rowH + 12
}

export async function renderMatchdayCanvas(input: MatchdayCardInput): Promise<HTMLCanvasElement> {
  await ensureShareFonts()

  const canvas = document.createElement('canvas')
  canvas.width = CARD_W
  canvas.height = CARD_H
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas not supported')

  ctx.fillStyle = C.bg
  ctx.fillRect(0, 0, CARD_W, CARD_H)

  const glow = ctx.createRadialGradient(CARD_W / 2, 260, 40, CARD_W / 2, 260, 500)
  glow.addColorStop(0, C.accentGlow)
  glow.addColorStop(1, 'transparent')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, CARD_W, CARD_H)

  drawShareFrame(ctx)
  await drawShareBranding(ctx)

  ctx.font = F.headingSm
  ctx.fillStyle = C.accent
  ctx.textAlign = 'center'
  ctx.fillText(input.title, CARD_W / 2, 200)

  ctx.font = F.label
  ctx.fillStyle = C.textMuted
  ctx.fillText(input.subtitle, CARD_W / 2, 244)

  let y = 280
  for (const row of input.matches) {
    y = await drawMatchRow(ctx, row, y)
  }

  drawShareFooter(ctx, input.dateLabel)

  return canvas
}

export async function renderMatchdayBlob(input: MatchdayCardInput): Promise<Blob> {
  return canvasToBlob(await renderMatchdayCanvas(input))
}
