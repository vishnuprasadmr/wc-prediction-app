import { getFlagUrl } from '../flags'
import { isExactScorePoints } from '../scoring'
import {
  canvasToBlob,
  ensureShareFonts,
  loadAvatarImage,
  loadImage,
  roundRect,
  truncateText,
} from './canvasUtils'
import { SHARE_IMAGE, VARIANT_HEADLINE, type ShareImageVariant } from './theme'
import type { ShareImageInput } from './types'

const { width: W, height: H, colors: C, fonts: F, brand, qr } = SHARE_IMAGE

let qrImageCache: HTMLImageElement | null | undefined

async function getQrImage(): Promise<HTMLImageElement | null> {
  if (qrImageCache !== undefined) return qrImageCache
  qrImageCache = await loadImage(qr.src)
  return qrImageCache
}

function drawHeader(ctx: CanvasRenderingContext2D): void {
  const gradient = ctx.createLinearGradient(0, 0, W, 0)
  gradient.addColorStop(0, C.accentDark)
  gradient.addColorStop(0.5, C.accent)
  gradient.addColorStop(1, C.accentDark)
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, W, 12)

  ctx.font = F.overline
  ctx.fillStyle = C.accent
  ctx.textAlign = 'left'
  ctx.fillText(brand.line1, 72, 72)

  ctx.font = F.label
  ctx.fillStyle = C.textMuted
  ctx.fillText(brand.line2, 72, 108)
}

async function drawQrCode(ctx: CanvasRenderingContext2D): Promise<void> {
  const img = await getQrImage()
  if (!img) return

  const size = qr.size
  const pad = 10
  const x = W - 72 - size
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

function drawFooter(ctx: CanvasRenderingContext2D): void {
  const y = H - 88
  const gradient = ctx.createLinearGradient(72, y, W - 72, y)
  gradient.addColorStop(0, 'transparent')
  gradient.addColorStop(0.5, C.accent)
  gradient.addColorStop(1, 'transparent')
  ctx.strokeStyle = gradient
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(72, y)
  ctx.lineTo(W - 72, y)
  ctx.stroke()

  ctx.font = F.caption
  ctx.fillStyle = C.textMuted
  ctx.textAlign = 'center'
  ctx.fillText(SHARE_IMAGE.footer, W / 2, H - 44)
}

function drawHeadline(ctx: CanvasRenderingContext2D, variant: ShareImageVariant): void {
  const isOracle = variant === 'oracle'
  ctx.font = F.headingSm
  ctx.fillStyle = isOracle ? C.gold : C.accent
  ctx.textAlign = 'center'
  ctx.fillText(VARIANT_HEADLINE[variant], W / 2, 248)
  if (isOracle) {
    ctx.font = F.caption
    ctx.fillStyle = C.textMuted
    ctx.fillText('You called it perfectly', W / 2, 286)
  }
}

async function drawFlag(
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
    ctx.font = F.headingSm
    ctx.fillStyle = C.accent
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(team.slice(0, 3).toUpperCase(), x + w / 2, y + h / 2)
    ctx.textBaseline = 'alphabetic'
  }
}

function drawTeamName(
  ctx: CanvasRenderingContext2D,
  name: string,
  centerX: number,
  y: number,
  maxWidth: number,
): void {
  ctx.font = F.caption
  ctx.fillStyle = C.textSubtle
  ctx.textAlign = 'center'
  ctx.fillText(truncateText(ctx, name, maxWidth), centerX, y)
}

async function drawMatchBlock(ctx: CanvasRenderingContext2D, input: ShareImageInput): Promise<void> {
  const match = input.match
  if (!match) return

  const flagW = 128
  const flagH = 88
  const centerY = 400
  const homeX = 120
  const awayX = W - 120 - flagW
  const score = `${match.homeScore} – ${match.awayScore}`

  await drawFlag(ctx, match.homeTeam, homeX, centerY - flagH / 2, flagW, flagH)
  await drawFlag(ctx, match.awayTeam, awayX, centerY - flagH / 2, flagW, flagH)

  drawTeamName(ctx, match.homeTeam, homeX + flagW / 2, centerY + flagH / 2 + 36, flagW + 40)
  drawTeamName(ctx, match.awayTeam, awayX + flagW / 2, centerY + flagH / 2 + 36, flagW + 40)

  ctx.font = F.score
  ctx.fillStyle = C.text
  ctx.textAlign = 'center'
  ctx.fillText(score, W / 2, centerY + 28)

  if (match.homePred !== undefined && match.awayPred !== undefined) {
    ctx.font = F.label
    ctx.fillStyle = C.textMuted
    ctx.fillText(`Your pick ${match.homePred}–${match.awayPred}`, W / 2, centerY + 78)
  }

  if (match.pointsEarned !== null && match.pointsEarned !== undefined) {
    const exact =
      input.variant === 'oracle' ||
      isExactScorePoints(match.pointsEarned, match.firstBonus ?? 0)
    const chipW = 220
    const chipH = 56
    const chipX = W / 2 - chipW / 2
    const chipY = centerY + 100
    roundRect(ctx, chipX, chipY, chipW, chipH, 28)
    ctx.fillStyle = exact ? C.goldGlow : C.accentGlow
    ctx.fill()
    ctx.strokeStyle = exact ? C.gold : C.accent
    ctx.lineWidth = 2
    ctx.stroke()
    ctx.font = F.headingSm
    ctx.fillStyle = exact ? C.gold : C.accent
    ctx.textAlign = 'center'
    ctx.fillText(`+${match.pointsEarned} pts`, W / 2, chipY + 38)
  }
}

