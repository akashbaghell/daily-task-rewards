-- =====================================================
-- FIX 1: Block direct SELECT on user_bank_details table
-- Users must use the masked view instead
-- =====================================================

-- Drop existing SELECT policies on user_bank_details
DROP POLICY IF EXISTS "Users can view own bank details" ON public.user_bank_details;

-- Create restrictive policy - only admins can SELECT directly
-- Regular users must use the masked view
CREATE POLICY "Only admins can view bank details directly"
ON public.user_bank_details
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Keep INSERT/UPDATE/DELETE policies for users to manage their own bank details
-- (These don't expose sensitive data)

-- =====================================================
-- FIX 2: Add RLS to user_bank_details_masked view
-- Ensure users can only see their own masked data
-- =====================================================

-- Recreate the masked view with security_invoker to respect RLS
DROP VIEW IF EXISTS public.user_bank_details_masked;

CREATE VIEW public.user_bank_details_masked
WITH (security_invoker = on) AS
SELECT 
  id,
  user_id,
  '****' || RIGHT(account_number, 4) as account_number_masked,
  LEFT(account_holder_name, 1) || '***' as account_holder_masked,
  LEFT(bank_name, 3) || '***' as bank_name_masked,
  LEFT(ifsc_code, 4) || '****' as ifsc_masked,
  is_primary,
  created_at,
  updated_at
FROM public.user_bank_details
WHERE user_id = auth.uid() OR public.has_role(auth.uid(), 'admin');

-- =====================================================
-- FIX 3: Add RLS to withdrawal_requests_masked view
-- Ensure users can only see their own masked data
-- =====================================================

DROP VIEW IF EXISTS public.withdrawal_requests_masked;

CREATE VIEW public.withdrawal_requests_masked
WITH (security_invoker = on) AS
SELECT 
  id,
  user_id,
  amount,
  created_at,
  processed_at,
  status,
  admin_notes,
  '****' || RIGHT(account_number, 4) as account_number_masked,
  LEFT(account_holder_name, 1) || '***' as account_holder_masked,
  LEFT(bank_name, 3) || '***' as bank_name_masked,
  LEFT(ifsc_code, 4) || '****' as ifsc_masked
FROM public.withdrawal_requests
WHERE user_id = auth.uid() OR public.has_role(auth.uid(), 'admin');

-- =====================================================
-- FIX 4: Add RLS to profiles_public view  
-- Already uses security_invoker, just need to verify behavior
-- =====================================================

DROP VIEW IF EXISTS public.profiles_public;

CREATE VIEW public.profiles_public
WITH (security_invoker = on) AS
SELECT 
  id,
  COALESCE(full_name, 'Anonymous') as display_name,
  referral_code
FROM public.profiles;

-- =====================================================
-- FIX 5: Tighten ad_views policy - separate viewer/owner access
-- =====================================================

-- Drop the combined policy
DROP POLICY IF EXISTS "Users can view own ad views" ON public.ad_views;

-- Create separate policies for cleaner access control
CREATE POLICY "Viewers can see their own ad views"
ON public.ad_views
FOR SELECT
USING (auth.uid() = viewer_id);

CREATE POLICY "Video owners can see ad views on their videos"
ON public.ad_views
FOR SELECT
USING (auth.uid() = video_owner_id);

CREATE POLICY "Admins can view all ad views"
ON public.ad_views
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));