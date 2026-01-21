-- Update record_video_view to give coins instead of rupees
CREATE OR REPLACE FUNCTION public.record_video_view(p_video_id uuid, p_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  already_watched BOOLEAN;
  v_coins INTEGER := 20;
BEGIN
  -- Check if user already watched this video today
  SELECT EXISTS (
    SELECT 1 FROM public.coin_transactions 
    WHERE user_id = p_user_id 
    AND description LIKE '%' || p_video_id::text || '%'
    AND type = 'video_watch'
    AND created_at > CURRENT_DATE
  ) INTO already_watched;

  IF already_watched THEN
    RETURN FALSE;
  END IF;

  -- Increment video view count
  UPDATE public.videos SET view_count = COALESCE(view_count, 0) + 1 WHERE id = p_video_id;

  -- Add coin transaction (instead of earning)
  INSERT INTO public.coin_transactions (user_id, amount, type, description)
  VALUES (p_user_id, v_coins, 'video_watch', 'Earned coins for watching video: ' || p_video_id::text);

  -- Update wallet coins
  INSERT INTO public.user_wallets (user_id, coins)
  VALUES (p_user_id, v_coins)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    coins = user_wallets.coins + v_coins,
    updated_at = now();

  RETURN TRUE;
END;
$function$;

-- Update add_referral_bonus to give coins instead of rupees
CREATE OR REPLACE FUNCTION public.add_referral_bonus(p_referrer_id uuid, p_referred_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_coins INTEGER := 100;
BEGIN
  -- Add coin transaction for referrer (100 coins)
  INSERT INTO public.coin_transactions (user_id, amount, type, description)
  VALUES (p_referrer_id, v_coins, 'referral_bonus', 'Bonus for referring a new user');

  -- Update wallet coins for referrer
  INSERT INTO public.user_wallets (user_id, coins)
  VALUES (p_referrer_id, v_coins)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    coins = user_wallets.coins + v_coins,
    updated_at = now();
END;
$function$;