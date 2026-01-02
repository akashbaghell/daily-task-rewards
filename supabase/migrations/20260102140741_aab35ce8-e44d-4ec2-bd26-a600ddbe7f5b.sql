-- Add coins column to user_wallets
ALTER TABLE public.user_wallets 
ADD COLUMN coins INTEGER NOT NULL DEFAULT 0;

-- Create coin_transactions table to track coin activity
CREATE TABLE public.coin_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  amount INTEGER NOT NULL,
  type TEXT NOT NULL, -- 'earned', 'spent', 'converted'
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.coin_transactions ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own transactions" 
ON public.coin_transactions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions" 
ON public.coin_transactions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all transactions" 
ON public.coin_transactions 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));