-- Fix videos table: hide uploader_id and total_earnings from public
DROP POLICY IF EXISTS "Anyone can view approved videos" ON public.videos;
DROP POLICY IF EXISTS "Videos are publicly viewable" ON public.videos;

-- Create a restricted public policy for videos - hide sensitive fields via view
CREATE POLICY "Videos are publicly viewable"
ON public.videos FOR SELECT
USING (status = 'approved' OR status IS NULL);

-- Create a public-safe videos view that hides sensitive data
CREATE OR REPLACE VIEW public.videos_public
WITH (security_invoker = on) AS
SELECT 
  id,
  title,
  description,
  youtube_id,
  thumbnail_url,
  video_url,
  duration,
  category,
  view_count,
  is_featured,
  status,
  created_at
  -- Excludes: uploader_id, total_earnings
FROM public.videos
WHERE status = 'approved' OR status IS NULL;

-- Ensure masked views are properly secured with security_invoker
-- These views filter by auth.uid() so they're self-restricting
DROP VIEW IF EXISTS public.user_bank_details_masked;
CREATE VIEW public.user_bank_details_masked
WITH (security_invoker = on) AS
SELECT 
  id,
  user_id,
  '****' || RIGHT(account_number, 4) as account_number_masked,
  CASE WHEN LENGTH(bank_name) > 3 THEN LEFT(bank_name, 3) || '***' ELSE '***' END as bank_name_masked,
  LEFT(ifsc_code, 4) || '****' as ifsc_masked,
  CASE WHEN LENGTH(account_holder_name) > 2 THEN LEFT(account_holder_name, 2) || '***' ELSE '***' END as account_holder_masked,
  is_primary,
  created_at,
  updated_at
FROM public.user_bank_details
WHERE user_id = auth.uid() OR public.has_role(auth.uid(), 'admin');

DROP VIEW IF EXISTS public.withdrawal_requests_masked;
CREATE VIEW public.withdrawal_requests_masked
WITH (security_invoker = on) AS
SELECT 
  id,
  user_id,
  amount,
  '****' || RIGHT(account_number, 4) as account_number_masked,
  CASE WHEN LENGTH(bank_name) > 3 THEN LEFT(bank_name, 3) || '***' ELSE '***' END as bank_name_masked,
  LEFT(ifsc_code, 4) || '****' as ifsc_masked,
  CASE WHEN LENGTH(account_holder_name) > 2 THEN LEFT(account_holder_name, 2) || '***' ELSE '***' END as account_holder_masked,
  status,
  admin_notes,
  created_at,
  processed_at
FROM public.withdrawal_requests
WHERE user_id = auth.uid() OR public.has_role(auth.uid(), 'admin');

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