import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface WalletData {
  coins: number;
  balance: number;
}

interface CoinChange {
  id: string;
  amount: number;
  timestamp: number;
}

export const useWalletRealtime = () => {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<WalletData>({ coins: 0, balance: 0 });
  const [loading, setLoading] = useState(true);
  const [animating, setAnimating] = useState(false);
  const [coinChanges, setCoinChanges] = useState<CoinChange[]>([]);
  const previousCoins = useRef<number>(0);
  const isInitialized = useRef(false);

  const removeCoinChange = useCallback((id: string) => {
    setCoinChanges(prev => prev.filter(change => change.id !== id));
  }, []);

  useEffect(() => {
    const fetchWallet = async () => {
      if (!user) {
        setWallet({ coins: 0, balance: 0 });
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from('user_wallets')
        .select('coins, balance')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data) {
        previousCoins.current = data.coins || 0;
        setWallet({ coins: data.coins || 0, balance: data.balance || 0 });
        isInitialized.current = true;
      }
      setLoading(false);
    };

    fetchWallet();

    // Subscribe to realtime changes
    if (!user) return;

    const channel = supabase
      .channel('wallet-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_wallets',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newCoins = payload.new.coins || 0;
          const newBalance = payload.new.balance || 0;
          const coinDiff = newCoins - previousCoins.current;
          
          // Only trigger animation if coins increased and we've initialized
          if (coinDiff > 0 && isInitialized.current) {
            setAnimating(true);
            setTimeout(() => setAnimating(false), 600);
            
            // Add floating notification
            const changeId = `${Date.now()}-${Math.random()}`;
            setCoinChanges(prev => [...prev, {
              id: changeId,
              amount: coinDiff,
              timestamp: Date.now(),
            }]);
          }
          
          previousCoins.current = newCoins;
          setWallet({ coins: newCoins, balance: newBalance });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return { wallet, loading, animating, coinChanges, removeCoinChange };
};
