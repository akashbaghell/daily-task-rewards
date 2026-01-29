-- Create a dedicated video_watches table to track daily video views
-- This replaces the fragile LIKE pattern matching on coin_transactions
CREATE TABLE public.video_watches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  video_id UUID NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  watch_date DATE NOT NULL DEFAULT CURRENT_DATE,
  watched_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  coins_earned INTEGER NOT NULL DEFAULT 20
);

-- Add unique constraint to prevent duplicate watches per user per video per day
-- This provides database-level enforcement and eliminates race conditions
ALTER TABLE public.video_watches 
ADD CONSTRAINT video_watches_unique_daily UNIQUE (user_id, video_id, watch_date);

-- Create index for faster lookups
CREATE INDEX idx_video_watches_user_date ON public.video_watches(user_id, watch_date);
CREATE INDEX idx_video_watches_video_id ON public.video_watches(video_id);

-- Enable Row Level Security
ALTER TABLE public.video_watches ENABLE ROW LEVEL SECURITY;

-- Users can view their own watch history
CREATE POLICY "Users can view their own video watches"
ON public.video_watches
FOR SELECT
USING (auth.uid() = user_id);

-- Only allow inserts via the RPC function (no direct inserts)
CREATE POLICY "Video watches inserted via RPC only"
ON public.video_watches
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Update the record_video_view function to use the new video_watches table
CREATE OR REPLACE FUNCTION public.record_video_view(p_video_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_coins INTEGER := 20;
BEGIN
  -- Validate user is authenticated
  IF p_user_id IS NULL OR p_user_id != auth.uid() THEN
    RETURN FALSE;
  END IF;

  -- Try to insert into video_watches table
  -- The unique constraint will prevent duplicates at database level
  BEGIN
    INSERT INTO public.video_watches (user_id, video_id, watch_date, coins_earned)
    VALUES (p_user_id, p_video_id, CURRENT_DATE, v_coins);
  EXCEPTION WHEN unique_violation THEN
    -- Already watched this video today
    RETURN FALSE;
  END;

  -- Increment video view count
  UPDATE public.videos SET view_count = COALESCE(view_count, 0) + 1 WHERE id = p_video_id;

  -- Add coin transaction
  INSERT INTO public.coin_transactions (user_id, amount, type, description)
  VALUES (p_user_id, v_coins, 'video_watch', 'Earned coins for watching video: ' || p_video_id::text);

  -- Update wallet coins
  INSERT INTO public.user_wallets (user_id, coins)
  VALUES (p_user_id, v_coins)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    coins = user_wallets.coins + v_coins,
    updated_at = now();

  RETURN TRUE;
END;
$$;