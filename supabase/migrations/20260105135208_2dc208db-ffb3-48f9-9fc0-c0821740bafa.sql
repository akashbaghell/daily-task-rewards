-- Prevent ANY insert/update/delete on user_roles (only database admins via handle_new_user can add roles)
-- First drop any existing policies that might allow modifications
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "No one can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "No one can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "No one can delete roles" ON public.user_roles;

-- Only allow users to see their OWN roles (not others)
CREATE POLICY "Users can only view their own roles" 
ON public.user_roles 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

-- Block ALL insert operations from client - roles are only assigned via server-side triggers
CREATE POLICY "Block client role inserts" 
ON public.user_roles 
FOR INSERT 
TO authenticated
WITH CHECK (false);

-- Block ALL update operations from client
CREATE POLICY "Block client role updates" 
ON public.user_roles 
FOR UPDATE 
TO authenticated
USING (false)
WITH CHECK (false);

-- Block ALL delete operations from client
CREATE POLICY "Block client role deletes" 
ON public.user_roles 
FOR DELETE 
TO authenticated
USING (false);

-- Add RLS policies for admin-only tables to be extra secure
-- Only admins can see withdrawal requests
DROP POLICY IF EXISTS "Admins can view all withdrawal requests" ON public.withdrawal_requests;
DROP POLICY IF EXISTS "Users can view own withdrawals" ON public.withdrawal_requests;
DROP POLICY IF EXISTS "Users can create own withdrawals" ON public.withdrawal_requests;

CREATE POLICY "Users can view own withdrawals" 
ON public.withdrawal_requests 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can create own withdrawals" 
ON public.withdrawal_requests 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Only admins can update withdrawals" 
ON public.withdrawal_requests 
FOR UPDATE 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Secure videos table - only admins can insert/update/delete
DROP POLICY IF EXISTS "Admins can manage videos" ON public.videos;
DROP POLICY IF EXISTS "Anyone can view videos" ON public.videos;
DROP POLICY IF EXISTS "Users can view videos" ON public.videos;

CREATE POLICY "Anyone can view videos" 
ON public.videos 
FOR SELECT 
USING (true);

CREATE POLICY "Only admins can insert videos" 
ON public.videos 
FOR INSERT 
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update videos" 
ON public.videos 
FOR UPDATE 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete videos" 
ON public.videos 
FOR DELETE 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Secure ads table - only admins
DROP POLICY IF EXISTS "Anyone can view active ads" ON public.ads;
DROP POLICY IF EXISTS "Admins can manage ads" ON public.ads;

CREATE POLICY "Anyone can view active ads" 
ON public.ads 
FOR SELECT 
USING (is_active = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can insert ads" 
ON public.ads 
FOR INSERT 
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update ads" 
ON public.ads 
FOR UPDATE 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete ads" 
ON public.ads 
FOR DELETE 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Secure daily_tasks - only admins can manage
DROP POLICY IF EXISTS "Anyone can view active tasks" ON public.daily_tasks;
DROP POLICY IF EXISTS "Admins can manage tasks" ON public.daily_tasks;

CREATE POLICY "Anyone can view active tasks" 
ON public.daily_tasks 
FOR SELECT 
USING (is_active = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can insert tasks" 
ON public.daily_tasks 
FOR INSERT 
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update tasks" 
ON public.daily_tasks 
FOR UPDATE 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete tasks" 
ON public.daily_tasks 
FOR DELETE 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Secure rewards table - only admins
DROP POLICY IF EXISTS "Anyone can view active rewards" ON public.rewards;
DROP POLICY IF EXISTS "Admins can manage rewards" ON public.rewards;

CREATE POLICY "Anyone can view active rewards" 
ON public.rewards 
FOR SELECT 
USING (is_active = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can insert rewards" 
ON public.rewards 
FOR INSERT 
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update rewards" 
ON public.rewards 
FOR UPDATE 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete rewards" 
ON public.rewards 
FOR DELETE 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));