/**
 * Chrome requires PNG icons (192 + 512) for PWA installability.
 * Run: node scripts/generate-pwa-icons.mjs
 */
import sharp from 'sharp'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const svg = readFileSync(join(root, 'public/pwa-512x512.svg'))

const badgeSvg = readFileSync(join(root, 'public/notification-badge.svg'))

const targets = [
  { file: 'pwa-192x192.png', size: 192, source: svg },
  { file: 'pwa-512x512.png', size: 512, source: svg },
  { file: 'apple-touch-icon.png', size: 180, source: svg },
  { file: 'notification-badge.png', size: 96, source: badgeSvg },
]

for (const { file, size, source } of targets) {
  const out = join(root, 'public', file)
  await sharp(source).resize(size, size).png().toFile(out)
  console.log(`wrote ${file} (${size}x${size})`)
}
