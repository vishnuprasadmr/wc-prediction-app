-- Drop Matchday hero prizes; lucky draw becomes ₹500; expose masked card + avatar publicly

DELETE FROM finale_prize_awards
WHERE slot_key IN ('matchday_hero_1', 'matchday_hero_2', 'matchday_hero_3');

UPDATE finale_prize_awards
SET amount_inr = 500, updated_at = now()
WHERE slot_key = 'lucky_draw';

DELETE FROM league_prizes
WHERE title = 'Matchday hero × 3';

UPDATE league_prizes
SET
  amount_inr = 500,
  description = '₹500 Zomato e-gift card — everyone with 70%+ match picks enters.',
  updated_at = now()
WHERE title = 'Lucky league draw';

UPDATE league_prize_config
SET
  total_inr = 4300,
  headline = '₹4,300 in Zomato gift cards',
  intro = 'Play every matchday — winners get Zomato e-gift cards with instant delivery, not cash.',
  footer_note = 'Zomato e-gift cards delivered in-app after the Final. Instant delivery — valid for online orders on the Zomato app. Tie-breakers follow league scoring rules.',
  updated_at = now()
WHERE id = true;

-- Mask first 16 digits (card number); never expose PIN digits in the mask.
CREATE OR REPLACE FUNCTION mask_gift_card_number(p_code TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  digits TEXT;
  card TEXT;
BEGIN
  IF p_code IS NULL OR btrim(p_code) = '' THEN
    RETURN NULL;
  END IF;
  digits := regexp_replace(p_code, '[^0-9]', '', 'g');
  IF length(digits) >= 16 THEN
    card := substring(digits FROM 1 FOR 16);
    RETURN substring(card FROM 1 FOR 4) || ' **** **** ' || substring(card FROM 13 FOR 4);
  END IF;
  IF length(digits) >= 8 THEN
    RETURN substring(digits FROM 1 FOR 4) || ' **** ' || substring(digits FROM length(digits) - 3 FOR 4);
  END IF;
  RETURN '****';
END;
$$;

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
  p.display_name AS winner_display_name,
  p.avatar_url AS winner_avatar_url,
  mask_gift_card_number(a.zomato_code) AS masked_card
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

GRANT SELECT ON finale_prize_awards_public TO authenticated;
GRANT EXECUTE ON FUNCTION mask_gift_card_number(TEXT) TO authenticated;
