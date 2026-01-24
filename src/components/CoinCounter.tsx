import { useEffect } from 'react';
import { Coins } from 'lucide-react';
import { useWalletRealtime } from '@/hooks/useWalletRealtime';
import { cn } from '@/lib/utils';
import { playCoinSound } from '@/lib/sounds';

interface FloatingCoinProps {
  amount: number;
  id: string;
  onComplete: (id: string) => void;
}

const FloatingCoin = ({ amount, id, onComplete }: FloatingCoinProps) => {
  useEffect(() => {
    // Play sound when notification appears
    playCoinSound();
    
    // Remove after animation completes
    const timer = setTimeout(() => {
      onComplete(id);
    }, 1500);
    
    return () => clearTimeout(timer);
  }, [id, onComplete]);

  return (
    <div 
      className="absolute -top-8 left-1/2 -translate-x-1/2 pointer-events-none z-50"
      style={{
        animation: 'floatUp 1.5s ease-out forwards',
      }}
    >
      <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold shadow-lg shadow-green-500/30 whitespace-nowrap">
        <Coins className="h-3 w-3" />
        +{amount}
      </div>
    </div>
  );
};

export const CoinCounter = () => {
  const { wallet, loading, animating, coinChanges, removeCoinChange } = useWalletRealtime();

  if (loading) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent/50 animate-pulse">
        <Coins className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium text-muted-foreground">---</span>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Floating notifications */}
      {coinChanges.map((change) => (
        <FloatingCoin
          key={change.id}
          id={change.id}
          amount={change.amount}
          onComplete={removeCoinChange}
        />
      ))}
      
      {/* Main counter */}
      <div
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/30 transition-all duration-300",
          animating && "scale-110 shadow-lg shadow-amber-500/30"
        )}
      >
        <Coins 
          className={cn(
            "h-4 w-4 text-amber-500 transition-transform duration-300",
            animating && "animate-bounce"
          )} 
        />
        <span 
          className={cn(
            "text-sm font-bold tabular-nums transition-all duration-300",
            animating ? "text-amber-400 scale-105" : "text-amber-500"
          )}
        >
          {wallet.coins.toLocaleString()}
        </span>
      </div>
    </div>
  );
};
