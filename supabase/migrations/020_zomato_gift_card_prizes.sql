-- Switch prize copy from cash/UPI to Zomato e-gift cards (safe if 018 already applied)

UPDATE league_prize_config
SET
  headline = '₹5,000 in Zomato gift cards',
  intro = 'Play every matchday — winners get Zomato e-gift cards with instant delivery, not cash.',
  footer_note = 'Zomato e-gift cards sent by email after the Final. Instant delivery — valid for online orders on the Zomato app. Tie-breakers follow league scoring rules.',
  updated_at = now()
WHERE id = true;

UPDATE league_prizes SET description = '₹1,500 Zomato e-gift card — instant delivery.' WHERE sort_order = 1 AND title = 'Champion';
UPDATE league_prizes SET description = '₹800 Zomato e-gift card.' WHERE sort_order = 2 AND title = 'Runner-up';
UPDATE league_prizes SET description = '₹500 Zomato e-gift card.' WHERE sort_order = 3 AND title = 'Bronze';
UPDATE league_prizes SET description = '₹500 Zomato e-gift card for the best scoreline picker.' WHERE sort_order = 4 AND title = 'Oracle';
UPDATE league_prizes SET description = '₹300 Zomato e-gift card each — opening weekend, a knockout round, and final week.' WHERE sort_order = 5 AND title = 'Matchday hero × 3';
UPDATE league_prizes SET description = '₹500 Zomato e-gift card after season picks settle.' WHERE sort_order = 6 AND title = 'Season specials star';
UPDATE league_prizes SET description = '₹300 Zomato e-gift card — everyone with 70%+ match picks enters.' WHERE sort_order = 7 AND title = 'Lucky league draw';
