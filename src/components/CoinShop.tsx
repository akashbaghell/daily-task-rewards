import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
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
import { Coins, ArrowRight, IndianRupee, Loader2, Store, Sparkles, Award, ShoppingBag, CheckCircle } from 'lucide-react';

const COINS_TO_RUPEE_RATE = 10;
const MIN_COINS_TO_CONVERT = 100;

interface WalletData {
  coins: number;
  balance: number;
}

interface Reward {
  id: string;
  name: string;
  description: string | null;
  type: string;
  coin_price: number;
  icon: string | null;
}

interface UserReward {
  reward_id: string;
}

export const CoinShop = () => {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<WalletData>({ coins: 0, balance: 0 });
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [userRewards, setUserRewards] = useState<UserReward[]>([]);
  const [loading, setLoading] = useState(true);
  const [converting, setConverting] = useState(false);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [coinsToConvert, setCoinsToConvert] = useState(1000);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    const [walletRes, rewardsRes, userRewardsRes] = await Promise.all([
      supabase.from('user_wallets').select('coins, balance').eq('user_id', user.id).maybeSingle(),
      supabase.from('rewards').select('*').eq('is_active', true).order('coin_price'),
      supabase.from('user_rewards').select('reward_id').eq('user_id', user.id),
    ]);

    if (walletRes.data) setWallet(walletRes.data);
    if (rewardsRes.data) setRewards(rewardsRes.data);
    if (userRewardsRes.data) setUserRewards(userRewardsRes.data);
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
      // Use secure RPC function to convert coins
      const { data: success, error } = await supabase.rpc('convert_coins_to_rupees', {
        p_user_id: user.id,
        p_coins: coinsToConvert,
      });

      if (error) throw error;

      if (success) {
        const rupeesToAdd = calculateRupees(coinsToConvert);
        const actualCoinsUsed = rupeesToAdd * COINS_TO_RUPEE_RATE;
        toast.success(`🎉 Converted ${actualCoinsUsed} coins to ₹${rupeesToAdd}!`);
        setDialogOpen(false);
        fetchData();
      }
    } catch (error: any) {
      console.error('Conversion error:', error);
      toast.error(error.message || 'Failed to convert coins');
    } finally {
      setConverting(false);
    }
  };

  const handlePurchaseReward = async (reward: Reward) => {
    if (!user) return;

    if (wallet.coins < reward.coin_price) {
      toast.error('Not enough coins');
      return;
    }

    if (userRewards.some(r => r.reward_id === reward.id)) {
      toast.error('You already own this reward');
      return;
    }

    setPurchasing(reward.id);

    try {
      // Use secure RPC function to purchase reward
      const { error } = await supabase.rpc('purchase_reward', {
        p_user_id: user.id,
        p_reward_id: reward.id,
      });

      if (error) {
        if (error.message.includes('Not enough coins')) {
          toast.error('Not enough coins');
        } else if (error.message.includes('already own')) {
          toast.error('You already own this reward');
        } else {
          throw error;
        }
        return;
      }

      toast.success(`🎉 ${reward.name} purchased!`);
      fetchData();
    } catch (error) {
      console.error('Purchase error:', error);
      toast.error('Failed to purchase reward');
    } finally {
      setPurchasing(null);
    }
  };

  const isOwned = (rewardId: string) => userRewards.some(r => r.reward_id === rewardId);

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 w-32 bg-muted rounded" />
        </CardHeader>
        <CardContent>
          <div className="h-32 bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  const badges = rewards.filter(r => r.type === 'badge');
  const features = rewards.filter(r => r.type === 'feature' || r.type === 'boost');

  return (
    <Card className="border-yellow-500/20 bg-gradient-to-br from-background to-yellow-500/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Store className="h-5 w-5 text-yellow-500" />
            Coin Shop
          </CardTitle>
          <div className="flex items-center gap-2">
            <Coins className="h-4 w-4 text-yellow-500" />
            <span className="font-bold text-yellow-500">{wallet.coins.toLocaleString()}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick Actions */}
        <div className="flex gap-2">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex-1 gap-2 bg-green-600 hover:bg-green-700">
                <IndianRupee className="h-4 w-4" />
                Convert to ₹
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
                <div className="p-3 rounded-lg bg-muted/50 text-center">
                  <p className="text-sm text-muted-foreground">Conversion Rate</p>
                  <p className="text-lg font-semibold">
                    <span className="text-yellow-500">1000 coins</span>
                    <ArrowRight className="h-4 w-4 inline mx-2" />
                    <span className="text-green-500">₹100</span>
                  </p>
                </div>

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
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Rewards Tabs */}
        <Tabs defaultValue="badges" className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="badges" className="flex-1 gap-1">
              <Award className="h-4 w-4" />
              Badges
            </TabsTrigger>
            <TabsTrigger value="features" className="flex-1 gap-1">
              <ShoppingBag className="h-4 w-4" />
              Features
            </TabsTrigger>
          </TabsList>

          <TabsContent value="badges" className="mt-3 space-y-2">
            {badges.map((reward) => (
              <div
                key={reward.id}
                className={`flex items-center gap-3 p-3 rounded-lg border ${
                  isOwned(reward.id) ? 'bg-green-500/10 border-green-500/30' : 'bg-muted/30'
                }`}
              >
                <span className="text-2xl">{reward.icon}</span>
                <div className="flex-1">
                  <p className="font-medium text-sm">{reward.name}</p>
                  <p className="text-xs text-muted-foreground">{reward.description}</p>
                </div>
                {isOwned(reward.id) ? (
                  <Badge variant="secondary" className="gap-1 bg-green-500/20 text-green-500">
                    <CheckCircle className="h-3 w-3" />
                    Owned
                  </Badge>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handlePurchaseReward(reward)}
                    disabled={purchasing === reward.id || wallet.coins < reward.coin_price}
                    className="gap-1"
                  >
                    {purchasing === reward.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <>
                        <Coins className="h-3 w-3 text-yellow-500" />
                        {reward.coin_price}
                      </>
                    )}
                  </Button>
                )}
              </div>
            ))}
          </TabsContent>

          <TabsContent value="features" className="mt-3 space-y-2">
            {features.map((reward) => (
              <div
                key={reward.id}
                className={`flex items-center gap-3 p-3 rounded-lg border ${
                  isOwned(reward.id) ? 'bg-green-500/10 border-green-500/30' : 'bg-muted/30'
                }`}
              >
                <span className="text-2xl">{reward.icon}</span>
                <div className="flex-1">
                  <p className="font-medium text-sm">{reward.name}</p>
                  <p className="text-xs text-muted-foreground">{reward.description}</p>
                </div>
                {isOwned(reward.id) ? (
                  <Badge variant="secondary" className="gap-1 bg-green-500/20 text-green-500">
                    <CheckCircle className="h-3 w-3" />
                    {reward.type === 'boost' ? 'Active' : 'Owned'}
                  </Badge>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handlePurchaseReward(reward)}
                    disabled={purchasing === reward.id || wallet.coins < reward.coin_price}
                    className="gap-1"
                  >
                    {purchasing === reward.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <>
                        <Coins className="h-3 w-3 text-yellow-500" />
                        {reward.coin_price}
                      </>
                    )}
                  </Button>
                )}
              </div>
            ))}
          </TabsContent>
        </Tabs>

        {/* My Badges */}
        {userRewards.length > 0 && (
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground mb-2">My Badges</p>
            <div className="flex flex-wrap gap-1">
              {userRewards.map((ur) => {
                const reward = rewards.find(r => r.id === ur.reward_id);
                return reward ? (
                  <span key={ur.reward_id} className="text-lg" title={reward.name}>
                    {reward.icon}
                  </span>
                ) : null;
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
