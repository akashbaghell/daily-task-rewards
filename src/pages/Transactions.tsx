import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { 
  ArrowLeft, Coins, IndianRupee, ArrowUpRight, ArrowDownRight, 
  RefreshCw, ShoppingBag, Sparkles, Clock 
} from 'lucide-react';

interface CoinTransaction {
  id: string;
  amount: number;
  type: string;
  description: string | null;
  created_at: string;
}

interface Earning {
  id: string;
  amount: number;
  type: string;
  created_at: string;
}

interface WalletData {
  coins: number;
  balance: number;
  total_earned: number;
  total_withdrawn: number;
}

const Transactions = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [coinTransactions, setCoinTransactions] = useState<CoinTransaction[]>([]);
  const [earnings, setEarnings] = useState<Earning[]>([]);
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    const [coinRes, earningsRes, walletRes] = await Promise.all([
      supabase
        .from('coin_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50),
      supabase
        .from('earnings')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50),
      supabase
        .from('user_wallets')
        .select('coins, balance, total_earned, total_withdrawn')
        .eq('user_id', user.id)
        .maybeSingle(),
    ]);

    if (coinRes.data) setCoinTransactions(coinRes.data);
    if (earningsRes.data) setEarnings(earningsRes.data);
    if (walletRes.data) setWallet(walletRes.data);
    setLoading(false);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTransactionIcon = (type: string, amount: number) => {
    if (type === 'converted') return <RefreshCw className="h-4 w-4 text-blue-500" />;
    if (type === 'spent') return <ShoppingBag className="h-4 w-4 text-purple-500" />;
    if (amount > 0) return <ArrowDownRight className="h-4 w-4 text-green-500" />;
    return <ArrowUpRight className="h-4 w-4 text-red-500" />;
  };

  const getEarningLabel = (type: string) => {
    switch (type) {
      case 'video_watch': return 'Video Watch';
      case 'referral': return 'Referral Bonus';
      case 'daily_task': return 'Daily Task';
      case 'coin_conversion': return 'Coin Conversion';
      default: return type;
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-48 bg-muted rounded" />
            <div className="h-64 bg-muted rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="font-display text-2xl font-bold">Transaction History</h1>
            <p className="text-muted-foreground text-sm">View all your coins and earnings</p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-yellow-500/10 flex items-center justify-center">
                  <Coins className="h-5 w-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Coins</p>
                  <p className="text-xl font-bold text-yellow-500">{wallet?.coins?.toLocaleString() || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                  <IndianRupee className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Balance</p>
                  <p className="text-xl font-bold text-green-500">₹{wallet?.balance || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Earned</p>
                  <p className="text-xl font-bold">₹{wallet?.total_earned || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                  <ArrowUpRight className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Withdrawn</p>
                  <p className="text-xl font-bold">₹{wallet?.total_withdrawn || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Transactions Tabs */}
        <Tabs defaultValue="coins" className="space-y-6">
          <TabsList>
            <TabsTrigger value="coins" className="gap-2">
              <Coins className="h-4 w-4" />
              Coin Transactions
            </TabsTrigger>
            <TabsTrigger value="earnings" className="gap-2">
              <IndianRupee className="h-4 w-4" />
              Rupee Earnings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="coins">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Coin Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                {coinTransactions.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Coins className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No coin transactions yet</p>
                    <p className="text-sm">Complete daily tasks to earn coins!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {coinTransactions.map((tx) => (
                      <div key={tx.id} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                        <div className="h-10 w-10 rounded-full bg-background flex items-center justify-center">
                          {getTransactionIcon(tx.type, tx.amount)}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">
                            {tx.description || tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}
                          </p>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {formatDate(tx.created_at)}
                          </div>
                        </div>
                        <div className={`font-bold ${tx.amount > 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {tx.amount > 0 ? '+' : ''}{tx.amount}
                          <Coins className="h-3 w-3 inline ml-1" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="earnings">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Rupee Earnings</CardTitle>
              </CardHeader>
              <CardContent>
                {earnings.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <IndianRupee className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No earnings yet</p>
                    <p className="text-sm">Watch videos and refer friends to earn!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {earnings.map((earning) => (
                      <div key={earning.id} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                        <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                          <IndianRupee className="h-5 w-5 text-green-500" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{getEarningLabel(earning.type)}</p>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {formatDate(earning.created_at)}
                          </div>
                        </div>
                        <div className="font-bold text-green-500">
                          +₹{earning.amount}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Transactions;
