-- Create referral_task_completions table to track detailed task completions by referred users
CREATE TABLE public.referral_task_completions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID NOT NULL,
  referred_id UUID NOT NULL,
  task_id UUID NOT NULL,
  task_title TEXT NOT NULL,
  coins_earned INTEGER NOT NULL DEFAULT 5,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.referral_task_completions ENABLE ROW LEVEL SECURITY;

-- Referrers can view their own referral task completions
CREATE POLICY "Referrers can view own referral task completions"
ON public.referral_task_completions
FOR SELECT
USING (referrer_id = auth.uid());

-- System can insert (via trigger)
CREATE POLICY "System can insert referral task completions"
ON public.referral_task_completions
FOR INSERT
WITH CHECK (true);

-- Create referral_milestones table to track milestone achievements
CREATE TABLE public.referral_milestones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID NOT NULL,
  referred_id UUID NOT NULL,
  milestone INTEGER NOT NULL, -- 10, 25, 50
  bonus_coins INTEGER NOT NULL,
  achieved_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(referrer_id, referred_id, milestone)
);

-- Enable RLS
ALTER TABLE public.referral_milestones ENABLE ROW LEVEL SECURITY;

-- Referrers can view their own milestones
CREATE POLICY "Referrers can view own milestones"
ON public.referral_milestones
FOR SELECT
USING (referrer_id = auth.uid());

-- System can insert milestones
CREATE POLICY "System can insert milestones"
ON public.referral_milestones
FOR INSERT
WITH CHECK (true);

-- Update the add_referrer_task_bonus function to track details and check milestones
CREATE OR REPLACE FUNCTION public.add_referrer_task_bonus()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referrer_id UUID;
  v_bonus_coins INTEGER := 5;
  v_task_title TEXT;
  v_task_count INTEGER;
  v_milestone_bonus INTEGER;
BEGIN
  -- Find if the user was referred by someone
  SELECT referrer_id INTO v_referrer_id 
  FROM public.referrals 
  WHERE referred_id = NEW.user_id;

  -- If user was referred, give bonus coins to referrer
  IF v_referrer_id IS NOT NULL THEN
    -- Get task title
    SELECT title INTO v_task_title FROM public.daily_tasks WHERE id = NEW.task_id;
    
    -- Record the task completion details
    INSERT INTO public.referral_task_completions (referrer_id, referred_id, task_id, task_title, coins_earned)
    VALUES (v_referrer_id, NEW.user_id, NEW.task_id, COALESCE(v_task_title, 'Task'), v_bonus_coins);

    -- Add coin transaction for referrer
    INSERT INTO public.coin_transactions (user_id, amount, type, description)
    VALUES (v_referrer_id, v_bonus_coins, 'referral_bonus', 'Bonus: Your referral completed a task');

    -- Update referrer's wallet coins
    UPDATE public.user_wallets 
    SET coins = coins + v_bonus_coins, updated_at = now()
    WHERE user_id = v_referrer_id;

    -- Count total tasks completed by this referred user
    SELECT COUNT(*) INTO v_task_count 
    FROM public.referral_task_completions 
    WHERE referrer_id = v_referrer_id AND referred_id = NEW.user_id;

    -- Check for milestone bonuses (10, 25, 50 tasks)
    IF v_task_count IN (10, 25, 50) THEN
      -- Determine bonus amount based on milestone
      CASE v_task_count
        WHEN 10 THEN v_milestone_bonus := 50;
        WHEN 25 THEN v_milestone_bonus := 150;
        WHEN 50 THEN v_milestone_bonus := 500;
        ELSE v_milestone_bonus := 0;
      END CASE;

      -- Record milestone achievement (ignore if already exists)
      INSERT INTO public.referral_milestones (referrer_id, referred_id, milestone, bonus_coins)
      VALUES (v_referrer_id, NEW.user_id, v_task_count, v_milestone_bonus)
      ON CONFLICT (referrer_id, referred_id, milestone) DO NOTHING;

      -- Add milestone bonus coins
      INSERT INTO public.coin_transactions (user_id, amount, type, description)
      VALUES (v_referrer_id, v_milestone_bonus, 'milestone_bonus', 'Milestone: Referral completed ' || v_task_count || ' tasks!');

      UPDATE public.user_wallets 
      SET coins = coins + v_milestone_bonus, updated_at = now()
      WHERE user_id = v_referrer_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;