function drawStatChip(
  ctx: CanvasRenderingContext2D,
  label: string,
  value: string,
  x: number,
  y: number,
  w: number,
  h: number,
  highlight = false,
): void {
  roundRect(ctx, x, y, w, h, 20)
  ctx.fillStyle = highlight ? C.accentGlow : C.chipBg
  ctx.fill()
  ctx.strokeStyle = highlight ? C.accent : C.panelBorder
  ctx.lineWidth = 2
  ctx.stroke()

  ctx.font = F.caption
  ctx.fillStyle = C.textMuted
  ctx.textAlign = 'center'
  ctx.fillText(label, x + w / 2, y + 40)

  ctx.font = F.stat
  ctx.fillStyle = highlight ? C.accent : C.text
  ctx.fillText(value, x + w / 2, y + 100)
}

function drawStatsRow(ctx: CanvasRenderingContext2D, input: ShareImageInput): void {
  const hasMatch = Boolean(input.match)
  const y = hasMatch ? 620 : 340
  const chipW = 280
  const chipH = 128
  const gap = 32
  const totalW = chipW * 3 + gap * 2
  const startX = (W - totalW) / 2

  drawStatChip(ctx, 'RANK', `#${input.rank || '—'}`, startX, y, chipW, chipH, true)
  drawStatChip(
    ctx,
    'POINTS',
    String(input.totalPoints),
    startX + chipW + gap,
    y,
    chipW,
    chipH,
  )
  drawStatChip(
    ctx,
    'EXACT',
    String(input.exactScores),
    startX + (chipW + gap) * 2,
    y,
    chipW,
    chipH,
  )
}

async function drawAvatarCircle(
  ctx: CanvasRenderingContext2D,
  name: string,
  avatarUrl: string | null | undefined,
  cx: number,
  cy: number,
  radius: number,
): Promise<void> {
  const img = avatarUrl ? await loadAvatarImage(avatarUrl) : null

  ctx.save()
  ctx.beginPath()
  ctx.arc(cx, cy, radius + 4, 0, Math.PI * 2)
  ctx.strokeStyle = C.accent
  ctx.lineWidth = 4
  ctx.stroke()

  ctx.beginPath()
  ctx.arc(cx, cy, radius, 0, Math.PI * 2)
  ctx.closePath()
  ctx.clip()

  if (img) {
    ctx.drawImage(img, cx - radius, cy - radius, radius * 2, radius * 2)
  } else {
    const gradient = ctx.createLinearGradient(cx - radius, cy - radius, cx + radius, cy + radius)
    gradient.addColorStop(0, C.accentDark)
    gradient.addColorStop(1, C.accent)
    ctx.fillStyle = gradient
    ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2)
    ctx.font = `700 ${Math.round(radius * 1.1)}px "Plus Jakarta Sans", Inter, sans-serif`
    ctx.fillStyle = C.bg
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(name.trim().charAt(0).toUpperCase() || '?', cx, cy)
    ctx.textBaseline = 'alphabetic'
  }

  ctx.restore()
}

async function drawPlayerName(
  ctx: CanvasRenderingContext2D,
  input: ShareImageInput,
  hasMatch: boolean,
): Promise<void> {
  const y = hasMatch ? 800 : 520
  const barH = 96
  const barX = 72
  const barW = W - 144

  roundRect(ctx, barX, y, barW, barH, 24)
  ctx.fillStyle = C.panel
  ctx.fill()
  ctx.strokeStyle = C.panelBorder
  ctx.lineWidth = 2
  ctx.stroke()

  const avatarRadius = 34
  const avatarCx = barX + 24 + avatarRadius
  const avatarCy = y + barH / 2
  await drawAvatarCircle(ctx, input.displayName, input.avatarUrl, avatarCx, avatarCy, avatarRadius)

  ctx.font = F.name
  ctx.fillStyle = C.text
  ctx.textAlign = 'left'
  const nameX = avatarCx + avatarRadius + 28
  ctx.fillText(truncateText(ctx, input.displayName, barW - (nameX - barX) - 24), nameX, y + 58)
}

function drawBackground(ctx: CanvasRenderingContext2D, variant: ShareImageVariant): void {
  ctx.fillStyle = C.bg
  ctx.fillRect(0, 0, W, H)

  const glow = ctx.createRadialGradient(W / 2, 320, 40, W / 2, 320, 520)
  glow.addColorStop(0, variant === 'oracle' ? C.goldGlow : C.accentGlow)
  glow.addColorStop(1, 'transparent')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, W, H)

  roundRect(ctx, 40, 40, W - 80, H - 80, 32)
  ctx.strokeStyle = C.panelBorder
  ctx.lineWidth = 3
  ctx.stroke()
}

export async function renderShareImageCanvas(input: ShareImageInput): Promise<HTMLCanvasElement> {
  await ensureShareFonts()

  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas not supported')

  drawBackground(ctx, input.variant)
  drawHeader(ctx)
  await drawQrCode(ctx)
  drawHeadline(ctx, input.variant)

  if (input.match) {
    await drawMatchBlock(ctx, input)
  } else {
    ctx.font = F.label
    ctx.fillStyle = C.textMuted
    ctx.textAlign = 'center'
    ctx.fillText('Simelabs internal prediction league', W / 2, 300)
  }

  drawStatsRow(ctx, input)
  await drawPlayerName(ctx, input, Boolean(input.match))
  drawFooter(ctx)

  return canvas
}

export async function renderShareImageBlob(input: ShareImageInput): Promise<Blob> {
  const canvas = await renderShareImageCanvas(input)
  return canvasToBlob(canvas)
}
