-- Split lucky draw: Global (Aparna) + Simelabs (Shameer)
-- Pool becomes ₹4,800

UPDATE finale_prize_awards
SET
  title = 'Lucky draw',
  night_label = 'Global',
  updated_at = now()
WHERE slot_key = 'lucky_draw';

INSERT INTO finale_prize_awards (
  slot_key, title, amount_inr, night_label, sort_order, user_id, zomato_code
)
VALUES (
  'lucky_draw_simelabs',
  'Lucky draw',
  500,
  'Simelabs',
  10,
  NULL,
  NULL
)
ON CONFLICT (slot_key) DO UPDATE
SET
  title = EXCLUDED.title,
  amount_inr = EXCLUDED.amount_inr,
  night_label = EXCLUDED.night_label,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

INSERT INTO league_prizes (title, amount_inr, winner_rule, description, sort_order)
SELECT
  'Lucky draw · Simelabs',
  500,
  'Simelabs league lucky draw among prize-less players',
  '₹500 Zomato e-gift card — Simelabs internal lucky draw.',
  COALESCE((SELECT MAX(sort_order) FROM league_prizes), 0) + 1
WHERE NOT EXISTS (
  SELECT 1 FROM league_prizes WHERE title = 'Lucky draw · Simelabs'
);

UPDATE league_prizes
SET
  title = 'Lucky draw · Global',
  description = '₹500 Zomato e-gift card — global league lucky draw.',
  updated_at = now()
WHERE title = 'Lucky league draw';

UPDATE league_prize_config
SET
  total_inr = 4800,
  headline = '₹4,800 in Zomato gift cards',
  updated_at = now()
WHERE id = true;
