import { canvasToBlob, ensureShareFonts, loadAvatarImage, roundRect } from './canvasUtils'
import type { GameSnapshotInput } from './gameSnapshotTypes'
import type { LeaderboardEntry } from '../types'
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
const PODIUM_Y = 500

async function drawMiniAvatar(
  ctx: CanvasRenderingContext2D,
  entry: LeaderboardEntry,
  cx: number,
  cy: number,
  radius: number,
  ring: string,
): Promise<void> {
  const img = entry.avatar_url ? await loadAvatarImage(entry.avatar_url) : null
  ctx.save()
  ctx.beginPath()
  ctx.arc(cx, cy, radius + 3, 0, Math.PI * 2)
  ctx.strokeStyle = ring
  ctx.lineWidth = 3
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
    ctx.font = `700 ${radius}px Inter, sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(entry.display_name.charAt(0).toUpperCase(), cx, cy)
  }
  ctx.restore()
}

async function drawCompactPodium(ctx: CanvasRenderingContext2D, entries: LeaderboardEntry[]): Promise<void> {
  const order = [2, 1, 3]
  const slots = order
    .map((rank) => entries.find((e) => e.rank === rank))
    .filter(Boolean) as LeaderboardEntry[]

  const positions = [
    { cx: 210, barH: 72, ring: C.accent },
    { cx: CARD_W / 2, barH: 96, ring: C.gold },
    { cx: CARD_W - 210, barH: 64, ring: C.textMuted },
  ]

  for (let i = 0; i < slots.length; i++) {
    const entry = slots[i]
    const pos = positions[i]
    const barW = 220
    const barY = PODIUM_Y - pos.barH
    roundRect(ctx, pos.cx - barW / 2, barY, barW, pos.barH, 12)
    ctx.fillStyle = entry.rank === 1 ? C.goldGlow : C.panel
    ctx.fill()
    ctx.strokeStyle = pos.ring
    ctx.lineWidth = 2
    ctx.stroke()

    ctx.textAlign = 'center'
    ctx.font = entry.rank === 1 ? '800 32px "Plus Jakarta Sans", Inter, sans-serif' : '800 26px "Plus Jakarta Sans", Inter, sans-serif'
    ctx.fillStyle = entry.rank === 1 ? C.gold : C.text
    ctx.fillText(String(entry.total_points), pos.cx, barY + pos.barH / 2 - 4)
    ctx.font = '600 14px Inter, sans-serif'
    ctx.fillStyle = C.textMuted
    ctx.fillText('pts', pos.cx, barY + pos.barH / 2 + 18)

    const avatarY = barY - 44
    await drawMiniAvatar(ctx, entry, pos.cx, avatarY, 36, pos.ring)
    ctx.font = '700 18px Inter, sans-serif'
    ctx.fillStyle = pos.ring
    ctx.fillText(`#${entry.rank}`, pos.cx, avatarY + 52)
    ctx.fillStyle = C.text
    ctx.font = '600 17px Inter, sans-serif'
    ctx.fillText(truncate(ctx, entry.display_name, 160), pos.cx, avatarY + 76)
  }
}

