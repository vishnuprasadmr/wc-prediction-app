-- League prize pool — admin-managed, hidden from players until published

CREATE TABLE IF NOT EXISTS league_prize_config (
  id BOOLEAN PRIMARY KEY DEFAULT true CHECK (id = true),
  published BOOLEAN NOT NULL DEFAULT false,
  headline TEXT NOT NULL DEFAULT '₹5,000 in Zomato gift cards',
  intro TEXT NOT NULL DEFAULT 'Play every matchday — winners get Zomato e-gift cards, not cash.',
  total_inr INTEGER NOT NULL DEFAULT 5000,
  footer_note TEXT NOT NULL DEFAULT 'Zomato e-gift cards sent by email after the Final. Instant delivery — valid for online orders on the Zomato app. Tie-breakers follow league rules.',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS league_prizes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sort_order INTEGER NOT NULL DEFAULT 0,
  title TEXT NOT NULL,
  amount_inr INTEGER NOT NULL CHECK (amount_inr >= 0),
  winner_rule TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO league_prize_config (id, published, headline, intro, total_inr, footer_note)
VALUES (
  true,
  false,
  '₹5,000 in Zomato gift cards',
  'Play every matchday — winners get Zomato e-gift cards with instant delivery, not cash.',
  5000,
  'Zomato e-gift cards sent by email after the Final. Instant delivery — valid for online orders on the Zomato app. Tie-breakers follow league scoring rules.'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO league_prizes (sort_order, title, amount_inr, winner_rule, description) VALUES
  (1, 'Champion', 1500, '#1 on the final leaderboard', '₹1,500 Zomato e-gift card — instant delivery.'),
  (2, 'Runner-up', 800, '#2 on the final leaderboard', '₹800 Zomato e-gift card.'),
  (3, 'Bronze', 500, '#3 on the final leaderboard', '₹500 Zomato e-gift card.'),
  (4, 'Oracle', 500, 'Most exact scores', '₹500 Zomato e-gift card for the best scoreline picker.'),
  (5, 'Matchday hero × 3', 900, 'Top matchday score on 3 named nights', '₹300 Zomato e-gift card each — opening weekend, a knockout round, and final week.'),
  (6, 'Season specials star', 500, 'Best season questionnaire score', '₹500 Zomato e-gift card after season picks settle.'),
  (7, 'Lucky league draw', 300, 'Random draw among active players', '₹300 Zomato e-gift card — everyone with 70%+ match picks enters.');

ALTER TABLE league_prize_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE league_prizes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS league_prize_config_select ON league_prize_config;
DROP POLICY IF EXISTS league_prize_config_admin_write ON league_prize_config;
DROP POLICY IF EXISTS league_prizes_select ON league_prizes;
DROP POLICY IF EXISTS league_prizes_admin_write ON league_prizes;

CREATE POLICY league_prize_config_select ON league_prize_config
  FOR SELECT TO authenticated
  USING (
    published = true
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY league_prize_config_admin_write ON league_prize_config
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

CREATE POLICY league_prizes_select ON league_prizes
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM league_prize_config WHERE id = true AND published = true)
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY league_prizes_admin_write ON league_prizes
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

GRANT SELECT ON league_prize_config TO authenticated;
GRANT SELECT ON league_prizes TO authenticated;
GRANT INSERT, UPDATE, DELETE ON league_prize_config TO authenticated;
GRANT INSERT, UPDATE, DELETE ON league_prizes TO authenticated;
