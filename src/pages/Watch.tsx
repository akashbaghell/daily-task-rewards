import { useEffect, useState, useRef } from 'react';
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

const REQUIRED_WATCH_TIME = 30; // seconds required to earn reward

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
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const hasClaimedRef = useRef(false);

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

  // Watch timer - starts counting when video loads
  useEffect(() => {
    if (!video || !user || !canEarn || rewardClaimed) return;

    // Reset watch time when video changes
    setWatchTime(0);
    hasClaimedRef.current = false;

    timerRef.current = setInterval(() => {
      setWatchTime(prev => {
        const newTime = prev + 1;
        return newTime;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [video, user, canEarn, rewardClaimed]);

  // Claim reward when watch time reaches required time
  useEffect(() => {
    const claimReward = async () => {
      if (watchTime >= REQUIRED_WATCH_TIME && user && canEarn && !hasClaimedRef.current && id) {
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
  }, [watchTime, user, canEarn, id]);

  const shareVideo = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast.success('Link copied!');
  };

  const watchProgress = Math.min((watchTime / REQUIRED_WATCH_TIME) * 100, 100);

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
              <iframe
                src={`https://www.youtube.com/embed/${video.youtube_id}?autoplay=1`}
                title={video.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
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
                          Watch {REQUIRED_WATCH_TIME - watchTime > 0 ? `${REQUIRED_WATCH_TIME - watchTime}s more` : 'Complete!'} to earn ₹20
                        </span>
                      </div>
                      <span className="font-medium text-primary">{Math.floor(watchProgress)}%</span>
                    </div>
                    <Progress value={watchProgress} className="h-2" />
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