export async function renderGameSnapshotCanvas(input: GameSnapshotInput): Promise<HTMLCanvasElement> {
  await ensureShareFonts()
  const canvas = document.createElement('canvas')
  canvas.width = CARD_W
  canvas.height = CARD_H
  const ctx = canvas.getContext('2d')!
  const { topThree } = input

  ctx.fillStyle = C.bg
  ctx.fillRect(0, 0, CARD_W, CARD_H)

  const glow = ctx.createRadialGradient(CARD_W / 2, 400, 40, CARD_W / 2, 400, 600)
  glow.addColorStop(0, 'rgba(38, 203, 153, 0.15)')
  glow.addColorStop(0.5, 'rgba(226, 55, 68, 0.08)')
  glow.addColorStop(1, 'transparent')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, CARD_W, CARD_H)

  drawShareFrame(ctx)
  await drawShareBranding(ctx)

  ctx.textAlign = 'center'
  ctx.font = F.headingSm
  ctx.fillStyle = C.accent
  ctx.fillText('GAME SNAPSHOT', CARD_W / 2, 198)

  ctx.font = F.caption
  ctx.fillStyle = C.textMuted
  ctx.fillText(input.leagueLabel, CARD_W / 2, 234)

  ctx.font = '600 20px Inter, system-ui, sans-serif'
  ctx.fillStyle = C.textSubtle
  ctx.fillText(
    `${input.finishedMatchCount} matches played · ${input.liveMealCount} live meal bets · ${input.settledMealCount} settled`,
    CARD_W / 2,
    268,
  )

  if (topThree.length > 0) {
    ctx.font = '700 16px Inter, sans-serif'
    ctx.fillStyle = C.gold
    ctx.fillText('TOP 3', CARD_W / 2, 310)
    await drawCompactPodium(ctx, topThree)
  }

  let y = PODIUM_Y + 36

  if (input.lastMatchLabel && input.lastMatchScore) {
    roundRect(ctx, 56, y, CARD_W - 112, 88, 16)
    ctx.fillStyle = C.panel
    ctx.fill()
    ctx.strokeStyle = C.panelBorder
    ctx.stroke()
    ctx.textAlign = 'left'
    ctx.font = '600 16px Inter, sans-serif'
    ctx.fillStyle = C.textMuted
    ctx.fillText('LATEST RESULT', 80, y + 32)
    ctx.font = '800 28px "Plus Jakarta Sans", Inter, sans-serif'
    ctx.fillStyle = C.text
    ctx.fillText(`${input.lastMatchLabel}  ${input.lastMatchScore}`, 80, y + 68)
    y += 108
  }

  roundRect(ctx, 56, y, CARD_W - 112, CARD_H - y - 120, 20)
  ctx.fillStyle = C.panel
  ctx.fill()
  ctx.strokeStyle = 'rgba(226, 55, 68, 0.35)'
  ctx.lineWidth = 2
  ctx.stroke()

  ctx.textAlign = 'left'
  ctx.font = '700 16px Inter, sans-serif'
  ctx.fillStyle = MEAL_RED
  ctx.fillText('MEAL BETS', 80, y + 36)

  let rowY = y + 64
  const maxRows = 5
  const rows = input.mealRows.slice(0, maxRows)

  if (rows.length === 0) {
    ctx.font = '600 20px Inter, sans-serif'
    ctx.fillStyle = C.textMuted
    ctx.fillText('No meal challenges yet — propose one in the app!', 80, rowY + 20)
  } else {
    for (const row of rows) {
      const badge = row.kind === 'live' ? 'LIVE' : 'FT'
      ctx.font = '700 13px Inter, sans-serif'
      ctx.fillStyle = row.kind === 'live' ? MEAL_RED : C.accent
      ctx.fillText(badge, 80, rowY + 14)

      ctx.font = '700 20px Inter, sans-serif'
      ctx.fillStyle = C.text
      ctx.fillText(truncate(ctx, row.matchLabel, CARD_W - 200), 130, rowY + 16)

      ctx.font = '600 18px Inter, sans-serif'
      ctx.fillStyle = C.textSubtle
      const lines = wrapTextLines(ctx, row.line, CARD_W - 176, 2)
      let lineY = rowY + 42
      for (const line of lines) {
        ctx.fillText(line, 80, lineY)
        lineY += 24
      }

      if (row.subline) {
        ctx.font = '600 17px Inter, sans-serif'
        ctx.fillStyle = row.kind === 'live' ? '#fbbf24' : C.accent
        ctx.fillText(truncate(ctx, row.subline, CARD_W - 176), 80, lineY + 4)
        lineY += 28
      }

      rowY = lineY + 12
      if (rowY > CARD_H - 160) break
    }
  }

  ctx.textAlign = 'center'
  ctx.font = '600 22px Inter, system-ui, sans-serif'
  ctx.fillStyle = C.textSubtle
  ctx.fillText('Predict · Meal bets · League points', CARD_W / 2, CARD_H - 88)

  drawShareFooter(ctx, input.dateLabel)
  return canvas
}

export async function renderGameSnapshotBlob(input: GameSnapshotInput): Promise<Blob> {
  return canvasToBlob(await renderGameSnapshotCanvas(input))
}
