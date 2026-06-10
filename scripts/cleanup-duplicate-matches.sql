-- Fix duplicate Finals / old placeholder knockouts
-- Run this in Supabase SQL Editor

-- 1. Remove old placeholder knockouts from initial seed (6 fake matches)
DELETE FROM matches WHERE api_fixture_id BETWEEN 3001 AND 3006;

-- 2. Remove any other stray knockout rows outside official FIFA numbering
DELETE FROM matches
WHERE stage IN ('Round of 32', 'Round of 16', 'Quarter-final', 'Semi-final', 'Third place', 'Final')
  AND (api_fixture_id IS NULL OR api_fixture_id < 2073 OR api_fixture_id > 2103);

-- 3. Ensure exactly one Final exists (FIFA match #104 = api_fixture_id 2103)
--    Mon 20 Jul 2026, 12:30 AM IST
INSERT INTO matches (api_fixture_id, stage, group_name, home_team, away_team, home_flag, away_flag, kickoff_at, status)
VALUES (2103, 'Final', NULL, 'TBD', 'TBD', '🏳️', '🏳️', '2026-07-19T19:00:00.000Z'::timestamptz, 'scheduled')
ON CONFLICT (api_fixture_id) DO UPDATE SET
  stage = EXCLUDED.stage,
  kickoff_at = EXCLUDED.kickoff_at,
  home_flag = EXCLUDED.home_flag,
  away_flag = EXCLUDED.away_flag;

-- Verify: should return exactly 1 row
SELECT api_fixture_id, stage, kickoff_at AT TIME ZONE 'Asia/Kolkata' AS kickoff_ist
FROM matches
WHERE stage = 'Final'
ORDER BY kickoff_at;
