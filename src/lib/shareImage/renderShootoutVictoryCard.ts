import { canvasToBlob, ensureShareFonts, loadAvatarImage, roundRect } from './canvasUtils'
import type { ShootoutVictoryShareInput } from './shootoutVictoryTypes'
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

async function drawAvatar(
  ctx: CanvasRenderingContext2D,
  url: string | null | undefined,
  name: string,
  cx: number,
  cy: number,
  radius: number,
  ring: string,
): Promise<void> {
  const img = url ? await loadAvatarImage(url) : null
  ctx.save()
  ctx.beginPath()
  ctx.arc(cx, cy, radius + 6, 0, Math.PI * 2)
  ctx.strokeStyle = ring
  ctx.lineWidth = 5
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

export async function renderShootoutVictoryCanvas(
  input: ShootoutVictoryShareInput,
): Promise<HTMLCanvasElement> {
  await ensureShareFonts()
  const canvas = document.createElement('canvas')
  canvas.width = CARD_W
  canvas.height = CARD_H
  const ctx = canvas.getContext('2d')!

  ctx.fillStyle = C.bg
  ctx.fillRect(0, 0, CARD_W, CARD_H)

  const glow = ctx.createRadialGradient(CARD_W / 2, 420, 40, CARD_W / 2, 420, 520)
  glow.addColorStop(0, 'rgba(251, 191, 36, 0.2)')
  glow.addColorStop(0.6, 'rgba(38, 203, 153, 0.1)')
  glow.addColorStop(1, 'transparent')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, CARD_W, CARD_H)

  drawShareFrame(ctx)
  await drawShareBranding(ctx)

  ctx.textAlign = 'center'
  ctx.font = F.headingSm
  ctx.fillStyle = GOLD
  ctx.fillText('ARENA VICTORY', CARD_W / 2, 200)

  ctx.font = '700 22px Inter, sans-serif'
  ctx.fillStyle = C.textMuted
  ctx.fillText('Penalty shootout', CARD_W / 2, 238)

  await drawAvatar(ctx, input.winnerAvatarUrl, input.winnerName, CARD_W / 2, 400, 100, GOLD)

  ctx.font = '800 42px "Plus Jakarta Sans", Inter, sans-serif'
  ctx.fillStyle = C.text
  ctx.fillText(truncate(ctx, input.winnerName, 520), CARD_W / 2, 540)

  ctx.font = '600 24px Inter, sans-serif'
  ctx.fillStyle = C.accent
  ctx.fillText(input.winnerHeroLabel, CARD_W / 2, 580)

  ctx.font = '800 72px "Plus Jakarta Sans", Inter, sans-serif'
  ctx.fillStyle = GOLD
  ctx.fillText(`${input.challengerScore} – ${input.opponentScore}`, CARD_W / 2, 700)

  roundRect(ctx, 120, 760, CARD_W - 240, 120, 20)
  ctx.fillStyle = C.panel
  ctx.fill()
  ctx.strokeStyle = C.panelBorder
  ctx.stroke()

  ctx.font = '600 22px Inter, sans-serif'
  ctx.fillStyle = C.textSubtle
  ctx.fillText(`vs ${truncate(ctx, input.loserName, 400)}`, CARD_W / 2, 810)
  ctx.font = '600 20px Inter, sans-serif'
  ctx.fillStyle = C.textMuted
  ctx.fillText(input.loserHeroLabel, CARD_W / 2, 848)

  ctx.font = '600 italic 24px Inter, sans-serif'
  ctx.fillStyle = C.text
  ctx.fillText(truncate(ctx, input.tauntLine, 900), CARD_W / 2, 940)

  drawShareFooter(ctx, input.dateLabel)
  return canvas
}

export async function renderShootoutVictoryBlob(input: ShootoutVictoryShareInput): Promise<Blob> {
  return canvasToBlob(await renderShootoutVictoryCanvas(input))
}
