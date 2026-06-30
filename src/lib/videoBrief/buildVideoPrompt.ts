import type { VideoBrief } from './types'

/**
 * Assemble a single copy-paste natural-language prompt from a VideoBrief,
 * ready to drop into a text-to-video tool (Gemini / Veo / Google Vids).
 */
export function buildVideoPrompt(brief: VideoBrief): string {
  const { videoMeta, scenes, assets } = brief
  const lines: string[] = []

  lines.push(
    `Create a ${videoMeta.targetDurationSec}-second ${videoMeta.aspectRatio} vertical video titled "${videoMeta.title}".`,
  )
  lines.push(`Style: ${videoMeta.style}. Music: ${videoMeta.musicMood}.`)
  lines.push(
    'Use the exact names, scores and numbers given below verbatim for any on-screen text — do not invent or alter them.',
  )
  lines.push('')
  lines.push('STORYBOARD (in order):')

  scenes.forEach((scene, index) => {
    lines.push('')
    lines.push(`Scene ${index + 1} — ${scene.title} (~${scene.durationSec}s)`)
    lines.push(`  Visual: ${scene.visual}`)
    lines.push(`  Voiceover: "${scene.narration}"`)
    if (scene.onScreenText.length > 0) {
      lines.push(`  On-screen text: ${scene.onScreenText.map((t) => `"${t}"`).join(', ')}`)
    }
    if (scene.assetRefs.length > 0) {
      lines.push(`  Use profile pictures: ${scene.assetRefs.join(', ')}`)
    }
  })

  if (assets.length > 0) {
    lines.push('')
    lines.push('PROFILE PICTURES (reference name → image):')
    for (const asset of assets) {
      lines.push(`  ${asset.ref} = ${asset.name}${asset.imageUrl ? ` (${asset.imageUrl})` : ''}`)
    }
  }

  return lines.join('\n')
}
