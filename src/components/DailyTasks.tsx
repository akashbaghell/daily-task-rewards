import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { CheckCircle2, Circle, Gift, Sparkles, Flame, Coins } from 'lucide-react';
import { triggerCoinShower } from '@/lib/confetti';
import { playCoinSound, playStreakSound } from '@/lib/sounds';

interface DailyTask {
  id: string;
  title: string;
  description: string | null;
  reward_amount: number;
  task_type: string;
}

interface UserTaskCompletion {
  task_id: string;
  reward_claimed: boolean;
}

interface UserStreak {
  current_streak: number;
  longest_streak: number;
  last_login_date: string | null;
}

export const DailyTasks = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [completions, setCompletions] = useState<UserTaskCompletion[]>([]);
  const [loading, setLoading] = useState(true);
  const [watchCount, setWatchCount] = useState(0);
  const [referralCount, setReferralCount] = useState(0);
  const [streak, setStreak] = useState<UserStreak>({ current_streak: 0, longest_streak: 0, last_login_date: null });

  useEffect(() => {
    if (user) {
      fetchTasks();
      fetchUserProgress();
      updateStreak();
    }
  }, [user]);

  const fetchTasks = async () => {
    const { data } = await supabase
      .from('daily_tasks')
      .select('*')
      .eq('is_active', true);
    
    if (data) setTasks(data);
    setLoading(false);
  };

  const fetchUserProgress = async () => {
    if (!user) return;

    // Fetch today's completions
    const today = new Date().toISOString().split('T')[0];
    const { data: completionData } = await supabase
      .from('user_daily_tasks')
      .select('task_id, reward_claimed')
      .eq('user_id', user.id)
      .eq('date', today);

    if (completionData) setCompletions(completionData);

    // Fetch today's watch count
    const { count: watchData } = await supabase
      .from('watch_history')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('watched_at', `${today}T00:00:00`);

    setWatchCount(watchData || 0);

    // Fetch total referral count
    const { count: refData } = await supabase
      .from('referrals')
      .select('*', { count: 'exact', head: true })
      .eq('referrer_id', user.id);

    setReferralCount(refData || 0);
  };

  const updateStreak = async () => {
    if (!user) return;

    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    // Fetch current streak data
    const { data: streakData } = await supabase
      .from('user_streaks')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (streakData) {
      // User has streak record
      if (streakData.last_login_date === today) {
        // Already logged in today
        setStreak({
          current_streak: streakData.current_streak,
          longest_streak: streakData.longest_streak,
          last_login_date: streakData.last_login_date,
        });
      } else if (streakData.last_login_date === yesterday) {
        // Consecutive login - increment streak
        const newStreak = streakData.current_streak + 1;
        const longestStreak = Math.max(newStreak, streakData.longest_streak);
        
        await supabase
          .from('user_streaks')
          .update({
            current_streak: newStreak,
            longest_streak: longestStreak,
            last_login_date: today,
            streak_updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id);

        setStreak({
          current_streak: newStreak,
          longest_streak: longestStreak,
          last_login_date: today,
        });

        if (newStreak === 7) {
          playStreakSound();
          toast.success('🔥 7-Day Streak! You earned a bonus!');
        } else if (newStreak > 1) {
          toast.success(`🔥 ${newStreak} Day Streak!`);
        }
      } else {
        // Streak broken - reset to 1
        await supabase
          .from('user_streaks')
          .update({
            current_streak: 1,
            last_login_date: today,
            streak_updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id);

        setStreak({
          current_streak: 1,
          longest_streak: streakData.longest_streak,
          last_login_date: today,
        });
      }
    } else {
      // First time - create streak record
      const { error } = await supabase
        .from('user_streaks')
        .insert({
          user_id: user.id,
          current_streak: 1,
          longest_streak: 1,
          last_login_date: today,
        });

      if (!error) {
        setStreak({
          current_streak: 1,
          longest_streak: 1,
          last_login_date: today,
        });
      }
    }
  };

  const isTaskCompleted = (task: DailyTask): boolean => {
    switch (task.task_type) {
      case 'watch_video':
        return watchCount >= 1;
      case 'watch_3_videos':
        return watchCount >= 3;
      case 'daily_login':
        return true; // User is logged in
      case 'referral':
        return referralCount >= 1;
      case 'streak_7':
        return streak.current_streak >= 7;
      default:
        return false;
    }
  };

  const isRewardClaimed = (taskId: string): boolean => {
    return completions.some(c => c.task_id === taskId && c.reward_claimed);
  };

  const getTaskProgress = (task: DailyTask): number => {
    switch (task.task_type) {
      case 'watch_video':
        return Math.min(watchCount / 1 * 100, 100);
      case 'watch_3_videos':
        return Math.min(watchCount / 3 * 100, 100);
      case 'daily_login':
        return 100;
      case 'referral':
        return referralCount >= 1 ? 100 : 0;
      case 'streak_7':
        return Math.min(streak.current_streak / 7 * 100, 100);
      default:
        return 0;
    }
  };

  const claimReward = async (task: DailyTask) => {
    if (!user || !isTaskCompleted(task) || isRewardClaimed(task.id)) return;

    try {
      const today = new Date().toISOString().split('T')[0];

      // Check if already claimed today
      const { data: existing } = await supabase
        .from('user_daily_tasks')
        .select('id')
        .eq('user_id', user.id)
        .eq('task_id', task.id)
        .eq('date', today)
        .maybeSingle();

      if (existing) {
        toast.error('Reward already claimed today!');
        return;
      }

      // Insert completion record
      const { error: insertError } = await supabase
        .from('user_daily_tasks')
        .insert({
          user_id: user.id,
          task_id: task.id,
          reward_claimed: true,
          date: today,
        });

      if (insertError) throw insertError;

      // Record coin transaction
      await supabase.from('coin_transactions').insert({
        user_id: user.id,
        amount: task.reward_amount,
        type: 'earned',
        description: `Completed task: ${task.title}`,
      });

      // Update wallet coins
      const { data: wallet } = await supabase
        .from('user_wallets')
        .select('coins')
        .eq('user_id', user.id)
        .maybeSingle();

      if (wallet) {
        await supabase
          .from('user_wallets')
          .update({
            coins: (wallet.coins || 0) + task.reward_amount,
          })
          .eq('user_id', user.id);
      } else {
        // Create wallet if doesn't exist
        await supabase.from('user_wallets').insert({
          user_id: user.id,
          coins: task.reward_amount,
          balance: 0,
          total_earned: 0,
        });
      }

      triggerCoinShower();
      playCoinSound();
      toast.success(`🪙 ${task.reward_amount} coins claimed!`);
      fetchUserProgress();
    } catch (error) {
      console.error('Error claiming reward:', error);
      toast.error('Failed to claim reward');
    }
  };

  const completedCount = tasks.filter(t => isTaskCompleted(t) && isRewardClaimed(t.id)).length;
  const totalReward = tasks.reduce((sum, t) => sum + Number(t.reward_amount), 0);

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 w-32 bg-muted rounded" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-muted rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-background to-primary/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-primary" />
            Daily Tasks
          </CardTitle>
          <div className="flex items-center gap-3">
            {/* Streak Badge */}
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-orange-500/10 border border-orange-500/30">
              <Flame className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-bold text-orange-500">{streak.current_streak}</span>
              <span className="text-xs text-muted-foreground">day{streak.current_streak !== 1 ? 's' : ''}</span>
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Coins className="h-4 w-4 text-yellow-500" />
              <span className="font-medium text-yellow-600">{totalReward}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{completedCount}/{tasks.length} completed</span>
          <Progress value={tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0} className="flex-1 h-1.5" />
        </div>
        {streak.longest_streak > 1 && (
          <p className="text-xs text-muted-foreground">
            🏆 Best streak: {streak.longest_streak} days
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {tasks.map((task) => {
          const completed = isTaskCompleted(task);
          const claimed = isRewardClaimed(task.id);
          const progress = getTaskProgress(task);

          return (
            <div
              key={task.id}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                claimed
                  ? 'bg-green-500/10 border-green-500/30'
                  : completed
                  ? 'bg-primary/10 border-primary/30'
                  : 'bg-muted/50 border-muted'
              }`}
            >
              <div className="flex-shrink-0">
                {claimed ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : completed ? (
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${claimed ? 'line-through text-muted-foreground' : ''}`}>
                  {task.title}
                </p>
                {!completed && (
                  <Progress value={progress} className="h-1 mt-1" />
                )}
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <Coins className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm font-semibold text-yellow-600">
                    {task.reward_amount}
                  </span>
                </div>
                {completed && !claimed && (
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => claimReward(task)}
                    className="h-7 text-xs"
                  >
                    Claim
                  </Button>
                )}
                {claimed && (
                  <span className="text-xs text-green-500 font-medium">Claimed</span>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
