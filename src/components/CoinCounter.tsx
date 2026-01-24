import { Coins } from 'lucide-react';
import { useWalletRealtime } from '@/hooks/useWalletRealtime';
import { cn } from '@/lib/utils';

export const CoinCounter = () => {
  const { wallet, loading, animating } = useWalletRealtime();

  if (loading) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent/50 animate-pulse">
        <Coins className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium text-muted-foreground">---</span>
      </div>
    );
  }

  return (
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
      {animating && (
        <span className="absolute -top-1 -right-1 text-xs font-bold text-green-400 animate-fade-in">
          +
        </span>
      )}
    </div>
  );
};
