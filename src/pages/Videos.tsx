import { useEffect, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { VideoCard } from '@/components/VideoCard';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';

interface VideoType {
  id: string;
  title: string;
  youtube_id: string;
  thumbnail_url: string | null;
  category: string;
}

const categories = [
  { key: 'all', label: 'videos.all' },
  { key: 'entertainment', label: 'videos.entertainment' },
  { key: 'education', label: 'videos.education' },
  { key: 'tech', label: 'videos.tech' },
  { key: 'music', label: 'videos.music' },
];

const Videos = () => {
  const { t } = useLanguage();
  const [videos, setVideos] = useState<VideoType[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');

  useEffect(() => {
    const fetchVideos = async () => {
      setLoading(true);
      let query = supabase.from('videos').select('*');

      if (activeCategory !== 'all') {
        query = query.eq('category', activeCategory);
      }

      const { data } = await query;
      if (data) setVideos(data);
      setLoading(false);
    };

    fetchVideos();
  }, [activeCategory]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <h1 className="font-display text-3xl font-bold mb-8">{t('videos.title')}</h1>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-2 mb-8">
          {categories.map((cat) => (
            <Button
              key={cat.key}
              variant={activeCategory === cat.key ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveCategory(cat.key)}
              className="capitalize"
            >
              {t(cat.label)}
            </Button>
          ))}
        </div>

        {/* Videos Grid */}
        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="aspect-video animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : videos.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">{t('videos.noVideos')}</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {videos.map((video) => (
              <VideoCard
                key={video.id}
                id={video.id}
                title={video.title}
                youtubeId={video.youtube_id}
                thumbnailUrl={video.thumbnail_url}
                category={video.category}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Videos;