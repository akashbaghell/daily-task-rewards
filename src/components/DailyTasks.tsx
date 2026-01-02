import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { CheckCircle2, Circle, Gift, Sparkles } from 'lucide-react';

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

export const DailyTasks = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [completions, setCompletions] = useState<UserTaskCompletion[]>([]);
  const [loading, setLoading] = useState(true);
  const [watchCount, setWatchCount] = useState(0);
  const [referralCount, setReferralCount] = useState(0);

  useEffect(() => {
    if (user) {
      fetchTasks();
      fetchUserProgress();
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

      // Add to earnings
      const { error: earningsError } = await supabase
        .from('earnings')
        .insert({
          user_id: user.id,
          amount: task.reward_amount,
          type: 'daily_task',
          reference_id: task.id,
        });

      if (earningsError) throw earningsError;

      // Update wallet
      const { data: wallet } = await supabase
        .from('user_wallets')
        .select('balance, total_earned')
        .eq('user_id', user.id)
        .maybeSingle();

      if (wallet) {
        await supabase
          .from('user_wallets')
          .update({
            balance: wallet.balance + task.reward_amount,
            total_earned: wallet.total_earned + task.reward_amount,
          })
          .eq('user_id', user.id);
      }

      toast.success(`₹${task.reward_amount} claimed successfully!`);
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
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Gift className="h-4 w-4" />
            <span>Up to ₹{totalReward}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{completedCount}/{tasks.length} completed</span>
          <Progress value={(completedCount / tasks.length) * 100} className="flex-1 h-1.5" />
        </div>
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
                <span className="text-sm font-semibold text-primary">
                  ₹{task.reward_amount}
                </span>
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
