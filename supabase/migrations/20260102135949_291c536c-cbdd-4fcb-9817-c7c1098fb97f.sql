-- Create user_streaks table for tracking login streaks
CREATE TABLE public.user_streaks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_login_date DATE,
  streak_updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_streaks
CREATE POLICY "Users can view own streak" 
ON public.user_streaks 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own streak" 
ON public.user_streaks 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own streak" 
ON public.user_streaks 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all streaks" 
ON public.user_streaks 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add admin policies to daily_tasks table for full management
CREATE POLICY "Admins can manage daily tasks" 
ON public.daily_tasks 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add streak bonus task
INSERT INTO public.daily_tasks (title, description, reward_amount, task_type) VALUES
('7-Day Streak Bonus', 'Maintain a 7-day login streak', 100, 'streak_7');