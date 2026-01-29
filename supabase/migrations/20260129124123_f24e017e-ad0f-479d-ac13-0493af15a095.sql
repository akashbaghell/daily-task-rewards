-- SECURITY FIX: Users should ONLY access bank/withdrawal data through masked views
-- Block direct SELECT on sensitive tables - only admins and service role can access directly

-- Step 1: Fix user_bank_details - Users should use masked view only
DROP POLICY IF EXISTS "Users can view own bank details" ON public.user_bank_details;
CREATE POLICY "Only admins can view bank details directly"
ON public.user_bank_details FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Step 2: Fix withdrawal_requests - Users should use masked view only  
DROP POLICY IF EXISTS "Users can view own withdrawal requests" ON public.withdrawal_requests;
CREATE POLICY "Only admins can view withdrawals directly"
ON public.withdrawal_requests FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Step 3: Recreate masked views with security_invoker and proper WHERE filtering
-- These views will filter by auth.uid() so users can only see their own data

DROP VIEW IF EXISTS public.user_bank_details_masked;
CREATE VIEW public.user_bank_details_masked
WITH (security_invoker = on)
AS SELECT 
  id,
  user_id,
  is_primary,
  created_at,
  updated_at,
  CASE 
    WHEN public.has_role(auth.uid(), 'admin') THEN account_number
    ELSE '****' || RIGHT(account_number, 4)
  END as account_number_masked,
  CASE 
    WHEN public.has_role(auth.uid(), 'admin') THEN bank_name
    ELSE LEFT(bank_name, 3) || '***'
  END as bank_name_masked,
  CASE 
    WHEN public.has_role(auth.uid(), 'admin') THEN ifsc_code
    ELSE LEFT(ifsc_code, 4) || '****'
  END as ifsc_masked,
  CASE 
    WHEN public.has_role(auth.uid(), 'admin') THEN account_holder_name
    ELSE LEFT(account_holder_name, 2) || '****'
  END as account_holder_masked
FROM public.user_bank_details
WHERE user_id = auth.uid() OR public.has_role(auth.uid(), 'admin');

DROP VIEW IF EXISTS public.withdrawal_requests_masked;
CREATE VIEW public.withdrawal_requests_masked
WITH (security_invoker = on)
AS SELECT 
  id,
  user_id,
  amount,
  status,
  created_at,
  processed_at,
  admin_notes,
  CASE 
    WHEN public.has_role(auth.uid(), 'admin') THEN account_number
    ELSE '****' || RIGHT(account_number, 4)
  END as account_number_masked,
  CASE 
    WHEN public.has_role(auth.uid(), 'admin') THEN bank_name
    ELSE LEFT(bank_name, 3) || '***'
  END as bank_name_masked,
  CASE 
    WHEN public.has_role(auth.uid(), 'admin') THEN ifsc_code
    ELSE LEFT(ifsc_code, 4) || '****'
  END as ifsc_masked,
  CASE 
    WHEN public.has_role(auth.uid(), 'admin') THEN account_holder_name
    ELSE LEFT(account_holder_name, 2) || '****'
  END as account_holder_masked
FROM public.withdrawal_requests
WHERE user_id = auth.uid() OR public.has_role(auth.uid(), 'admin');