import { getFlagUrl } from '../flags'
import {
  canvasToBlob,
  ensureShareFonts,
  loadImage,
  loadShareImage,
  computeCoverDraw,
  roundRect,
  truncateText,
} from './canvasUtils'
import { SHARE_IMAGE } from './theme'
import type { LeagueTableShareInput } from './leagueTableTypes'
import { drawShareBranding } from './shareCardCommon'

const W = 1080
const H = 1350
const C = SHARE_IMAGE.colors
const F = SHARE_IMAGE.fonts

async function drawHeroBackground(
  ctx: CanvasRenderingContext2D,
  input: LeagueTableShareInput,
): Promise<void> {
  ctx.fillStyle = C.bg
  ctx.fillRect(0, 0, W, H)

  const hero = input.hero
  const backdropTeam = hero?.backdropTeam ?? hero?.teamName
  const playerImg = hero?.pictureUrl ? await loadShareImage(hero.pictureUrl) : null
  const flagUrl = backdropTeam ? getFlagUrl(backdropTeam) : null
  const flagImg = !playerImg && flagUrl ? await loadImage(flagUrl) : null
  const bgImg = playerImg ?? flagImg

  if (bgImg) {
    const clip = { x: 40, y: 40, w: W - 80, h: 500 }
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

    const shade = ctx.createLinearGradient(40, 40, W - 80, 500)
    shade.addColorStop(0, 'rgba(0,0,0,0.92)')
    shade.addColorStop(0.45, 'rgba(0,0,0,0.72)')
    shade.addColorStop(1, 'rgba(0,0,0,0.35)')
    ctx.fillStyle = shade
    ctx.fillRect(40, 40, W - 80, 500)
    ctx.restore()
  } else {
    const glow = ctx.createRadialGradient(W / 2, 280, 40, W / 2, 280, 480)
    glow.addColorStop(0, C.accentGlow)
    glow.addColorStop(1, 'transparent')
    ctx.fillStyle = glow
    ctx.fillRect(0, 0, W, H)
  }

  roundRect(ctx, 40, 40, W - 80, H - 80, 32)
  ctx.strokeStyle = C.panelBorder
  ctx.lineWidth = 3
  ctx.stroke()
}

async function drawFlag(
  ctx: CanvasRenderingContext2D,
  team: string,
  x: number,
  y: number,
  w: number,
  h: number,
): Promise<void> {
  roundRect(ctx, x, y, w, h, 10)
  ctx.fillStyle = C.chipBg
  ctx.fill()
  ctx.strokeStyle = C.panelBorder
  ctx.lineWidth = 2
  ctx.stroke()

  const url = getFlagUrl(team)
  const img = url ? await loadImage(url) : null
  if (img) {
    ctx.save()
    roundRect(ctx, x + 3, y + 3, w - 6, h - 6, 6)
    ctx.clip()
    ctx.drawImage(img, x + 3, y + 3, w - 6, h - 6)
    ctx.restore()
  } else {
    ctx.font = '700 22px Inter, system-ui, sans-serif'
    ctx.fillStyle = C.accent
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(team.slice(0, 3).toUpperCase(), x + w / 2, y + h / 2)
    ctx.textBaseline = 'alphabetic'
  }
}

