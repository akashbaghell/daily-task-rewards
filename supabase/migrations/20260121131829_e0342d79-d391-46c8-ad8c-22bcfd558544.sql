-- Create a secure function to convert coins to rupees
CREATE OR REPLACE FUNCTION public.convert_coins_to_rupees(p_user_id uuid, p_coins integer)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_current_coins INTEGER;
  v_rupees INTEGER;
  v_coins_to_use INTEGER;
BEGIN
  -- Validate minimum coins (100)
  IF p_coins < 100 THEN
    RAISE EXCEPTION 'Minimum 100 coins required for conversion';
  END IF;

  -- Get current coins
  SELECT coins INTO v_current_coins 
  FROM public.user_wallets 
  WHERE user_id = p_user_id;

  IF v_current_coins IS NULL THEN
    RAISE EXCEPTION 'Wallet not found';
  END IF;

  -- Check if user has enough coins
  IF v_current_coins < p_coins THEN
    RAISE EXCEPTION 'Not enough coins';
  END IF;

  -- Calculate rupees (10 coins = 1 rupee)
  v_rupees := FLOOR(p_coins / 10);
  v_coins_to_use := v_rupees * 10;

  IF v_rupees <= 0 THEN
    RAISE EXCEPTION 'Not enough coins for conversion';
  END IF;

  -- Update wallet: deduct coins, add rupees
  UPDATE public.user_wallets 
  SET 
    coins = coins - v_coins_to_use,
    balance = balance + v_rupees,
    total_earned = total_earned + v_rupees,
    updated_at = now()
  WHERE user_id = p_user_id;

  -- Record coin transaction (negative for spent)
  INSERT INTO public.coin_transactions (user_id, amount, type, description)
  VALUES (p_user_id, -v_coins_to_use, 'converted', 'Converted ' || v_coins_to_use || ' coins to ₹' || v_rupees);

  -- Record earning
  INSERT INTO public.earnings (user_id, amount, type)
  VALUES (p_user_id, v_rupees, 'coin_conversion');

  RETURN TRUE;
END;
$function$;