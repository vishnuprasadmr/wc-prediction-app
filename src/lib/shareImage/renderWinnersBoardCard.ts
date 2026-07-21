import { canvasToBlob, ensureShareFonts, loadAvatarImage, roundRect } from './canvasUtils'
import type { WinnersBoardShareInput } from './winnersBoardTypes'
import {
  CARD_H,
  CARD_W,
  C,
  drawShareBranding,
  drawShareFooter,
  drawShareFrame,
  truncate,
} from './shareCardCommon'

const GOLD = '#fbbf24'

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
  ctx.arc(cx, cy, radius + 4, 0, Math.PI * 2)
  ctx.strokeStyle = GOLD
  ctx.lineWidth = 4
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
    ctx.font = `700 ${Math.round(radius * 0.85)}px Inter, sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(name.charAt(0).toUpperCase() || '?', cx, cy)
  }
  ctx.restore()
}

export async function renderWinnersBoardCanvas(
  input: WinnersBoardShareInput,
): Promise<HTMLCanvasElement> {
  await ensureShareFonts()
  const canvas = document.createElement('canvas')
  canvas.width = CARD_W
  canvas.height = CARD_H
  const ctx = canvas.getContext('2d')!

  ctx.fillStyle = C.bg
  ctx.fillRect(0, 0, CARD_W, CARD_H)

  const glow = ctx.createRadialGradient(CARD_W / 2, 280, 20, CARD_W / 2, 280, 560)
  glow.addColorStop(0, 'rgba(38, 203, 153, 0.28)')
  glow.addColorStop(0.55, 'rgba(251, 191, 36, 0.1)')
  glow.addColorStop(1, 'transparent')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, CARD_W, CARD_H)

  drawShareFrame(ctx)
  await drawShareBranding(ctx)

  ctx.textAlign = 'center'
  ctx.font = '800 42px "Plus Jakarta Sans", Inter, sans-serif'
  ctx.fillStyle = C.text
  ctx.fillText(truncate(ctx, input.headline, 920), CARD_W / 2, 200)

  ctx.font = '700 22px Inter, sans-serif'
  ctx.fillStyle = C.accent
  ctx.fillText(input.poolLabel, CARD_W / 2, 240)

  const winners = input.winners.slice(0, 8)
  const cols = 2
  const cellW = 430
  const cellH = 210
  const gapX = 40
  const gapY = 28
  const startX = (CARD_W - (cols * cellW + (cols - 1) * gapX)) / 2
  const startY = 280

  for (let i = 0; i < winners.length; i++) {
    const w = winners[i]!
    const col = i % cols
    const row = Math.floor(i / cols)
    const x = startX + col * (cellW + gapX)
    const y = startY + row * (cellH + gapY)

    roundRect(ctx, x, y, cellW, cellH, 22)
    ctx.fillStyle = 'rgba(255,255,255,0.04)'
    ctx.fill()
    ctx.strokeStyle = 'rgba(38, 203, 153, 0.28)'
    ctx.lineWidth = 2
    ctx.stroke()

    const ax = x + 78
    const ay = y + cellH / 2
    await drawAvatar(ctx, w.winnerAvatarUrl, w.winnerName, ax, ay, 52)

    ctx.textAlign = 'left'
    ctx.font = '700 15px Inter, sans-serif'
    ctx.fillStyle = GOLD
    ctx.fillText(truncate(ctx, (w.badge || w.prizeTitle).toUpperCase(), 280), x + 150, y + 62)

    ctx.font = '800 28px "Plus Jakarta Sans", Inter, sans-serif'
    ctx.fillStyle = C.text
    ctx.fillText(truncate(ctx, w.winnerName, 280), x + 150, y + 102)

    ctx.font = '700 20px Inter, sans-serif'
    ctx.fillStyle = C.accent
    ctx.fillText(w.amountLabel, x + 150, y + 140)

    ctx.font = '600 14px Inter, sans-serif'
    ctx.fillStyle = C.textMuted
    ctx.fillText(truncate(ctx, w.prizeTitle, 280), x + 150, y + 168)
  }

  drawShareFooter(ctx, input.dateLabel)
  return canvas
}

export async function renderWinnersBoardBlob(input: WinnersBoardShareInput): Promise<Blob> {
  return canvasToBlob(await renderWinnersBoardCanvas(input))
}
