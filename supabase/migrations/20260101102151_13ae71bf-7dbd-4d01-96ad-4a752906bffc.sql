-- Create storage bucket for user videos
INSERT INTO storage.buckets (id, name, public, file_size_limit) 
VALUES ('videos', 'videos', true, 104857600)
ON CONFLICT (id) DO NOTHING;

-- Create storage bucket for video thumbnails
INSERT INTO storage.buckets (id, name, public, file_size_limit) 
VALUES ('thumbnails', 'thumbnails', true, 5242880)
ON CONFLICT (id) DO NOTHING;

-- Create storage bucket for custom ads
INSERT INTO storage.buckets (id, name, public, file_size_limit) 
VALUES ('ads', 'ads', true, 52428800)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for videos bucket
CREATE POLICY "Anyone can view videos" ON storage.objects FOR SELECT USING (bucket_id = 'videos');
CREATE POLICY "Authenticated users can upload videos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'videos' AND auth.uid() IS NOT NULL);
CREATE POLICY "Users can update their own videos" ON storage.objects FOR UPDATE USING (bucket_id = 'videos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete their own videos" ON storage.objects FOR DELETE USING (bucket_id = 'videos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for thumbnails bucket
CREATE POLICY "Anyone can view thumbnails" ON storage.objects FOR SELECT USING (bucket_id = 'thumbnails');
CREATE POLICY "Authenticated users can upload thumbnails" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'thumbnails' AND auth.uid() IS NOT NULL);
CREATE POLICY "Users can update their own thumbnails" ON storage.objects FOR UPDATE USING (bucket_id = 'thumbnails' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete their own thumbnails" ON storage.objects FOR DELETE USING (bucket_id = 'thumbnails' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for ads bucket (only admins can manage)
CREATE POLICY "Anyone can view ads" ON storage.objects FOR SELECT USING (bucket_id = 'ads');
CREATE POLICY "Admins can upload ads" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'ads' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update ads" ON storage.objects FOR UPDATE USING (bucket_id = 'ads' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete ads" ON storage.objects FOR DELETE USING (bucket_id = 'ads' AND public.has_role(auth.uid(), 'admin'));

-- Update videos table to support user uploads
ALTER TABLE public.videos 
ADD COLUMN IF NOT EXISTS uploader_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS video_url TEXT,
ADD COLUMN IF NOT EXISTS duration INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
ADD COLUMN IF NOT EXISTS total_earnings NUMERIC(10,2) DEFAULT 0;

-- Create ads table for custom ads
CREATE TABLE IF NOT EXISTS public.ads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  ad_type TEXT NOT NULL CHECK (ad_type IN ('image', 'video', 'adsense')),
  media_url TEXT,
  click_url TEXT,
  adsense_slot TEXT,
  duration INTEGER DEFAULT 5,
  earnings_per_view NUMERIC(10,2) DEFAULT 0.50,
  is_active BOOLEAN DEFAULT true,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create ad views tracking table
CREATE TABLE IF NOT EXISTS public.ad_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id UUID REFERENCES public.ads(id) ON DELETE CASCADE,
  video_id UUID REFERENCES public.videos(id) ON DELETE CASCADE,
  viewer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  video_owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  earnings NUMERIC(10,2) DEFAULT 0,
  viewed_at TIMESTAMPTZ DEFAULT now()
);

-- Create creator earnings table
CREATE TABLE IF NOT EXISTS public.creator_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  video_id UUID REFERENCES public.videos(id) ON DELETE SET NULL,
  ad_id UUID REFERENCES public.ads(id) ON DELETE SET NULL,
  amount NUMERIC(10,2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('ad_revenue', 'video_view')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_earnings ENABLE ROW LEVEL SECURITY;

-- RLS policies for ads
CREATE POLICY "Anyone can view active ads" ON public.ads FOR SELECT USING (is_active = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage ads" ON public.ads FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS policies for ad_views
CREATE POLICY "Users can view own ad views" ON public.ad_views FOR SELECT USING (viewer_id = auth.uid() OR video_owner_id = auth.uid());
CREATE POLICY "System can insert ad views" ON public.ad_views FOR INSERT WITH CHECK (viewer_id = auth.uid());

-- RLS policies for creator_earnings
CREATE POLICY "Creators can view own earnings" ON public.creator_earnings FOR SELECT USING (creator_id = auth.uid());
CREATE POLICY "Admins can view all earnings" ON public.creator_earnings FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Update videos RLS to allow user uploads
DROP POLICY IF EXISTS "Admins can manage videos" ON public.videos;
CREATE POLICY "Users can insert own videos" ON public.videos FOR INSERT WITH CHECK (auth.uid() = uploader_id);
CREATE POLICY "Users can update own videos" ON public.videos FOR UPDATE USING (auth.uid() = uploader_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can delete own videos" ON public.videos FOR DELETE USING (auth.uid() = uploader_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage all videos" ON public.videos FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Function to record ad view and distribute earnings
CREATE OR REPLACE FUNCTION public.record_ad_view(
  p_ad_id UUID,
  p_video_id UUID,
  p_viewer_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_video_owner_id UUID;
  v_earnings_per_view NUMERIC(10,2);
  v_creator_share NUMERIC(10,2);
BEGIN
  -- Get video owner
  SELECT uploader_id INTO v_video_owner_id FROM public.videos WHERE id = p_video_id;
  
  IF v_video_owner_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Get ad earnings
  SELECT earnings_per_view INTO v_earnings_per_view FROM public.ads WHERE id = p_ad_id;
  
  -- Creator gets 70% of ad revenue
  v_creator_share := v_earnings_per_view * 0.70;

  -- Record ad view
  INSERT INTO public.ad_views (ad_id, video_id, viewer_id, video_owner_id, earnings)
  VALUES (p_ad_id, p_video_id, p_viewer_id, v_video_owner_id, v_creator_share);

  -- Update ad view count
  UPDATE public.ads SET view_count = view_count + 1 WHERE id = p_ad_id;

  -- Update video total earnings
  UPDATE public.videos SET total_earnings = total_earnings + v_creator_share WHERE id = p_video_id;

  -- Add to creator earnings
  INSERT INTO public.creator_earnings (creator_id, video_id, ad_id, amount, type)
  VALUES (v_video_owner_id, p_video_id, p_ad_id, v_creator_share, 'ad_revenue');

  -- Add to creator wallet
  INSERT INTO public.user_wallets (user_id, balance, total_earned)
  VALUES (v_video_owner_id, v_creator_share, v_creator_share)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    balance = user_wallets.balance + v_creator_share,
    total_earned = user_wallets.total_earned + v_creator_share,
    updated_at = now();

  RETURN TRUE;
END;
$$;