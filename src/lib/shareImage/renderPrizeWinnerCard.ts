import { formatInr } from '../prizes'
import { canvasToBlob, ensureShareFonts, loadAvatarImage, roundRect } from './canvasUtils'
import type { PrizeWinnerShareInput } from './prizeWinnerTypes'
import {
  CARD_H,
  CARD_W,
  C,
  F,
  drawShareBranding,
  drawShareFooter,
  drawShareFrame,
  truncate,
} from './shareCardCommon'

const GOLD = '#fbbf24'
const ZOMATO = '#E23744'

async function drawAvatar(
  ctx: CanvasRenderingContext2D,
  url: string | null | undefined,
  name: string,
  cx: number,
  cy: number,
  radius: number,
): Promise<void> {
  const img = url ? await loadAvatarImage(url) : null
  ctx.save()
  ctx.beginPath()
  ctx.arc(cx, cy, radius + 7, 0, Math.PI * 2)
  ctx.strokeStyle = GOLD
  ctx.lineWidth = 6
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(cx, cy, radius, 0, Math.PI * 2)
  ctx.clip()
  if (img) {
    ctx.drawImage(img, cx - radius, cy - radius, radius * 2, radius * 2)
  } else {
    ctx.fillStyle = C.accent
    ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2)
    ctx.fillStyle = C.bg
    ctx.font = `700 ${radius * 0.9}px Inter, sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(name.charAt(0).toUpperCase(), cx, cy)
  }
  ctx.restore()
}

export async function renderPrizeWinnerCanvas(
  input: PrizeWinnerShareInput,
): Promise<HTMLCanvasElement> {
  await ensureShareFonts()
  const canvas = document.createElement('canvas')
  canvas.width = CARD_W
  canvas.height = CARD_H
  const ctx = canvas.getContext('2d')!

  ctx.fillStyle = C.bg
  ctx.fillRect(0, 0, CARD_W, CARD_H)

  const glow = ctx.createRadialGradient(CARD_W / 2, 380, 40, CARD_W / 2, 380, 520)
  glow.addColorStop(0, 'rgba(251, 191, 36, 0.22)')
  glow.addColorStop(0.55, 'rgba(226, 55, 68, 0.12)')
  glow.addColorStop(1, 'transparent')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, CARD_W, CARD_H)

  drawShareFrame(ctx)
  await drawShareBranding(ctx)

  ctx.textAlign = 'center'
  ctx.font = F.headingSm
  ctx.fillStyle = GOLD
  ctx.fillText('PRIZE WINNER', CARD_W / 2, 200)

  ctx.font = '700 26px Inter, sans-serif'
  ctx.fillStyle = C.textMuted
  ctx.fillText(truncate(ctx, input.prizeTitle.toUpperCase(), 900), CARD_W / 2, 245)

  await drawAvatar(ctx, input.winnerAvatarUrl, input.winnerName, CARD_W / 2, 420, 110)

  ctx.font = '800 44px "Plus Jakarta Sans", Inter, sans-serif'
  ctx.fillStyle = C.text
  ctx.fillText(truncate(ctx, input.winnerName, 860), CARD_W / 2, 580)

  ctx.font = '800 64px "Plus Jakarta Sans", Inter, sans-serif'
  ctx.fillStyle = C.accent
  ctx.fillText(input.amountLabel || formatInr(input.amountInr), CARD_W / 2, 660)

  ctx.font = '600 22px Inter, sans-serif'
  ctx.fillStyle = C.textSubtle
  ctx.fillText('Zomato e-gift card delivered', CARD_W / 2, 710)

  roundRect(ctx, 100, 760, CARD_W - 200, 160, 24)
  ctx.fillStyle = 'rgba(226, 55, 68, 0.12)'
  ctx.fill()
  ctx.strokeStyle = ZOMATO
  ctx.lineWidth = 2
  ctx.stroke()

  ctx.font = '700 20px Inter, sans-serif'
  ctx.fillStyle = ZOMATO
  ctx.fillText('GIFT CARD RECEIVED', CARD_W / 2, 815)

  ctx.font = '800 34px "Plus Jakarta Sans", Inter, monospace'
  ctx.fillStyle = C.text
  ctx.fillText(input.maskedCard ?? '•••• **** **** ••••', CARD_W / 2, 870)

  ctx.font = '600 italic 22px Inter, sans-serif'
  ctx.fillStyle = C.textMuted
  ctx.fillText('Digits hidden — full code unlocked by the winner in-app', CARD_W / 2, 980)

  drawShareFooter(ctx, input.dateLabel)
  return canvas
}

export async function renderPrizeWinnerBlob(input: PrizeWinnerShareInput): Promise<Blob> {
  return canvasToBlob(await renderPrizeWinnerCanvas(input))
}
