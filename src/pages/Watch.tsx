import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { VideoCard } from '@/components/VideoCard';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Share2, IndianRupee, CheckCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface VideoType {
  id: string;
  title: string;
  youtube_id: string;
  thumbnail_url: string | null;
  description: string | null;
  category: string;
  view_count?: number;
}

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

const WATCH_PERCENTAGE = 0.9; // User must watch 90% of video to earn

const Watch = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [video, setVideo] = useState<VideoType | null>(null);
  const [relatedVideos, setRelatedVideos] = useState<VideoType[]>([]);
  const [loading, setLoading] = useState(true);
  const [earnedReward, setEarnedReward] = useState(false);
  const [watchTime, setWatchTime] = useState(0);
  const [canEarn, setCanEarn] = useState(true);
  const [rewardClaimed, setRewardClaimed] = useState(false);
  const [videoDuration, setVideoDuration] = useState(0);
  const [playerReady, setPlayerReady] = useState(false);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const hasClaimedRef = useRef(false);
  const playerRef = useRef<any>(null);
  const playerContainerId = `youtube-player-${id}`;

  const requiredWatchTime = Math.max(30, Math.floor(videoDuration * WATCH_PERCENTAGE));

  // Load YouTube IFrame API
  useEffect(() => {
    if (window.YT && window.YT.Player) {
      return;
    }

    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
  }, []);

  // Initialize YouTube player
  const initPlayer = useCallback(() => {
    if (!video || playerRef.current) return;
    
    const container = document.getElementById(playerContainerId);
    if (!container) return;

    playerRef.current = new window.YT.Player(playerContainerId, {
      videoId: video.youtube_id,
      width: '100%',
      height: '100%',
      playerVars: {
        autoplay: 1,
        rel: 0,
      },
      events: {
        onReady: (event: any) => {
          const duration = event.target.getDuration();
          setVideoDuration(duration);
          setPlayerReady(true);
        },
      },
    });
  }, [video, playerContainerId]);

  useEffect(() => {
    if (!video) return;

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      window.onYouTubeIframeAPIReady = initPlayer;
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy?.();
        playerRef.current = null;
      }
      setPlayerReady(false);
    };
  }, [video, initPlayer]);

  // Fetch video data
  useEffect(() => {
    const fetchVideo = async () => {
      if (!id) return;

      const { data } = await supabase
        .from('videos')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (data) {
        setVideo(data);

        // Track watch history if logged in
        if (user) {
          await supabase.from('watch_history').upsert(
            { user_id: user.id, video_id: id },
            { onConflict: 'user_id,video_id' }
          );

          // Check if already earned for this video today
          const { data: existingEarning } = await supabase
            .from('earnings')
            .select('id')
            .eq('user_id', user.id)
            .eq('reference_id', id)
            .eq('type', 'video_watch')
            .gte('created_at', new Date().toISOString().split('T')[0])
            .maybeSingle();

          if (existingEarning) {
            setCanEarn(false);
            setEarnedReward(true);
          }
        }

        // Fetch related videos
        const { data: related } = await supabase
          .from('videos')
          .select('*')
          .eq('category', data.category)
          .neq('id', id)
          .limit(4);

        if (related) setRelatedVideos(related);
      }

      setLoading(false);
    };

    fetchVideo();
  }, [id, user]);

  // Watch timer - starts counting when player is ready
  useEffect(() => {
    if (!video || !user || !canEarn || rewardClaimed || !playerReady || videoDuration === 0) return;

    // Reset watch time when video changes
    setWatchTime(0);
    hasClaimedRef.current = false;

    timerRef.current = setInterval(() => {
      setWatchTime(prev => prev + 1);
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [video, user, canEarn, rewardClaimed, playerReady, videoDuration]);

  // Claim reward when watch time reaches required time
  useEffect(() => {
    const claimReward = async () => {
      if (watchTime >= requiredWatchTime && user && canEarn && !hasClaimedRef.current && id && requiredWatchTime > 0) {
        hasClaimedRef.current = true;
        setRewardClaimed(true);
        
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }

        // Record video view and earn ₹20
        const { data: earned } = await supabase.rpc('record_video_view', {
          p_video_id: id,
          p_user_id: user.id
        });

        if (earned === true) {
          setEarnedReward(true);
          setCanEarn(false);
          toast.success('₹20 earned for watching this video!', {
            icon: <IndianRupee className="h-4 w-4 text-green-500" />,
          });
        }
      }
    };

    claimReward();
  }, [watchTime, user, canEarn, id, requiredWatchTime]);

  const shareVideo = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast.success('Link copied!');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  const watchProgress = requiredWatchTime > 0 ? Math.min((watchTime / requiredWatchTime) * 100, 100) : 0;
  const remainingTime = Math.max(0, requiredWatchTime - watchTime);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="aspect-video animate-pulse rounded-xl bg-muted mb-6" />
        </div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8 text-center">
          <p className="text-muted-foreground mb-4">Video not found</p>
          <Button onClick={() => navigate('/videos')}>Browse Videos</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          size="sm"
          className="mb-4"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Video */}
          <div className="lg:col-span-2 space-y-4">
            <div className="aspect-video rounded-xl overflow-hidden bg-black">
              <div id={playerContainerId} className="w-full h-full" />
            </div>

            {/* Watch Progress & Earning */}
            {user && (
              <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                {earnedReward ? (
                  <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-medium">+₹20 earned for watching this video!</span>
                  </div>
                ) : canEarn ? (
                  <>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          {videoDuration > 0 
                            ? `Watch ${remainingTime > 0 ? formatTime(remainingTime) + ' more' : 'Complete!'} to earn ₹20`
                            : 'Loading video...'
                          }
                        </span>
                      </div>
                      <span className="font-medium text-primary">{Math.floor(watchProgress)}%</span>
                    </div>
                    <Progress value={watchProgress} className="h-2" />
                    {videoDuration > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Required: {formatTime(requiredWatchTime)} (90% of {formatTime(Math.floor(videoDuration))})
                      </p>
                    )}
                  </>
                ) : (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CheckCircle className="h-5 w-5" />
                    <span>Already earned from this video today</span>
                  </div>
                )}
              </div>
            )}

            {!user && (
              <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
                <p className="text-sm text-center">
                  <Button variant="link" className="p-0 h-auto" onClick={() => navigate('/auth')}>
                    Login
                  </Button>
                  {' '}karke videos dekho aur ₹20 per video kamao!
                </p>
              </div>
            )}

            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="font-display text-2xl font-bold mb-2">{video.title}</h1>
                {video.description && (
                  <p className="text-muted-foreground">{video.description}</p>
                )}
                <p className="text-sm text-muted-foreground mt-2">
                  {video.view_count || 0} views
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={shareVideo}>
                <Share2 className="h-4 w-4 mr-2" />
                {t('common.share')}
              </Button>
            </div>
          </div>

          {/* Related Videos */}
          <div className="space-y-4">
            <h2 className="font-display text-lg font-semibold">Related Videos</h2>
            <div className="space-y-4">
              {relatedVideos.map((vid) => (
                <VideoCard
                  key={vid.id}
                  id={vid.id}
                  title={vid.title}
                  youtubeId={vid.youtube_id}
                  thumbnailUrl={vid.thumbnail_url}
                  category={vid.category}
                />
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Watch;
