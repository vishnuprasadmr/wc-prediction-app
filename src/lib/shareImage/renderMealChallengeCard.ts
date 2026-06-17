import { canvasToBlob, ensureShareFonts, roundRect } from './canvasUtils'
import type { MealChallengeCardInput } from './mealChallengeTypes'
import {
  CARD_H,
  CARD_W,
  C,
  F,
  drawFlagChip,
  drawShareBranding,
  drawShareFooter,
  drawShareFrame,
  truncate,
  wrapTextLines,
} from './shareCardCommon'

const MEAL_RED = '#E23744'
const MEAL_RED_GLOW = 'rgba(226, 55, 68, 0.22)'

async function drawFixture(
  ctx: CanvasRenderingContext2D,
  homeTeam: string,
  awayTeam: string,
  centerY: number,
): Promise<void> {
  const flagW = 96
  const flagH = 64
  const vsGap = 40
  ctx.font = '800 36px "Plus Jakarta Sans", Inter, system-ui, sans-serif'
  const vsW = ctx.measureText('VS').width
  const totalW = flagW + vsGap + vsW + vsGap + flagW
  const startX = (CARD_W - totalW) / 2
  const flagY = centerY - flagH / 2

  await drawFlagChip(ctx, homeTeam, startX, flagY, flagW, flagH)
  await drawFlagChip(ctx, awayTeam, startX + flagW + vsGap + vsW + vsGap, flagY, flagW, flagH)

  ctx.fillStyle = MEAL_RED
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('VS', startX + flagW + vsGap + vsW / 2, centerY)
  ctx.textBaseline = 'alphabetic'

  ctx.font = '600 18px Inter, system-ui, sans-serif'
  ctx.fillStyle = C.textSubtle
  const nameY = flagY + flagH + 24
  ctx.fillText(truncate(ctx, homeTeam, 120), startX + flagW / 2, nameY)
  ctx.fillText(
    truncate(ctx, awayTeam, 120),
    startX + flagW + vsGap + vsW + vsGap + flagW / 2,
    nameY,
  )
}

export async function renderMealChallengeCanvas(
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

  const glow = ctx.createRadialGradient(CARD_W / 2, 360, 40, CARD_W / 2, 360, 520)
  glow.addColorStop(0, share.mode === 'live' ? MEAL_RED_GLOW : 'rgba(38, 203, 153, 0.18)')
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
  if (share.scoreLabel) {
    ctx.fillText(`FULL TIME · ${share.scoreLabel}`, CARD_W / 2, 228)
  } else {
    ctx.fillText(share.kickoffLabel, CARD_W / 2, 228)
  }

  await drawFixture(ctx, share.homeTeam, share.awayTeam, 320)

  roundRect(ctx, 56, 420, CARD_W - 112, 520, 28)
  ctx.fillStyle = C.panel
  ctx.fill()
  ctx.strokeStyle = 'rgba(226, 55, 68, 0.35)'
  ctx.lineWidth = 2
  ctx.stroke()

  ctx.textAlign = 'left'
  ctx.font = '700 18px Inter, system-ui, sans-serif'
  ctx.fillStyle = MEAL_RED
  ctx.fillText(`${share.creatorName} says`, 88, 468)

  ctx.font = '800 34px "Plus Jakarta Sans", Inter, system-ui, sans-serif'
  ctx.fillStyle = C.text
  const quote = `“${share.claimText}”`
  const quoteLines = wrapTextLines(ctx, quote, CARD_W - 176, 3)
  let y = 512
  for (const line of quoteLines) {
    ctx.fillText(line, 88, y)
    y += 44
  }

  y += 16
  ctx.font = '600 22px Inter, system-ui, sans-serif'
  ctx.fillStyle = C.textMuted
  ctx.fillText('Claim', 88, y)
  y += 32
  ctx.fillStyle = C.textSubtle
  ctx.fillText(share.claimLabel, 88, y)

  y += 40
  ctx.fillStyle = C.textMuted
  ctx.fillText('Or else (meal stake)', 88, y)
  y += 32
  ctx.font = '700 26px "Plus Jakarta Sans", Inter, system-ui, sans-serif'
  ctx.fillStyle = C.text
  const stakeLines = wrapTextLines(ctx, share.stakeText, CARD_W - 176, 2)
  for (const line of stakeLines) {
    ctx.fillText(line, 88, y)
    y += 34
  }

  y += 12
  ctx.font = '600 20px Inter, system-ui, sans-serif'
  ctx.fillStyle = C.textMuted
  ctx.fillText(`Meal winner rule: ${share.winConditionLabel}`, 88, y)

  if (share.mode === 'live' && share.acceptorsCount > 0) {
    y += 36
    ctx.fillStyle = MEAL_RED
    ctx.fillText(
      `${share.acceptorsCount} accepted · ${share.totalPointsStaked} pts staked`,
      88,
      y,
    )
  }

  if (share.mode === 'result') {
    y += 44
    roundRect(ctx, 72, y - 28, CARD_W - 144, 88, 16)
    ctx.fillStyle = 'rgba(38, 203, 153, 0.12)'
    ctx.fill()
    ctx.strokeStyle = C.panelBorder
    ctx.stroke()
    ctx.font = '800 32px "Plus Jakarta Sans", Inter, system-ui, sans-serif'
    ctx.fillStyle = C.accent
    ctx.textAlign = 'center'
    const winnerLine = share.winnerName
      ? `🍽️ ${share.winnerName} wins the meal`
      : share.winnerNote ?? 'No meal winner'
    ctx.fillText(truncate(ctx, winnerLine, CARD_W - 200), CARD_W / 2, y + 24)
    ctx.textAlign = 'left'
  }

  ctx.font = '600 24px Inter, system-ui, sans-serif'
  ctx.fillStyle = C.textSubtle
  ctx.textAlign = 'center'
  ctx.fillText(share.ctaLine, CARD_W / 2, 1000)

  drawShareFooter(ctx, input.dateLabel)
  return canvas
}

export async function renderMealChallengeBlob(input: MealChallengeCardInput): Promise<Blob> {
  return canvasToBlob(await renderMealChallengeCanvas(input))
}
