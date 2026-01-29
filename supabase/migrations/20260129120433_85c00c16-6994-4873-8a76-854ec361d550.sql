-- Clean up duplicate/conflicting SELECT policies on user_bank_details
-- Keep only the admin-only policy for direct access
DROP POLICY IF EXISTS "Users can view own bank details" ON public.user_bank_details;
DROP POLICY IF EXISTS "Users can view their own bank details" ON public.user_bank_details;
DROP POLICY IF EXISTS "Admins can view all bank details" ON public.user_bank_details;

-- Now only admins can SELECT directly - users must use masked view
-- (The "Only admins can view bank details directly" policy from previous migration handles this)

-- Also clean up the old ad_views policy that we replaced
DROP POLICY IF EXISTS "Users can view own ad views" ON public.ad_views;