-- ==============================================
-- FIX: Withdrawal Requests Bank Details Exposure
-- ==============================================

-- Drop existing policies on withdrawal_requests
DROP POLICY IF EXISTS "Users can view own withdrawals" ON public.withdrawal_requests;
DROP POLICY IF EXISTS "Users can insert own withdrawals" ON public.withdrawal_requests;
DROP POLICY IF EXISTS "Admins can manage withdrawals" ON public.withdrawal_requests;

-- Create a secure view that masks bank details for users
DROP VIEW IF EXISTS public.withdrawal_requests_masked;

CREATE VIEW public.withdrawal_requests_masked
WITH (security_invoker = on) AS
SELECT 
  id,
  user_id,
  amount,
  status,
  created_at,
  processed_at,
  admin_notes,
  -- Mask bank details - show only last 4 digits
  CASE 
    WHEN auth.uid() = user_id THEN 
      '****' || RIGHT(account_number, 4)
    WHEN has_role(auth.uid(), 'admin') THEN 
      account_number
    ELSE '********'
  END as account_number_masked,
  CASE 
    WHEN auth.uid() = user_id THEN 
      LEFT(account_holder_name, 2) || '***'
    WHEN has_role(auth.uid(), 'admin') THEN 
      account_holder_name
    ELSE '***'
  END as account_holder_masked,
  CASE 
    WHEN has_role(auth.uid(), 'admin') THEN bank_name
    ELSE '***Bank'
  END as bank_name_masked,
  CASE 
    WHEN has_role(auth.uid(), 'admin') THEN ifsc_code
    ELSE '****' || RIGHT(ifsc_code, 4)
  END as ifsc_masked
FROM public.withdrawal_requests;

-- Deny direct SELECT on base table - force use of view
CREATE POLICY "No direct select on withdrawal_requests"
ON public.withdrawal_requests
FOR SELECT
USING (false);

-- Allow INSERT for users (to create new withdrawal requests)
CREATE POLICY "Users can insert own withdrawal requests"
ON public.withdrawal_requests
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Allow admins full access for processing
CREATE POLICY "Admins can manage withdrawal_requests"
ON public.withdrawal_requests
FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- ==============================================
-- FIX: Profiles Referral Code Exposure
-- ==============================================

-- Drop existing permissive policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view referrer profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Users can only view their own profile
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Create a limited view for referral lookups (only shows minimal info)
DROP VIEW IF EXISTS public.profiles_public;

CREATE VIEW public.profiles_public
WITH (security_invoker = on) AS
SELECT 
  id,
  LEFT(COALESCE(full_name, 'User'), 1) || '***' as display_name,
  referral_code
FROM public.profiles;