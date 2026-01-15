-- Clean up duplicate/conflicting RLS policies on profiles
DROP POLICY IF EXISTS "Users can view referrer profile" ON public.profiles;

-- Clean up duplicate policies on withdrawal_requests  
DROP POLICY IF EXISTS "Users can view own withdrawals" ON public.withdrawal_requests;
DROP POLICY IF EXISTS "Users can create own withdrawals" ON public.withdrawal_requests;
DROP POLICY IF EXISTS "Users can create withdrawal requests" ON public.withdrawal_requests;
DROP POLICY IF EXISTS "Admins can view all withdrawals" ON public.withdrawal_requests;
DROP POLICY IF EXISTS "Admins can update withdrawals" ON public.withdrawal_requests;
DROP POLICY IF EXISTS "Only admins can update withdrawals" ON public.withdrawal_requests;