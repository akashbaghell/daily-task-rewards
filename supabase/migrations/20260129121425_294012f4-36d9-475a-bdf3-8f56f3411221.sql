-- Drop and recreate the masked view with proper security
DROP VIEW IF EXISTS public.user_bank_details_masked;

CREATE VIEW public.user_bank_details_masked
WITH (security_invoker = on) AS
SELECT 
  id,
  user_id,
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
  is_primary,
  created_at,
  updated_at
FROM public.user_bank_details
WHERE user_id = auth.uid() OR public.has_role(auth.uid(), 'admin');

-- Ensure base table policies are restrictive
-- Users should NOT have direct SELECT - must use masked view
DROP POLICY IF EXISTS "Only admins can view bank details directly" ON public.user_bank_details;

CREATE POLICY "Only admins can view bank details directly"
ON public.user_bank_details FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Users can only insert their own bank details
DROP POLICY IF EXISTS "Users can insert own bank details" ON public.user_bank_details;

CREATE POLICY "Users can insert own bank details"
ON public.user_bank_details FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can only update their own bank details  
DROP POLICY IF EXISTS "Users can update own bank details" ON public.user_bank_details;

CREATE POLICY "Users can update own bank details"
ON public.user_bank_details FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can only delete their own bank details
DROP POLICY IF EXISTS "Users can delete own bank details" ON public.user_bank_details;

CREATE POLICY "Users can delete own bank details"
ON public.user_bank_details FOR DELETE
TO authenticated
USING (auth.uid() = user_id);