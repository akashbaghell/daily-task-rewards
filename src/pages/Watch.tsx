import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { VideoCard } from '@/components/VideoCard';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Share2, IndianRupee, CheckCircle } from 'lucide-react';
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

const Watch = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [video, setVideo] = useState<VideoType | null>(null);
  const [relatedVideos, setRelatedVideos] = useState<VideoType[]>([]);
  const [loading, setLoading] = useState(true);
  const [earnedReward, setEarnedReward] = useState(false);

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

        // Track watch history and earn reward if logged in
        if (user) {
          await supabase.from('watch_history').upsert(
            { user_id: user.id, video_id: id },
            { onConflict: 'user_id,video_id' }
          );

          // Record video view and earn ₹20
          const { data: earned } = await supabase.rpc('record_video_view', {
            p_video_id: id,
            p_user_id: user.id
          });

          if (earned === true) {
            setEarnedReward(true);
            toast.success('₹20 earned for watching this video!', {
              icon: <IndianRupee className="h-4 w-4 text-green-500" />,
            });
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

  const shareVideo = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast.success('Link copied!');
  };

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

            {/* Earning notification */}
            {earnedReward && (
              <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-600 dark:text-green-400">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">+₹20 earned for watching this video!</span>
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