function wrapLines(
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

function drawHeroStory(ctx: CanvasRenderingContext2D, input: LeagueTableShareInput, y: number): number {
  const hero = input.hero
  if (!hero) return y

  ctx.font = '700 22px Inter, system-ui, sans-serif'
  ctx.fillStyle = C.accent
  ctx.textAlign = 'left'
  ctx.fillText('MATCH HERO', 72, y + 28)

  ctx.font = '800 46px "Plus Jakarta Sans", Inter, system-ui, sans-serif'
  ctx.fillStyle = C.text
  const headlineLines = wrapLines(ctx, hero.headline, W - 144, 2)
  let cy = y + 84
  for (const line of headlineLines) {
    ctx.fillText(line, 72, cy)
    cy += 52
  }

  ctx.font = '600 26px Inter, system-ui, sans-serif'
  ctx.fillStyle = C.textSubtle
  ctx.fillText(truncateText(ctx, hero.subline, W - 144), 72, cy + 8)

  if (hero.goalCount > 0) {
    const chip = hero.goalCount >= 3 ? 'HAT-TRICK' : hero.goalCount === 2 ? 'BRACE' : 'GOAL'
    const chipW = 140
    const chipH = 40
    const chipX = 72
    const chipY = cy + 28
    roundRect(ctx, chipX, chipY, chipW, chipH, 20)
    ctx.fillStyle = hero.goalCount >= 3 ? C.goldGlow : C.accentGlow
    ctx.fill()
    ctx.strokeStyle = hero.goalCount >= 3 ? C.gold : C.accent
    ctx.lineWidth = 2
    ctx.stroke()
    ctx.font = '800 20px Inter, system-ui, sans-serif'
    ctx.fillStyle = hero.goalCount >= 3 ? C.gold : C.accent
    ctx.textAlign = 'center'
    ctx.fillText(chip, chipX + chipW / 2, chipY + 27)
    cy += 56
  }

  return cy + 36
}

async function drawLastMatch(
  ctx: CanvasRenderingContext2D,
  input: LeagueTableShareInput,
  y: number,
): Promise<number> {
  const match = input.lastMatch
  if (!match) return y

  const barH = 108
  const barX = 72
  const barW = W - 144

  roundRect(ctx, barX, y, barW, barH, 20)
  ctx.fillStyle = C.panel
  ctx.fill()
  ctx.strokeStyle = C.panelBorder
  ctx.lineWidth = 2
  ctx.stroke()

  ctx.font = '600 20px Inter, system-ui, sans-serif'
  ctx.fillStyle = C.textMuted
  ctx.textAlign = 'center'
  ctx.fillText('LATEST RESULT', W / 2, y + 30)

  const flagW = 72
  const flagH = 48
  const centerY = y + 66
  const homeX = barX + 48
  const awayX = barX + barW - 48 - flagW

  await drawFlag(ctx, match.homeTeam, homeX, centerY - flagH / 2, flagW, flagH)
  await drawFlag(ctx, match.awayTeam, awayX, centerY - flagH / 2, flagW, flagH)

  ctx.font = '800 40px "Plus Jakarta Sans", Inter, system-ui, sans-serif'
  ctx.fillStyle = C.text
  ctx.textAlign = 'center'
  ctx.fillText(`${match.homeScore} – ${match.awayScore}`, W / 2, centerY + 14)

  return y + barH + 16
}

function drawTable(
  ctx: CanvasRenderingContext2D,
  input: LeagueTableShareInput,
  y: number,
): void {
  const entries = input.entries
  const tableX = 72
  const tableW = W - 144
  const rowH = 56
  const headerH = 48

  ctx.font = F.headingSm
  ctx.fillStyle = C.accent
  ctx.textAlign = 'center'
  ctx.fillText('LEADERBOARD', W / 2, y + 36)

  if (input.leagueLabel) {
    ctx.font = F.caption
    ctx.fillStyle = C.textMuted
    ctx.fillText(input.leagueLabel, W / 2, y + 68)
  }

  const tableY = y + (input.leagueLabel ? 88 : 56)

  roundRect(ctx, tableX, tableY, tableW, headerH + entries.length * rowH, 16)
  ctx.fillStyle = C.panel
  ctx.fill()
  ctx.strokeStyle = C.panelBorder
  ctx.lineWidth = 2
  ctx.stroke()

  const cols = { rank: tableX + 28, name: tableX + 88, pts: tableX + tableW - 140, exact: tableX + tableW - 52 }

  ctx.font = '700 20px Inter, system-ui, sans-serif'
  ctx.fillStyle = C.textMuted
  ctx.textAlign = 'left'
  ctx.fillText('#', cols.rank, tableY + 32)
  ctx.fillText('PLAYER', cols.name, tableY + 32)
  ctx.textAlign = 'right'
  ctx.fillText('PTS', cols.pts, tableY + 32)
  ctx.fillText('EX', cols.exact, tableY + 32)

  ctx.strokeStyle = C.panelBorder
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(tableX + 16, tableY + headerH)
  ctx.lineTo(tableX + tableW - 16, tableY + headerH)
  ctx.stroke()

  entries.forEach((entry, i) => {
    const rowY = tableY + headerH + i * rowH
    const isTop3 = entry.rank <= 3

    if (isTop3) {
      roundRect(ctx, tableX + 8, rowY + 4, tableW - 16, rowH - 8, 12)
      ctx.fillStyle = entry.rank === 1 ? C.goldGlow : C.accentGlow
      ctx.fill()
    }

    ctx.font = isTop3
      ? '800 28px "Plus Jakarta Sans", Inter, system-ui, sans-serif'
      : '700 26px Inter, system-ui, sans-serif'
    ctx.fillStyle = isTop3 ? (entry.rank === 1 ? C.gold : C.accent) : C.textMuted
    ctx.textAlign = 'left'
    ctx.fillText(String(entry.rank), cols.rank, rowY + 38)

    ctx.font = isTop3
      ? '700 28px "Plus Jakarta Sans", Inter, system-ui, sans-serif'
      : '600 26px Inter, system-ui, sans-serif'
    ctx.fillStyle = C.text
    ctx.fillText(truncateText(ctx, entry.display_name, tableW - 280), cols.name, rowY + 38)

    ctx.font = '800 28px "Plus Jakarta Sans", Inter, system-ui, sans-serif'
    ctx.fillStyle = isTop3 ? C.accent : C.text
    ctx.textAlign = 'right'
    ctx.fillText(String(entry.total_points), cols.pts, rowY + 38)

    ctx.font = '600 24px Inter, system-ui, sans-serif'
    ctx.fillStyle = C.textMuted
    ctx.fillText(String(entry.exact_scores), cols.exact, rowY + 38)
  })
}

function drawFooter(ctx: CanvasRenderingContext2D, dateLabel: string): void {
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
  ctx.fillText(dateLabel, W / 2, H - 56)
  ctx.fillText(SHARE_IMAGE.footer, W / 2, H - 24)
}

export async function renderLeagueTableCanvas(
  input: LeagueTableShareInput,
): Promise<HTMLCanvasElement> {
  await ensureShareFonts()

  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas not supported')

  await drawHeroBackground(ctx, input)
  await drawShareBranding(ctx)

  let y = 148
  y = drawHeroStory(ctx, input, y)
  y = await drawLastMatch(ctx, input, y)
  drawTable(ctx, input, y)
  drawFooter(ctx, input.dateLabel)

  return canvas
}

export async function renderLeagueTableBlob(input: LeagueTableShareInput): Promise<Blob> {
  const canvas = await renderLeagueTableCanvas(input)
  return canvasToBlob(canvas)
}
