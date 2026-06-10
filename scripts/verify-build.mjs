import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

const distDir = 'dist'
const indexPath = join(distDir, 'index.html')

if (!existsSync(indexPath)) {
  console.error('verify-build: dist/index.html not found — run npm run build')
  process.exit(1)
}

const html = readFileSync(indexPath, 'utf8')

if (html.includes('/src/main.tsx') || html.includes('/src/main.ts')) {
  console.error(
    'verify-build: dist/index.html still references /src/main — publish directory must be dist after build, not the repo root.',
  )
  process.exit(1)
}

if (!html.includes('/assets/')) {
  console.error('verify-build: dist/index.html has no /assets/ bundle — Vite build may have failed.')
  process.exit(1)
}

console.log('verify-build: production bundle OK')
