-- Secure withdrawal_requests_masked view with proper security
DROP VIEW IF EXISTS public.withdrawal_requests_masked;

CREATE VIEW public.withdrawal_requests_masked
WITH (security_invoker = on) AS
SELECT 
  id,
  user_id,
  amount,
  '****' || RIGHT(account_number, 4) as account_number_masked,
  CASE 
    WHEN LENGTH(bank_name) > 3 THEN LEFT(bank_name, 3) || '***'
    ELSE '***'
  END as bank_name_masked,
  LEFT(ifsc_code, 4) || '****' as ifsc_masked,
  CASE 
    WHEN LENGTH(account_holder_name) > 2 THEN LEFT(account_holder_name, 2) || '***'
    ELSE '***'
  END as account_holder_masked,
  status,
  admin_notes,
  created_at,
  processed_at
FROM public.withdrawal_requests
WHERE user_id = auth.uid() OR public.has_role(auth.uid(), 'admin');

-- Ensure base withdrawal_requests table has strict RLS
-- Only admins should have direct SELECT access
DROP POLICY IF EXISTS "Users can view own withdrawal requests" ON public.withdrawal_requests;
DROP POLICY IF EXISTS "Admins can view all withdrawals" ON public.withdrawal_requests;
DROP POLICY IF EXISTS "Only admins can view withdrawals directly" ON public.withdrawal_requests;

-- Admins only for direct table SELECT - users must use masked view
CREATE POLICY "Only admins can view withdrawals directly"
ON public.withdrawal_requests FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Users can insert their own withdrawal requests (via RPC function)
DROP POLICY IF EXISTS "Users can insert own withdrawal requests" ON public.withdrawal_requests;

CREATE POLICY "Users can insert own withdrawal requests"
ON public.withdrawal_requests FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Similarly secure profiles_public view
DROP VIEW IF EXISTS public.profiles_public;

CREATE VIEW public.profiles_public
WITH (security_invoker = on) AS
SELECT 
  id,
  CASE 
    WHEN full_name IS NOT NULL AND LENGTH(full_name) > 0 
    THEN LEFT(full_name, 1) || '***'
    ELSE 'User'
  END as display_name,
  referral_code
FROM public.profiles
WHERE id = auth.uid() 
   OR public.has_role(auth.uid(), 'admin')
   OR referral_code IS NOT NULL;