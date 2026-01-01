import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/Navbar';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Users, Copy, Share2, UserPlus } from 'lucide-react';

interface Referral {
  id: string;
  created_at: string;
  referred: {
    full_name: string | null;
  };
}

const Referrals = () => {
  const { t } = useLanguage();
  const { user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchReferrals = async () => {
      if (!user) return;

      const { data } = await supabase
        .from('referrals')
        .select(`
          id,
          created_at,
          referred:referred_id (full_name)
        `)
        .eq('referrer_id', user.id)
        .order('created_at', { ascending: false });

      if (data) {
        const formattedData = data.map((item: any) => ({
          id: item.id,
          created_at: item.created_at,
          referred: {
            full_name: item.referred?.full_name || 'Unknown User',
          },
        }));
        setReferrals(formattedData);
      }
      setLoading(false);
    };

    if (user) {
      fetchReferrals();
    }
  }, [user]);

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

  if (authLoading || loading) {
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

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <h1 className="font-display text-3xl font-bold mb-8">{t('referrals.title')}</h1>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Referral Stats */}
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
                  💰 1 Referral = ₹120 Bonus!
                </p>
              </div>
              
              <p className="text-sm text-muted-foreground">
                {t('referrals.shareMessage')}
              </p>

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

          {/* Referrals List */}
          <Card className="lg:col-span-2 animate-fade-in" style={{ animationDelay: '100ms' }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                {t('referrals.peopleJoined')} ({referrals.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {referrals.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">{t('referrals.noReferrals')}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {referrals.map((referral) => (
                    <div
                      key={referral.id}
                      className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
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
                            Joined {new Date(referral.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <span className="text-green-600 dark:text-green-400 font-semibold">
                        +₹120
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Referrals;