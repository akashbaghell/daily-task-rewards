-- Create rewards table for shop items
CREATE TABLE public.rewards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL, -- 'badge', 'feature', 'boost'
  coin_price INTEGER NOT NULL DEFAULT 100,
  icon TEXT, -- emoji or icon name
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_rewards table to track purchased rewards
CREATE TABLE public.user_rewards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  reward_id UUID NOT NULL REFERENCES public.rewards(id) ON DELETE CASCADE,
  purchased_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  UNIQUE(user_id, reward_id)
);

-- Enable RLS
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_rewards ENABLE ROW LEVEL SECURITY;

-- RLS policies for rewards
CREATE POLICY "Anyone can view active rewards" 
ON public.rewards 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage rewards" 
ON public.rewards 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for user_rewards
CREATE POLICY "Users can view own rewards" 
ON public.user_rewards 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can purchase rewards" 
ON public.user_rewards 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all user rewards" 
ON public.user_rewards 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert default rewards
INSERT INTO public.rewards (name, description, type, coin_price, icon) VALUES
('🥉 Bronze Badge', 'Show off your beginner status', 'badge', 100, '🥉'),
('🥈 Silver Badge', 'A mark of dedication', 'badge', 500, '🥈'),
('🥇 Gold Badge', 'Elite member badge', 'badge', 1000, '🥇'),
('💎 Diamond Badge', 'Legendary status', 'badge', 5000, '💎'),
('👑 VIP Badge', 'Ultimate prestige', 'badge', 10000, '👑'),
('⚡ 2x Coin Boost', 'Earn double coins for 24 hours', 'boost', 200, '⚡'),
('🎯 Priority Support', 'Get faster support responses', 'feature', 1500, '🎯'),
('🌟 Featured Profile', 'Your profile gets highlighted', 'feature', 2000, '🌟'),
('🎨 Custom Theme', 'Unlock custom profile themes', 'feature', 3000, '🎨');