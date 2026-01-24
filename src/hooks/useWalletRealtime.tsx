import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface WalletData {
  coins: number;
  balance: number;
}

export const useWalletRealtime = () => {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<WalletData>({ coins: 0, balance: 0 });
  const [loading, setLoading] = useState(true);
  const [animating, setAnimating] = useState(false);
  const previousCoins = useRef<number>(0);

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
          
          // Trigger animation if coins increased
          if (newCoins > previousCoins.current) {
            setAnimating(true);
            setTimeout(() => setAnimating(false), 600);
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

  return { wallet, loading, animating };
};
