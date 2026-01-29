-- ===========================================
-- FIX 1: Enhanced process_withdrawal function with validation
-- ===========================================
CREATE OR REPLACE FUNCTION public.process_withdrawal(
  p_withdrawal_id UUID,
  p_user_id UUID, 
  p_amount INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_current_balance INTEGER;
  v_request_status TEXT;
  v_request_amount INTEGER;
BEGIN
  -- Validate inputs
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Invalid withdrawal amount: must be positive';
  END IF;
  
  IF p_amount < 1000 THEN
    RAISE EXCEPTION 'Minimum withdrawal amount is ₹1000';
  END IF;
  
  -- Verify withdrawal request exists and is pending (with row lock)
  SELECT status, amount INTO v_request_status, v_request_amount
  FROM public.withdrawal_requests
  WHERE id = p_withdrawal_id AND user_id = p_user_id
  FOR UPDATE;
  
  IF v_request_status IS NULL THEN
    RAISE EXCEPTION 'Withdrawal request not found';
  END IF;
  
  IF v_request_status != 'pending' AND v_request_status != 'processing' THEN
    RAISE EXCEPTION 'Withdrawal already processed (status: %)', v_request_status;
  END IF;
  
  -- Verify amount matches request
  IF v_request_amount != p_amount THEN
    RAISE EXCEPTION 'Amount mismatch: expected %, got %', v_request_amount, p_amount;
  END IF;
  
  -- Lock and check balance
  SELECT balance INTO v_current_balance 
  FROM public.user_wallets 
  WHERE user_id = p_user_id 
  FOR UPDATE;
  
  IF v_current_balance IS NULL THEN
    RAISE EXCEPTION 'Wallet not found for user';
  END IF;
  
  IF v_current_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient balance: has %, needs %', v_current_balance, p_amount;
  END IF;
  
  -- Update wallet
  UPDATE public.user_wallets 
  SET 
    balance = balance - p_amount,
    total_withdrawn = total_withdrawn + p_amount,
    updated_at = now()
  WHERE user_id = p_user_id;
  
  RETURN TRUE;
END;
$$;

-- ===========================================
-- FIX 2: Create claim_task_reward RPC function
-- ===========================================
CREATE OR REPLACE FUNCTION public.claim_task_reward(
  p_user_id UUID,
  p_task_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_reward_amount NUMERIC;
  v_task_title TEXT;
  v_today DATE := CURRENT_DATE;
  v_already_claimed BOOLEAN;
BEGIN
  -- Validate user
  IF p_user_id IS NULL OR p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  
  -- Get task info
  SELECT title, reward_amount INTO v_task_title, v_reward_amount
  FROM public.daily_tasks
  WHERE id = p_task_id AND is_active = true;
  
  IF v_task_title IS NULL THEN
    RAISE EXCEPTION 'Task not found or inactive';
  END IF;
  
  -- Check if already claimed today
  SELECT EXISTS (
    SELECT 1 FROM public.user_daily_tasks
    WHERE user_id = p_user_id 
    AND task_id = p_task_id 
    AND date = v_today
  ) INTO v_already_claimed;
  
  IF v_already_claimed THEN
    RAISE EXCEPTION 'Reward already claimed today';
  END IF;
  
  -- Insert completion record
  INSERT INTO public.user_daily_tasks (user_id, task_id, reward_claimed, date)
  VALUES (p_user_id, p_task_id, true, v_today);
  
  -- Record coin transaction
  INSERT INTO public.coin_transactions (user_id, amount, type, description)
  VALUES (p_user_id, v_reward_amount::integer, 'earned', 'Completed task: ' || v_task_title);
  
  -- Update wallet coins
  INSERT INTO public.user_wallets (user_id, coins)
  VALUES (p_user_id, v_reward_amount::integer)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    coins = user_wallets.coins + v_reward_amount::integer,
    updated_at = now();
  
  RETURN TRUE;
END;
$$;

-- ===========================================
-- FIX 3: Create award_streak_bonus RPC function
-- ===========================================
CREATE OR REPLACE FUNCTION public.award_streak_bonus(
  p_user_id UUID,
  p_streak_count INTEGER,
  p_bonus_coins INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Validate user
  IF p_user_id IS NULL OR p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  
  -- Validate inputs
  IF p_streak_count <= 0 OR p_bonus_coins <= 0 THEN
    RAISE EXCEPTION 'Invalid streak or bonus amount';
  END IF;
  
  -- Record coin transaction
  INSERT INTO public.coin_transactions (user_id, amount, type, description)
  VALUES (p_user_id, p_bonus_coins, 'streak_bonus', '🎁 Completed ' || p_streak_count || '-day streak challenge!');
  
  -- Update wallet coins
  INSERT INTO public.user_wallets (user_id, coins)
  VALUES (p_user_id, p_bonus_coins)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    coins = user_wallets.coins + p_bonus_coins,
    updated_at = now();
  
  RETURN TRUE;
END;
$$;

-- ===========================================
-- FIX 4: Create purchase_reward RPC function
-- ===========================================
CREATE OR REPLACE FUNCTION public.purchase_reward(
  p_user_id UUID,
  p_reward_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_reward_name TEXT;
  v_reward_type TEXT;
  v_coin_price INTEGER;
  v_current_coins INTEGER;
  v_already_owned BOOLEAN;
  v_expires_at TIMESTAMPTZ;
BEGIN
  -- Validate user
  IF p_user_id IS NULL OR p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  
  -- Get reward info
  SELECT name, type, coin_price INTO v_reward_name, v_reward_type, v_coin_price
  FROM public.rewards
  WHERE id = p_reward_id AND is_active = true;
  
  IF v_reward_name IS NULL THEN
    RAISE EXCEPTION 'Reward not found or inactive';
  END IF;
  
  -- Check if already owned
  SELECT EXISTS (
    SELECT 1 FROM public.user_rewards
    WHERE user_id = p_user_id AND reward_id = p_reward_id
  ) INTO v_already_owned;
  
  IF v_already_owned THEN
    RAISE EXCEPTION 'You already own this reward';
  END IF;
  
  -- Get current coins with lock
  SELECT coins INTO v_current_coins
  FROM public.user_wallets
  WHERE user_id = p_user_id
  FOR UPDATE;
  
  IF v_current_coins IS NULL THEN
    RAISE EXCEPTION 'Wallet not found';
  END IF;
  
  IF v_current_coins < v_coin_price THEN
    RAISE EXCEPTION 'Not enough coins: have %, need %', v_current_coins, v_coin_price;
  END IF;
  
  -- Set expiration for boosts
  IF v_reward_type = 'boost' THEN
    v_expires_at := now() + interval '24 hours';
  ELSE
    v_expires_at := NULL;
  END IF;
  
  -- Deduct coins
  UPDATE public.user_wallets
  SET coins = coins - v_coin_price, updated_at = now()
  WHERE user_id = p_user_id;
  
  -- Add user reward
  INSERT INTO public.user_rewards (user_id, reward_id, expires_at)
  VALUES (p_user_id, p_reward_id, v_expires_at);
  
  -- Record coin transaction
  INSERT INTO public.coin_transactions (user_id, amount, type, description)
  VALUES (p_user_id, -v_coin_price, 'spent', 'Purchased ' || v_reward_name);
  
  RETURN TRUE;
END;
$$;