-- Fix withdrawal race condition by making status update atomic within the RPC
-- The status update now happens INSIDE the transaction, preventing race conditions

CREATE OR REPLACE FUNCTION public.process_withdrawal(p_withdrawal_id uuid, p_user_id uuid, p_amount integer)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_current_balance INTEGER;
  v_request_status TEXT;
  v_request_amount INTEGER;
  v_request_user_id UUID;
BEGIN
  -- Validate inputs
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Invalid withdrawal amount: must be positive';
  END IF;
  
  IF p_amount < 1000 THEN
    RAISE EXCEPTION 'Minimum withdrawal amount is ₹1000';
  END IF;
  
  -- Lock the withdrawal request row and verify it's valid
  SELECT status, amount, user_id INTO v_request_status, v_request_amount, v_request_user_id
  FROM public.withdrawal_requests
  WHERE id = p_withdrawal_id
  FOR UPDATE;
  
  IF v_request_status IS NULL THEN
    RAISE EXCEPTION 'Withdrawal request not found';
  END IF;
  
  -- Verify the user_id matches
  IF v_request_user_id != p_user_id THEN
    RAISE EXCEPTION 'User ID mismatch for withdrawal request';
  END IF;
  
  -- Only allow processing from pending or processing status
  IF v_request_status NOT IN ('pending', 'processing') THEN
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
  
  -- ATOMICALLY update withdrawal status to approved BEFORE deducting
  -- This prevents race conditions where status is updated separately
  UPDATE public.withdrawal_requests
  SET status = 'approved', processed_at = now()
  WHERE id = p_withdrawal_id;
  
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

-- Add rate limiting for video views: max 10 videos per hour per user
-- This prevents rapid consecutive claim abuse
ALTER TABLE public.video_watches ADD COLUMN IF NOT EXISTS claim_hour TIMESTAMP WITH TIME ZONE DEFAULT date_trunc('hour', now());

-- Create index for hourly rate limiting lookups
CREATE INDEX IF NOT EXISTS idx_video_watches_user_hour ON public.video_watches(user_id, claim_hour);

-- Update record_video_view to include hourly rate limiting
CREATE OR REPLACE FUNCTION public.record_video_view(p_video_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_coins INTEGER := 20;
  v_hourly_count INTEGER;
  v_current_hour TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Validate user is authenticated
  IF p_user_id IS NULL OR p_user_id != auth.uid() THEN
    RETURN FALSE;
  END IF;

  -- Get current hour for rate limiting
  v_current_hour := date_trunc('hour', now());

  -- Check hourly rate limit (max 10 videos per hour)
  SELECT COUNT(*) INTO v_hourly_count
  FROM public.video_watches
  WHERE user_id = p_user_id 
  AND claim_hour = v_current_hour;

  IF v_hourly_count >= 10 THEN
    -- Rate limited - too many claims this hour
    RETURN FALSE;
  END IF;

  -- Try to insert into video_watches table
  -- The unique constraint will prevent duplicates at database level
  BEGIN
    INSERT INTO public.video_watches (user_id, video_id, watch_date, coins_earned, claim_hour)
    VALUES (p_user_id, p_video_id, CURRENT_DATE, v_coins, v_current_hour);
  EXCEPTION WHEN unique_violation THEN
    -- Already watched this video today
    RETURN FALSE;
  END;

  -- Increment video view count
  UPDATE public.videos SET view_count = COALESCE(view_count, 0) + 1 WHERE id = p_video_id;

  -- Add coin transaction
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
$$;