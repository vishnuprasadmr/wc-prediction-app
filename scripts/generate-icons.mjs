// Simple SVG-based PWA icon generator (writes SVG placeholders as PNG substitute)
// For production, replace with actual PNG icons
import { writeFileSync, copyFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const publicDir = join(__dirname, '../public')

const iconSvg = (size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#26cb99"/>
      <stop offset="100%" style="stop-color:#009688"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="url(#g)"/>
  <text x="50%" y="54%" font-family="Arial,sans-serif" font-size="${size * 0.32}" font-weight="bold" fill="#050505" text-anchor="middle" dominant-baseline="middle">WC</text>
</svg>`

writeFileSync(join(publicDir, 'pwa-192x192.svg'), iconSvg(192))
writeFileSync(join(publicDir, 'pwa-512x512.svg'), iconSvg(512))
writeFileSync(join(publicDir, 'apple-touch-icon.svg'), iconSvg(180))

// Update vite config to use SVG icons if PNG not available - we'll reference SVG in manifest
console.log('Icon SVGs generated in public/')
