-- Add view_count to videos table
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;

-- Create user_wallets table for earnings tracking
CREATE TABLE public.user_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  balance INTEGER DEFAULT 0 NOT NULL,
  total_earned INTEGER DEFAULT 0 NOT NULL,
  total_withdrawn INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create earnings table to track how users earned money
CREATE TABLE public.earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('video_watch', 'referral')),
  reference_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create withdrawal_requests table
CREATE TABLE public.withdrawal_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount INTEGER NOT NULL CHECK (amount >= 5000),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  bank_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  ifsc_code TEXT NOT NULL,
  account_holder_name TEXT NOT NULL,
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.user_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_wallets
CREATE POLICY "Users can view own wallet" ON public.user_wallets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert wallet" ON public.user_wallets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can update wallet" ON public.user_wallets
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for earnings
CREATE POLICY "Users can view own earnings" ON public.earnings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own earnings" ON public.earnings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for withdrawal_requests
CREATE POLICY "Users can view own withdrawals" ON public.withdrawal_requests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create withdrawal requests" ON public.withdrawal_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admin policies
CREATE POLICY "Admins can view all wallets" ON public.user_wallets
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all earnings" ON public.earnings
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all withdrawals" ON public.withdrawal_requests
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update withdrawals" ON public.withdrawal_requests
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- Function to increment view count and add earnings
CREATE OR REPLACE FUNCTION public.record_video_view(p_video_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  already_watched BOOLEAN;
BEGIN
  -- Check if user already watched this video today
  SELECT EXISTS (
    SELECT 1 FROM public.earnings 
    WHERE user_id = p_user_id 
    AND reference_id = p_video_id 
    AND type = 'video_watch'
    AND created_at > CURRENT_DATE
  ) INTO already_watched;

  IF already_watched THEN
    RETURN FALSE;
  END IF;

  -- Increment video view count
  UPDATE public.videos SET view_count = COALESCE(view_count, 0) + 1 WHERE id = p_video_id;

  -- Add earning record
  INSERT INTO public.earnings (user_id, amount, type, reference_id)
  VALUES (p_user_id, 20, 'video_watch', p_video_id);

  -- Update or create wallet
  INSERT INTO public.user_wallets (user_id, balance, total_earned)
  VALUES (p_user_id, 20, 20)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    balance = user_wallets.balance + 20,
    total_earned = user_wallets.total_earned + 20,
    updated_at = now();

  RETURN TRUE;
END;
$$;

-- Function to add referral bonus (called from handle_new_user trigger)
CREATE OR REPLACE FUNCTION public.add_referral_bonus(p_referrer_id UUID, p_referred_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Add earning record for referrer
  INSERT INTO public.earnings (user_id, amount, type, reference_id)
  VALUES (p_referrer_id, 100, 'referral', p_referred_id);

  -- Update or create wallet for referrer
  INSERT INTO public.user_wallets (user_id, balance, total_earned)
  VALUES (p_referrer_id, 100, 100)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    balance = user_wallets.balance + 100,
    total_earned = user_wallets.total_earned + 100,
    updated_at = now();
END;
$$;

-- Update handle_new_user to add referral bonus
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  referrer_profile_id UUID;
  new_referral_code TEXT;
BEGIN
  -- Generate unique referral code
  LOOP
    new_referral_code := public.generate_referral_code();
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.profiles WHERE referral_code = new_referral_code);
  END LOOP;

  -- Check if user was referred
  IF NEW.raw_user_meta_data->>'referred_by' IS NOT NULL THEN
    SELECT id INTO referrer_profile_id 
    FROM public.profiles 
    WHERE referral_code = NEW.raw_user_meta_data->>'referred_by';
  END IF;

  -- Insert profile
  INSERT INTO public.profiles (id, full_name, referral_code, referred_by, language_preference)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    new_referral_code,
    referrer_profile_id,
    COALESCE(NEW.raw_user_meta_data->>'language', 'en')
  );

  -- Assign default user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');

  -- Create referral record if referred by someone
  IF referrer_profile_id IS NOT NULL THEN
    INSERT INTO public.referrals (referrer_id, referred_id)
    VALUES (referrer_profile_id, NEW.id);
    
    -- Add referral bonus to referrer
    PERFORM public.add_referral_bonus(referrer_profile_id, NEW.id);
  END IF;

  -- Create wallet for new user
  INSERT INTO public.user_wallets (user_id, balance, total_earned)
  VALUES (NEW.id, 0, 0);

  RETURN NEW;
END;
$$;