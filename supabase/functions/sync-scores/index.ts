import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { withSupabase } from 'jsr:@supabase/server@^1'
import {
  extractScores,
  fetchAllFifaMatches,
  mapFifaStatus,
  MATCH_NUMBER_OFFSET,
  type FifaMatch,
} from './fifa.ts'

interface SyncPayload {
  /** Sync one FIFA match number (1–104) */
  matchNumber?: number
  /** Only sync matches that have kicked off but are not finished in DB */
  dueOnly?: boolean
}

interface DbMatch {
  id: string
  api_fixture_id: number
  manual_override: boolean
  home_score: number | null
  away_score: number | null
  status: string
  kickoff_at: string
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function syncFifaToDb(
  supabase: ReturnType<typeof createClient>,
  options: { matchNumber?: number; dueOnly?: boolean },
) {
  const fifaMatches = await fetchAllFifaMatches()
  let targets = fifaMatches

  if (options.matchNumber != null) {
    targets = targets.filter((m) => m.MatchNumber === options.matchNumber)
  }

  const { data: dbMatches, error: loadError } = await supabase
    .from('matches')
    .select('id, api_fixture_id, manual_override, home_score, away_score, status, kickoff_at')

  if (loadError) throw loadError

  const dbByFixture = new Map(
    (dbMatches as DbMatch[]).map((m) => [m.api_fixture_id, m]),
  )

  const now = Date.now()
  const dueFixtureIds = options.dueOnly
    ? new Set(
        (dbMatches as DbMatch[])
          .filter((m) => {
            const kickoff = new Date(m.kickoff_at).getTime()
            const started = kickoff <= now + 15 * 60 * 1000
            const notDone = m.status !== 'finished'
            const recent = kickoff >= now - 4 * 60 * 60 * 1000
            return started && (notDone || recent)
          })
          .map((m) => m.api_fixture_id),
      )
    : null

  let updated = 0
  let skipped = 0
  let unchanged = 0

  for (const fm of targets) {
    const apiFixtureId = MATCH_NUMBER_OFFSET + fm.MatchNumber
    const dbRow = dbByFixture.get(apiFixtureId)
    if (!dbRow) continue

    if (dueFixtureIds && !dueFixtureIds.has(apiFixtureId)) {
      unchanged++
      continue
    }

    if (dbRow.manual_override) {
      skipped++
      continue
    }

    const [homeScore, awayScore] = extractScores(fm)
    const status = mapFifaStatus(fm.MatchStatus, homeScore, awayScore)

    if (status === 'scheduled' && homeScore === null && awayScore === null) {
      unchanged++
      continue
    }

    const changed =
      dbRow.home_score !== homeScore ||
      dbRow.away_score !== awayScore ||
      dbRow.status !== status

    if (!changed) {
      unchanged++
      continue
    }

    const { error } = await supabase
      .from('matches')
      .update({
        home_score: homeScore,
        away_score: awayScore,
        status,
        score_source: 'api',
      })
      .eq('id', dbRow.id)

    if (!error) updated++
  }

  return {
    success: true,
    updated,
    skipped,
    unchanged,
    total_fifa: fifaMatches.length,
    mode: options.matchNumber
      ? `match-${options.matchNumber}`
      : options.dueOnly
        ? 'due-only'
        : 'all',
    source: 'fifa.com',
  }
}

console.info('sync-scores: server started')

export default {
  fetch: withSupabase({ auth: ['secret', 'publishable'] }, async (req, ctx) => {
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders })
    }

    if (req.method !== 'POST') {
      return Response.json({ error: 'POST only' }, { status: 405, headers: corsHeaders })
    }

    try {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      )

      let body: SyncPayload = {}
      try {
        const text = await req.text()
        if (text) body = JSON.parse(text)
      } catch {
        body = {}
      }

      const result = await syncFifaToDb(supabase, {
        matchNumber: body.matchNumber,
        dueOnly: body.dueOnly ?? (!body.matchNumber && ctx.authMode !== 'secret'),
      })

      return Response.json(result, { headers: corsHeaders })
    } catch (err) {
      return Response.json(
        { error: err instanceof Error ? err.message : String(err) },
        { status: 500, headers: corsHeaders },
      )
    }
  }),
}
