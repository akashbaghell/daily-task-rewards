import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Navbar } from '@/components/Navbar';
import { WalletCard } from '@/components/WalletCard';
import { WithdrawalDialog } from '@/components/WithdrawalDialog';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Video, Users, IndianRupee, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface Earning {
  id: string;
  amount: number;
  type: string;
  created_at: string;
}

interface WithdrawalRequest {
  id: string;
  amount: number;
  status: string;
  admin_notes: string | null;
  created_at: string;
}

interface WalletData {
  balance: number;
  total_earned: number;
  total_withdrawn: number;
}

const WalletPage = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [earnings, setEarnings] = useState<Earning[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
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

      // Fetch recent earnings
      const { data: earningsData } = await supabase
        .from('earnings')
        .select('id, amount, type, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (earningsData) setEarnings(earningsData);

      // Fetch withdrawal requests (using masked view for security)
      const { data: withdrawalsData } = await supabase
        .from('withdrawal_requests_masked')
        .select('id, amount, status, admin_notes, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (withdrawalsData) setWithdrawals(withdrawalsData);

      setLoading(false);
    };

    if (user) {
      fetchData();
    }
  }, [user]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'processing':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Completed';
      case 'rejected':
        return 'Rejected';
      case 'processing':
        return 'Processing';
      default:
        return 'Pending';
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-500/20 text-green-600';
      case 'rejected':
        return 'bg-red-500/20 text-red-600';
      case 'processing':
        return 'bg-blue-500/20 text-blue-600';
      default:
        return 'bg-yellow-500/20 text-yellow-600';
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <h1 className="font-display text-3xl font-bold mb-8 flex items-center gap-3">
          <IndianRupee className="h-8 w-8 text-primary" />
          My Wallet
        </h1>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Wallet Card */}
          <div className="lg:col-span-1">
            <WalletCard onWithdrawClick={() => setWithdrawDialogOpen(true)} />
          </div>

          {/* Earnings History */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Earnings</CardTitle>
              </CardHeader>
              <CardContent>
                {earnings.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No earnings yet. Watch videos to earn!
                  </p>
                ) : (
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {earnings.map((earning) => (
                      <div
                        key={earning.id}
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          {earning.type === 'video_watch' ? (
                            <Video className="h-5 w-5 text-primary" />
                          ) : (
                            <Users className="h-5 w-5 text-green-500" />
                          )}
                          <div>
                            <p className="font-medium text-sm">
                              {earning.type === 'video_watch' ? 'Video Watched' : 'Referral Bonus'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(earning.created_at).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>
                        <span className="font-bold text-green-500">+₹{earning.amount}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Withdrawal Requests */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Withdrawal History</CardTitle>
          </CardHeader>
          <CardContent>
            {withdrawals.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No withdrawal requests yet
              </p>
            ) : (
              <div className="space-y-3">
                {withdrawals.map((withdrawal) => (
                  <div
                    key={withdrawal.id}
                    className="p-3 bg-muted/50 rounded-lg"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(withdrawal.status)}
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm">{getStatusText(withdrawal.status)}</p>
                            <span className={`px-2 py-0.5 text-xs rounded-full ${getStatusBadgeClass(withdrawal.status)}`}>
                              {withdrawal.status}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {new Date(withdrawal.created_at).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>
                      <span className="font-bold">₹{withdrawal.amount}</span>
                    </div>
                    {withdrawal.status === 'rejected' && withdrawal.admin_notes && (
                      <div className="mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded text-sm text-red-600">
                        <strong>Reason:</strong> {withdrawal.admin_notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <WithdrawalDialog
        open={withdrawDialogOpen}
        onOpenChange={setWithdrawDialogOpen}
        maxAmount={wallet?.balance || 0}
      />
    </div>
  );
};

export default WalletPage;
