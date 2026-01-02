-- Create daily_tasks table to store available tasks
CREATE TABLE public.daily_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  reward_amount NUMERIC NOT NULL DEFAULT 5,
  task_type TEXT NOT NULL DEFAULT 'watch_video', -- watch_video, share_video, login, etc.
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_daily_tasks to track user's daily task completions
CREATE TABLE public.user_daily_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  task_id UUID NOT NULL REFERENCES public.daily_tasks(id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reward_claimed BOOLEAN DEFAULT false,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  UNIQUE(user_id, task_id, date)
);

-- Enable RLS
ALTER TABLE public.daily_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_daily_tasks ENABLE ROW LEVEL SECURITY;

-- RLS policies for daily_tasks (everyone can read active tasks)
CREATE POLICY "Anyone can view active tasks" 
ON public.daily_tasks 
FOR SELECT 
USING (is_active = true);

-- RLS policies for user_daily_tasks
CREATE POLICY "Users can view their own task completions" 
ON public.user_daily_tasks 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own task completions" 
ON public.user_daily_tasks 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own task completions" 
ON public.user_daily_tasks 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Insert some default daily tasks
INSERT INTO public.daily_tasks (title, description, reward_amount, task_type) VALUES
('Watch 1 Video', 'Watch any video to complete this task', 10, 'watch_video'),
('Watch 3 Videos', 'Watch 3 videos today', 25, 'watch_3_videos'),
('Share a Video', 'Share any video with friends', 15, 'share_video'),
('Daily Login', 'Login to the app daily', 5, 'daily_login'),
('Refer a Friend', 'Invite a friend to join', 50, 'referral');