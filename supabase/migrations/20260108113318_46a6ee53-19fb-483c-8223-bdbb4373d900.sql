-- ==============================================
-- COMPREHENSIVE SECURITY FIX MIGRATION
-- ==============================================

-- 1. FIX: Remove user ability to directly insert earnings (should only be via RPC)
DROP POLICY IF EXISTS "Users can insert own earnings" ON public.earnings;

-- 2. FIX: Remove user ability to directly insert coin transactions  
DROP POLICY IF EXISTS "Users can insert own transactions" ON public.coin_transactions;

-- 3. FIX: Remove user ability to directly update wallets (should only be via RPC)
DROP POLICY IF EXISTS "System can update wallet" ON public.user_wallets;
DROP POLICY IF EXISTS "System can insert wallet" ON public.user_wallets;

-- Create proper wallet policies - only allow system/admin operations
CREATE POLICY "Service role can manage wallets"
ON public.user_wallets
FOR ALL
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'))
WITH CHECK (false); -- Prevents client-side inserts/updates

-- 4. FIX: Remove overly permissive referral milestone policy
DROP POLICY IF EXISTS "System can insert milestones" ON public.referral_milestones;

-- Create restrictive policy - only triggers can insert (using service role)
CREATE POLICY "Only triggers can insert milestones"
ON public.referral_milestones
FOR INSERT
WITH CHECK (false); -- Client cannot insert, only server-side triggers

-- 5. FIX: Remove overly permissive referral task completions policy  
DROP POLICY IF EXISTS "System can insert referral task completions" ON public.referral_task_completions;

-- Create restrictive policy
CREATE POLICY "Only triggers can insert task completions"
ON public.referral_task_completions
FOR INSERT
WITH CHECK (false);

-- 6. FIX: Restrict ad_views insertion to only verified views via RPC
DROP POLICY IF EXISTS "System can insert ad views" ON public.ad_views;

CREATE POLICY "Only RPC can insert ad views"
ON public.ad_views
FOR INSERT
WITH CHECK (false);

-- 7. FIX: Restrict profiles visibility - users can only see own profile by default
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Allow users to view own profile
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- Allow viewing basic info of referrer (for referral system)
CREATE POLICY "Users can view referrer profile"
ON public.profiles
FOR SELECT
USING (
  id IN (
    SELECT referred_by FROM public.profiles WHERE id = auth.uid()
  )
);

-- Admin can view all profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- 8. FIX: Add explicit block on creator_earnings INSERT from clients
CREATE POLICY "Block client inserts on creator_earnings"
ON public.creator_earnings
FOR INSERT
WITH CHECK (false);

-- 9. Ensure videos without owners are protected
UPDATE public.videos 
SET uploader_id = (SELECT user_id FROM public.user_roles WHERE role = 'admin' LIMIT 1)
WHERE uploader_id IS NULL;