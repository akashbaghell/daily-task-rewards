-- Update the add_referral_bonus function to give ₹50 (currently gives ₹120, changing to ₹50)
CREATE OR REPLACE FUNCTION public.add_referral_bonus(p_referrer_id uuid, p_referred_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Add earning record for referrer (₹50)
  INSERT INTO public.earnings (user_id, amount, type, reference_id)
  VALUES (p_referrer_id, 50, 'referral', p_referred_id);

  -- Update or create wallet for referrer (₹50)
  INSERT INTO public.user_wallets (user_id, balance, total_earned)
  VALUES (p_referrer_id, 50, 50)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    balance = user_wallets.balance + 50,
    total_earned = user_wallets.total_earned + 50,
    updated_at = now();
END;
$$;

-- Create a function to give referrer bonus coins when referred user completes a task
CREATE OR REPLACE FUNCTION public.add_referrer_task_bonus()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referrer_id UUID;
  v_bonus_coins INTEGER := 5; -- 5 coins bonus per task
BEGIN
  -- Find if the user was referred by someone
  SELECT referrer_id INTO v_referrer_id 
  FROM public.referrals 
  WHERE referred_id = NEW.user_id;

  -- If user was referred, give bonus coins to referrer
  IF v_referrer_id IS NOT NULL THEN
    -- Add coin transaction for referrer
    INSERT INTO public.coin_transactions (user_id, amount, type, description)
    VALUES (v_referrer_id, v_bonus_coins, 'referral_bonus', 'Bonus: Your referral completed a task');

    -- Update referrer's wallet coins
    UPDATE public.user_wallets 
    SET coins = coins + v_bonus_coins, updated_at = now()
    WHERE user_id = v_referrer_id;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger to call the function when a user completes a daily task
DROP TRIGGER IF EXISTS on_referred_user_task_complete ON public.user_daily_tasks;
CREATE TRIGGER on_referred_user_task_complete
  AFTER INSERT ON public.user_daily_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.add_referrer_task_bonus();