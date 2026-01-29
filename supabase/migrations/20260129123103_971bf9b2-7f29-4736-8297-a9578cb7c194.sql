-- Remove conflicting policies on withdrawal_requests
DROP POLICY IF EXISTS "Users can view their own masked withdrawal requests" ON public.withdrawal_requests;
DROP POLICY IF EXISTS "No direct select on withdrawal_requests" ON public.withdrawal_requests;

-- Ensure only admins can SELECT from withdrawal_requests directly
DROP POLICY IF EXISTS "Only admins can view withdrawals directly" ON public.withdrawal_requests;
CREATE POLICY "Only admins can view withdrawals directly"
ON public.withdrawal_requests FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Remove the overly permissive videos policy
DROP POLICY IF EXISTS "Anyone can view videos" ON public.videos;
DROP POLICY IF EXISTS "Videos are publicly viewable" ON public.videos;

-- Videos should be publicly viewable for approved content only
CREATE POLICY "Approved videos are publicly viewable"
ON public.videos FOR SELECT
USING (status = 'approved' OR status IS NULL OR uploader_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- For profiles table, ensure RLS properly restricts access
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));