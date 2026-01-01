import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/Navbar';
import { VideoCard } from '@/components/VideoCard';
import { WalletCard } from '@/components/WalletCard';
import { WithdrawalDialog } from '@/components/WithdrawalDialog';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Video, Users, Copy, ExternalLink, Wallet } from 'lucide-react';

interface VideoType {
  id: string;
  title: string;
  youtube_id: string;
  thumbnail_url: string | null;
  category: string;
}

interface WalletData {
  balance: number;
  total_earned: number;
  total_withdrawn: number;
}

const Dashboard = () => {
  const { t } = useLanguage();
  const { user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [videos, setVideos] = useState<VideoType[]>([]);
  const [watchCount, setWatchCount] = useState(0);
  const [referralCount, setReferralCount] = useState(0);
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      // Fetch recent videos
      const { data: videosData } = await supabase
        .from('videos')
        .select('*')
        .limit(4);

      if (videosData) setVideos(videosData);

      // Fetch watch count
      const { count: watchCountData } = await supabase
        .from('watch_history')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      setWatchCount(watchCountData || 0);

      // Fetch referral count
      const { count: referralCountData } = await supabase
        .from('referrals')
        .select('*', { count: 'exact', head: true })
        .eq('referrer_id', user.id);

      setReferralCount(referralCountData || 0);

      // Fetch wallet
      const { data: walletData } = await supabase
        .from('user_wallets')
        .select('balance, total_earned, total_withdrawn')
        .eq('user_id', user.id)
        .maybeSingle();

      if (walletData) {
        setWallet(walletData);
      } else {
        setWallet({ balance: 0, total_earned: 0, total_withdrawn: 0 });
      }

      setLoading(false);
    };

    if (user) {
      fetchData();
    }
  }, [user]);

  const referralLink = profile?.referral_code
    ? `${window.location.origin}/auth?mode=signup&ref=${profile.referral_code}`
    : '';

  const copyReferralLink = () => {
    navigator.clipboard.writeText(referralLink);
    toast.success(t('dashboard.linkCopied'));
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-48 bg-muted rounded" />
            <div className="grid gap-6 md:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-muted rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold mb-2">
            {t('dashboard.welcome')}, {profile?.full_name || 'User'}! 👋
          </h1>
          <p className="text-muted-foreground">
            Here's what's happening with your account today.
          </p>
        </div>

        {/* Wallet Card */}
        <div className="mb-10">
          <WalletCard onWithdrawClick={() => setWithdrawDialogOpen(true)} />
        </div>

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-3 mb-10">
          <Card className="animate-fade-in">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t('dashboard.videosWatched')}
              </CardTitle>
              <Video className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{watchCount}</div>
              <p className="text-xs text-green-500 mt-1">₹{watchCount * 20} earned</p>
            </CardContent>
          </Card>

          <Card className="animate-fade-in" style={{ animationDelay: '100ms' }}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t('dashboard.totalReferrals')}
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{referralCount}</div>
              <p className="text-xs text-green-500 mt-1">₹{referralCount * 100} earned</p>
            </CardContent>
          </Card>

          <Card className="animate-fade-in" style={{ animationDelay: '200ms' }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t('dashboard.yourReferralLink')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <code className="text-xs bg-muted px-2 py-1 rounded block truncate">
                {profile?.referral_code || '...'}
              </code>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={copyReferralLink} className="flex-1">
                  <Copy className="h-3 w-3 mr-1" />
                  {t('dashboard.copyLink')}
                </Button>
                <Button size="sm" variant="outline" onClick={() => navigate('/referrals')}>
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Videos */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-xl font-bold">
              {t('dashboard.recentVideos')}
            </h2>
            <Button variant="ghost" size="sm" onClick={() => navigate('/videos')}>
              {t('home.viewAll')}
            </Button>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {videos.map((video) => (
              <VideoCard
                key={video.id}
                id={video.id}
                title={video.title}
                youtubeId={video.youtube_id}
                thumbnailUrl={video.thumbnail_url}
                category={video.category}
              />
            ))}
          </div>
        </div>
      </main>

      <WithdrawalDialog
        open={withdrawDialogOpen}
        onOpenChange={setWithdrawDialogOpen}
        maxAmount={wallet?.balance || 0}
      />
    </div>
  );
};

export default Dashboard;