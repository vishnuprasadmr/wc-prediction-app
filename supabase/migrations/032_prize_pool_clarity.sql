-- Clarify that ₹5,000 is the overall pool split across awards, not a single first prize

UPDATE league_prize_config
SET
  headline = 'League prize pool',
  intro = '₹5,000 overall prize pool for the tournament — split across separate award categories below. Each winner receives their own Zomato e-gift card; amounts are not cumulative for one person unless they win multiple categories.',
  footer_note = 'Overall pool = sum of all category awards listed above. Zomato e-gift cards sent by email after the Final. Instant delivery — valid for online orders on the Zomato app. Tie-breakers follow league scoring rules.',
  updated_at = now()
WHERE id = true;
