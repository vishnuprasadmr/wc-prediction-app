-- Prize pool copy: amount shown once on the page, not duplicated in headline

UPDATE league_prize_config
SET
  headline = 'Tournament prize pool',
  intro = 'Play every matchday — winners receive Zomato e-gift cards with instant delivery.',
  total_inr = (
    SELECT COALESCE(SUM(amount_inr), 5000)::INTEGER FROM league_prizes
  ),
  updated_at = now()
WHERE id = true;
