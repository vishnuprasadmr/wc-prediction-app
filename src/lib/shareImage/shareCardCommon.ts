import { getFlagUrl } from '../flags'
import { loadImage, loadShareImage, roundRect, truncateText, computeCoverDraw } from './canvasUtils'
import { SHARE_IMAGE } from './theme'

export const CARD_W = 1080
export const CARD_H = 1350
export const C = SHARE_IMAGE.colors
export const F = SHARE_IMAGE.fonts
const { brand, qr } = SHARE_IMAGE

let qrImageCache: HTMLImageElement | null | undefined
let wcLogoCache: HTMLImageElement | null | undefined

export async function drawWc26Logo(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size = 96,
): Promise<void> {
  if (wcLogoCache === undefined) {
    wcLogoCache = await loadImage('/wc26-share-logo.svg')
  }
  const img = wcLogoCache
  if (!img) return

  const x = cx - size / 2
  const y = cy - size / 2

  ctx.save()
  ctx.shadowColor = 'rgba(38, 203, 153, 0.45)'
  ctx.shadowBlur = 18
  ctx.drawImage(img, x, y, size, size)
  ctx.restore()
}

/** Brand row: Simelabs text (left), WC 26 badge (centre), QR (right). */
export async function drawShareBranding(ctx: CanvasRenderingContext2D): Promise<void> {
  drawShareHeader(ctx)
  await drawWc26Logo(ctx, CARD_W / 2, 88, 92)
  await drawShareQr(ctx)
}

export async function drawShareQr(ctx: CanvasRenderingContext2D): Promise<void> {
  if (qrImageCache === undefined) {
    qrImageCache = await loadImage(qr.src)
  }
  const img = qrImageCache
  if (!img) return

  const size = qr.size
  const pad = 10
  const x = CARD_W - 72 - size
  const y = 52
  const outer = size + pad * 2

  roundRect(ctx, x - pad, y - pad, outer, outer + 28, 14)
  ctx.fillStyle = '#ffffff'
  ctx.fill()
  ctx.strokeStyle = C.accent
  ctx.lineWidth = 3
  ctx.stroke()
  ctx.drawImage(img, x, y, size, size)

  ctx.font = '600 18px Inter, system-ui, sans-serif'
  ctx.fillStyle = '#0a1a14'
  ctx.textAlign = 'center'
  ctx.fillText(qr.label, x + size / 2, y + size + 22)
}

export function drawShareHeader(ctx: CanvasRenderingContext2D): void {
  const gradient = ctx.createLinearGradient(0, 0, CARD_W, 0)
  gradient.addColorStop(0, C.accentDark)
  gradient.addColorStop(0.5, C.accent)
  gradient.addColorStop(1, C.accentDark)
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, CARD_W, 12)

  ctx.font = F.overline
  ctx.fillStyle = C.accent
  ctx.textAlign = 'left'
  ctx.fillText(brand.line1, 72, 72)

  ctx.font = F.label
  ctx.fillStyle = C.textMuted
  ctx.fillText(brand.line2, 72, 108)
}

export function drawShareFrame(ctx: CanvasRenderingContext2D): void {
  roundRect(ctx, 40, 40, CARD_W - 80, CARD_H - 80, 32)
  ctx.strokeStyle = C.panelBorder
  ctx.lineWidth = 3
  ctx.stroke()
}

export function drawShareFooter(ctx: CanvasRenderingContext2D, dateLabel: string): void {
  const y = CARD_H - 88
  const gradient = ctx.createLinearGradient(72, y, CARD_W - 72, y)
  gradient.addColorStop(0, 'transparent')
  gradient.addColorStop(0.5, C.accent)
  gradient.addColorStop(1, 'transparent')
  ctx.strokeStyle = gradient
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(72, y)
  ctx.lineTo(CARD_W - 72, y)
  ctx.stroke()

  ctx.font = F.caption
  ctx.fillStyle = C.textMuted
  ctx.textAlign = 'center'
  ctx.fillText(dateLabel, CARD_W / 2, CARD_H - 56)
  ctx.fillText(SHARE_IMAGE.footer, CARD_W / 2, CARD_H - 24)
}

export async function drawHeroBackdrop(
  ctx: CanvasRenderingContext2D,
  pictureUrl?: string,
  backdropTeam?: string,
  height = 560,
): Promise<void> {
  ctx.fillStyle = C.bg
  ctx.fillRect(0, 0, CARD_W, CARD_H)

  const playerImg = pictureUrl ? await loadShareImage(pictureUrl) : null
  const flagUrl = backdropTeam ? getFlagUrl(backdropTeam) : null
  const flagImg = !playerImg && flagUrl ? await loadImage(flagUrl) : null
  const bgImg = playerImg ?? flagImg

  if (bgImg) {
    const clip = { x: 40, y: 40, w: CARD_W - 80, h: height }
    const isPlayer = Boolean(playerImg)
    const { dx, dy, dw, dh } = computeCoverDraw(
      bgImg.width,
      bgImg.height,
      clip,
      isPlayer ? 'top-right' : 'center',
    )

    ctx.save()
    roundRect(ctx, clip.x, clip.y, clip.w, clip.h, 32)
    ctx.clip()
    ctx.drawImage(bgImg, dx, dy, dw, dh)

    const shade = ctx.createLinearGradient(40, 40, CARD_W - 80, height)
    shade.addColorStop(0, 'rgba(0,0,0,0.94)')
    shade.addColorStop(0.5, 'rgba(0,0,0,0.75)')
    shade.addColorStop(1, 'rgba(0,0,0,0.3)')
    ctx.fillStyle = shade
    ctx.fillRect(40, 40, CARD_W - 80, height)
    ctx.restore()
  } else {
    const glow = ctx.createRadialGradient(CARD_W / 2, 280, 40, CARD_W / 2, 280, 480)
    glow.addColorStop(0, C.accentGlow)
    glow.addColorStop(1, 'transparent')
    ctx.fillStyle = glow
    ctx.fillRect(0, 0, CARD_W, CARD_H)
  }
}

export async function drawFlagChip(
  ctx: CanvasRenderingContext2D,
  team: string,
  x: number,
  y: number,
  w: number,
  h: number,
): Promise<void> {
  roundRect(ctx, x, y, w, h, 12)
  ctx.fillStyle = C.chipBg
  ctx.fill()
  ctx.strokeStyle = C.panelBorder
  ctx.lineWidth = 2
  ctx.stroke()

  const url = getFlagUrl(team)
  const img = url ? await loadImage(url) : null
  if (img) {
    ctx.save()
    roundRect(ctx, x + 4, y + 4, w - 8, h - 8, 8)
    ctx.clip()
    ctx.drawImage(img, x + 4, y + 4, w - 8, h - 8)
    ctx.restore()
  } else {
    ctx.font = '700 24px Inter, system-ui, sans-serif'
    ctx.fillStyle = C.accent
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(team.slice(0, 3).toUpperCase(), x + w / 2, y + h / 2)
    ctx.textBaseline = 'alphabetic'
  }
}

export function wrapTextLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
): string[] {
  const words = text.split(/\s+/)
  const lines: string[] = []
  let line = ''

  for (const word of words) {
    const next = line ? `${line} ${word}` : word
    if (ctx.measureText(next).width > maxWidth && line) {
      lines.push(line)
      line = word
    } else {
      line = next
    }
  }
  if (line) lines.push(line)
  return lines.slice(0, maxLines)
}

export function truncate(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  return truncateText(ctx, text, maxWidth)
}
