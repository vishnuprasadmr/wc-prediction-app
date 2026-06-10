import pg from 'pg'
import { readFileSync, readdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const password = process.env.SUPABASE_DB_PASSWORD
const projectRef = 'jobgrjaweuiifmpnpgjd'

if (!password) {
  console.error('Set SUPABASE_DB_PASSWORD')
  process.exit(1)
}

const regions = [
  'ap-south-1', 'ap-southeast-1', 'ap-southeast-2', 'ap-northeast-1', 'ap-northeast-2',
  'us-east-1', 'us-east-2', 'us-west-1', 'eu-west-1', 'eu-west-2', 'eu-central-1',
  'ca-central-1', 'sa-east-1',
]
const hosts = [
  '2406:da14:1d62:b401:f008:c48a:be82:d266', // IPv6 for db.jobgrjaweuiifmpnpgjd.supabase.co
  `db.${projectRef}.supabase.co`,
  ...regions.flatMap((r) => [
    `aws-0-${r}.pooler.supabase.com`,
    `aws-1-${r}.pooler.supabase.com`,
  ]),
]

const migrationsDir = join(__dirname, '../supabase/migrations')
const files = readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort()

async function tryConnect(host) {
  const isPooler = host.includes('pooler')
  const user = isPooler ? `postgres.${projectRef}` : 'postgres'
  const client = new pg.Client({
    host,
    port: 5432,
    database: 'postgres',
    user,
    password,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  })
  await client.connect()
  return client
}

let client
for (const host of hosts) {
  try {
    console.log(`Trying ${host}...`)
    client = await tryConnect(host)
    console.log(`Connected via ${host}`)
    break
  } catch (err) {
    console.log(`  failed: ${err.message}`)
  }
}

if (!client) {
  console.error('Could not connect to database')
  process.exit(1)
}

try {
  for (const file of files) {
    console.log(`Running ${file}...`)
    const sql = readFileSync(join(migrationsDir, file), 'utf8')
    await client.query(sql)
    console.log(`  done`)
  }
  const { rows } = await client.query('SELECT COUNT(*)::int AS n FROM matches')
  console.log(`\nSuccess! ${rows[0].n} matches in database.`)
} catch (err) {
  console.error('Migration error:', err.message)
  process.exit(1)
} finally {
  await client.end()
}
