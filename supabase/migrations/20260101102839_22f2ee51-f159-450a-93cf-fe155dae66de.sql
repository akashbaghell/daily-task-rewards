-- Update referral bonus function to give ₹120 instead of ₹100
CREATE OR REPLACE FUNCTION public.add_referral_bonus(p_referrer_id uuid, p_referred_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Add earning record for referrer (₹120)
  INSERT INTO public.earnings (user_id, amount, type, reference_id)
  VALUES (p_referrer_id, 120, 'referral', p_referred_id);

  -- Update or create wallet for referrer (₹120)
  INSERT INTO public.user_wallets (user_id, balance, total_earned)
  VALUES (p_referrer_id, 120, 120)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    balance = user_wallets.balance + 120,
    total_earned = user_wallets.total_earned + 120,
    updated_at = now();
END;
$$;