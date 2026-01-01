import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/Navbar';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { User, Mail, Calendar, Globe, LogOut } from 'lucide-react';

const Profile = () => {
  const { t, language, setLanguage } = useLanguage();
  const { user, profile, loading: authLoading, signOut, refreshProfile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  const handleLanguageChange = async (lang: 'en' | 'hi') => {
    setLanguage(lang);

    if (user) {
      await supabase
        .from('profiles')
        .update({ language_preference: lang })
        .eq('id', user.id);

      await refreshProfile();
      toast.success('Language updated!');
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-48 bg-muted rounded" />
            <div className="h-64 bg-muted rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="font-display text-3xl font-bold mb-8">{t('profile.title')}</h1>

        <div className="space-y-6">
          {/* Profile Info */}
          <Card className="animate-fade-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary">
                    {profile?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
                <div>
                  <p className="text-lg font-semibold">{profile?.full_name || 'User'}</p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {user?.email}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-border space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {t('profile.memberSince')}
                  </span>
                  <span className="text-sm font-medium">
                    {profile?.created_at
                      ? new Date(profile.created_at).toLocaleDateString()
                      : '—'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Referral Code</span>
                  <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                    {profile?.referral_code}
                  </code>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Settings */}
          <Card className="animate-fade-in" style={{ animationDelay: '100ms' }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                {t('profile.settings')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{t('profile.language')}</p>
                  <p className="text-sm text-muted-foreground">
                    Choose your preferred language
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={language === 'en' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleLanguageChange('en')}
                  >
                    English
                  </Button>
                  <Button
                    variant={language === 'hi' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleLanguageChange('hi')}
                  >
                    हिंदी
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Logout */}
          <Card className="animate-fade-in border-destructive/20" style={{ animationDelay: '200ms' }}>
            <CardContent className="pt-6">
              <Button
                variant="destructive"
                className="w-full"
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4 mr-2" />
                {t('nav.logout')}
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Profile;