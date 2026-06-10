-- Auto-generated fixture seed
CREATE OR REPLACE FUNCTION seed_match(
  p_api_id INTEGER,
  p_stage TEXT,
  p_group TEXT,
  p_home TEXT,
  p_away TEXT,
  p_home_flag TEXT,
  p_away_flag TEXT,
  p_kickoff TIMESTAMPTZ
) RETURNS void AS $$
BEGIN
  INSERT INTO matches (api_fixture_id, stage, group_name, home_team, away_team, home_flag, away_flag, kickoff_at, status)
  VALUES (p_api_id, p_stage, p_group, p_home, p_away, p_home_flag, p_away_flag, p_kickoff, 'scheduled')
  ON CONFLICT (api_fixture_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

SELECT seed_match(2000, 'Group', 'A', 'Mexico', 'South Africa', '🇲🇽', '🇿🇦', '2026-06-11T13:00:00.000Z'::timestamptz);
SELECT seed_match(2001, 'Group', 'A', 'South Korea', 'UEFA Play-off D', '🇰🇷', '🇪🇺', '2026-06-14T16:00:00.000Z'::timestamptz);
SELECT seed_match(2002, 'Group', 'A', 'Mexico', 'South Korea', '🇲🇽', '🇰🇷', '2026-06-17T19:00:00.000Z'::timestamptz);
SELECT seed_match(2003, 'Group', 'A', 'South Africa', 'UEFA Play-off D', '🇿🇦', '🇪🇺', '2026-06-20T10:00:00.000Z'::timestamptz);
SELECT seed_match(2004, 'Group', 'A', 'Mexico', 'UEFA Play-off D', '🇲🇽', '🇪🇺', '2026-06-23T13:00:00.000Z'::timestamptz);
SELECT seed_match(2005, 'Group', 'A', 'South Africa', 'South Korea', '🇿🇦', '🇰🇷', '2026-06-26T16:00:00.000Z'::timestamptz);
SELECT seed_match(2006, 'Group', 'B', 'Canada', 'UEFA Play-off A', '🇨🇦', '🇪🇺', '2026-06-11T19:00:00.000Z'::timestamptz);
SELECT seed_match(2007, 'Group', 'B', 'Qatar', 'Switzerland', '🇶🇦', '🇨🇭', '2026-06-14T10:00:00.000Z'::timestamptz);
SELECT seed_match(2008, 'Group', 'B', 'Canada', 'Qatar', '🇨🇦', '🇶🇦', '2026-06-18T13:00:00.000Z'::timestamptz);
SELECT seed_match(2009, 'Group', 'B', 'UEFA Play-off A', 'Switzerland', '🇪🇺', '🇨🇭', '2026-06-21T16:00:00.000Z'::timestamptz);
SELECT seed_match(2010, 'Group', 'B', 'Canada', 'Switzerland', '🇨🇦', '🇨🇭', '2026-06-24T19:00:00.000Z'::timestamptz);
SELECT seed_match(2011, 'Group', 'B', 'UEFA Play-off A', 'Qatar', '🇪🇺', '🇶🇦', '2026-06-27T10:00:00.000Z'::timestamptz);
SELECT seed_match(2012, 'Group', 'C', 'Brazil', 'Morocco', '🇧🇷', '🇲🇦', '2026-06-12T13:00:00.000Z'::timestamptz);
SELECT seed_match(2013, 'Group', 'C', 'Haiti', 'Scotland', '🇭🇹', '🏴󠁧󠁢󠁳󠁣󠁴󠁿', '2026-06-15T16:00:00.000Z'::timestamptz);
SELECT seed_match(2014, 'Group', 'C', 'Brazil', 'Haiti', '🇧🇷', '🇭🇹', '2026-06-18T19:00:00.000Z'::timestamptz);
SELECT seed_match(2015, 'Group', 'C', 'Morocco', 'Scotland', '🇲🇦', '🏴󠁧󠁢󠁳󠁣󠁴󠁿', '2026-06-21T10:00:00.000Z'::timestamptz);
SELECT seed_match(2016, 'Group', 'C', 'Brazil', 'Scotland', '🇧🇷', '🏴󠁧󠁢󠁳󠁣󠁴󠁿', '2026-06-25T13:00:00.000Z'::timestamptz);
SELECT seed_match(2017, 'Group', 'C', 'Morocco', 'Haiti', '🇲🇦', '🇭🇹', '2026-06-28T16:00:00.000Z'::timestamptz);
SELECT seed_match(2018, 'Group', 'D', 'USA', 'Paraguay', '🇺🇸', '🇵🇾', '2026-06-14T19:00:00.000Z'::timestamptz);
SELECT seed_match(2019, 'Group', 'D', 'Australia', 'UEFA Play-off C', '🇦🇺', '🇪🇺', '2026-06-17T10:00:00.000Z'::timestamptz);
SELECT seed_match(2020, 'Group', 'D', 'USA', 'Australia', '🇺🇸', '🇦🇺', '2026-06-20T13:00:00.000Z'::timestamptz);
SELECT seed_match(2021, 'Group', 'D', 'Paraguay', 'UEFA Play-off C', '🇵🇾', '🇪🇺', '2026-06-23T16:00:00.000Z'::timestamptz);
SELECT seed_match(2022, 'Group', 'D', 'USA', 'UEFA Play-off C', '🇺🇸', '🇪🇺', '2026-06-26T19:00:00.000Z'::timestamptz);
SELECT seed_match(2023, 'Group', 'D', 'Paraguay', 'Australia', '🇵🇾', '🇦🇺', '2026-06-29T10:00:00.000Z'::timestamptz);
SELECT seed_match(2024, 'Group', 'E', 'Germany', 'Curaçao', '🇩🇪', '🇨🇼', '2026-06-15T13:00:00.000Z'::timestamptz);
SELECT seed_match(2025, 'Group', 'E', 'Ivory Coast', 'Ecuador', '🇨🇮', '🇪🇨', '2026-06-18T16:00:00.000Z'::timestamptz);
SELECT seed_match(2026, 'Group', 'E', 'Germany', 'Ivory Coast', '🇩🇪', '🇨🇮', '2026-06-21T19:00:00.000Z'::timestamptz);
SELECT seed_match(2027, 'Group', 'E', 'Curaçao', 'Ecuador', '🇨🇼', '🇪🇨', '2026-06-24T10:00:00.000Z'::timestamptz);
SELECT seed_match(2028, 'Group', 'E', 'Germany', 'Ecuador', '🇩🇪', '🇪🇨', '2026-06-27T13:00:00.000Z'::timestamptz);
SELECT seed_match(2029, 'Group', 'E', 'Curaçao', 'Ivory Coast', '🇨🇼', '🇨🇮', '2026-06-30T16:00:00.000Z'::timestamptz);
SELECT seed_match(2030, 'Group', 'F', 'Netherlands', 'Japan', '🇳🇱', '🇯🇵', '2026-06-15T19:00:00.000Z'::timestamptz);
SELECT seed_match(2031, 'Group', 'F', 'UEFA Play-off B', 'Tunisia', '🇪🇺', '🇹🇳', '2026-06-18T10:00:00.000Z'::timestamptz);
SELECT seed_match(2032, 'Group', 'F', 'Netherlands', 'UEFA Play-off B', '🇳🇱', '🇪🇺', '2026-06-22T13:00:00.000Z'::timestamptz);
SELECT seed_match(2033, 'Group', 'F', 'Japan', 'Tunisia', '🇯🇵', '🇹🇳', '2026-06-25T16:00:00.000Z'::timestamptz);
SELECT seed_match(2034, 'Group', 'F', 'Netherlands', 'Tunisia', '🇳🇱', '🇹🇳', '2026-06-28T19:00:00.000Z'::timestamptz);
SELECT seed_match(2035, 'Group', 'F', 'Japan', 'UEFA Play-off B', '🇯🇵', '🇪🇺', '2026-07-01T10:00:00.000Z'::timestamptz);
SELECT seed_match(2036, 'Group', 'G', 'Belgium', 'Egypt', '🇧🇪', '🇪🇬', '2026-06-17T13:00:00.000Z'::timestamptz);
SELECT seed_match(2037, 'Group', 'G', 'Iran', 'New Zealand', '🇮🇷', '🇳🇿', '2026-06-20T16:00:00.000Z'::timestamptz);
SELECT seed_match(2038, 'Group', 'G', 'Belgium', 'Iran', '🇧🇪', '🇮🇷', '2026-06-23T19:00:00.000Z'::timestamptz);
SELECT seed_match(2039, 'Group', 'G', 'Egypt', 'New Zealand', '🇪🇬', '🇳🇿', '2026-06-26T10:00:00.000Z'::timestamptz);
SELECT seed_match(2040, 'Group', 'G', 'Belgium', 'New Zealand', '🇧🇪', '🇳🇿', '2026-06-30T13:00:00.000Z'::timestamptz);
SELECT seed_match(2041, 'Group', 'G', 'Egypt', 'Iran', '🇪🇬', '🇮🇷', '2026-07-03T16:00:00.000Z'::timestamptz);
SELECT seed_match(2042, 'Group', 'H', 'Spain', 'Cape Verde', '🇪🇸', '🇨🇻', '2026-06-18T19:00:00.000Z'::timestamptz);
SELECT seed_match(2043, 'Group', 'H', 'Saudi Arabia', 'Uruguay', '🇸🇦', '🇺🇾', '2026-06-21T10:00:00.000Z'::timestamptz);
SELECT seed_match(2044, 'Group', 'H', 'Spain', 'Saudi Arabia', '🇪🇸', '🇸🇦', '2026-06-24T13:00:00.000Z'::timestamptz);
SELECT seed_match(2045, 'Group', 'H', 'Cape Verde', 'Uruguay', '🇨🇻', '🇺🇾', '2026-06-27T16:00:00.000Z'::timestamptz);
SELECT seed_match(2046, 'Group', 'H', 'Spain', 'Uruguay', '🇪🇸', '🇺🇾', '2026-06-30T19:00:00.000Z'::timestamptz);
SELECT seed_match(2047, 'Group', 'H', 'Cape Verde', 'Saudi Arabia', '🇨🇻', '🇸🇦', '2026-07-03T10:00:00.000Z'::timestamptz);
SELECT seed_match(2048, 'Group', 'I', 'France', 'Senegal', '🇫🇷', '🇸🇳', '2026-06-19T13:00:00.000Z'::timestamptz);
SELECT seed_match(2049, 'Group', 'I', 'IC Play-off 2', 'Norway', '🌏', '🇳🇴', '2026-06-22T16:00:00.000Z'::timestamptz);
SELECT seed_match(2050, 'Group', 'I', 'France', 'IC Play-off 2', '🇫🇷', '🌏', '2026-06-25T19:00:00.000Z'::timestamptz);
SELECT seed_match(2051, 'Group', 'I', 'Senegal', 'Norway', '🇸🇳', '🇳🇴', '2026-06-28T10:00:00.000Z'::timestamptz);
SELECT seed_match(2052, 'Group', 'I', 'France', 'Norway', '🇫🇷', '🇳🇴', '2026-07-01T13:00:00.000Z'::timestamptz);
SELECT seed_match(2053, 'Group', 'I', 'Senegal', 'IC Play-off 2', '🇸🇳', '🌏', '2026-07-04T16:00:00.000Z'::timestamptz);
SELECT seed_match(2054, 'Group', 'J', 'Argentina', 'Algeria', '🇦🇷', '🇩🇿', '2026-06-20T19:00:00.000Z'::timestamptz);
SELECT seed_match(2055, 'Group', 'J', 'Austria', 'Jordan', '🇦🇹', '🇯🇴', '2026-06-23T10:00:00.000Z'::timestamptz);
SELECT seed_match(2056, 'Group', 'J', 'Argentina', 'Austria', '🇦🇷', '🇦🇹', '2026-06-27T13:00:00.000Z'::timestamptz);
SELECT seed_match(2057, 'Group', 'J', 'Algeria', 'Jordan', '🇩🇿', '🇯🇴', '2026-06-30T16:00:00.000Z'::timestamptz);
SELECT seed_match(2058, 'Group', 'J', 'Argentina', 'Jordan', '🇦🇷', '🇯🇴', '2026-07-03T19:00:00.000Z'::timestamptz);
SELECT seed_match(2059, 'Group', 'J', 'Algeria', 'Austria', '🇩🇿', '🇦🇹', '2026-07-06T10:00:00.000Z'::timestamptz);
SELECT seed_match(2060, 'Group', 'K', 'Portugal', 'IC Play-off 1', '🇵🇹', '🌏', '2026-06-21T13:00:00.000Z'::timestamptz);
SELECT seed_match(2061, 'Group', 'K', 'Uzbekistan', 'Colombia', '🇺🇿', '🇨🇴', '2026-06-24T16:00:00.000Z'::timestamptz);
SELECT seed_match(2062, 'Group', 'K', 'Portugal', 'Uzbekistan', '🇵🇹', '🇺🇿', '2026-06-27T19:00:00.000Z'::timestamptz);
SELECT seed_match(2063, 'Group', 'K', 'IC Play-off 1', 'Colombia', '🌏', '🇨🇴', '2026-06-30T10:00:00.000Z'::timestamptz);
SELECT seed_match(2064, 'Group', 'K', 'Portugal', 'Colombia', '🇵🇹', '🇨🇴', '2026-07-04T13:00:00.000Z'::timestamptz);
SELECT seed_match(2065, 'Group', 'K', 'IC Play-off 1', 'Uzbekistan', '🌏', '🇺🇿', '2026-07-07T16:00:00.000Z'::timestamptz);
SELECT seed_match(2066, 'Group', 'L', 'England', 'Croatia', '🏴󠁧󠁢󠁥󠁮󠁧󠁿', '🇭🇷', '2026-06-22T19:00:00.000Z'::timestamptz);
SELECT seed_match(2067, 'Group', 'L', 'Ghana', 'Panama', '🇬🇭', '🇵🇦', '2026-06-25T10:00:00.000Z'::timestamptz);
SELECT seed_match(2068, 'Group', 'L', 'England', 'Ghana', '🏴󠁧󠁢󠁥󠁮󠁧󠁿', '🇬🇭', '2026-06-28T13:00:00.000Z'::timestamptz);
SELECT seed_match(2069, 'Group', 'L', 'Croatia', 'Panama', '🇭🇷', '🇵🇦', '2026-07-01T16:00:00.000Z'::timestamptz);
SELECT seed_match(2070, 'Group', 'L', 'England', 'Panama', '🏴󠁧󠁢󠁥󠁮󠁧󠁿', '🇵🇦', '2026-07-04T19:00:00.000Z'::timestamptz);
SELECT seed_match(2071, 'Group', 'L', 'Croatia', 'Ghana', '🇭🇷', '🇬🇭', '2026-07-07T10:00:00.000Z'::timestamptz);
SELECT seed_match(3001, 'Round of 32', NULL, 'TBD', 'TBD', '🏳️', '🏳️', '2026-06-29T16:00:00.000Z'::timestamptz);
SELECT seed_match(3002, 'Round of 16', NULL, 'TBD', 'TBD', '🏳️', '🏳️', '2026-07-05T16:00:00.000Z'::timestamptz);
SELECT seed_match(3003, 'Quarter-final', NULL, 'TBD', 'TBD', '🏳️', '🏳️', '2026-07-10T16:00:00.000Z'::timestamptz);
SELECT seed_match(3004, 'Semi-final', NULL, 'TBD', 'TBD', '🏳️', '🏳️', '2026-07-15T16:00:00.000Z'::timestamptz);
SELECT seed_match(3005, 'Third place', NULL, 'TBD', 'TBD', '🏳️', '🏳️', '2026-07-19T16:00:00.000Z'::timestamptz);
SELECT seed_match(3006, 'Final', NULL, 'TBD', 'TBD', '🏳️', '🏳️', '2026-07-20T16:00:00.000Z'::timestamptz);
