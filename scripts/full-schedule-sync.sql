-- Full official FIFA World Cup 2026 schedule sync (104 matches, IST-accurate kickoffs)
-- Run in Supabase SQL Editor

-- Remove legacy placeholder knockouts (old seed used api_fixture_ids 3001-3006)
DELETE FROM matches WHERE api_fixture_id BETWEEN 3001 AND 3006;

-- Remove duplicate knockout rows outside official FIFA match numbers (2000-2103)
DELETE FROM matches
WHERE stage IN ('Round of 32', 'Round of 16', 'Quarter-final', 'Semi-final', 'Third place', 'Final')
  AND (api_fixture_id IS NULL OR api_fixture_id < 2000 OR api_fixture_id > 2103);

-- Ensure only one Final (official match #104 → api_fixture_id 2103)
DELETE FROM matches WHERE stage = 'Final' AND api_fixture_id <> 2103;

-- Ensure only one Third place match (#103 → api_fixture_id 2102)
DELETE FROM matches WHERE stage = 'Third place' AND api_fixture_id <> 2102;


INSERT INTO matches (api_fixture_id, stage, group_name, home_team, away_team, home_flag, away_flag, kickoff_at, status)
VALUES (2000, 'Group', 'A', 'Mexico', 'South Africa', '🇲🇽', '🇿🇦', '2026-06-11T19:00:00.000Z'::timestamptz, 'scheduled')
ON CONFLICT (api_fixture_id) DO UPDATE SET
  stage = EXCLUDED.stage,
  group_name = EXCLUDED.group_name,
  home_team = EXCLUDED.home_team,
  away_team = EXCLUDED.away_team,
  home_flag = EXCLUDED.home_flag,
  away_flag = EXCLUDED.away_flag,
  kickoff_at = EXCLUDED.kickoff_at;

INSERT INTO matches (api_fixture_id, stage, group_name, home_team, away_team, home_flag, away_flag, kickoff_at, status)
VALUES (2001, 'Group', 'A', 'South Korea', 'Czechia', '🇰🇷', '🇨🇿', '2026-06-12T02:00:00.000Z'::timestamptz, 'scheduled')
ON CONFLICT (api_fixture_id) DO UPDATE SET
  stage = EXCLUDED.stage,
  group_name = EXCLUDED.group_name,
  home_team = EXCLUDED.home_team,
  away_team = EXCLUDED.away_team,
  home_flag = EXCLUDED.home_flag,
  away_flag = EXCLUDED.away_flag,
  kickoff_at = EXCLUDED.kickoff_at;

INSERT INTO matches (api_fixture_id, stage, group_name, home_team, away_team, home_flag, away_flag, kickoff_at, status)
VALUES (2002, 'Group', 'B', 'Canada', 'Bosnia and Herzegovina', '🇨🇦', '🇧🇦', '2026-06-12T19:00:00.000Z'::timestamptz, 'scheduled')
ON CONFLICT (api_fixture_id) DO UPDATE SET
  stage = EXCLUDED.stage,
  group_name = EXCLUDED.group_name,
  home_team = EXCLUDED.home_team,
  away_team = EXCLUDED.away_team,
  home_flag = EXCLUDED.home_flag,
  away_flag = EXCLUDED.away_flag,
  kickoff_at = EXCLUDED.kickoff_at;

INSERT INTO matches (api_fixture_id, stage, group_name, home_team, away_team, home_flag, away_flag, kickoff_at, status)
VALUES (2003, 'Group', 'D', 'USA', 'Paraguay', '🇺🇸', '🇵🇾', '2026-06-13T01:00:00.000Z'::timestamptz, 'scheduled')
ON CONFLICT (api_fixture_id) DO UPDATE SET
  stage = EXCLUDED.stage,
  group_name = EXCLUDED.group_name,
  home_team = EXCLUDED.home_team,
  away_team = EXCLUDED.away_team,
  home_flag = EXCLUDED.home_flag,
  away_flag = EXCLUDED.away_flag,
  kickoff_at = EXCLUDED.kickoff_at;

INSERT INTO matches (api_fixture_id, stage, group_name, home_team, away_team, home_flag, away_flag, kickoff_at, status)
VALUES (2004, 'Group', 'C', 'Haiti', 'Scotland', '🇭🇹', '🏴󠁧󠁢󠁳󠁣󠁴󠁿', '2026-06-14T01:00:00.000Z'::timestamptz, 'scheduled')
ON CONFLICT (api_fixture_id) DO UPDATE SET
  stage = EXCLUDED.stage,
  group_name = EXCLUDED.group_name,
  home_team = EXCLUDED.home_team,
  away_team = EXCLUDED.away_team,
  home_flag = EXCLUDED.home_flag,
  away_flag = EXCLUDED.away_flag,
  kickoff_at = EXCLUDED.kickoff_at;

INSERT INTO matches (api_fixture_id, stage, group_name, home_team, away_team, home_flag, away_flag, kickoff_at, status)
VALUES (2005, 'Group', 'D', 'Australia', 'Türkiye', '🇦🇺', '🇹🇷', '2026-06-14T04:00:00.000Z'::timestamptz, 'scheduled')
ON CONFLICT (api_fixture_id) DO UPDATE SET
  stage = EXCLUDED.stage,
  group_name = EXCLUDED.group_name,
  home_team = EXCLUDED.home_team,
  away_team = EXCLUDED.away_team,
  home_flag = EXCLUDED.home_flag,
  away_flag = EXCLUDED.away_flag,
  kickoff_at = EXCLUDED.kickoff_at;

INSERT INTO matches (api_fixture_id, stage, group_name, home_team, away_team, home_flag, away_flag, kickoff_at, status)
VALUES (2006, 'Group', 'C', 'Brazil', 'Morocco', '🇧🇷', '🇲🇦', '2026-06-13T22:00:00.000Z'::timestamptz, 'scheduled')
ON CONFLICT (api_fixture_id) DO UPDATE SET
  stage = EXCLUDED.stage,
  group_name = EXCLUDED.group_name,
  home_team = EXCLUDED.home_team,
  away_team = EXCLUDED.away_team,
  home_flag = EXCLUDED.home_flag,
  away_flag = EXCLUDED.away_flag,
  kickoff_at = EXCLUDED.kickoff_at;

INSERT INTO matches (api_fixture_id, stage, group_name, home_team, away_team, home_flag, away_flag, kickoff_at, status)
VALUES (2007, 'Group', 'B', 'Qatar', 'Switzerland', '🇶🇦', '🇨🇭', '2026-06-13T19:00:00.000Z'::timestamptz, 'scheduled')
ON CONFLICT (api_fixture_id) DO UPDATE SET
  stage = EXCLUDED.stage,
  group_name = EXCLUDED.group_name,
  home_team = EXCLUDED.home_team,
  away_team = EXCLUDED.away_team,
  home_flag = EXCLUDED.home_flag,
  away_flag = EXCLUDED.away_flag,
  kickoff_at = EXCLUDED.kickoff_at;

INSERT INTO matches (api_fixture_id, stage, group_name, home_team, away_team, home_flag, away_flag, kickoff_at, status)
VALUES (2008, 'Group', 'E', 'Ivory Coast', 'Ecuador', '🇨🇮', '🇪🇨', '2026-06-14T23:00:00.000Z'::timestamptz, 'scheduled')
ON CONFLICT (api_fixture_id) DO UPDATE SET
  stage = EXCLUDED.stage,
  group_name = EXCLUDED.group_name,
  home_team = EXCLUDED.home_team,
  away_team = EXCLUDED.away_team,
  home_flag = EXCLUDED.home_flag,
  away_flag = EXCLUDED.away_flag,
  kickoff_at = EXCLUDED.kickoff_at;

INSERT INTO matches (api_fixture_id, stage, group_name, home_team, away_team, home_flag, away_flag, kickoff_at, status)
VALUES (2009, 'Group', 'E', 'Germany', 'Curaçao', '🇩🇪', '🇨🇼', '2026-06-14T17:00:00.000Z'::timestamptz, 'scheduled')
ON CONFLICT (api_fixture_id) DO UPDATE SET
  stage = EXCLUDED.stage,
  group_name = EXCLUDED.group_name,
  home_team = EXCLUDED.home_team,
  away_team = EXCLUDED.away_team,
  home_flag = EXCLUDED.home_flag,
  away_flag = EXCLUDED.away_flag,
  kickoff_at = EXCLUDED.kickoff_at;

INSERT INTO matches (api_fixture_id, stage, group_name, home_team, away_team, home_flag, away_flag, kickoff_at, status)
VALUES (2010, 'Group', 'F', 'Netherlands', 'Japan', '🇳🇱', '🇯🇵', '2026-06-14T20:00:00.000Z'::timestamptz, 'scheduled')
ON CONFLICT (api_fixture_id) DO UPDATE SET
  stage = EXCLUDED.stage,
  group_name = EXCLUDED.group_name,
  home_team = EXCLUDED.home_team,
  away_team = EXCLUDED.away_team,
  home_flag = EXCLUDED.home_flag,
  away_flag = EXCLUDED.away_flag,
  kickoff_at = EXCLUDED.kickoff_at;

INSERT INTO matches (api_fixture_id, stage, group_name, home_team, away_team, home_flag, away_flag, kickoff_at, status)
VALUES (2011, 'Group', 'F', 'Sweden', 'Tunisia', '🇸🇪', '🇹🇳', '2026-06-15T02:00:00.000Z'::timestamptz, 'scheduled')
ON CONFLICT (api_fixture_id) DO UPDATE SET
  stage = EXCLUDED.stage,
  group_name = EXCLUDED.group_name,
  home_team = EXCLUDED.home_team,
  away_team = EXCLUDED.away_team,
  home_flag = EXCLUDED.home_flag,
  away_flag = EXCLUDED.away_flag,
  kickoff_at = EXCLUDED.kickoff_at;

INSERT INTO matches (api_fixture_id, stage, group_name, home_team, away_team, home_flag, away_flag, kickoff_at, status)
VALUES (2012, 'Group', 'H', 'Saudi Arabia', 'Uruguay', '🇸🇦', '🇺🇾', '2026-06-15T22:00:00.000Z'::timestamptz, 'scheduled')
ON CONFLICT (api_fixture_id) DO UPDATE SET
  stage = EXCLUDED.stage,
  group_name = EXCLUDED.group_name,
  home_team = EXCLUDED.home_team,
  away_team = EXCLUDED.away_team,
  home_flag = EXCLUDED.home_flag,
  away_flag = EXCLUDED.away_flag,
  kickoff_at = EXCLUDED.kickoff_at;

INSERT INTO matches (api_fixture_id, stage, group_name, home_team, away_team, home_flag, away_flag, kickoff_at, status)
VALUES (2013, 'Group', 'H', 'Spain', 'Cape Verde', '🇪🇸', '🇨🇻', '2026-06-15T16:00:00.000Z'::timestamptz, 'scheduled')
ON CONFLICT (api_fixture_id) DO UPDATE SET
  stage = EXCLUDED.stage,
  group_name = EXCLUDED.group_name,
  home_team = EXCLUDED.home_team,
  away_team = EXCLUDED.away_team,
  home_flag = EXCLUDED.home_flag,
  away_flag = EXCLUDED.away_flag,
  kickoff_at = EXCLUDED.kickoff_at;

INSERT INTO matches (api_fixture_id, stage, group_name, home_team, away_team, home_flag, away_flag, kickoff_at, status)
VALUES (2014, 'Group', 'G', 'Iran', 'New Zealand', '🇮🇷', '🇳🇿', '2026-06-16T01:00:00.000Z'::timestamptz, 'scheduled')
ON CONFLICT (api_fixture_id) DO UPDATE SET
  stage = EXCLUDED.stage,
  group_name = EXCLUDED.group_name,
  home_team = EXCLUDED.home_team,
  away_team = EXCLUDED.away_team,
  home_flag = EXCLUDED.home_flag,
  away_flag = EXCLUDED.away_flag,
  kickoff_at = EXCLUDED.kickoff_at;

INSERT INTO matches (api_fixture_id, stage, group_name, home_team, away_team, home_flag, away_flag, kickoff_at, status)
VALUES (2015, 'Group', 'G', 'Belgium', 'Egypt', '🇧🇪', '🇪🇬', '2026-06-15T19:00:00.000Z'::timestamptz, 'scheduled')
ON CONFLICT (api_fixture_id) DO UPDATE SET
  stage = EXCLUDED.stage,
  group_name = EXCLUDED.group_name,
  home_team = EXCLUDED.home_team,
  away_team = EXCLUDED.away_team,
  home_flag = EXCLUDED.home_flag,
  away_flag = EXCLUDED.away_flag,
  kickoff_at = EXCLUDED.kickoff_at;

INSERT INTO matches (api_fixture_id, stage, group_name, home_team, away_team, home_flag, away_flag, kickoff_at, status)
VALUES (2016, 'Group', 'I', 'France', 'Senegal', '🇫🇷', '🇸🇳', '2026-06-16T19:00:00.000Z'::timestamptz, 'scheduled')
ON CONFLICT (api_fixture_id) DO UPDATE SET
  stage = EXCLUDED.stage,
  group_name = EXCLUDED.group_name,
  home_team = EXCLUDED.home_team,
  away_team = EXCLUDED.away_team,
  home_flag = EXCLUDED.home_flag,
  away_flag = EXCLUDED.away_flag,
  kickoff_at = EXCLUDED.kickoff_at;

INSERT INTO matches (api_fixture_id, stage, group_name, home_team, away_team, home_flag, away_flag, kickoff_at, status)
VALUES (2017, 'Group', 'I', 'Iraq', 'Norway', '🇮🇶', '🇳🇴', '2026-06-16T22:00:00.000Z'::timestamptz, 'scheduled')
ON CONFLICT (api_fixture_id) DO UPDATE SET
  stage = EXCLUDED.stage,
  group_name = EXCLUDED.group_name,
  home_team = EXCLUDED.home_team,
  away_team = EXCLUDED.away_team,
  home_flag = EXCLUDED.home_flag,
  away_flag = EXCLUDED.away_flag,
  kickoff_at = EXCLUDED.kickoff_at;

INSERT INTO matches (api_fixture_id, stage, group_name, home_team, away_team, home_flag, away_flag, kickoff_at, status)
VALUES (2018, 'Group', 'J', 'Argentina', 'Algeria', '🇦🇷', '🇩🇿', '2026-06-17T01:00:00.000Z'::timestamptz, 'scheduled')
ON CONFLICT (api_fixture_id) DO UPDATE SET
  stage = EXCLUDED.stage,
  group_name = EXCLUDED.group_name,
  home_team = EXCLUDED.home_team,
  away_team = EXCLUDED.away_team,
  home_flag = EXCLUDED.home_flag,
  away_flag = EXCLUDED.away_flag,
  kickoff_at = EXCLUDED.kickoff_at;

INSERT INTO matches (api_fixture_id, stage, group_name, home_team, away_team, home_flag, away_flag, kickoff_at, status)
VALUES (2019, 'Group', 'J', 'Austria', 'Jordan', '🇦🇹', '🇯🇴', '2026-06-17T04:00:00.000Z'::timestamptz, 'scheduled')
ON CONFLICT (api_fixture_id) DO UPDATE SET
  stage = EXCLUDED.stage,
  group_name = EXCLUDED.group_name,
  home_team = EXCLUDED.home_team,
  away_team = EXCLUDED.away_team,
  home_flag = EXCLUDED.home_flag,
  away_flag = EXCLUDED.away_flag,
  kickoff_at = EXCLUDED.kickoff_at;

INSERT INTO matches (api_fixture_id, stage, group_name, home_team, away_team, home_flag, away_flag, kickoff_at, status)
VALUES (2020, 'Group', 'L', 'Ghana', 'Panama', '🇬🇭', '🇵🇦', '2026-06-17T23:00:00.000Z'::timestamptz, 'scheduled')
ON CONFLICT (api_fixture_id) DO UPDATE SET
  stage = EXCLUDED.stage,
  group_name = EXCLUDED.group_name,
  home_team = EXCLUDED.home_team,
  away_team = EXCLUDED.away_team,
  home_flag = EXCLUDED.home_flag,
  away_flag = EXCLUDED.away_flag,
  kickoff_at = EXCLUDED.kickoff_at;

INSERT INTO matches (api_fixture_id, stage, group_name, home_team, away_team, home_flag, away_flag, kickoff_at, status)
VALUES (2021, 'Group', 'L', 'England', 'Croatia', '🏴󠁧󠁢󠁥󠁮󠁧󠁿', '🇭🇷', '2026-06-17T20:00:00.000Z'::timestamptz, 'scheduled')
ON CONFLICT (api_fixture_id) DO UPDATE SET
  stage = EXCLUDED.stage,
  group_name = EXCLUDED.group_name,
  home_team = EXCLUDED.home_team,
  away_team = EXCLUDED.away_team,
  home_flag = EXCLUDED.home_flag,
  away_flag = EXCLUDED.away_flag,
  kickoff_at = EXCLUDED.kickoff_at;

INSERT INTO matches (api_fixture_id, stage, group_name, home_team, away_team, home_flag, away_flag, kickoff_at, status)
VALUES (2022, 'Group', 'K', 'Portugal', 'Congo DR', '🇵🇹', '🇨🇩', '2026-06-17T17:00:00.000Z'::timestamptz, 'scheduled')
ON CONFLICT (api_fixture_id) DO UPDATE SET
  stage = EXCLUDED.stage,
  group_name = EXCLUDED.group_name,
  home_team = EXCLUDED.home_team,
  away_team = EXCLUDED.away_team,
  home_flag = EXCLUDED.home_flag,
  away_flag = EXCLUDED.away_flag,
  kickoff_at = EXCLUDED.kickoff_at;

INSERT INTO matches (api_fixture_id, stage, group_name, home_team, away_team, home_flag, away_flag, kickoff_at, status)
VALUES (2023, 'Group', 'K', 'Uzbekistan', 'Colombia', '🇺🇿', '🇨🇴', '2026-06-18T02:00:00.000Z'::timestamptz, 'scheduled')
ON CONFLICT (api_fixture_id) DO UPDATE SET
  stage = EXCLUDED.stage,
  group_name = EXCLUDED.group_name,
  home_team = EXCLUDED.home_team,
  away_team = EXCLUDED.away_team,
  home_flag = EXCLUDED.home_flag,
  away_flag = EXCLUDED.away_flag,
  kickoff_at = EXCLUDED.kickoff_at;

INSERT INTO matches (api_fixture_id, stage, group_name, home_team, away_team, home_flag, away_flag, kickoff_at, status)
VALUES (2024, 'Group', 'A', 'Czechia', 'South Africa', '🇨🇿', '🇿🇦', '2026-06-18T16:00:00.000Z'::timestamptz, 'scheduled')
ON CONFLICT (api_fixture_id) DO UPDATE SET
  stage = EXCLUDED.stage,
  group_name = EXCLUDED.group_name,
  home_team = EXCLUDED.home_team,
  away_team = EXCLUDED.away_team,
  home_flag = EXCLUDED.home_flag,
  away_flag = EXCLUDED.away_flag,
  kickoff_at = EXCLUDED.kickoff_at;

INSERT INTO matches (api_fixture_id, stage, group_name, home_team, away_team, home_flag, away_flag, kickoff_at, status)
VALUES (2025, 'Group', 'B', 'Switzerland', 'Bosnia and Herzegovina', '🇨🇭', '🇧🇦', '2026-06-18T19:00:00.000Z'::timestamptz, 'scheduled')
ON CONFLICT (api_fixture_id) DO UPDATE SET
  stage = EXCLUDED.stage,
  group_name = EXCLUDED.group_name,
  home_team = EXCLUDED.home_team,
  away_team = EXCLUDED.away_team,
  home_flag = EXCLUDED.home_flag,
  away_flag = EXCLUDED.away_flag,
  kickoff_at = EXCLUDED.kickoff_at;

INSERT INTO matches (api_fixture_id, stage, group_name, home_team, away_team, home_flag, away_flag, kickoff_at, status)
VALUES (2026, 'Group', 'B', 'Canada', 'Qatar', '🇨🇦', '🇶🇦', '2026-06-18T22:00:00.000Z'::timestamptz, 'scheduled')
ON CONFLICT (api_fixture_id) DO UPDATE SET
  stage = EXCLUDED.stage,
  group_name = EXCLUDED.group_name,
  home_team = EXCLUDED.home_team,
  away_team = EXCLUDED.away_team,
  home_flag = EXCLUDED.home_flag,
  away_flag = EXCLUDED.away_flag,
  kickoff_at = EXCLUDED.kickoff_at;

INSERT INTO matches (api_fixture_id, stage, group_name, home_team, away_team, home_flag, away_flag, kickoff_at, status)
VALUES (2027, 'Group', 'A', 'Mexico', 'South Korea', '🇲🇽', '🇰🇷', '2026-06-19T01:00:00.000Z'::timestamptz, 'scheduled')
ON CONFLICT (api_fixture_id) DO UPDATE SET
  stage = EXCLUDED.stage,
  group_name = EXCLUDED.group_name,
  home_team = EXCLUDED.home_team,
  away_team = EXCLUDED.away_team,
  home_flag = EXCLUDED.home_flag,
  away_flag = EXCLUDED.away_flag,
  kickoff_at = EXCLUDED.kickoff_at;

INSERT INTO matches (api_fixture_id, stage, group_name, home_team, away_team, home_flag, away_flag, kickoff_at, status)
VALUES (2028, 'Group', 'C', 'Brazil', 'Haiti', '🇧🇷', '🇭🇹', '2026-06-20T00:30:00.000Z'::timestamptz, 'scheduled')
ON CONFLICT (api_fixture_id) DO UPDATE SET
  stage = EXCLUDED.stage,
  group_name = EXCLUDED.group_name,
  home_team = EXCLUDED.home_team,
  away_team = EXCLUDED.away_team,
  home_flag = EXCLUDED.home_flag,
  away_flag = EXCLUDED.away_flag,
  kickoff_at = EXCLUDED.kickoff_at;

INSERT INTO matches (api_fixture_id, stage, group_name, home_team, away_team, home_flag, away_flag, kickoff_at, status)
VALUES (2029, 'Group', 'C', 'Scotland', 'Morocco', '🏴󠁧󠁢󠁳󠁣󠁴󠁿', '🇲🇦', '2026-06-19T22:00:00.000Z'::timestamptz, 'scheduled')
ON CONFLICT (api_fixture_id) DO UPDATE SET
  stage = EXCLUDED.stage,
  group_name = EXCLUDED.group_name,
  home_team = EXCLUDED.home_team,
  away_team = EXCLUDED.away_team,
  home_flag = EXCLUDED.home_flag,
  away_flag = EXCLUDED.away_flag,
  kickoff_at = EXCLUDED.kickoff_at;

INSERT INTO matches (api_fixture_id, stage, group_name, home_team, away_team, home_flag, away_flag, kickoff_at, status)
VALUES (2030, 'Group', 'D', 'Türkiye', 'Paraguay', '🇹🇷', '🇵🇾', '2026-06-20T03:00:00.000Z'::timestamptz, 'scheduled')
ON CONFLICT (api_fixture_id) DO UPDATE SET
  stage = EXCLUDED.stage,
  group_name = EXCLUDED.group_name,
  home_team = EXCLUDED.home_team,
  away_team = EXCLUDED.away_team,
  home_flag = EXCLUDED.home_flag,
  away_flag = EXCLUDED.away_flag,
  kickoff_at = EXCLUDED.kickoff_at;

INSERT INTO matches (api_fixture_id, stage, group_name, home_team, away_team, home_flag, away_flag, kickoff_at, status)
VALUES (2031, 'Group', 'D', 'USA', 'Australia', '🇺🇸', '🇦🇺', '2026-06-19T19:00:00.000Z'::timestamptz, 'scheduled')
ON CONFLICT (api_fixture_id) DO UPDATE SET
  stage = EXCLUDED.stage,
  group_name = EXCLUDED.group_name,
  home_team = EXCLUDED.home_team,
  away_team = EXCLUDED.away_team,
  home_flag = EXCLUDED.home_flag,
  away_flag = EXCLUDED.away_flag,
  kickoff_at = EXCLUDED.kickoff_at;

INSERT INTO matches (api_fixture_id, stage, group_name, home_team, away_team, home_flag, away_flag, kickoff_at, status)
VALUES (2032, 'Group', 'E', 'Germany', 'Ivory Coast', '🇩🇪', '🇨🇮', '2026-06-20T20:00:00.000Z'::timestamptz, 'scheduled')
ON CONFLICT (api_fixture_id) DO UPDATE SET
  stage = EXCLUDED.stage,
  group_name = EXCLUDED.group_name,
  home_team = EXCLUDED.home_team,
  away_team = EXCLUDED.away_team,
  home_flag = EXCLUDED.home_flag,
  away_flag = EXCLUDED.away_flag,
  kickoff_at = EXCLUDED.kickoff_at;

INSERT INTO matches (api_fixture_id, stage, group_name, home_team, away_team, home_flag, away_flag, kickoff_at, status)
VALUES (2033, 'Group', 'E', 'Ecuador', 'Curaçao', '🇪🇨', '🇨🇼', '2026-06-21T00:00:00.000Z'::timestamptz, 'scheduled')
ON CONFLICT (api_fixture_id) DO UPDATE SET
  stage = EXCLUDED.stage,
  group_name = EXCLUDED.group_name,
  home_team = EXCLUDED.home_team,
  away_team = EXCLUDED.away_team,
  home_flag = EXCLUDED.home_flag,
  away_flag = EXCLUDED.away_flag,
  kickoff_at = EXCLUDED.kickoff_at;

INSERT INTO matches (api_fixture_id, stage, group_name, home_team, away_team, home_flag, away_flag, kickoff_at, status)
VALUES (2034, 'Group', 'F', 'Netherlands', 'Sweden', '🇳🇱', '🇸🇪', '2026-06-20T17:00:00.000Z'::timestamptz, 'scheduled')
ON CONFLICT (api_fixture_id) DO UPDATE SET
  stage = EXCLUDED.stage,
  group_name = EXCLUDED.group_name,
  home_team = EXCLUDED.home_team,
  away_team = EXCLUDED.away_team,
  home_flag = EXCLUDED.home_flag,
  away_flag = EXCLUDED.away_flag,
  kickoff_at = EXCLUDED.kickoff_at;

INSERT INTO matches (api_fixture_id, stage, group_name, home_team, away_team, home_flag, away_flag, kickoff_at, status)
VALUES (2035, 'Group', 'F', 'Tunisia', 'Japan', '🇹🇳', '🇯🇵', '2026-06-21T04:00:00.000Z'::timestamptz, 'scheduled')
ON CONFLICT (api_fixture_id) DO UPDATE SET
  stage = EXCLUDED.stage,
  group_name = EXCLUDED.group_name,
  home_team = EXCLUDED.home_team,
  away_team = EXCLUDED.away_team,
  home_flag = EXCLUDED.home_flag,
  away_flag = EXCLUDED.away_flag,
  kickoff_at = EXCLUDED.kickoff_at;

INSERT INTO matches (api_fixture_id, stage, group_name, home_team, away_team, home_flag, away_flag, kickoff_at, status)
VALUES (2036, 'Group', 'H', 'Uruguay', 'Cape Verde', '🇺🇾', '🇨🇻', '2026-06-21T22:00:00.000Z'::timestamptz, 'scheduled')
ON CONFLICT (api_fixture_id) DO UPDATE SET
  stage = EXCLUDED.stage,
  group_name = EXCLUDED.group_name,
  home_team = EXCLUDED.home_team,
  away_team = EXCLUDED.away_team,
  home_flag = EXCLUDED.home_flag,
  away_flag = EXCLUDED.away_flag,
  kickoff_at = EXCLUDED.kickoff_at;

INSERT INTO matches (api_fixture_id, stage, group_name, home_team, away_team, home_flag, away_flag, kickoff_at, status)
VALUES (2037, 'Group', 'H', 'Spain', 'Saudi Arabia', '🇪🇸', '🇸🇦', '2026-06-21T16:00:00.000Z'::timestamptz, 'scheduled')
ON CONFLICT (api_fixture_id) DO UPDATE SET
  stage = EXCLUDED.stage,
  group_name = EXCLUDED.group_name,
  home_team = EXCLUDED.home_team,
  away_team = EXCLUDED.away_team,
  home_flag = EXCLUDED.home_flag,
  away_flag = EXCLUDED.away_flag,
  kickoff_at = EXCLUDED.kickoff_at;

INSERT INTO matches (api_fixture_id, stage, group_name, home_team, away_team, home_flag, away_flag, kickoff_at, status)
VALUES (2038, 'Group', 'G', 'Belgium', 'Iran', '🇧🇪', '🇮🇷', '2026-06-21T19:00:00.000Z'::timestamptz, 'scheduled')
ON CONFLICT (api_fixture_id) DO UPDATE SET
  stage = EXCLUDED.stage,
  group_name = EXCLUDED.group_name,
  home_team = EXCLUDED.home_team,
  away_team = EXCLUDED.away_team,
  home_flag = EXCLUDED.home_flag,
  away_flag = EXCLUDED.away_flag,
  kickoff_at = EXCLUDED.kickoff_at;

INSERT INTO matches (api_fixture_id, stage, group_name, home_team, away_team, home_flag, away_flag, kickoff_at, status)
VALUES (2039, 'Group', 'G', 'New Zealand', 'Egypt', '🇳🇿', '🇪🇬', '2026-06-22T01:00:00.000Z'::timestamptz, 'scheduled')
ON CONFLICT (api_fixture_id) DO UPDATE SET
  stage = EXCLUDED.stage,
  group_name = EXCLUDED.group_name,
  home_team = EXCLUDED.home_team,
  away_team = EXCLUDED.away_team,
  home_flag = EXCLUDED.home_flag,
  away_flag = EXCLUDED.away_flag,
  kickoff_at = EXCLUDED.kickoff_at;

INSERT INTO matches (api_fixture_id, stage, group_name, home_team, away_team, home_flag, away_flag, kickoff_at, status)
VALUES (2040, 'Group', 'I', 'Norway', 'Senegal', '🇳🇴', '🇸🇳', '2026-06-23T00:00:00.000Z'::timestamptz, 'scheduled')
ON CONFLICT (api_fixture_id) DO UPDATE SET
  stage = EXCLUDED.stage,
  group_name = EXCLUDED.group_name,
  home_team = EXCLUDED.home_team,
  away_team = EXCLUDED.away_team,
  home_flag = EXCLUDED.home_flag,
  away_flag = EXCLUDED.away_flag,
  kickoff_at = EXCLUDED.kickoff_at;

INSERT INTO matches (api_fixture_id, stage, group_name, home_team, away_team, home_flag, away_flag, kickoff_at, status)
VALUES (2041, 'Group', 'I', 'France', 'Iraq', '🇫🇷', '🇮🇶', '2026-06-22T21:00:00.000Z'::timestamptz, 'scheduled')
ON CONFLICT (api_fixture_id) DO UPDATE SET
  stage = EXCLUDED.stage,
  group_name = EXCLUDED.group_name,
  home_team = EXCLUDED.home_team,
  away_team = EXCLUDED.away_team,
  home_flag = EXCLUDED.home_flag,
  away_flag = EXCLUDED.away_flag,
  kickoff_at = EXCLUDED.kickoff_at;

INSERT INTO matches (api_fixture_id, stage, group_name, home_team, away_team, home_flag, away_flag, kickoff_at, status)
VALUES (2042, 'Group', 'J', 'Argentina', 'Austria', '🇦🇷', '🇦🇹', '2026-06-22T17:00:00.000Z'::timestamptz, 'scheduled')
ON CONFLICT (api_fixture_id) DO UPDATE SET
  stage = EXCLUDED.stage,
  group_name = EXCLUDED.group_name,
  home_team = EXCLUDED.home_team,
  away_team = EXCLUDED.away_team,
  home_flag = EXCLUDED.home_flag,
  away_flag = EXCLUDED.away_flag,
  kickoff_at = EXCLUDED.kickoff_at;

INSERT INTO matches (api_fixture_id, stage, group_name, home_team, away_team, home_flag, away_flag, kickoff_at, status)
VALUES (2043, 'Group', 'J', 'Jordan', 'Algeria', '🇯🇴', '🇩🇿', '2026-06-23T03:00:00.000Z'::timestamptz, 'scheduled')
ON CONFLICT (api_fixture_id) DO UPDATE SET
  stage = EXCLUDED.stage,
  group_name = EXCLUDED.group_name,
  home_team = EXCLUDED.home_team,
  away_team = EXCLUDED.away_team,
  home_flag = EXCLUDED.home_flag,
  away_flag = EXCLUDED.away_flag,
  kickoff_at = EXCLUDED.kickoff_at;

INSERT INTO matches (api_fixture_id, stage, group_name, home_team, away_team, home_flag, away_flag, kickoff_at, status)
VALUES (2044, 'Group', 'L', 'England', 'Ghana', '🏴󠁧󠁢󠁥󠁮󠁧󠁿', '🇬🇭', '2026-06-23T20:00:00.000Z'::timestamptz, 'scheduled')
ON CONFLICT (api_fixture_id) DO UPDATE SET
  stage = EXCLUDED.stage,
  group_name = EXCLUDED.group_name,
  home_team = EXCLUDED.home_team,
  away_team = EXCLUDED.away_team,
  home_flag = EXCLUDED.home_flag,
  away_flag = EXCLUDED.away_flag,
  kickoff_at = EXCLUDED.kickoff_at;

INSERT INTO matches (api_fixture_id, stage, group_name, home_team, away_team, home_flag, away_flag, kickoff_at, status)
VALUES (2045, 'Group', 'L', 'Panama', 'Croatia', '🇵🇦', '🇭🇷', '2026-06-23T23:00:00.000Z'::timestamptz, 'scheduled')
ON CONFLICT (api_fixture_id) DO UPDATE SET
  stage = EXCLUDED.stage,
  group_name = EXCLUDED.group_name,
  home_team = EXCLUDED.home_team,
  away_team = EXCLUDED.away_team,
  home_flag = EXCLUDED.home_flag,
  away_flag = EXCLUDED.away_flag,
  kickoff_at = EXCLUDED.kickoff_at;

INSERT INTO matches (api_fixture_id, stage, group_name, home_team, away_team, home_flag, away_flag, kickoff_at, status)
VALUES (2046, 'Group', 'K', 'Portugal', 'Uzbekistan', '🇵🇹', '🇺🇿', '2026-06-23T17:00:00.000Z'::timestamptz, 'scheduled')
ON CONFLICT (api_fixture_id) DO UPDATE SET
  stage = EXCLUDED.stage,
  group_name = EXCLUDED.group_name,
  home_team = EXCLUDED.home_team,
  away_team = EXCLUDED.away_team,
  home_flag = EXCLUDED.home_flag,
  away_flag = EXCLUDED.away_flag,
  kickoff_at = EXCLUDED.kickoff_at;

INSERT INTO matches (api_fixture_id, stage, group_name, home_team, away_team, home_flag, away_flag, kickoff_at, status)
VALUES (2047, 'Group', 'K', 'Colombia', 'Congo DR', '🇨🇴', '🇨🇩', '2026-06-24T02:00:00.000Z'::timestamptz, 'scheduled')
ON CONFLICT (api_fixture_id) DO UPDATE SET
  stage = EXCLUDED.stage,
  group_name = EXCLUDED.group_name,
  home_team = EXCLUDED.home_team,
  away_team = EXCLUDED.away_team,
  home_flag = EXCLUDED.home_flag,
  away_flag = EXCLUDED.away_flag,
  kickoff_at = EXCLUDED.kickoff_at;

INSERT INTO matches (api_fixture_id, stage, group_name, home_team, away_team, home_flag, away_flag, kickoff_at, status)
VALUES (2048, 'Group', 'C', 'Scotland', 'Brazil', '🏴󠁧󠁢󠁳󠁣󠁴󠁿', '🇧🇷', '2026-06-24T22:00:00.000Z'::timestamptz, 'scheduled')
ON CONFLICT (api_fixture_id) DO UPDATE SET
  stage = EXCLUDED.stage,
  group_name = EXCLUDED.group_name,
  home_team = EXCLUDED.home_team,
  away_team = EXCLUDED.away_team,
  home_flag = EXCLUDED.home_flag,
  away_flag = EXCLUDED.away_flag,
  kickoff_at = EXCLUDED.kickoff_at;

INSERT INTO matches (api_fixture_id, stage, group_name, home_team, away_team, home_flag, away_flag, kickoff_at, status)
VALUES (2049, 'Group', 'C', 'Morocco', 'Haiti', '🇲🇦', '🇭🇹', '2026-06-24T22:00:00.000Z'::timestamptz, 'scheduled')
ON CONFLICT (api_fixture_id) DO UPDATE SET
  stage = EXCLUDED.stage,
  group_name = EXCLUDED.group_name,
  home_team = EXCLUDED.home_team,
  away_team = EXCLUDED.away_team,
  home_flag = EXCLUDED.home_flag,
  away_flag = EXCLUDED.away_flag,
  kickoff_at = EXCLUDED.kickoff_at;

INSERT INTO matches (api_fixture_id, stage, group_name, home_team, away_team, home_flag, away_flag, kickoff_at, status)
VALUES (2050, 'Group', 'B', 'Switzerland', 'Canada', '🇨🇭', '🇨🇦', '2026-06-24T19:00:00.000Z'::timestamptz, 'scheduled')
ON CONFLICT (api_fixture_id) DO UPDATE SET
  stage = EXCLUDED.stage,
  group_name = EXCLUDED.group_name,
  home_team = EXCLUDED.home_team,
  away_team = EXCLUDED.away_team,
  home_flag = EXCLUDED.home_flag,
  away_flag = EXCLUDED.away_flag,
  kickoff_at = EXCLUDED.kickoff_at;

INSERT INTO matches (api_fixture_id, stage, group_name, home_team, away_team, home_flag, away_flag, kickoff_at, status)
VALUES (2051, 'Group', 'B', 'Bosnia and Herzegovina', 'Qatar', '🇧🇦', '🇶🇦', '2026-06-24T19:00:00.000Z'::timestamptz, 'scheduled')
ON CONFLICT (api_fixture_id) DO UPDATE SET
  stage = EXCLUDED.stage,
  group_name = EXCLUDED.group_name,
  home_team = EXCLUDED.home_team,
  away_team = EXCLUDED.away_team,
  home_flag = EXCLUDED.home_flag,
  away_flag = EXCLUDED.away_flag,
  kickoff_at = EXCLUDED.kickoff_at;

INSERT INTO matches (api_fixture_id, stage, group_name, home_team, away_team, home_flag, away_flag, kickoff_at, status)
VALUES (2052, 'Group', 'A', 'Czechia', 'Mexico', '🇨🇿', '🇲🇽', '2026-06-25T01:00:00.000Z'::timestamptz, 'scheduled')
ON CONFLICT (api_fixture_id) DO UPDATE SET
  stage = EXCLUDED.stage,
  group_name = EXCLUDED.group_name,
  home_team = EXCLUDED.home_team,
  away_team = EXCLUDED.away_team,
  home_flag = EXCLUDED.home_flag,
  away_flag = EXCLUDED.away_flag,
  kickoff_at = EXCLUDED.kickoff_at;

INSERT INTO matches (api_fixture_id, stage, group_name, home_team, away_team, home_flag, away_flag, kickoff_at, status)
VALUES (2053, 'Group', 'A', 'South Africa', 'South Korea', '🇿🇦', '🇰🇷', '2026-06-25T01:00:00.000Z'::timestamptz, 'scheduled')
ON CONFLICT (api_fixture_id) DO UPDATE SET
  stage = EXCLUDED.stage,
  group_name = EXCLUDED.group_name,
  home_team = EXCLUDED.home_team,
  away_team = EXCLUDED.away_team,
  home_flag = EXCLUDED.home_flag,
  away_flag = EXCLUDED.away_flag,
  kickoff_at = EXCLUDED.kickoff_at;

INSERT INTO matches (api_fixture_id, stage, group_name, home_team, away_team, home_flag, away_flag, kickoff_at, status)
VALUES (2054, 'Group', 'E', 'Curaçao', 'Ivory Coast', '🇨🇼', '🇨🇮', '2026-06-25T20:00:00.000Z'::timestamptz, 'scheduled')
ON CONFLICT (api_fixture_id) DO UPDATE SET
  stage = EXCLUDED.stage,
  group_name = EXCLUDED.group_name,
  home_team = EXCLUDED.home_team,
  away_team = EXCLUDED.away_team,
  home_flag = EXCLUDED.home_flag,
  away_flag = EXCLUDED.away_flag,
  kickoff_at = EXCLUDED.kickoff_at;

INSERT INTO matches (api_fixture_id, stage, group_name, home_team, away_team, home_flag, away_flag, kickoff_at, status)
VALUES (2055, 'Group', 'E', 'Ecuador', 'Germany', '🇪🇨', '🇩🇪', '2026-06-25T20:00:00.000Z'::timestamptz, 'scheduled')
ON CONFLICT (api_fixture_id) DO UPDATE SET
  stage = EXCLUDED.stage,
  group_name = EXCLUDED.group_name,
  home_team = EXCLUDED.home_team,
  away_team = EXCLUDED.away_team,
  home_flag = EXCLUDED.home_flag,
  away_flag = EXCLUDED.away_flag,
  kickoff_at = EXCLUDED.kickoff_at;

INSERT INTO matches (api_fixture_id, stage, group_name, home_team, away_team, home_flag, away_flag, kickoff_at, status)
VALUES (2056, 'Group', 'F', 'Japan', 'Sweden', '🇯🇵', '🇸🇪', '2026-06-25T23:00:00.000Z'::timestamptz, 'scheduled')
ON CONFLICT (api_fixture_id) DO UPDATE SET
  stage = EXCLUDED.stage,
  group_name = EXCLUDED.group_name,
  home_team = EXCLUDED.home_team,
  away_team = EXCLUDED.away_team,
  home_flag = EXCLUDED.home_flag,
  away_flag = EXCLUDED.away_flag,
  kickoff_at = EXCLUDED.kickoff_at;

INSERT INTO matches (api_fixture_id, stage, group_name, home_team, away_team, home_flag, away_flag, kickoff_at, status)
VALUES (2057, 'Group', 'F', 'Tunisia', 'Netherlands', '🇹🇳', '🇳🇱', '2026-06-25T23:00:00.000Z'::timestamptz, 'scheduled')
ON CONFLICT (api_fixture_id) DO UPDATE SET
  stage = EXCLUDED.stage,
  group_name = EXCLUDED.group_name,
  home_team = EXCLUDED.home_team,
  away_team = EXCLUDED.away_team,
  home_flag = EXCLUDED.home_flag,
  away_flag = EXCLUDED.away_flag,
  kickoff_at = EXCLUDED.kickoff_at;

INSERT INTO matches (api_fixture_id, stage, group_name, home_team, away_team, home_flag, away_flag, kickoff_at, status)
VALUES (2058, 'Group', 'D', 'Türkiye', 'USA', '🇹🇷', '🇺🇸', '2026-06-26T02:00:00.000Z'::timestamptz, 'scheduled')
ON CONFLICT (api_fixture_id) DO UPDATE SET
  stage = EXCLUDED.stage,
  group_name = EXCLUDED.group_name,
  home_team = EXCLUDED.home_team,
  away_team = EXCLUDED.away_team,
  home_flag = EXCLUDED.home_flag,
  away_flag = EXCLUDED.away_flag,
  kickoff_at = EXCLUDED.kickoff_at;

INSERT INTO matches (api_fixture_id, stage, group_name, home_team, away_team, home_flag, away_flag, kickoff_at, status)
VALUES (2059, 'Group', 'D', 'Paraguay', 'Australia', '🇵🇾', '🇦🇺', '2026-06-26T02:00:00.000Z'::timestamptz, 'scheduled')
ON CONFLICT (api_fixture_id) DO UPDATE SET
  stage = EXCLUDED.stage,
  group_name = EXCLUDED.group_name,
  home_team = EXCLUDED.home_team,
  away_team = EXCLUDED.away_team,
  home_flag = EXCLUDED.home_flag,
  away_flag = EXCLUDED.away_flag,
  kickoff_at = EXCLUDED.kickoff_at;

INSERT INTO matches (api_fixture_id, stage, group_name, home_team, away_team, home_flag, away_flag, kickoff_at, status)
VALUES (2060, 'Group', 'I', 'Norway', 'France', '🇳🇴', '🇫🇷', '2026-06-26T19:00:00.000Z'::timestamptz, 'scheduled')
ON CONFLICT (api_fixture_id) DO UPDATE SET
  stage = EXCLUDED.stage,
  group_name = EXCLUDED.group_name,
  home_team = EXCLUDED.home_team,
  away_team = EXCLUDED.away_team,
  home_flag = EXCLUDED.home_flag,
  away_flag = EXCLUDED.away_flag,
  kickoff_at = EXCLUDED.kickoff_at;

INSERT INTO matches (api_fixture_id, stage, group_name, home_team, away_team, home_flag, away_flag, kickoff_at, status)
VALUES (2061, 'Group', 'I', 'Senegal', 'Iraq', '🇸🇳', '🇮🇶', '2026-06-26T19:00:00.000Z'::timestamptz, 'scheduled')
ON CONFLICT (api_fixture_id) DO UPDATE SET
  stage = EXCLUDED.stage,
  group_name = EXCLUDED.group_name,
  home_team = EXCLUDED.home_team,
  away_team = EXCLUDED.away_team,
  home_flag = EXCLUDED.home_flag,
  away_flag = EXCLUDED.away_flag,
  kickoff_at = EXCLUDED.kickoff_at;

INSERT INTO matches (api_fixture_id, stage, group_name, home_team, away_team, home_flag, away_flag, kickoff_at, status)
VALUES (2062, 'Group', 'G', 'Egypt', 'Iran', '🇪🇬', '🇮🇷', '2026-06-27T03:00:00.000Z'::timestamptz, 'scheduled')
ON CONFLICT (api_fixture_id) DO UPDATE SET
  stage = EXCLUDED.stage,
  group_name = EXCLUDED.group_name,
  home_team = EXCLUDED.home_team,
  away_team = EXCLUDED.away_team,
  home_flag = EXCLUDED.home_flag,
  away_flag = EXCLUDED.away_flag,
  kickoff_at = EXCLUDED.kickoff_at;

INSERT INTO matches (api_fixture_id, stage, group_name, home_team, away_team, home_flag, away_flag, kickoff_at, status)
VALUES (2063, 'Group', 'G', 'New Zealand', 'Belgium', '🇳🇿', '🇧🇪', '2026-06-27T03:00:00.000Z'::timestamptz, 'scheduled')
ON CONFLICT (api_fixture_id) DO UPDATE SET
  stage = EXCLUDED.stage,
  group_name = EXCLUDED.group_name,
  home_team = EXCLUDED.home_team,
  away_team = EXCLUDED.away_team,
  home_flag = EXCLUDED.home_flag,
  away_flag = EXCLUDED.away_flag,
  kickoff_at = EXCLUDED.kickoff_at;

INSERT INTO matches (api_fixture_id, stage, group_name, home_team, away_team, home_flag, away_flag, kickoff_at, status)
VALUES (2064, 'Group', 'H', 'Cape Verde', 'Saudi Arabia', '🇨🇻', '🇸🇦', '2026-06-27T00:00:00.000Z'::timestamptz, 'scheduled')
ON CONFLICT (api_fixture_id) DO UPDATE SET
  stage = EXCLUDED.stage,
  group_name = EXCLUDED.group_name,
  home_team = EXCLUDED.home_team,
  away_team = EXCLUDED.away_team,
  home_flag = EXCLUDED.home_flag,
  away_flag = EXCLUDED.away_flag,
  kickoff_at = EXCLUDED.kickoff_at;

INSERT INTO matches (api_fixture_id, stage, group_name, home_team, away_team, home_flag, away_flag, kickoff_at, status)
VALUES (2065, 'Group', 'H', 'Uruguay', 'Spain', '🇺🇾', '🇪🇸', '2026-06-27T00:00:00.000Z'::timestamptz, 'scheduled')
ON CONFLICT (api_fixture_id) DO UPDATE SET
  stage = EXCLUDED.stage,
  group_name = EXCLUDED.group_name,
  home_team = EXCLUDED.home_team,
  away_team = EXCLUDED.away_team,
  home_flag = EXCLUDED.home_flag,
  away_flag = EXCLUDED.away_flag,
  kickoff_at = EXCLUDED.kickoff_at;

INSERT INTO matches (api_fixture_id, stage, group_name, home_team, away_team, home_flag, away_flag, kickoff_at, status)
VALUES (2066, 'Group', 'L', 'Panama', 'England', '🇵🇦', '🏴󠁧󠁢󠁥󠁮󠁧󠁿', '2026-06-27T21:00:00.000Z'::timestamptz, 'scheduled')
ON CONFLICT (api_fixture_id) DO UPDATE SET
  stage = EXCLUDED.stage,
  group_name = EXCLUDED.group_name,
  home_team = EXCLUDED.home_team,
  away_team = EXCLUDED.away_team,
  home_flag = EXCLUDED.home_flag,
  away_flag = EXCLUDED.away_flag,
  kickoff_at = EXCLUDED.kickoff_at;

INSERT INTO matches (api_fixture_id, stage, group_name, home_team, away_team, home_flag, away_flag, kickoff_at, status)
VALUES (2067, 'Group', 'L', 'Croatia', 'Ghana', '🇭🇷', '🇬🇭', '2026-06-27T21:00:00.000Z'::timestamptz, 'scheduled')
ON CONFLICT (api_fixture_id) DO UPDATE SET
  stage = EXCLUDED.stage,
  group_name = EXCLUDED.group_name,
  home_team = EXCLUDED.home_team,
  away_team = EXCLUDED.away_team,
  home_flag = EXCLUDED.home_flag,
  away_flag = EXCLUDED.away_flag,
  kickoff_at = EXCLUDED.kickoff_at;

INSERT INTO matches (api_fixture_id, stage, group_name, home_team, away_team, home_flag, away_flag, kickoff_at, status)
VALUES (2068, 'Group', 'J', 'Algeria', 'Austria', '🇩🇿', '🇦🇹', '2026-06-28T02:00:00.000Z'::timestamptz, 'scheduled')
ON CONFLICT (api_fixture_id) DO UPDATE SET
  stage = EXCLUDED.stage,
  group_name = EXCLUDED.group_name,
  home_team = EXCLUDED.home_team,
  away_team = EXCLUDED.away_team,
  home_flag = EXCLUDED.home_flag,
  away_flag = EXCLUDED.away_flag,
  kickoff_at = EXCLUDED.kickoff_at;

INSERT INTO matches (api_fixture_id, stage, group_name, home_team, away_team, home_flag, away_flag, kickoff_at, status)
VALUES (2069, 'Group', 'J', 'Jordan', 'Argentina', '🇯🇴', '🇦🇷', '2026-06-28T02:00:00.000Z'::timestamptz, 'scheduled')
ON CONFLICT (api_fixture_id) DO UPDATE SET
  stage = EXCLUDED.stage,
  group_name = EXCLUDED.group_name,
  home_team = EXCLUDED.home_team,
  away_team = EXCLUDED.away_team,
  home_flag = EXCLUDED.home_flag,
  away_flag = EXCLUDED.away_flag,
  kickoff_at = EXCLUDED.kickoff_at;

INSERT INTO matches (api_fixture_id, stage, group_name, home_team, away_team, home_flag, away_flag, kickoff_at, status)
VALUES (2070, 'Group', 'K', 'Colombia', 'Portugal', '🇨🇴', '🇵🇹', '2026-06-27T23:30:00.000Z'::timestamptz, 'scheduled')
ON CONFLICT (api_fixture_id) DO UPDATE SET
  stage = EXCLUDED.stage,
  group_name = EXCLUDED.group_name,
  home_team = EXCLUDED.home_team,
  away_team = EXCLUDED.away_team,
  home_flag = EXCLUDED.home_flag,
  away_flag = EXCLUDED.away_flag,
  kickoff_at = EXCLUDED.kickoff_at;

INSERT INTO matches (api_fixture_id, stage, group_name, home_team, away_team, home_flag, away_flag, kickoff_at, status)
VALUES (2071, 'Group', 'K', 'Congo DR', 'Uzbekistan', '🇨🇩', '🇺🇿', '2026-06-27T23:30:00.000Z'::timestamptz, 'scheduled')
ON CONFLICT (api_fixture_id) DO UPDATE SET
  stage = EXCLUDED.stage,
  group_name = EXCLUDED.group_name,
  home_team = EXCLUDED.home_team,
  away_team = EXCLUDED.away_team,
  home_flag = EXCLUDED.home_flag,
  away_flag = EXCLUDED.away_flag,
  kickoff_at = EXCLUDED.kickoff_at;

INSERT INTO matches (api_fixture_id, stage, group_name, home_team, away_team, home_flag, away_flag, kickoff_at, status)
VALUES (2072, 'Round of 32', NULL, 'South Africa', 'Canada', '🇿🇦', '🇨🇦', '2026-06-28T19:00:00.000Z'::timestamptz, 'scheduled')
ON CONFLICT (api_fixture_id) DO UPDATE SET
  stage = EXCLUDED.stage,
  group_name = EXCLUDED.group_name,
  home_team = EXCLUDED.home_team,
  away_team = EXCLUDED.away_team,
  home_flag = EXCLUDED.home_flag,
  away_flag = EXCLUDED.away_flag,
  kickoff_at = EXCLUDED.kickoff_at;

INSERT INTO matches (api_fixture_id, stage, group_name, home_team, away_team, home_flag, away_flag, kickoff_at, status)
VALUES (2073, 'Round of 32', NULL, 'Germany', 'Paraguay', '🇩🇪', '🇵🇾', '2026-06-29T20:30:00.000Z'::timestamptz, 'scheduled')
ON CONFLICT (api_fixture_id) DO UPDATE SET
  stage = EXCLUDED.stage,
  group_name = EXCLUDED.group_name,
  home_team = EXCLUDED.home_team,
  away_team = EXCLUDED.away_team,
  home_flag = EXCLUDED.home_flag,
  away_flag = EXCLUDED.away_flag,
  kickoff_at = EXCLUDED.kickoff_at;

INSERT INTO matches (api_fixture_id, stage, group_name, home_team, away_team, home_flag, away_flag, kickoff_at, status)
VALUES (2074, 'Round of 32', NULL, 'Netherlands', 'Morocco', '🇳🇱', '🇲🇦', '2026-06-30T01:00:00.000Z'::timestamptz, 'scheduled')
ON CONFLICT (api_fixture_id) DO UPDATE SET
  stage = EXCLUDED.stage,
  group_name = EXCLUDED.group_name,
  home_team = EXCLUDED.home_team,
  away_team = EXCLUDED.away_team,
  home_flag = EXCLUDED.home_flag,
  away_flag = EXCLUDED.away_flag,
  kickoff_at = EXCLUDED.kickoff_at;

INSERT INTO matches (api_fixture_id, stage, group_name, home_team, away_team, home_flag, away_flag, kickoff_at, status)
VALUES (2075, 'Round of 32', NULL, 'Brazil', 'Japan', '🇧🇷', '🇯🇵', '2026-06-29T17:00:00.000Z'::timestamptz, 'scheduled')
ON CONFLICT (api_fixture_id) DO UPDATE SET
  stage = EXCLUDED.stage,
  group_name = EXCLUDED.group_name,
  home_team = EXCLUDED.home_team,
  away_team = EXCLUDED.away_team,
  home_flag = EXCLUDED.home_flag,
  away_flag = EXCLUDED.away_flag,
  kickoff_at = EXCLUDED.kickoff_at;

INSERT INTO matches (api_fixture_id, stage, group_name, home_team, away_team, home_flag, away_flag, kickoff_at, status)
VALUES (2076, 'Round of 32', NULL, 'France', 'Sweden', '🇫🇷', '🇸🇪', '2026-06-30T21:00:00.000Z'::timestamptz, 'scheduled')
ON CONFLICT (api_fixture_id) DO UPDATE SET
  stage = EXCLUDED.stage,
  group_name = EXCLUDED.group_name,
  home_team = EXCLUDED.home_team,
  away_team = EXCLUDED.away_team,
  home_flag = EXCLUDED.home_flag,
  away_flag = EXCLUDED.away_flag,
  kickoff_at = EXCLUDED.kickoff_at;

INSERT INTO matches (api_fixture_id, stage, group_name, home_team, away_team, home_flag, away_flag, kickoff_at, status)
VALUES (2077, 'Round of 32', NULL, 'Ivory Coast', 'Norway', '🇨🇮', '🇳🇴', '2026-06-30T17:00:00.000Z'::timestamptz, 'scheduled')
ON CONFLICT (api_fixture_id) DO UPDATE SET
  stage = EXCLUDED.stage,
  group_name = EXCLUDED.group_name,
  home_team = EXCLUDED.home_team,
  away_team = EXCLUDED.away_team,
  home_flag = EXCLUDED.home_flag,
  away_flag = EXCLUDED.away_flag,
  kickoff_at = EXCLUDED.kickoff_at;

INSERT INTO matches (api_fixture_id, stage, group_name, home_team, away_team, home_flag, away_flag, kickoff_at, status)
VALUES (2078, 'Round of 32', NULL, 'Mexico', 'Ecuador', '🇲🇽', '🇪🇨', '2026-07-01T01:00:00.000Z'::timestamptz, 'scheduled')
ON CONFLICT (api_fixture_id) DO UPDATE SET
  stage = EXCLUDED.stage,
  group_name = EXCLUDED.group_name,
  home_team = EXCLUDED.home_team,
  away_team = EXCLUDED.away_team,
  home_flag = EXCLUDED.home_flag,
  away_flag = EXCLUDED.away_flag,
  kickoff_at = EXCLUDED.kickoff_at;

INSERT INTO matches (api_fixture_id, stage, group_name, home_team, away_team, home_flag, away_flag, kickoff_at, status)
VALUES (2079, 'Round of 32', NULL, 'England', 'TBD', '🏴󠁧󠁢󠁥󠁮󠁧󠁿', '🏳️', '2026-07-01T16:00:00.000Z'::timestamptz, 'scheduled')
ON CONFLICT (api_fixture_id) DO UPDATE SET
  stage = EXCLUDED.stage,
  group_name = EXCLUDED.group_name,
  home_team = EXCLUDED.home_team,
  away_team = EXCLUDED.away_team,
  home_flag = EXCLUDED.home_flag,
  away_flag = EXCLUDED.away_flag,
  kickoff_at = EXCLUDED.kickoff_at;

INSERT INTO matches (api_fixture_id, stage, group_name, home_team, away_team, home_flag, away_flag, kickoff_at, status)
VALUES (2080, 'Round of 32', NULL, 'USA', 'Bosnia and Herzegovina', '🇺🇸', '🇧🇦', '2026-07-02T00:00:00.000Z'::timestamptz, 'scheduled')
ON CONFLICT (api_fixture_id) DO UPDATE SET
  stage = EXCLUDED.stage,
  group_name = EXCLUDED.group_name,
  home_team = EXCLUDED.home_team,
  away_team = EXCLUDED.away_team,
  home_flag = EXCLUDED.home_flag,
  away_flag = EXCLUDED.away_flag,
  kickoff_at = EXCLUDED.kickoff_at;

INSERT INTO matches (api_fixture_id, stage, group_name, home_team, away_team, home_flag, away_flag, kickoff_at, status)
VALUES (2081, 'Round of 32', NULL, 'Belgium', 'TBD', '🇧🇪', '🏳️', '2026-07-01T20:00:00.000Z'::timestamptz, 'scheduled')
ON CONFLICT (api_fixture_id) DO UPDATE SET
  stage = EXCLUDED.stage,
  group_name = EXCLUDED.group_name,
  home_team = EXCLUDED.home_team,
  away_team = EXCLUDED.away_team,
  home_flag = EXCLUDED.home_flag,
  away_flag = EXCLUDED.away_flag,
  kickoff_at = EXCLUDED.kickoff_at;

INSERT INTO matches (api_fixture_id, stage, group_name, home_team, away_team, home_flag, away_flag, kickoff_at, status)
VALUES (2082, 'Round of 32', NULL, 'TBD', 'Croatia', '🏳️', '🇭🇷', '2026-07-02T23:00:00.000Z'::timestamptz, 'scheduled')
ON CONFLICT (api_fixture_id) DO UPDATE SET
  stage = EXCLUDED.stage,
  group_name = EXCLUDED.group_name,
  home_team = EXCLUDED.home_team,
  away_team = EXCLUDED.away_team,
  home_flag = EXCLUDED.home_flag,
  away_flag = EXCLUDED.away_flag,
  kickoff_at = EXCLUDED.kickoff_at;

INSERT INTO matches (api_fixture_id, stage, group_name, home_team, away_team, home_flag, away_flag, kickoff_at, status)
VALUES (2083, 'Round of 32', NULL, 'Spain', 'TBD', '🇪🇸', '🏳️', '2026-07-02T19:00:00.000Z'::timestamptz, 'scheduled')
ON CONFLICT (api_fixture_id) DO UPDATE SET
  stage = EXCLUDED.stage,
  group_name = EXCLUDED.group_name,
  home_team = EXCLUDED.home_team,
  away_team = EXCLUDED.away_team,
  home_flag = EXCLUDED.home_flag,
  away_flag = EXCLUDED.away_flag,
  kickoff_at = EXCLUDED.kickoff_at;

INSERT INTO matches (api_fixture_id, stage, group_name, home_team, away_team, home_flag, away_flag, kickoff_at, status)
VALUES (2084, 'Round of 32', NULL, 'Switzerland', 'TBD', '🇨🇭', '🏳️', '2026-07-03T03:00:00.000Z'::timestamptz, 'scheduled')
ON CONFLICT (api_fixture_id) DO UPDATE SET
  stage = EXCLUDED.stage,
  group_name = EXCLUDED.group_name,
  home_team = EXCLUDED.home_team,
  away_team = EXCLUDED.away_team,
  home_flag = EXCLUDED.home_flag,
  away_flag = EXCLUDED.away_flag,
  kickoff_at = EXCLUDED.kickoff_at;

INSERT INTO matches (api_fixture_id, stage, group_name, home_team, away_team, home_flag, away_flag, kickoff_at, status)
VALUES (2085, 'Round of 32', NULL, 'Argentina', 'Cape Verde', '🇦🇷', '🇨🇻', '2026-07-03T22:00:00.000Z'::timestamptz, 'scheduled')
ON CONFLICT (api_fixture_id) DO UPDATE SET
  stage = EXCLUDED.stage,
  group_name = EXCLUDED.group_name,
  home_team = EXCLUDED.home_team,
  away_team = EXCLUDED.away_team,
  home_flag = EXCLUDED.home_flag,
  away_flag = EXCLUDED.away_flag,
  kickoff_at = EXCLUDED.kickoff_at;

INSERT INTO matches (api_fixture_id, stage, group_name, home_team, away_team, home_flag, away_flag, kickoff_at, status)
VALUES (2086, 'Round of 32', NULL, 'TBD', 'Ghana', '🏳️', '🇬🇭', '2026-07-04T01:30:00.000Z'::timestamptz, 'scheduled')
ON CONFLICT (api_fixture_id) DO UPDATE SET
  stage = EXCLUDED.stage,
  group_name = EXCLUDED.group_name,
  home_team = EXCLUDED.home_team,
  away_team = EXCLUDED.away_team,
  home_flag = EXCLUDED.home_flag,
  away_flag = EXCLUDED.away_flag,
  kickoff_at = EXCLUDED.kickoff_at;

INSERT INTO matches (api_fixture_id, stage, group_name, home_team, away_team, home_flag, away_flag, kickoff_at, status)
VALUES (2087, 'Round of 32', NULL, 'Australia', 'Egypt', '🇦🇺', '🇪🇬', '2026-07-03T18:00:00.000Z'::timestamptz, 'scheduled')
ON CONFLICT (api_fixture_id) DO UPDATE SET
  stage = EXCLUDED.stage,
  group_name = EXCLUDED.group_name,
  home_team = EXCLUDED.home_team,
  away_team = EXCLUDED.away_team,
  home_flag = EXCLUDED.home_flag,
  away_flag = EXCLUDED.away_flag,
  kickoff_at = EXCLUDED.kickoff_at;

INSERT INTO matches (api_fixture_id, stage, group_name, home_team, away_team, home_flag, away_flag, kickoff_at, status)
VALUES (2088, 'Round of 16', NULL, 'TBD', 'TBD', '🏳️', '🏳️', '2026-07-04T01:30:00.000Z'::timestamptz, 'scheduled')
ON CONFLICT (api_fixture_id) DO UPDATE SET
  stage = EXCLUDED.stage,
  group_name = EXCLUDED.group_name,
  home_team = EXCLUDED.home_team,
  away_team = EXCLUDED.away_team,
  home_flag = EXCLUDED.home_flag,
  away_flag = EXCLUDED.away_flag,
  kickoff_at = EXCLUDED.kickoff_at;

INSERT INTO matches (api_fixture_id, stage, group_name, home_team, away_team, home_flag, away_flag, kickoff_at, status)
VALUES (2089, 'Round of 16', NULL, 'TBD', 'TBD', '🏳️', '🏳️', '2026-07-04T17:00:00.000Z'::timestamptz, 'scheduled')
ON CONFLICT (api_fixture_id) DO UPDATE SET
  stage = EXCLUDED.stage,
  group_name = EXCLUDED.group_name,
  home_team = EXCLUDED.home_team,
  away_team = EXCLUDED.away_team,
  home_flag = EXCLUDED.home_flag,
  away_flag = EXCLUDED.away_flag,
  kickoff_at = EXCLUDED.kickoff_at;

INSERT INTO matches (api_fixture_id, stage, group_name, home_team, away_team, home_flag, away_flag, kickoff_at, status)
VALUES (2090, 'Round of 16', NULL, 'TBD', 'TBD', '🏳️', '🏳️', '2026-07-04T21:00:00.000Z'::timestamptz, 'scheduled')
ON CONFLICT (api_fixture_id) DO UPDATE SET
  stage = EXCLUDED.stage,
  group_name = EXCLUDED.group_name,
  home_team = EXCLUDED.home_team,
  away_team = EXCLUDED.away_team,
  home_flag = EXCLUDED.home_flag,
  away_flag = EXCLUDED.away_flag,
  kickoff_at = EXCLUDED.kickoff_at;

INSERT INTO matches (api_fixture_id, stage, group_name, home_team, away_team, home_flag, away_flag, kickoff_at, status)
VALUES (2091, 'Round of 16', NULL, 'TBD', 'TBD', '🏳️', '🏳️', '2026-07-05T20:00:00.000Z'::timestamptz, 'scheduled')
ON CONFLICT (api_fixture_id) DO UPDATE SET
  stage = EXCLUDED.stage,
  group_name = EXCLUDED.group_name,
  home_team = EXCLUDED.home_team,
  away_team = EXCLUDED.away_team,
  home_flag = EXCLUDED.home_flag,
  away_flag = EXCLUDED.away_flag,
  kickoff_at = EXCLUDED.kickoff_at;

INSERT INTO matches (api_fixture_id, stage, group_name, home_team, away_team, home_flag, away_flag, kickoff_at, status)
VALUES (2092, 'Round of 16', NULL, 'TBD', 'TBD', '🏳️', '🏳️', '2026-07-06T00:00:00.000Z'::timestamptz, 'scheduled')
ON CONFLICT (api_fixture_id) DO UPDATE SET
  stage = EXCLUDED.stage,
  group_name = EXCLUDED.group_name,
  home_team = EXCLUDED.home_team,
  away_team = EXCLUDED.away_team,
  home_flag = EXCLUDED.home_flag,
  away_flag = EXCLUDED.away_flag,
  kickoff_at = EXCLUDED.kickoff_at;

INSERT INTO matches (api_fixture_id, stage, group_name, home_team, away_team, home_flag, away_flag, kickoff_at, status)
VALUES (2093, 'Round of 16', NULL, 'TBD', 'TBD', '🏳️', '🏳️', '2026-07-06T20:00:00.000Z'::timestamptz, 'scheduled')
ON CONFLICT (api_fixture_id) DO UPDATE SET
  stage = EXCLUDED.stage,
  group_name = EXCLUDED.group_name,
  home_team = EXCLUDED.home_team,
  away_team = EXCLUDED.away_team,
  home_flag = EXCLUDED.home_flag,
  away_flag = EXCLUDED.away_flag,
  kickoff_at = EXCLUDED.kickoff_at;

INSERT INTO matches (api_fixture_id, stage, group_name, home_team, away_team, home_flag, away_flag, kickoff_at, status)
VALUES (2094, 'Round of 16', NULL, 'TBD', 'TBD', '🏳️', '🏳️', '2026-07-07T16:00:00.000Z'::timestamptz, 'scheduled')
ON CONFLICT (api_fixture_id) DO UPDATE SET
  stage = EXCLUDED.stage,
  group_name = EXCLUDED.group_name,
  home_team = EXCLUDED.home_team,
  away_team = EXCLUDED.away_team,
  home_flag = EXCLUDED.home_flag,
  away_flag = EXCLUDED.away_flag,
  kickoff_at = EXCLUDED.kickoff_at;

INSERT INTO matches (api_fixture_id, stage, group_name, home_team, away_team, home_flag, away_flag, kickoff_at, status)
VALUES (2095, 'Round of 16', NULL, 'TBD', 'TBD', '🏳️', '🏳️', '2026-07-07T20:00:00.000Z'::timestamptz, 'scheduled')
ON CONFLICT (api_fixture_id) DO UPDATE SET
  stage = EXCLUDED.stage,
  group_name = EXCLUDED.group_name,
  home_team = EXCLUDED.home_team,
  away_team = EXCLUDED.away_team,
  home_flag = EXCLUDED.home_flag,
  away_flag = EXCLUDED.away_flag,
  kickoff_at = EXCLUDED.kickoff_at;

INSERT INTO matches (api_fixture_id, stage, group_name, home_team, away_team, home_flag, away_flag, kickoff_at, status)
VALUES (2096, 'Quarter-final', NULL, 'TBD', 'TBD', '🏳️', '🏳️', '2026-07-09T20:00:00.000Z'::timestamptz, 'scheduled')
ON CONFLICT (api_fixture_id) DO UPDATE SET
  stage = EXCLUDED.stage,
  group_name = EXCLUDED.group_name,
  home_team = EXCLUDED.home_team,
  away_team = EXCLUDED.away_team,
  home_flag = EXCLUDED.home_flag,
  away_flag = EXCLUDED.away_flag,
  kickoff_at = EXCLUDED.kickoff_at;

INSERT INTO matches (api_fixture_id, stage, group_name, home_team, away_team, home_flag, away_flag, kickoff_at, status)
VALUES (2097, 'Quarter-final', NULL, 'TBD', 'TBD', '🏳️', '🏳️', '2026-07-10T19:00:00.000Z'::timestamptz, 'scheduled')
ON CONFLICT (api_fixture_id) DO UPDATE SET
  stage = EXCLUDED.stage,
  group_name = EXCLUDED.group_name,
  home_team = EXCLUDED.home_team,
  away_team = EXCLUDED.away_team,
  home_flag = EXCLUDED.home_flag,
  away_flag = EXCLUDED.away_flag,
  kickoff_at = EXCLUDED.kickoff_at;

INSERT INTO matches (api_fixture_id, stage, group_name, home_team, away_team, home_flag, away_flag, kickoff_at, status)
VALUES (2098, 'Quarter-final', NULL, 'TBD', 'TBD', '🏳️', '🏳️', '2026-07-11T21:00:00.000Z'::timestamptz, 'scheduled')
ON CONFLICT (api_fixture_id) DO UPDATE SET
  stage = EXCLUDED.stage,
  group_name = EXCLUDED.group_name,
  home_team = EXCLUDED.home_team,
  away_team = EXCLUDED.away_team,
  home_flag = EXCLUDED.home_flag,
  away_flag = EXCLUDED.away_flag,
  kickoff_at = EXCLUDED.kickoff_at;

INSERT INTO matches (api_fixture_id, stage, group_name, home_team, away_team, home_flag, away_flag, kickoff_at, status)
VALUES (2099, 'Quarter-final', NULL, 'TBD', 'TBD', '🏳️', '🏳️', '2026-07-12T01:00:00.000Z'::timestamptz, 'scheduled')
ON CONFLICT (api_fixture_id) DO UPDATE SET
  stage = EXCLUDED.stage,
  group_name = EXCLUDED.group_name,
  home_team = EXCLUDED.home_team,
  away_team = EXCLUDED.away_team,
  home_flag = EXCLUDED.home_flag,
  away_flag = EXCLUDED.away_flag,
  kickoff_at = EXCLUDED.kickoff_at;

INSERT INTO matches (api_fixture_id, stage, group_name, home_team, away_team, home_flag, away_flag, kickoff_at, status)
VALUES (2100, 'Semi-final', NULL, 'TBD', 'TBD', '🏳️', '🏳️', '2026-07-14T19:00:00.000Z'::timestamptz, 'scheduled')
ON CONFLICT (api_fixture_id) DO UPDATE SET
  stage = EXCLUDED.stage,
  group_name = EXCLUDED.group_name,
  home_team = EXCLUDED.home_team,
  away_team = EXCLUDED.away_team,
  home_flag = EXCLUDED.home_flag,
  away_flag = EXCLUDED.away_flag,
  kickoff_at = EXCLUDED.kickoff_at;

INSERT INTO matches (api_fixture_id, stage, group_name, home_team, away_team, home_flag, away_flag, kickoff_at, status)
VALUES (2101, 'Semi-final', NULL, 'TBD', 'TBD', '🏳️', '🏳️', '2026-07-15T19:00:00.000Z'::timestamptz, 'scheduled')
ON CONFLICT (api_fixture_id) DO UPDATE SET
  stage = EXCLUDED.stage,
  group_name = EXCLUDED.group_name,
  home_team = EXCLUDED.home_team,
  away_team = EXCLUDED.away_team,
  home_flag = EXCLUDED.home_flag,
  away_flag = EXCLUDED.away_flag,
  kickoff_at = EXCLUDED.kickoff_at;

INSERT INTO matches (api_fixture_id, stage, group_name, home_team, away_team, home_flag, away_flag, kickoff_at, status)
VALUES (2102, 'Third place', NULL, 'TBD', 'TBD', '🏳️', '🏳️', '2026-07-18T21:00:00.000Z'::timestamptz, 'scheduled')
ON CONFLICT (api_fixture_id) DO UPDATE SET
  stage = EXCLUDED.stage,
  group_name = EXCLUDED.group_name,
  home_team = EXCLUDED.home_team,
  away_team = EXCLUDED.away_team,
  home_flag = EXCLUDED.home_flag,
  away_flag = EXCLUDED.away_flag,
  kickoff_at = EXCLUDED.kickoff_at;

INSERT INTO matches (api_fixture_id, stage, group_name, home_team, away_team, home_flag, away_flag, kickoff_at, status)
VALUES (2103, 'Final', NULL, 'TBD', 'TBD', '🏳️', '🏳️', '2026-07-19T19:00:00.000Z'::timestamptz, 'scheduled')
ON CONFLICT (api_fixture_id) DO UPDATE SET
  stage = EXCLUDED.stage,
  group_name = EXCLUDED.group_name,
  home_team = EXCLUDED.home_team,
  away_team = EXCLUDED.away_team,
  home_flag = EXCLUDED.home_flag,
  away_flag = EXCLUDED.away_flag,
  kickoff_at = EXCLUDED.kickoff_at;

SELECT COUNT(*) AS total_matches FROM matches;
SELECT stage, COUNT(*) FROM matches WHERE stage = 'Final' GROUP BY stage;
