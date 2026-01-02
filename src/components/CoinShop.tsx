import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Coins, ArrowRight, IndianRupee, Loader2, Store, Sparkles } from 'lucide-react';

const COINS_TO_RUPEE_RATE = 10; // 10 coins = ₹1 (1000 coins = ₹100)
const MIN_COINS_TO_CONVERT = 100;

interface WalletData {
  coins: number;
  balance: number;
}

export const CoinShop = () => {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<WalletData>({ coins: 0, balance: 0 });
  const [loading, setLoading] = useState(true);
  const [converting, setConverting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [coinsToConvert, setCoinsToConvert] = useState(1000);

  useEffect(() => {
    if (user) {
      fetchWallet();
    }
  }, [user]);

  const fetchWallet = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('user_wallets')
      .select('coins, balance')
      .eq('user_id', user.id)
      .maybeSingle();

    if (data) {
      setWallet(data);
    }
    setLoading(false);
  };

  const calculateRupees = (coins: number): number => {
    return Math.floor(coins / COINS_TO_RUPEE_RATE);
  };

  const handleConvert = async () => {
    if (!user) return;

    if (coinsToConvert < MIN_COINS_TO_CONVERT) {
      toast.error(`Minimum ${MIN_COINS_TO_CONVERT} coins required`);
      return;
    }

    if (coinsToConvert > wallet.coins) {
      toast.error('Not enough coins');
      return;
    }

    const rupeesToAdd = calculateRupees(coinsToConvert);
    const actualCoinsUsed = rupeesToAdd * COINS_TO_RUPEE_RATE;

    if (rupeesToAdd <= 0) {
      toast.error('Not enough coins for conversion');
      return;
    }

    setConverting(true);

    try {
      // Update wallet
      const { error: walletError } = await supabase
        .from('user_wallets')
        .update({
          coins: wallet.coins - actualCoinsUsed,
          balance: wallet.balance + rupeesToAdd,
          total_earned: wallet.balance + rupeesToAdd,
        })
        .eq('user_id', user.id);

      if (walletError) throw walletError;

      // Record transaction
      await supabase.from('coin_transactions').insert({
        user_id: user.id,
        amount: -actualCoinsUsed,
        type: 'converted',
        description: `Converted ${actualCoinsUsed} coins to ₹${rupeesToAdd}`,
      });

      // Add to earnings
      await supabase.from('earnings').insert({
        user_id: user.id,
        amount: rupeesToAdd,
        type: 'coin_conversion',
      });

      toast.success(`🎉 Converted ${actualCoinsUsed} coins to ₹${rupeesToAdd}!`);
      setDialogOpen(false);
      fetchWallet();
    } catch (error) {
      console.error('Conversion error:', error);
      toast.error('Failed to convert coins');
    } finally {
      setConverting(false);
    }
  };

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 w-32 bg-muted rounded" />
        </CardHeader>
        <CardContent>
          <div className="h-24 bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-yellow-500/20 bg-gradient-to-br from-background to-yellow-500/5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Store className="h-5 w-5 text-yellow-500" />
          Coin Shop
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Coin Balance */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-yellow-500/20 flex items-center justify-center">
              <Coins className="h-6 w-6 text-yellow-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Your Coins</p>
              <p className="text-2xl font-bold text-yellow-500">{wallet.coins.toLocaleString()}</p>
            </div>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-yellow-500 hover:bg-yellow-600 text-black">
                <Sparkles className="h-4 w-4" />
                Convert
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Coins className="h-5 w-5 text-yellow-500" />
                  Convert Coins to Rupees
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-6 py-4">
                {/* Conversion Rate Info */}
                <div className="p-3 rounded-lg bg-muted/50 text-center">
                  <p className="text-sm text-muted-foreground">Conversion Rate</p>
                  <p className="text-lg font-semibold">
                    <span className="text-yellow-500">1000 coins</span>
                    <ArrowRight className="h-4 w-4 inline mx-2" />
                    <span className="text-green-500">₹100</span>
                  </p>
                </div>

                {/* Input */}
                <div className="space-y-2">
                  <Label>Coins to Convert</Label>
                  <Input
                    type="number"
                    value={coinsToConvert}
                    onChange={(e) => setCoinsToConvert(Math.max(0, Number(e.target.value)))}
                    min={MIN_COINS_TO_CONVERT}
                    max={wallet.coins}
                    step={100}
                  />
                  <p className="text-xs text-muted-foreground">
                    Available: {wallet.coins.toLocaleString()} coins
                  </p>
                </div>

                {/* Preview */}
                <div className="flex items-center justify-between p-4 rounded-lg bg-primary/5 border">
                  <div className="flex items-center gap-2">
                    <Coins className="h-5 w-5 text-yellow-500" />
                    <span className="font-medium">{coinsToConvert.toLocaleString()}</span>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                  <div className="flex items-center gap-2">
                    <IndianRupee className="h-5 w-5 text-green-500" />
                    <span className="font-medium text-green-500">
                      {calculateRupees(coinsToConvert)}
                    </span>
                  </div>
                </div>

                {/* Quick Select */}
                <div className="flex gap-2 flex-wrap">
                  {[100, 500, 1000, 2000, 5000].map((amount) => (
                    <Button
                      key={amount}
                      variant={coinsToConvert === amount ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCoinsToConvert(amount)}
                      disabled={amount > wallet.coins}
                    >
                      {amount}
                    </Button>
                  ))}
                  <Button
                    variant={coinsToConvert === wallet.coins ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCoinsToConvert(wallet.coins)}
                  >
                    Max
                  </Button>
                </div>

                {/* Convert Button */}
                <Button
                  className="w-full gap-2"
                  onClick={handleConvert}
                  disabled={converting || coinsToConvert < MIN_COINS_TO_CONVERT || coinsToConvert > wallet.coins}
                >
                  {converting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Convert to ₹{calculateRupees(coinsToConvert)}
                    </>
                  )}
                </Button>

                {wallet.coins < MIN_COINS_TO_CONVERT && (
                  <p className="text-xs text-center text-muted-foreground">
                    Complete daily tasks to earn more coins!
                  </p>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Conversion Info */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-muted/50 text-center">
            <p className="text-2xl font-bold text-yellow-500">10</p>
            <p className="text-xs text-muted-foreground">coins = ₹1</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50 text-center">
            <p className="text-2xl font-bold text-green-500">₹{calculateRupees(wallet.coins)}</p>
            <p className="text-xs text-muted-foreground">convertible</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
