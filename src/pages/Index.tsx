import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/Navbar';
import { VideoCard } from '@/components/VideoCard';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Play, Users, Video, ArrowRight, Sparkles } from 'lucide-react';

interface VideoType {
  id: string;
  title: string;
  youtube_id: string;
  thumbnail_url: string | null;
  category: string;
}

const Index = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [featuredVideos, setFeaturedVideos] = useState<VideoType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeaturedVideos = async () => {
      const { data } = await supabase
        .from('videos')
        .select('*')
        .eq('is_featured', true)
        .limit(4);

      if (data) setFeaturedVideos(data);
      setLoading(false);
    };

    fetchFeaturedVideos();
  }, []);

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const features = [
    {
      icon: Video,
      title: 'Watch Videos',
      titleHi: 'वीडियो देखें',
      desc: 'Browse and watch amazing content',
      descHi: 'शानदार कंटेंट ब्राउज़ करें',
    },
    {
      icon: Users,
      title: 'Refer Friends',
      titleHi: 'दोस्तों को रेफर करें',
      desc: 'Share your unique link',
      descHi: 'अपना यूनिक लिंक शेयर करें',
    },
    {
      icon: Sparkles,
      title: 'Grow Network',
      titleHi: 'नेटवर्क बढ़ाएं',
      desc: 'Build your community',
      descHi: 'अपनी कम्युनिटी बनाएं',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero" />
        <div className="container relative mx-auto px-4 py-20 md:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
              <Play className="h-4 w-4" />
              <span>VidShare Platform</span>
            </div>
            <h1 className="font-display text-4xl font-bold tracking-tight md:text-6xl lg:text-7xl mb-6">
              {t('home.hero.title')}
            </h1>
            <p className="text-lg text-muted-foreground md:text-xl mb-8 max-w-2xl mx-auto">
              {t('home.hero.subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/auth?mode=signup">
                <Button size="lg" className="gap-2 px-8">
                  {t('home.hero.cta')}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/auth">
                <Button size="lg" variant="outline" className="px-8">
                  {t('nav.login')}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-3">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group rounded-2xl border border-border bg-card p-6 text-center transition-all hover:border-primary/20 hover:shadow-lg animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="mb-2 font-display text-lg font-semibold">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Videos */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="mb-10 flex items-center justify-between">
            <h2 className="font-display text-2xl font-bold md:text-3xl">
              {t('home.featured')}
            </h2>
            <Link to="/videos">
              <Button variant="ghost" className="gap-2">
                {t('home.viewAll')}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          {loading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="aspect-video animate-pulse rounded-xl bg-muted" />
              ))}
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {featuredVideos.map((video) => (
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
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="rounded-3xl bg-gradient-to-r from-primary to-primary/80 p-8 md:p-12 text-center text-primary-foreground">
            <h2 className="font-display text-2xl font-bold md:text-4xl mb-4">
              Ready to get started?
            </h2>
            <p className="mb-8 text-primary-foreground/80 max-w-xl mx-auto">
              Join thousands of users who are already watching and sharing videos.
            </p>
            <Link to="/auth?mode=signup">
              <Button size="lg" variant="secondary" className="gap-2">
                Create Free Account
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2024 VidShare. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;