import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT_DIR = path.join(__dirname, '../public/flags')
const FIFA_BASE = 'https://api.fifa.com/api/v3/picture/flags-sq-1'

const CODES = [
  'ALG', 'ARG', 'AUS', 'AUT', 'BEL', 'BIH', 'BRA', 'CAN', 'CIV', 'COD',
  'COL', 'CPV', 'CRO', 'CUW', 'CZE', 'ECU', 'EGY', 'ENG', 'ESP', 'FRA',
  'GER', 'GHA', 'HAI', 'IRN', 'IRQ', 'JOR', 'JPN', 'KOR', 'KSA', 'MAR',
  'MEX', 'NED', 'NOR', 'NZL', 'PAN', 'PAR', 'POR', 'QAT', 'RSA', 'SCO',
  'SEN', 'SUI', 'SWE', 'TUN', 'TUR', 'URU', 'USA', 'UZB',
]

fs.mkdirSync(OUT_DIR, { recursive: true })

let ok = 0
let fail = 0

for (const code of CODES) {
  const url = `${FIFA_BASE}/${code}`
  try {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const buf = Buffer.from(await res.arrayBuffer())
    const ext = (res.headers.get('content-type') || '').includes('svg') ? 'svg' : 'png'
    const outPath = path.join(OUT_DIR, `${code}.${ext}`)
    fs.writeFileSync(outPath, buf)
    console.log(`✓ ${code} (${buf.length} bytes, .${ext})`)
    ok++
  } catch (err) {
    console.error(`✗ ${code}: ${err.message}`)
    fail++
  }
}

console.log(`\nDone: ${ok} saved, ${fail} failed → ${OUT_DIR}`)
