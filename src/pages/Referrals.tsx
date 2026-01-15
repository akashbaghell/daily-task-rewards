import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/Navbar';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Users, Copy, Share2, UserPlus, Coins, Trophy, Target, ChevronDown, ChevronUp } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';

interface Referral {
  id: string;
  created_at: string;
  referred_id: string;
  referred: {
    full_name: string | null;
  };
}

interface TaskCompletion {
  id: string;
  referred_id: string;
  task_title: string;
  coins_earned: number;
  created_at: string;
}

interface Milestone {
  id: string;
  referred_id: string;
  milestone: number;
  bonus_coins: number;
  achieved_at: string;
}

interface ReferralDetails {
  referral: Referral;
  taskCompletions: TaskCompletion[];
  milestones: Milestone[];
  totalCoins: number;
  taskCount: number;
}

const MILESTONE_TARGETS = [
  { target: 10, bonus: 50, label: '10 Tasks' },
  { target: 25, bonus: 150, label: '25 Tasks' },
  { target: 50, bonus: 500, label: '50 Tasks' },
];

const Referrals = () => {
  const { t } = useLanguage();
  const { user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [taskCompletions, setTaskCompletions] = useState<TaskCompletion[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedReferral, setExpandedReferral] = useState<string | null>(null);

  // Show promotional content for non-logged-in users instead of redirecting

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      const [referralsRes, taskCompletionsRes, milestonesRes] = await Promise.all([
        supabase
          .from('referrals')
          .select(`
            id,
            created_at,
            referred_id,
            referred:referred_id (full_name)
          `)
          .eq('referrer_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('referral_task_completions')
          .select('*')
          .eq('referrer_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('referral_milestones')
          .select('*')
          .eq('referrer_id', user.id)
          .order('achieved_at', { ascending: false }),
      ]);

      if (referralsRes.data) {
        const formattedData = referralsRes.data.map((item: any) => ({
          id: item.id,
          created_at: item.created_at,
          referred_id: item.referred_id,
          referred: {
            full_name: item.referred?.full_name || 'Unknown User',
          },
        }));
        setReferrals(formattedData);
      }

      if (taskCompletionsRes.data) {
        setTaskCompletions(taskCompletionsRes.data);
      }

      if (milestonesRes.data) {
        setMilestones(milestonesRes.data);
      }

      setLoading(false);
    };

    if (user) {
      fetchData();
    }
  }, [user]);

  const getReferralDetails = (referral: Referral): ReferralDetails => {
    const completions = taskCompletions.filter(tc => tc.referred_id === referral.referred_id);
    const referralMilestones = milestones.filter(m => m.referred_id === referral.referred_id);
    const taskCoins = completions.reduce((sum, tc) => sum + tc.coins_earned, 0);
    const milestoneCoins = referralMilestones.reduce((sum, m) => sum + m.bonus_coins, 0);
    
    return {
      referral,
      taskCompletions: completions,
      milestones: referralMilestones,
      totalCoins: taskCoins + milestoneCoins,
      taskCount: completions.length,
    };
  };

  const getTotalEarnings = () => {
    const signupBonus = referrals.length * 50; // ₹50 per referral
    const taskCoins = taskCompletions.reduce((sum, tc) => sum + tc.coins_earned, 0);
    const milestoneCoins = milestones.reduce((sum, m) => sum + m.bonus_coins, 0);
    return { signupBonus, taskCoins, milestoneCoins, totalCoins: taskCoins + milestoneCoins };
  };

  const referralLink = profile?.referral_code
    ? `${window.location.origin}/auth?mode=signup&ref=${profile.referral_code}`
    : '';

  const copyReferralLink = () => {
    navigator.clipboard.writeText(referralLink);
    toast.success(t('dashboard.linkCopied'));
  };

  const shareOnWhatsApp = () => {
    const message = encodeURIComponent(
      `Join VidShare and start watching amazing videos! Use my referral code: ${profile?.referral_code}\n\n${referralLink}`
    );
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  const getNextMilestone = (taskCount: number) => {
    return MILESTONE_TARGETS.find(m => taskCount < m.target);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-48 bg-muted rounded" />
            <div className="h-48 bg-muted rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  // Show promotional content for non-logged-in users
  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <h1 className="font-display text-3xl font-bold mb-8">{t('referrals.title')}</h1>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Earn by Watching Videos */}
            <Card className="animate-fade-in border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                  <Coins className="h-6 w-6" />
                  Videos देखकर कमाएं
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-4xl font-bold text-primary">₹5-10</div>
                <p className="text-muted-foreground">हर वीडियो देखने पर</p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    रोज़ाना unlimited videos देखें
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    तुरंत पैसे wallet में जमा
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    Entertainment + Earning
                  </li>
                </ul>
                <Button className="w-full" onClick={() => navigate('/videos')}>
                  Videos देखना शुरू करें
                </Button>
              </CardContent>
            </Card>

            {/* Earn by Referring */}
            <Card className="animate-fade-in border-2 border-yellow-500/20 bg-gradient-to-br from-yellow-500/5 to-transparent" style={{ animationDelay: '0.1s' }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
                  <Users className="h-6 w-6" />
                  Refer करके कमाएं
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-4xl font-bold text-yellow-600 dark:text-yellow-400">₹50</div>
                <p className="text-muted-foreground">हर referral पर bonus</p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-yellow-500" />
                    दोस्तों को invite करें
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-yellow-500" />
                    उनके हर task पर 5 coins
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-yellow-500" />
                    Milestone bonuses तक ₹500
                  </li>
                </ul>
                <Button variant="outline" className="w-full border-yellow-500/50 text-yellow-600 hover:bg-yellow-500/10" onClick={() => navigate('/auth?mode=signup')}>
                  अभी Register करें
                </Button>
              </CardContent>
            </Card>

            {/* Daily Tasks */}
            <Card className="animate-fade-in border-2 border-green-500/20 bg-gradient-to-br from-green-500/5 to-transparent" style={{ animationDelay: '0.2s' }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-600 dark:text-green-400">
                  <Trophy className="h-6 w-6" />
                  Daily Tasks पूरे करें
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-4xl font-bold text-green-600 dark:text-green-400">₹100+</div>
                <p className="text-muted-foreground">रोज़ाना कमाने का मौका</p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    आसान daily tasks
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    Streak bonus rewards
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    Bank में direct withdrawal
                  </li>
                </ul>
                <Button variant="outline" className="w-full border-green-500/50 text-green-600 hover:bg-green-500/10" onClick={() => navigate('/auth?mode=signup')}>
                  Free में Join करें
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* CTA Section */}
          <Card className="mt-8 bg-gradient-to-r from-primary/10 via-yellow-500/10 to-green-500/10 border-2 border-primary/20">
            <CardContent className="py-8 text-center">
              <h2 className="text-2xl font-bold mb-2">आज ही शुरू करें! 🚀</h2>
              <p className="text-muted-foreground mb-6">
                Free registration, No investment, Real money withdrawal
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" onClick={() => navigate('/auth?mode=signup')}>
                  <UserPlus className="mr-2 h-5 w-5" />
                  अभी Register करें
                </Button>
                <Button size="lg" variant="outline" onClick={() => navigate('/auth?mode=login')}>
                  Login करें
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-48 bg-muted rounded" />
            <div className="h-48 bg-muted rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  const earnings = getTotalEarnings();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <h1 className="font-display text-3xl font-bold mb-8">{t('referrals.title')}</h1>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Referral Stats & Share */}
          <Card className="lg:col-span-1 animate-fade-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {t('referrals.inviteFriends')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                <p className="text-sm font-medium text-green-600 dark:text-green-400">
                  💰 1 Referral = ₹50 Bonus!
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  + 5 coins per task they complete
                </p>
              </div>

              {/* Earnings Summary */}
              <div className="space-y-3 p-3 bg-muted/50 rounded-lg">
                <p className="text-sm font-medium">Your Earnings</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">Signup Bonuses</p>
                    <p className="font-bold text-green-600">₹{earnings.signupBonus}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Task Coins</p>
                    <p className="font-bold text-yellow-600">{earnings.taskCoins} 🪙</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Milestone Coins</p>
                    <p className="font-bold text-purple-600">{earnings.milestoneCoins} 🪙</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Total Coins</p>
                    <p className="font-bold text-primary">{earnings.totalCoins} 🪙</p>
                  </div>
                </div>
              </div>

              {/* Milestone Rewards Info */}
              <div className="space-y-2">
                <p className="text-sm font-medium flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-yellow-500" />
                  Milestone Bonuses
                </p>
                <div className="space-y-1 text-xs">
                  {MILESTONE_TARGETS.map(m => (
                    <div key={m.target} className="flex justify-between text-muted-foreground">
                      <span>{m.label}</span>
                      <span className="text-yellow-600 font-medium">+{m.bonus} 🪙</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">{t('referrals.yourCode')}</p>
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <code className="flex-1 font-mono text-lg font-bold tracking-widest">
                    {profile?.referral_code}
                  </code>
                  <Button size="icon" variant="ghost" onClick={copyReferralLink}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">{t('referrals.peopleJoined')}</p>
                <p className="text-4xl font-bold">{referrals.length}</p>
              </div>

              <div className="space-y-2">
                <Button onClick={copyReferralLink} className="w-full">
                  <Copy className="h-4 w-4 mr-2" />
                  {t('dashboard.copyLink')}
                </Button>
                <Button onClick={shareOnWhatsApp} variant="outline" className="w-full">
                  <Share2 className="h-4 w-4 mr-2" />
                  {t('referrals.shareWhatsApp')}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Referrals List with Details */}
          <Card className="lg:col-span-2 animate-fade-in" style={{ animationDelay: '100ms' }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                {t('referrals.peopleJoined')} ({referrals.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="referrals" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="referrals">My Referrals</TabsTrigger>
                  <TabsTrigger value="activity">Recent Activity</TabsTrigger>
                </TabsList>

                <TabsContent value="referrals">
                  {referrals.length === 0 ? (
                    <div className="text-center py-12">
                      <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">{t('referrals.noReferrals')}</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {referrals.map((referral) => {
                        const details = getReferralDetails(referral);
                        const isExpanded = expandedReferral === referral.id;
                        const nextMilestone = getNextMilestone(details.taskCount);

                        return (
                          <div key={referral.id} className="bg-muted/50 rounded-lg overflow-hidden">
                            <div
                              className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/70 transition-colors"
                              onClick={() => setExpandedReferral(isExpanded ? null : referral.id)}
                            >
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                  <span className="text-sm font-semibold text-primary">
                                    {referral.referred.full_name?.charAt(0)?.toUpperCase() || 'U'}
                                  </span>
                                </div>
                                <div>
                                  <p className="font-medium">{referral.referred.full_name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    Joined {new Date(referral.created_at).toLocaleDateString()} • {details.taskCount} tasks
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="text-right">
                                  <span className="text-green-600 dark:text-green-400 font-semibold block">
                                    +₹50
                                  </span>
                                  {details.totalCoins > 0 && (
                                    <span className="text-yellow-600 text-sm">
                                      +{details.totalCoins} 🪙
                                    </span>
                                  )}
                                </div>
                                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                              </div>
                            </div>

                            {isExpanded && (
                              <div className="px-4 pb-4 space-y-4 border-t border-border/50">
                                {/* Milestone Progress */}
                                {nextMilestone && (
                                  <div className="pt-3">
                                    <div className="flex items-center justify-between text-sm mb-2">
                                      <span className="flex items-center gap-1">
                                        <Target className="h-4 w-4 text-purple-500" />
                                        Next: {nextMilestone.label}
                                      </span>
                                      <span className="text-muted-foreground">
                                        {details.taskCount}/{nextMilestone.target}
                                      </span>
                                    </div>
                                    <Progress 
                                      value={(details.taskCount / nextMilestone.target) * 100} 
                                      className="h-2"
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">
                                      Reward: +{nextMilestone.bonus} 🪙
                                    </p>
                                  </div>
                                )}

                                {/* Achieved Milestones */}
                                {details.milestones.length > 0 && (
                                  <div>
                                    <p className="text-sm font-medium flex items-center gap-1 mb-2">
                                      <Trophy className="h-4 w-4 text-yellow-500" />
                                      Milestones Achieved
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                      {details.milestones.map(m => (
                                        <span
                                          key={m.id}
                                          className="px-2 py-1 bg-yellow-500/10 text-yellow-600 rounded-full text-xs font-medium"
                                        >
                                          {m.milestone} Tasks (+{m.bonus_coins} 🪙)
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Recent Task Completions */}
                                <div>
                                  <p className="text-sm font-medium flex items-center gap-1 mb-2">
                                    <Coins className="h-4 w-4 text-yellow-500" />
                                    Task Completions ({details.taskCompletions.length})
                                  </p>
                                  {details.taskCompletions.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">No tasks completed yet</p>
                                  ) : (
                                    <div className="space-y-1 max-h-40 overflow-y-auto">
                                      {details.taskCompletions.slice(0, 10).map(tc => (
                                        <div
                                          key={tc.id}
                                          className="flex items-center justify-between text-sm py-1"
                                        >
                                          <span className="text-muted-foreground">{tc.task_title}</span>
                                          <span className="text-yellow-600">+{tc.coins_earned} 🪙</span>
                                        </div>
                                      ))}
                                      {details.taskCompletions.length > 10 && (
                                        <p className="text-xs text-muted-foreground">
                                          ...and {details.taskCompletions.length - 10} more
                                        </p>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="activity">
                  {taskCompletions.length === 0 && milestones.length === 0 ? (
                    <div className="text-center py-12">
                      <Coins className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No activity yet</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {/* Combine and sort activity */}
                      {[
                        ...taskCompletions.map(tc => ({
                          type: 'task' as const,
                          date: new Date(tc.created_at),
                          data: tc,
                        })),
                        ...milestones.map(m => ({
                          type: 'milestone' as const,
                          date: new Date(m.achieved_at),
                          data: m,
                        })),
                      ]
                        .sort((a, b) => b.date.getTime() - a.date.getTime())
                        .slice(0, 50)
                        .map((item, idx) => {
                          const referral = referrals.find(
                            r => r.referred_id === (item.data as any).referred_id
                          );
                          const userName = referral?.referred.full_name || 'Someone';

                          if (item.type === 'task') {
                            const tc = item.data as TaskCompletion;
                            return (
                              <div
                                key={`task-${tc.id}`}
                                className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="h-8 w-8 rounded-full bg-yellow-500/10 flex items-center justify-center">
                                    <Coins className="h-4 w-4 text-yellow-500" />
                                  </div>
                                  <div>
                                    <p className="text-sm">
                                      <span className="font-medium">{userName}</span> completed{' '}
                                      <span className="text-muted-foreground">{tc.task_title}</span>
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {item.date.toLocaleDateString()}
                                    </p>
                                  </div>
                                </div>
                                <span className="text-yellow-600 font-medium">+{tc.coins_earned} 🪙</span>
                              </div>
                            );
                          } else {
                            const m = item.data as Milestone;
                            return (
                              <div
                                key={`milestone-${m.id}`}
                                className="flex items-center justify-between p-3 bg-purple-500/10 rounded-lg border border-purple-500/20"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="h-8 w-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                                    <Trophy className="h-4 w-4 text-purple-500" />
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium">
                                      🎉 Milestone! {userName} completed {m.milestone} tasks
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {item.date.toLocaleDateString()}
                                    </p>
                                  </div>
                                </div>
                                <span className="text-purple-600 font-bold">+{m.bonus_coins} 🪙</span>
                              </div>
                            );
                          }
                        })}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Referrals;
