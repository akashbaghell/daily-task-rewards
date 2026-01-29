-- Fix error 1: Allow users to view their own bank details through masked view
-- The user_bank_details_masked view already uses security_invoker and filters by auth.uid()
-- We need to allow users to SELECT from base table for the view to work

-- First, clean up duplicate policies on user_bank_details
DROP POLICY IF EXISTS "Users can insert their own bank details" ON public.user_bank_details;
DROP POLICY IF EXISTS "Users can update their own bank details" ON public.user_bank_details;

-- Add policy allowing users to view their own bank details (needed for masked view to work)
DROP POLICY IF EXISTS "Users can view own bank details" ON public.user_bank_details;
CREATE POLICY "Users can view own bank details"
ON public.user_bank_details FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- Fix error 2: Allow users to view their own withdrawal requests through masked view
-- Add policy allowing users to view their own withdrawal requests
DROP POLICY IF EXISTS "Users can view own withdrawal requests" ON public.withdrawal_requests;
CREATE POLICY "Users can view own withdrawal requests"
ON public.withdrawal_requests FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- Clean up duplicate policies on user_wallets
DROP POLICY IF EXISTS "Users can view their own wallet" ON public.user_wallets;

-- Remove the conflicting admin-only policy since we now have proper user + admin access
DROP POLICY IF EXISTS "Only admins can view withdrawals directly" ON public.withdrawal_requests;
DROP POLICY IF EXISTS "Only admins can view bank details directly" ON public.user_bank_details;