import { canvasToBlob, computeCoverDraw, ensureShareFonts, loadImage, roundRect } from './canvasUtils'
import type { MealChallengeCardInput } from './mealChallengeTypes'
import {
  CARD_H,
  CARD_W,
  C,
  F,
  drawShareBranding,
  drawShareFooter,
  drawShareFrame,
  truncate,
  wrapTextLines,
} from './shareCardCommon'

const MEAL_RED = '#E23744'

export async function renderMealFulfillmentCanvas(
  input: MealChallengeCardInput,
): Promise<HTMLCanvasElement> {
  await ensureShareFonts()
  const canvas = document.createElement('canvas')
  canvas.width = CARD_W
  canvas.height = CARD_H
  const ctx = canvas.getContext('2d')!
  const { share } = input

  ctx.fillStyle = C.bg
  ctx.fillRect(0, 0, CARD_W, CARD_H)

  const glow = ctx.createRadialGradient(CARD_W / 2, 520, 40, CARD_W / 2, 520, 560)
  glow.addColorStop(0, 'rgba(226, 55, 68, 0.2)')
  glow.addColorStop(1, 'transparent')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, CARD_W, CARD_H)

  drawShareFrame(ctx)
  await drawShareBranding(ctx)

  ctx.font = F.overline
  ctx.fillStyle = MEAL_RED
  ctx.textAlign = 'center'
  ctx.fillText(share.badge, CARD_W / 2, 188)

  ctx.font = F.caption
  ctx.fillStyle = C.textMuted
  const scoreBit = share.scoreLabel ? `FT ${share.scoreLabel}` : share.kickoffLabel
  ctx.fillText(`${share.homeTeam} vs ${share.awayTeam} · ${scoreBit}`, CARD_W / 2, 228)

  const photoY = 260
  const photoH = 520
  const photoPad = 56
  roundRect(ctx, photoPad, photoY, CARD_W - photoPad * 2, photoH, 24)
  ctx.fillStyle = C.panel
  ctx.fill()
  ctx.strokeStyle = 'rgba(226, 55, 68, 0.4)'
  ctx.lineWidth = 2
  ctx.stroke()

  if (share.photoUrl) {
    const img = await loadImage(share.photoUrl)
    if (img) {
      ctx.save()
      roundRect(ctx, photoPad + 4, photoY + 4, CARD_W - photoPad * 2 - 8, photoH - 8, 20)
      ctx.clip()
      const rect = { x: photoPad + 4, y: photoY + 4, w: CARD_W - photoPad * 2 - 8, h: photoH - 8 }
      const { dx, dy, dw, dh } = computeCoverDraw(img.width, img.height, rect, 'center')
      ctx.drawImage(img, dx, dy, dw, dh)
      ctx.restore()
    }
  } else {
    ctx.font = '600 28px Inter, system-ui, sans-serif'
    ctx.fillStyle = C.textMuted
    ctx.textAlign = 'center'
    ctx.fillText('🍽️', CARD_W / 2, photoY + photoH / 2 - 12)
    ctx.font = F.caption
    ctx.fillText('Meal proof photo', CARD_W / 2, photoY + photoH / 2 + 28)
  }

  let y = photoY + photoH + 48
  ctx.textAlign = 'left'
  ctx.font = '800 36px "Plus Jakarta Sans", Inter, system-ui, sans-serif'
  ctx.fillStyle = C.text
  ctx.fillText(`${share.creatorName} paid up`, 72, y)

  y += 44
  ctx.font = '600 22px Inter, system-ui, sans-serif'
  ctx.fillStyle = C.textMuted
  const stakeLines = wrapTextLines(ctx, share.stakeText, CARD_W - 144, 2)
  for (const line of stakeLines) {
    ctx.fillText(line, 72, y)
    y += 30
  }

  y += 16
  roundRect(ctx, 56, y, CARD_W - 112, 100, 16)
  ctx.fillStyle = 'rgba(38, 203, 153, 0.1)'
  ctx.fill()
  ctx.strokeStyle = C.panelBorder
  ctx.stroke()

  ctx.font = '700 24px Inter, system-ui, sans-serif'
  ctx.fillStyle = C.accent
  ctx.textAlign = 'center'
  const winLine = share.winnerName
    ? `Meal for ${share.winnerName}`
    : share.acceptorsWonCount
      ? `${share.acceptorsWonCount} colleague(s) won the point bet`
      : 'Claim did not hold'
  ctx.fillText(truncate(ctx, winLine, CARD_W - 160), CARD_W / 2, y + 58)

  ctx.font = '600 22px Inter, system-ui, sans-serif'
  ctx.fillStyle = C.textSubtle
  ctx.textAlign = 'center'
  ctx.fillText(share.ctaLine, CARD_W / 2, 1000)

  drawShareFooter(ctx, input.dateLabel)
  return canvas
}

export async function renderMealFulfillmentBlob(input: MealChallengeCardInput): Promise<Blob> {
  return canvasToBlob(await renderMealFulfillmentCanvas(input))
}
