-- Fix RLS for masked views - they need RLS policies too
-- profiles_public view should only allow viewing your own profile or public data

-- Create RLS policy for withdrawal_requests_masked view (users see only their own)
CREATE POLICY "Users can view their own masked withdrawal requests"
ON public.withdrawal_requests
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id 
  OR public.has_role(auth.uid(), 'admin')
);

-- Create RLS policy for user_bank_details_masked - users see only their own
-- First ensure base table has proper RLS
DROP POLICY IF EXISTS "Users can view their own bank details" ON public.user_bank_details;
DROP POLICY IF EXISTS "Users can insert their own bank details" ON public.user_bank_details;
DROP POLICY IF EXISTS "Users can update their own bank details" ON public.user_bank_details;

CREATE POLICY "Users can view their own bank details"
ON public.user_bank_details
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own bank details"
ON public.user_bank_details
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bank details"
ON public.user_bank_details
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Block direct client wallet updates - only allow via RPC functions
DROP POLICY IF EXISTS "Users can update their own wallet" ON public.user_wallets;
DROP POLICY IF EXISTS "Users can view their own wallet" ON public.user_wallets;

-- Users can only VIEW their wallet, not update directly
CREATE POLICY "Users can view their own wallet"
ON public.user_wallets
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- No INSERT/UPDATE/DELETE policies for users - only via RPC functions
-- Admins can manage wallets
CREATE POLICY "Admins can manage all wallets"
ON public.user_wallets
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create secure withdrawal processing function with validation
CREATE OR REPLACE FUNCTION public.submit_withdrawal_request(
  p_amount INTEGER,
  p_bank_name TEXT,
  p_account_number TEXT,
  p_ifsc_code TEXT,
  p_account_holder_name TEXT,
  p_save_bank_details BOOLEAN DEFAULT FALSE
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_current_balance INTEGER;
  v_pending_withdrawals INTEGER;
  v_result JSON;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated');
  END IF;
  
  -- Validate minimum amount
  IF p_amount < 1000 THEN
    RETURN json_build_object('success', false, 'error', 'Minimum withdrawal is ₹1000');
  END IF;
  
  -- Validate inputs
  IF p_bank_name IS NULL OR trim(p_bank_name) = '' THEN
    RETURN json_build_object('success', false, 'error', 'Bank name is required');
  END IF;
  
  IF p_account_number IS NULL OR trim(p_account_number) = '' THEN
    RETURN json_build_object('success', false, 'error', 'Account number is required');
  END IF;
  
  IF p_ifsc_code IS NULL OR trim(p_ifsc_code) = '' THEN
    RETURN json_build_object('success', false, 'error', 'IFSC code is required');
  END IF;
  
  IF p_account_holder_name IS NULL OR trim(p_account_holder_name) = '' THEN
    RETURN json_build_object('success', false, 'error', 'Account holder name is required');
  END IF;
  
  -- Get current balance
  SELECT balance INTO v_current_balance
  FROM public.user_wallets
  WHERE user_id = v_user_id;
  
  IF v_current_balance IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Wallet not found');
  END IF;
  
  -- Check for pending withdrawals
  SELECT COALESCE(SUM(amount), 0) INTO v_pending_withdrawals
  FROM public.withdrawal_requests
  WHERE user_id = v_user_id AND status = 'pending';
  
  -- Check if user has enough balance (considering pending withdrawals)
  IF (v_current_balance - v_pending_withdrawals) < p_amount THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient balance');
  END IF;
  
  -- Save bank details if requested
  IF p_save_bank_details THEN
    INSERT INTO public.user_bank_details (user_id, bank_name, account_number, ifsc_code, account_holder_name)
    VALUES (v_user_id, trim(p_bank_name), trim(p_account_number), upper(trim(p_ifsc_code)), trim(p_account_holder_name))
    ON CONFLICT (user_id) 
    DO UPDATE SET 
      bank_name = EXCLUDED.bank_name,
      account_number = EXCLUDED.account_number,
      ifsc_code = EXCLUDED.ifsc_code,
      account_holder_name = EXCLUDED.account_holder_name,
      updated_at = now();
  END IF;
  
  -- Create withdrawal request
  INSERT INTO public.withdrawal_requests (
    user_id, 
    amount, 
    bank_name, 
    account_number, 
    ifsc_code, 
    account_holder_name,
    status
  )
  VALUES (
    v_user_id, 
    p_amount, 
    trim(p_bank_name), 
    trim(p_account_number), 
    upper(trim(p_ifsc_code)), 
    trim(p_account_holder_name),
    'pending'
  );
  
  RETURN json_build_object('success', true, 'message', 'Withdrawal request submitted');
END;
$$;

-- Add unique constraint on user_bank_details if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_bank_details_user_id_key'
  ) THEN
    ALTER TABLE public.user_bank_details ADD CONSTRAINT user_bank_details_user_id_key UNIQUE (user_id);
  END IF;
EXCEPTION WHEN others THEN
  NULL;
END $$;