import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Wallet, IndianRupee, ArrowDownToLine, TrendingUp } from 'lucide-react';

interface WalletData {
  balance: number;
  total_earned: number;
  total_withdrawn: number;
}

interface WalletCardProps {
  onWithdrawClick: () => void;
}

export const WalletCard = ({ onWithdrawClick }: WalletCardProps) => {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWallet = async () => {
      if (!user) return;

      const { data } = await supabase
        .from('user_wallets')
        .select('balance, total_earned, total_withdrawn')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data) {
        setWallet(data);
      } else {
        setWallet({ balance: 0, total_earned: 0, total_withdrawn: 0 });
      }
      setLoading(false);
    };

    fetchWallet();
  }, [user]);

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader className="pb-2">
          <div className="h-4 w-24 bg-muted rounded" />
        </CardHeader>
        <CardContent>
          <div className="h-8 w-32 bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  const canWithdraw = (wallet?.balance || 0) >= 5000;

  return (
    <Card className="bg-gradient-to-br from-primary/10 via-background to-accent/10 border-primary/20">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Wallet className="h-4 w-4" />
          Your Wallet
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex items-center gap-1 text-3xl font-bold text-primary">
            <IndianRupee className="h-6 w-6" />
            {wallet?.balance || 0}
          </div>
          <p className="text-xs text-muted-foreground mt-1">Available Balance</p>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border/50">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-green-500" />
            <div>
              <p className="text-sm font-medium">₹{wallet?.total_earned || 0}</p>
              <p className="text-xs text-muted-foreground">Total Earned</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ArrowDownToLine className="h-4 w-4 text-blue-500" />
            <div>
              <p className="text-sm font-medium">₹{wallet?.total_withdrawn || 0}</p>
              <p className="text-xs text-muted-foreground">Withdrawn</p>
            </div>
          </div>
        </div>

        <Button 
          onClick={onWithdrawClick} 
          className="w-full" 
          disabled={!canWithdraw}
        >
          <IndianRupee className="h-4 w-4 mr-2" />
          {canWithdraw ? 'Withdraw Now' : `Min ₹5000 for withdrawal`}
        </Button>
      </CardContent>
    </Card>
  );
};
