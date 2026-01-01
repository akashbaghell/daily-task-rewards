import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { X, Volume2, VolumeX, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Ad {
  id: string;
  title: string;
  ad_type: 'image' | 'video' | 'adsense';
  media_url: string | null;
  click_url: string | null;
  adsense_slot: string | null;
  duration: number;
  earnings_per_view: number;
}

interface AdPlayerProps {
  videoId: string;
  viewerId: string;
  onAdComplete: () => void;
  onSkip?: () => void;
}

export const AdPlayer = ({ videoId, viewerId, onAdComplete, onSkip }: AdPlayerProps) => {
  const [ad, setAd] = useState<Ad | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(0);
  const [canSkip, setCanSkip] = useState(false);
  const [muted, setMuted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fetchAd = async () => {
      const { data } = await supabase
        .from('ads')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) {
        setAd(data as Ad);
        setTimeLeft(data.duration || 5);
      } else {
        // No ads available, skip
        onAdComplete();
      }
      setLoading(false);
    };

    fetchAd();
  }, [onAdComplete]);

  useEffect(() => {
    if (!ad || loading) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          handleAdComplete();
          return 0;
        }
        if (prev <= ad.duration - 5) {
          setCanSkip(true);
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [ad, loading]);

  const handleAdComplete = async () => {
    if (ad) {
      // Record ad view and distribute earnings
      await supabase.rpc('record_ad_view', {
        p_ad_id: ad.id,
        p_video_id: videoId,
        p_viewer_id: viewerId,
      });
    }
    onAdComplete();
  };

  const handleSkip = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    onSkip?.();
    onAdComplete();
  };

  const handleAdClick = () => {
    if (ad?.click_url) {
      window.open(ad.click_url, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="absolute inset-0 bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!ad) return null;

  return (
    <div className="absolute inset-0 bg-black z-10">
      {/* Ad Content */}
      {ad.ad_type === 'video' && ad.media_url && (
        <video
          ref={videoRef}
          src={ad.media_url}
          autoPlay
          muted={muted}
          className="w-full h-full object-contain cursor-pointer"
          onClick={handleAdClick}
        />
      )}

      {ad.ad_type === 'image' && ad.media_url && (
        <div 
          className="w-full h-full flex items-center justify-center cursor-pointer"
          onClick={handleAdClick}
        >
          <img
            src={ad.media_url}
            alt={ad.title}
            className="max-w-full max-h-full object-contain"
          />
        </div>
      )}

      {ad.ad_type === 'adsense' && ad.adsense_slot && (
        <div className="w-full h-full flex items-center justify-center bg-muted">
          <div className="text-center p-8">
            <p className="text-muted-foreground mb-4">Advertisement</p>
            {/* AdSense would be integrated here */}
            <div 
              className="min-h-[250px] min-w-[300px] bg-muted-foreground/10 rounded-lg flex items-center justify-center"
            >
              <p className="text-sm text-muted-foreground">AdSense Slot: {ad.adsense_slot}</p>
            </div>
          </div>
        </div>
      )}

      {/* Ad Overlay */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between pointer-events-auto">
          <div className="flex items-center gap-2 bg-black/70 rounded px-3 py-1.5">
            <span className="text-white text-sm font-medium">Ad • {timeLeft}s</span>
          </div>

          {ad.ad_type === 'video' && (
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={() => setMuted(!muted)}
            >
              {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </Button>
          )}
        </div>

        {/* Progress bar */}
        <div className="absolute bottom-16 left-0 right-0 px-4 pointer-events-auto">
          <Progress 
            value={((ad.duration - timeLeft) / ad.duration) * 100} 
            className="h-1 bg-white/30"
          />
        </div>

        {/* Bottom bar */}
        <div className="absolute bottom-0 left-0 right-0 p-4 flex items-center justify-between pointer-events-auto">
          {ad.click_url && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleAdClick}
              className="gap-2"
            >
              Learn More
              <ExternalLink className="h-4 w-4" />
            </Button>
          )}

          <div className="ml-auto">
            {canSkip ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleSkip}
                className="gap-2"
              >
                Skip Ad
                <X className="h-4 w-4" />
              </Button>
            ) : (
              <div className="bg-black/70 rounded px-3 py-1.5">
                <span className="text-white text-sm">
                  Skip in {Math.max(0, ad.duration - 5 - (ad.duration - timeLeft))}s
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
