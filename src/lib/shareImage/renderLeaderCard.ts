import { canvasToBlob, ensureShareFonts, loadAvatarImage, roundRect } from './canvasUtils'
import type { LeaderCardInput } from './leaderCardTypes'
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
} from './shareCardCommon'

const PODIUM_FLOOR_Y = 728

interface PodiumSlot {
  entry: LeaderboardEntry
  cx: number
  barW: number
  barH: number
  radius: number
  ringColor: string
  fillStyle: string
  strokeStyle: string
}

async function drawPodiumAvatar(
  ctx: CanvasRenderingContext2D,
  entry: LeaderboardEntry,
  cx: number,
  cy: number,
  radius: number,
  ringColor: string,
): Promise<void> {
  const img = entry.avatar_url ? await loadAvatarImage(entry.avatar_url) : null

  ctx.save()
  ctx.beginPath()
  ctx.arc(cx, cy, radius + 5, 0, Math.PI * 2)
  ctx.strokeStyle = ringColor
  ctx.lineWidth = radius >= 85 ? 6 : 4
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
    ctx.font = `700 ${Math.round(radius * 0.9)}px "Plus Jakarta Sans", Inter, sans-serif`
    ctx.fillStyle = C.bg
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(entry.display_name.trim().charAt(0).toUpperCase() || '?', cx, cy)
    ctx.textBaseline = 'alphabetic'
  }
  ctx.restore()
}

function drawPodiumBar(ctx: CanvasRenderingContext2D, slot: PodiumSlot): void {
  const barX = slot.cx - slot.barW / 2
  const barY = PODIUM_FLOOR_Y - slot.barH

  roundRect(ctx, barX, barY, slot.barW, slot.barH, 16)
  ctx.fillStyle = slot.fillStyle
  ctx.fill()
  ctx.strokeStyle = slot.strokeStyle
  ctx.lineWidth = 2
  ctx.stroke()

  const isFirst = slot.entry.rank === 1
  const midY = barY + slot.barH / 2

  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = isFirst
    ? '800 44px "Plus Jakarta Sans", Inter, system-ui, sans-serif'
    : '800 36px "Plus Jakarta Sans", Inter, system-ui, sans-serif'
  ctx.fillStyle = isFirst ? C.gold : C.text
  ctx.fillText(String(slot.entry.total_points), slot.cx, midY - 10)

  ctx.font = '700 18px Inter, system-ui, sans-serif'
  ctx.fillStyle = isFirst ? C.gold : C.textMuted
  ctx.fillText('PTS', slot.cx, midY + 22)

  ctx.textBaseline = 'alphabetic'
}

function drawPodiumLabel(
  ctx: CanvasRenderingContext2D,
  entry: LeaderboardEntry,
  cx: number,
  avatarBottom: number,
): void {
  ctx.textAlign = 'center'
  ctx.font = '800 22px Inter, system-ui, sans-serif'
  ctx.fillStyle = entry.rank === 1 ? C.gold : entry.rank === 2 ? C.accent : C.textMuted
  ctx.fillText(`#${entry.rank}`, cx, avatarBottom + 26)

  ctx.font = '700 24px "Plus Jakarta Sans", Inter, system-ui, sans-serif'
  ctx.fillStyle = C.text
  ctx.fillText(truncate(ctx, entry.display_name, 200), cx, avatarBottom + 54)
}

async function drawPodium(ctx: CanvasRenderingContext2D, entries: LeaderboardEntry[]): Promise<void> {
  const second = entries.find((e) => e.rank === 2)
  const first = entries.find((e) => e.rank === 1) ?? entries[0]
  const third = entries.find((e) => e.rank === 3)

  const slots: PodiumSlot[] = []

  if (second) {
    slots.push({
      entry: second,
      cx: 210,
      barW: 228,
      barH: 108,
      radius: 70,
      ringColor: C.accent,
      fillStyle: C.accentGlow,
      strokeStyle: C.accent,
    })
  }
  if (first) {
    slots.push({
      entry: first,
      cx: CARD_W / 2,
      barW: 268,
      barH: 148,
      radius: 90,
      ringColor: C.gold,
      fillStyle: C.goldGlow,
      strokeStyle: C.gold,
    })
  }
  if (third) {
    slots.push({
      entry: third,
      cx: CARD_W - 210,
      barW: 228,
      barH: 92,
      radius: 70,
      ringColor: C.textMuted,
      fillStyle: C.chipBg,
      strokeStyle: C.panelBorder,
    })
  }

  const drawOrder = [...slots].sort((a, b) => a.barH - b.barH)
  for (const slot of drawOrder) {
    drawPodiumBar(ctx, slot)
  }

  for (const slot of slots) {
    const barY = PODIUM_FLOOR_Y - slot.barH
    const avatarCy = barY - slot.radius - 38
    await drawPodiumAvatar(ctx, slot.entry, slot.cx, avatarCy, slot.radius, slot.ringColor)
    drawPodiumLabel(ctx, slot.entry, slot.cx, avatarCy + slot.radius)
  }
}

export async function renderLeaderCardCanvas(input: LeaderCardInput): Promise<HTMLCanvasElement> {
  await ensureShareFonts()

  const canvas = document.createElement('canvas')
  canvas.width = CARD_W
  canvas.height = CARD_H
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas not supported')

  ctx.fillStyle = C.bg
  ctx.fillRect(0, 0, CARD_W, CARD_H)

  const glow = ctx.createRadialGradient(CARD_W / 2, 320, 40, CARD_W / 2, 320, 520)
  glow.addColorStop(0, C.goldGlow)
  glow.addColorStop(1, 'transparent')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, CARD_W, CARD_H)

  drawShareFrame(ctx)
  await drawShareBranding(ctx)

  ctx.font = F.headingSm
  ctx.fillStyle = C.gold
  ctx.textAlign = 'center'
  ctx.fillText('TOP PREDICTORS', CARD_W / 2, 200)

  ctx.font = F.caption
  ctx.fillStyle = C.textMuted
  ctx.fillText(input.leagueLabel, CARD_W / 2, 244)

  await drawPodium(ctx, input.entries.slice(0, 3))

  ctx.font = '600 30px Inter, system-ui, sans-serif'
  ctx.fillStyle = C.textSubtle
  ctx.textAlign = 'center'
  ctx.fillText(input.dailyPrompt, CARD_W / 2, 820)

  ctx.font = '500 22px Inter, system-ui, sans-serif'
  ctx.fillStyle = C.textMuted
  ctx.fillText('Predict every match · Join the league', CARD_W / 2, 868)

  drawShareFooter(ctx, input.dateLabel)

  return canvas
}

export async function renderLeaderCardBlob(input: LeaderCardInput): Promise<Blob> {
  return canvasToBlob(await renderLeaderCardCanvas(input))
}
