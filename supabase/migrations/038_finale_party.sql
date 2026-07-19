-- After-final party: anticipation → admin assigns winners + Zomato codes → publish

CREATE TABLE IF NOT EXISTS finale_party_config (
  id BOOLEAN PRIMARY KEY DEFAULT true CHECK (id = true),
  status TEXT NOT NULL DEFAULT 'off'
    CHECK (status IN ('off', 'anticipation', 'published')),
  anticipation_headline TEXT NOT NULL DEFAULT 'The Final whistle has blown',
  anticipation_body TEXT NOT NULL DEFAULT
    'The after-game party is warming up. Official results and Zomato gifts drop once the host locks the envelope.',
  published_headline TEXT NOT NULL DEFAULT 'After-game party',
  published_body TEXT NOT NULL DEFAULT
    'Tournament honours are in. Open your gift if you won — everyone gets a thank-you.',
  published_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS finale_prize_awards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_key TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  amount_inr INTEGER NOT NULL CHECK (amount_inr >= 0),
  night_label TEXT,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  zomato_code TEXT,
  suggested_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  revealed_at TIMESTAMPTZ,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO finale_party_config (id, status)
VALUES (true, 'off')
ON CONFLICT (id) DO NOTHING;

INSERT INTO finale_prize_awards (slot_key, title, amount_inr, night_label, sort_order) VALUES
  ('champion', 'Champion', 1500, NULL, 1),
  ('runner_up', 'Runner-up', 800, NULL, 2),
  ('bronze', 'Bronze', 500, NULL, 3),
  ('oracle', 'Oracle', 500, NULL, 4),
  ('matchday_hero_1', 'Matchday hero', 300, 'Opening weekend', 5),
  ('matchday_hero_2', 'Matchday hero', 300, 'Knockout round', 6),
  ('matchday_hero_3', 'Matchday hero', 300, 'Final week', 7),
  ('season_star', 'Season specials star', 500, NULL, 8),
  ('lucky_draw', 'Lucky league draw', 300, NULL, 9)
ON CONFLICT (slot_key) DO NOTHING;

ALTER TABLE finale_party_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE finale_prize_awards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS finale_party_config_select ON finale_party_config;
DROP POLICY IF EXISTS finale_party_config_admin_write ON finale_party_config;
DROP POLICY IF EXISTS finale_prize_awards_admin_all ON finale_prize_awards;

CREATE POLICY finale_party_config_select ON finale_party_config
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY finale_party_config_admin_write ON finale_party_config
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

-- Base table: admins only (codes live here)
CREATE POLICY finale_prize_awards_admin_all ON finale_prize_awards
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

-- Public columns only — no zomato_code. Readable when published (or by admin).
CREATE OR REPLACE VIEW finale_prize_awards_public
WITH (security_invoker = false)
AS
SELECT
  a.id,
  a.slot_key,
  a.title,
  a.amount_inr,
  a.night_label,
  a.user_id,
  a.suggested_user_id,
  a.revealed_at,
  a.sort_order,
  a.created_at,
  a.updated_at,
  p.display_name AS winner_display_name
FROM finale_prize_awards a
LEFT JOIN profiles p ON p.id = a.user_id
WHERE
  EXISTS (
    SELECT 1 FROM finale_party_config c
    WHERE c.id = true AND c.status = 'published'
  )
  OR EXISTS (
    SELECT 1 FROM profiles me
    WHERE me.id = auth.uid() AND me.is_admin = true
  );

GRANT SELECT ON finale_party_config TO authenticated;
GRANT INSERT, UPDATE, DELETE ON finale_party_config TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON finale_prize_awards TO authenticated;
GRANT SELECT ON finale_prize_awards_public TO authenticated;

-- Winner (or admin) fetches gift code after publish
CREATE OR REPLACE FUNCTION get_finale_gift_code(p_award_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_code TEXT;
  v_owner UUID;
  v_published BOOLEAN;
  v_is_admin BOOLEAN;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT status = 'published' INTO v_published
  FROM finale_party_config WHERE id = true;

  IF NOT COALESCE(v_published) THEN
    RAISE EXCEPTION 'Finale results are not published yet';
  END IF;

  SELECT is_admin INTO v_is_admin FROM profiles WHERE id = v_uid;

  SELECT user_id, zomato_code INTO v_owner, v_code
  FROM finale_prize_awards
  WHERE id = p_award_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Award not found';
  END IF;

  IF v_owner IS DISTINCT FROM v_uid AND NOT COALESCE(v_is_admin, false) THEN
    RAISE EXCEPTION 'Not your gift';
  END IF;

  IF v_code IS NULL OR btrim(v_code) = '' THEN
    RAISE EXCEPTION 'No gift code assigned';
  END IF;

  RETURN v_code;
END;
$$;

CREATE OR REPLACE FUNCTION mark_finale_gift_revealed(p_award_id UUID)
RETURNS TIMESTAMPTZ
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_owner UUID;
  v_published BOOLEAN;
  v_revealed TIMESTAMPTZ;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT status = 'published' INTO v_published
  FROM finale_party_config WHERE id = true;

  IF NOT COALESCE(v_published) THEN
    RAISE EXCEPTION 'Finale results are not published yet';
  END IF;

  SELECT user_id, revealed_at INTO v_owner, v_revealed
  FROM finale_prize_awards
  WHERE id = p_award_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Award not found';
  END IF;

  IF v_owner IS DISTINCT FROM v_uid THEN
    RAISE EXCEPTION 'Not your gift';
  END IF;

  IF v_revealed IS NOT NULL THEN
    RETURN v_revealed;
  END IF;

  UPDATE finale_prize_awards
  SET revealed_at = now(), updated_at = now()
  WHERE id = p_award_id
  RETURNING revealed_at INTO v_revealed;

  RETURN v_revealed;
END;
$$;

GRANT EXECUTE ON FUNCTION get_finale_gift_code(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_finale_gift_revealed(UUID) TO authenticated;
