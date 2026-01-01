import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import { useAdmin } from '@/hooks/useAdmin';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Plus, Pencil, Trash2, Video, Loader2, Shield, Users, 
  IndianRupee, Eye, Clock, CheckCircle, XCircle, TrendingUp,
  Megaphone, Image, Link, Search, Filter
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface VideoType {
  id: string;
  title: string;
  youtube_id: string;
  description: string | null;
  thumbnail_url: string | null;
  category: string;
  is_featured: boolean;
  view_count: number;
}

interface WithdrawalRequest {
  id: string;
  amount: number;
  status: string;
  bank_name: string;
  account_number: string;
  ifsc_code: string;
  account_holder_name: string;
  admin_notes: string | null;
  created_at: string;
  user_id: string;
}

interface AdType {
  id: string;
  title: string;
  ad_type: 'image' | 'video' | 'adsense';
  media_url: string | null;
  click_url: string | null;
  adsense_slot: string | null;
  duration: number;
  earnings_per_view: number;
  is_active: boolean;
  view_count: number;
  created_at: string;
}

interface UserDetails {
  id: string;
  full_name: string | null;
  referral_code: string | null;
  created_at: string | null;
  videoCount: number;
  referralCount: number;
  totalEarnings: number;
  walletBalance: number;
}

interface Stats {
  totalUsers: number;
  totalVideos: number;
  totalViews: number;
  totalEarnings: number;
  pendingWithdrawals: number;
  totalAds: number;
}

const categories = ['entertainment', 'education', 'tech', 'music'];

const Admin = () => {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const navigate = useNavigate();

  const [videos, setVideos] = useState<VideoType[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [ads, setAds] = useState<AdType[]>([]);
  const [users, setUsers] = useState<UserDetails[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalVideos: 0,
    totalViews: 0,
    totalEarnings: 0,
    pendingWithdrawals: 0,
    totalAds: 0,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [adDialogOpen, setAdDialogOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<VideoType | null>(null);
  const [editingAd, setEditingAd] = useState<AdType | null>(null);

  // Video Form state
  const [title, setTitle] = useState('');
  const [youtubeId, setYoutubeId] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('entertainment');
  const [isFeatured, setIsFeatured] = useState(false);

  // Ad Form state
  const [adTitle, setAdTitle] = useState('');
  const [adType, setAdType] = useState<'image' | 'video' | 'adsense'>('image');
  const [adMediaUrl, setAdMediaUrl] = useState('');
  const [adClickUrl, setAdClickUrl] = useState('');
  const [adAdsenseSlot, setAdAdsenseSlot] = useState('');
  const [adDuration, setAdDuration] = useState(5);
  const [adEarnings, setAdEarnings] = useState(0.5);
  const [adIsActive, setAdIsActive] = useState(true);

  // User search & filter state
  const [userSearch, setUserSearch] = useState('');
  const [userFilter, setUserFilter] = useState<'all' | 'with_videos' | 'with_referrals' | 'high_earners'>('all');

  // Filtered users
  const filteredUsers = users.filter((u) => {
    // Search filter
    const searchMatch = userSearch.trim() === '' || 
      (u.full_name?.toLowerCase().includes(userSearch.toLowerCase())) ||
      (u.referral_code?.toLowerCase().includes(userSearch.toLowerCase())) ||
      u.id.toLowerCase().includes(userSearch.toLowerCase());
    
    if (!searchMatch) return false;

    // Category filter
    switch (userFilter) {
      case 'with_videos':
        return u.videoCount > 0;
      case 'with_referrals':
        return u.referralCount > 0;
      case 'high_earners':
        return u.totalEarnings >= 500;
      default:
        return true;
    }
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!adminLoading && !isAdmin && user) {
      toast.error('Access denied. Admin only.');
      navigate('/dashboard');
    }
  }, [isAdmin, adminLoading, user, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin]);

  const fetchData = async () => {
    await Promise.all([fetchVideos(), fetchWithdrawals(), fetchAds(), fetchUsers(), fetchStats()]);
    setLoading(false);
  };

  const fetchVideos = async () => {
    const { data } = await supabase
      .from('videos')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) setVideos(data);
  };

  const fetchWithdrawals = async () => {
    const { data } = await supabase
      .from('withdrawal_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) setWithdrawals(data);
  };

  const fetchAds = async () => {
    const { data } = await supabase
      .from('ads')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) setAds(data as AdType[]);
  };

  const fetchUsers = async () => {
    // Fetch all profiles
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, referral_code, created_at')
      .order('created_at', { ascending: false });

    if (!profiles) return;

    // Fetch video counts per user
    const { data: videoCounts } = await supabase
      .from('videos')
      .select('uploader_id');

    // Fetch referral counts per user
    const { data: referralCounts } = await supabase
      .from('referrals')
      .select('referrer_id');

    // Fetch earnings per user
    const { data: earningsData } = await supabase
      .from('earnings')
      .select('user_id, amount');

    // Fetch wallets
    const { data: wallets } = await supabase
      .from('user_wallets')
      .select('user_id, balance');

    // Map data to users
    const usersWithDetails: UserDetails[] = profiles.map((profile) => {
      const videoCount = videoCounts?.filter(v => v.uploader_id === profile.id).length || 0;
      const referralCount = referralCounts?.filter(r => r.referrer_id === profile.id).length || 0;
      const totalEarnings = earningsData?.filter(e => e.user_id === profile.id).reduce((sum, e) => sum + e.amount, 0) || 0;
      const wallet = wallets?.find(w => w.user_id === profile.id);

      return {
        id: profile.id,
        full_name: profile.full_name,
        referral_code: profile.referral_code,
        created_at: profile.created_at,
        videoCount,
        referralCount,
        totalEarnings,
        walletBalance: wallet?.balance || 0,
      };
    });

    setUsers(usersWithDetails);
  };

  const fetchStats = async () => {
    // Total users
    const { count: usersCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    // Total videos
    const { count: videosCount } = await supabase
      .from('videos')
      .select('*', { count: 'exact', head: true });

    // Total views
    const { data: viewsData } = await supabase
      .from('videos')
      .select('view_count');
    
    const totalViews = viewsData?.reduce((sum, v) => sum + (v.view_count || 0), 0) || 0;

    // Total earnings distributed
    const { data: earningsData } = await supabase
      .from('earnings')
      .select('amount');
    
    const totalEarnings = earningsData?.reduce((sum, e) => sum + e.amount, 0) || 0;

    // Pending withdrawals
    const { count: pendingCount } = await supabase
      .from('withdrawal_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    // Total ads
    const { count: adsCount } = await supabase
      .from('ads')
      .select('*', { count: 'exact', head: true });

    setStats({
      totalUsers: usersCount || 0,
      totalVideos: videosCount || 0,
      totalViews,
      totalEarnings,
      pendingWithdrawals: pendingCount || 0,
      totalAds: adsCount || 0,
    });
  };

  const resetAdForm = () => {
    setAdTitle('');
    setAdType('image');
    setAdMediaUrl('');
    setAdClickUrl('');
    setAdAdsenseSlot('');
    setAdDuration(5);
    setAdEarnings(0.5);
    setAdIsActive(true);
    setEditingAd(null);
  };

  const openEditAdDialog = (ad: AdType) => {
    setEditingAd(ad);
    setAdTitle(ad.title);
    setAdType(ad.ad_type);
    setAdMediaUrl(ad.media_url || '');
    setAdClickUrl(ad.click_url || '');
    setAdAdsenseSlot(ad.adsense_slot || '');
    setAdDuration(ad.duration);
    setAdEarnings(ad.earnings_per_view);
    setAdIsActive(ad.is_active);
    setAdDialogOpen(true);
  };

  const handleAdSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!adTitle.trim()) {
      toast.error('Ad title is required');
      return;
    }

    if (adType !== 'adsense' && !adMediaUrl.trim()) {
      toast.error('Media URL is required for image/video ads');
      return;
    }

    if (adType === 'adsense' && !adAdsenseSlot.trim()) {
      toast.error('AdSense slot ID is required');
      return;
    }

    setSaving(true);

    const adData = {
      title: adTitle.trim(),
      ad_type: adType,
      media_url: adType !== 'adsense' ? adMediaUrl.trim() : null,
      click_url: adClickUrl.trim() || null,
      adsense_slot: adType === 'adsense' ? adAdsenseSlot.trim() : null,
      duration: adDuration,
      earnings_per_view: adEarnings,
      is_active: adIsActive,
    };

    if (editingAd) {
      const { error } = await supabase
        .from('ads')
        .update(adData)
        .eq('id', editingAd.id);

      if (error) {
        toast.error('Failed to update ad');
      } else {
        toast.success('Ad updated!');
        setAdDialogOpen(false);
        resetAdForm();
        fetchAds();
      }
    } else {
      const { error } = await supabase
        .from('ads')
        .insert(adData);

      if (error) {
        toast.error('Failed to add ad');
      } else {
        toast.success('Ad added!');
        setAdDialogOpen(false);
        resetAdForm();
        fetchAds();
        fetchStats();
      }
    }

    setSaving(false);
  };

  const handleDeleteAd = async (id: string) => {
    const { error } = await supabase
      .from('ads')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete ad');
    } else {
      toast.success('Ad deleted!');
      fetchAds();
      fetchStats();
    }
  };

  const toggleAdActive = async (ad: AdType) => {
    const { error } = await supabase
      .from('ads')
      .update({ is_active: !ad.is_active })
      .eq('id', ad.id);

    if (error) {
      toast.error('Failed to update ad');
    } else {
      fetchAds();
    }
  };

  const extractYoutubeId = (input: string): string => {
    const urlMatch = input.match(
      /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
    );
    if (urlMatch) return urlMatch[1];
    if (/^[a-zA-Z0-9_-]{11}$/.test(input)) return input;
    return input;
  };

  const resetForm = () => {
    setTitle('');
    setYoutubeId('');
    setDescription('');
    setCategory('entertainment');
    setIsFeatured(false);
    setEditingVideo(null);
  };

  const openEditDialog = (video: VideoType) => {
    setEditingVideo(video);
    setTitle(video.title);
    setYoutubeId(video.youtube_id);
    setDescription(video.description || '');
    setCategory(video.category);
    setIsFeatured(video.is_featured);
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !youtubeId.trim()) {
      toast.error('Title and YouTube ID are required');
      return;
    }

    setSaving(true);
    const videoId = extractYoutubeId(youtubeId.trim());
    const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

    const videoData = {
      title: title.trim(),
      youtube_id: videoId,
      description: description.trim() || null,
      thumbnail_url: thumbnailUrl,
      category,
      is_featured: isFeatured,
    };

    if (editingVideo) {
      const { error } = await supabase
        .from('videos')
        .update(videoData)
        .eq('id', editingVideo.id);

      if (error) {
        toast.error('Failed to update video');
      } else {
        toast.success('Video updated!');
        setDialogOpen(false);
        resetForm();
        fetchVideos();
      }
    } else {
      const { error } = await supabase
        .from('videos')
        .insert(videoData);

      if (error) {
        if (error.message.includes('duplicate')) {
          toast.error('This video already exists');
        } else {
          toast.error('Failed to add video');
        }
      } else {
        toast.success('Video added!');
        setDialogOpen(false);
        resetForm();
        fetchVideos();
        fetchStats();
      }
    }

    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('videos')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete video');
    } else {
      toast.success('Video deleted!');
      fetchVideos();
      fetchStats();
    }
  };

  const handleWithdrawalAction = async (id: string, action: 'approved' | 'rejected', userId: string, amount: number) => {
    const updateData: { status: string; processed_at: string; admin_notes?: string } = {
      status: action,
      processed_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('withdrawal_requests')
      .update(updateData)
      .eq('id', id);

    if (error) {
      toast.error('Failed to update withdrawal');
      return;
    }

    // If approved, deduct from wallet using the rpc function
    if (action === 'approved') {
      // @ts-ignore - process_withdrawal function exists in db
      await supabase.rpc('process_withdrawal', {
        p_user_id: userId,
        p_amount: amount
      });
    }

    toast.success(`Withdrawal ${action}!`);
    fetchWithdrawals();
    fetchStats();
  };

  if (authLoading || adminLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 rounded-lg bg-primary/10">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="font-display text-3xl font-bold">Admin Panel</h1>
            <p className="text-muted-foreground">Manage videos, users & withdrawals</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Users className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.totalUsers}</p>
                  <p className="text-xs text-muted-foreground">Total Users</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Video className="h-8 w-8 text-purple-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.totalVideos}</p>
                  <p className="text-xs text-muted-foreground">Total Videos</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Eye className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.totalViews}</p>
                  <p className="text-xs text-muted-foreground">Total Views</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-8 w-8 text-orange-500" />
                <div>
                  <p className="text-2xl font-bold">₹{stats.totalEarnings}</p>
                  <p className="text-xs text-muted-foreground">Earnings Given</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className={stats.pendingWithdrawals > 0 ? 'border-yellow-500/50' : ''}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Clock className="h-8 w-8 text-yellow-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.pendingWithdrawals}</p>
                  <p className="text-xs text-muted-foreground">Pending Withdrawals</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Megaphone className="h-8 w-8 text-pink-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.totalAds}</p>
                  <p className="text-xs text-muted-foreground">Active Ads</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList>
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="videos" className="gap-2">
              <Video className="h-4 w-4" />
              Videos
            </TabsTrigger>
            <TabsTrigger value="ads" className="gap-2">
              <Megaphone className="h-4 w-4" />
              Ads
            </TabsTrigger>
            <TabsTrigger value="withdrawals" className="gap-2">
              <IndianRupee className="h-4 w-4" />
              Withdrawals
              {stats.pendingWithdrawals > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-yellow-500 text-white rounded-full">
                  {stats.pendingWithdrawals}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    All Users ({filteredUsers.length} / {users.length})
                  </CardTitle>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search name, ID, referral code..."
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        className="pl-9 w-full sm:w-64"
                      />
                    </div>
                    <Select value={userFilter} onValueChange={(v) => setUserFilter(v as typeof userFilter)}>
                      <SelectTrigger className="w-full sm:w-44">
                        <Filter className="h-4 w-4 mr-2" />
                        <SelectValue placeholder="Filter" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Users</SelectItem>
                        <SelectItem value="with_videos">With Videos</SelectItem>
                        <SelectItem value="with_referrals">With Referrals</SelectItem>
                        <SelectItem value="high_earners">High Earners (₹500+)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {filteredUsers.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    {users.length === 0 ? 'No users yet' : 'No users match your search/filter'}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-3 font-medium">User</th>
                          <th className="text-left p-3 font-medium">Referral Code</th>
                          <th className="text-center p-3 font-medium">Videos</th>
                          <th className="text-center p-3 font-medium">Referrals</th>
                          <th className="text-right p-3 font-medium">Total Earned</th>
                          <th className="text-right p-3 font-medium">Wallet Balance</th>
                          <th className="text-left p-3 font-medium">Joined</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUsers.map((u) => (
                          <tr key={u.id} className="border-b hover:bg-muted/50">
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                  <span className="text-xs font-semibold text-primary">
                                    {u.full_name?.charAt(0)?.toUpperCase() || 'U'}
                                  </span>
                                </div>
                                <div>
                                  <p className="font-medium">{u.full_name || 'Unknown'}</p>
                                  <p className="text-xs text-muted-foreground">{u.id.slice(0, 8)}...</p>
                                </div>
                              </div>
                            </td>
                            <td className="p-3">
                              <code className="bg-muted px-2 py-1 rounded text-sm">
                                {u.referral_code || '-'}
                              </code>
                            </td>
                            <td className="p-3 text-center">
                              <span className={`px-2 py-1 rounded-full text-sm ${u.videoCount > 0 ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300' : 'text-muted-foreground'}`}>
                                {u.videoCount}
                              </span>
                            </td>
                            <td className="p-3 text-center">
                              <span className={`px-2 py-1 rounded-full text-sm ${u.referralCount > 0 ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' : 'text-muted-foreground'}`}>
                                {u.referralCount}
                              </span>
                            </td>
                            <td className="p-3 text-right font-medium text-green-600">
                              ₹{u.totalEarnings}
                            </td>
                            <td className="p-3 text-right font-medium">
                              ₹{u.walletBalance}
                            </td>
                            <td className="p-3 text-sm text-muted-foreground">
                              {u.created_at ? new Date(u.created_at).toLocaleDateString('en-IN') : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Videos Tab */}
          <TabsContent value="videos">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Video className="h-5 w-5" />
                  All Videos ({videos.length})
                </CardTitle>
                <Dialog open={dialogOpen} onOpenChange={(open) => {
                  setDialogOpen(open);
                  if (!open) resetForm();
                }}>
                  <DialogTrigger asChild>
                    <Button className="gap-2">
                      <Plus className="h-4 w-4" />
                      Add Video
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                      <DialogTitle>
                        {editingVideo ? 'Edit Video' : 'Add New Video'}
                      </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="title">Title *</Label>
                        <Input
                          id="title"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          placeholder="Video title"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="youtubeId">YouTube URL or ID *</Label>
                        <Input
                          id="youtubeId"
                          value={youtubeId}
                          onChange={(e) => setYoutubeId(e.target.value)}
                          placeholder="https://youtube.com/watch?v=... or video ID"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="Video description"
                          rows={3}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Category</Label>
                          <Select value={category} onValueChange={setCategory}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {categories.map((cat) => (
                                <SelectItem key={cat} value={cat} className="capitalize">
                                  {cat}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Featured</Label>
                          <Select
                            value={isFeatured ? 'yes' : 'no'}
                            onValueChange={(v) => setIsFeatured(v === 'yes')}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="no">No</SelectItem>
                              <SelectItem value="yes">Yes</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <Button type="submit" className="w-full" disabled={saving}>
                        {saving ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : editingVideo ? (
                          'Update Video'
                        ) : (
                          'Add Video'
                        )}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {videos.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    No videos yet. Add your first video!
                  </div>
                ) : (
                  <div className="space-y-3">
                    {videos.map((video) => (
                      <div
                        key={video.id}
                        className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg"
                      >
                        <img
                          src={video.thumbnail_url || `https://img.youtube.com/vi/${video.youtube_id}/hqdefault.jpg`}
                          alt={video.title}
                          className="w-24 h-14 object-cover rounded"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{video.title}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="capitalize">{video.category}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              {video.view_count || 0} views
                            </span>
                            {video.is_featured && (
                              <>
                                <span>•</span>
                                <span className="bg-primary/10 text-primary px-2 py-0.5 rounded">
                                  Featured
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(video)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Video?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. The video "{video.title}" will be permanently deleted.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(video.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Withdrawals Tab */}
          <TabsContent value="withdrawals">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IndianRupee className="h-5 w-5" />
                  Withdrawal Requests
                </CardTitle>
              </CardHeader>
              <CardContent>
                {withdrawals.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    No withdrawal requests yet
                  </div>
                ) : (
                  <div className="space-y-4">
                    {withdrawals.map((withdrawal) => (
                      <div
                        key={withdrawal.id}
                        className={`p-4 rounded-lg border ${
                          withdrawal.status === 'pending' 
                            ? 'border-yellow-500/50 bg-yellow-500/5' 
                            : withdrawal.status === 'approved'
                            ? 'border-green-500/50 bg-green-500/5'
                            : 'border-red-500/50 bg-red-500/5'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-lg">₹{withdrawal.amount}</span>
                              <span className={`px-2 py-0.5 text-xs rounded-full capitalize ${
                                withdrawal.status === 'pending'
                                  ? 'bg-yellow-500/20 text-yellow-600'
                                  : withdrawal.status === 'approved'
                                  ? 'bg-green-500/20 text-green-600'
                                  : 'bg-red-500/20 text-red-600'
                              }`}>
                                {withdrawal.status}
                              </span>
                            </div>
                            <div className="text-sm space-y-1">
                              <p><strong>User ID:</strong> {withdrawal.user_id.slice(0, 8)}...</p>
                              <p><strong>Bank:</strong> {withdrawal.bank_name}</p>
                              <p><strong>Account:</strong> {withdrawal.account_number}</p>
                              <p><strong>IFSC:</strong> {withdrawal.ifsc_code}</p>
                              <p><strong>Name:</strong> {withdrawal.account_holder_name}</p>
                              <p className="text-muted-foreground text-xs">
                                {new Date(withdrawal.created_at).toLocaleString('en-IN')}
                              </p>
                            </div>
                          </div>

                          {withdrawal.status === 'pending' && (
                            <div className="flex flex-col gap-2">
                              <Button
                                size="sm"
                                className="gap-1 bg-green-600 hover:bg-green-700"
                                onClick={() => handleWithdrawalAction(withdrawal.id, 'approved', withdrawal.user_id, withdrawal.amount)}
                              >
                                <CheckCircle className="h-4 w-4" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                className="gap-1"
                                onClick={() => handleWithdrawalAction(withdrawal.id, 'rejected', withdrawal.user_id, withdrawal.amount)}
                              >
                                <XCircle className="h-4 w-4" />
                                Reject
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Ads Tab */}
          <TabsContent value="ads">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Megaphone className="h-5 w-5" />
                  Manage Ads ({ads.length})
                </CardTitle>
                <Dialog open={adDialogOpen} onOpenChange={(open) => {
                  setAdDialogOpen(open);
                  if (!open) resetAdForm();
                }}>
                  <DialogTrigger asChild>
                    <Button className="gap-2">
                      <Plus className="h-4 w-4" />
                      Add Ad
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                      <DialogTitle>
                        {editingAd ? 'Edit Ad' : 'Add New Ad'}
                      </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAdSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label>Ad Title *</Label>
                        <Input
                          value={adTitle}
                          onChange={(e) => setAdTitle(e.target.value)}
                          placeholder="Ad title"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Ad Type</Label>
                        <Select value={adType} onValueChange={(v: 'image' | 'video' | 'adsense') => setAdType(v)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="image">Image Ad</SelectItem>
                            <SelectItem value="video">Video Ad</SelectItem>
                            <SelectItem value="adsense">Google AdSense</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {adType !== 'adsense' ? (
                        <div className="space-y-2">
                          <Label>Media URL *</Label>
                          <Input
                            value={adMediaUrl}
                            onChange={(e) => setAdMediaUrl(e.target.value)}
                            placeholder="https://..."
                          />
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Label>AdSense Slot ID *</Label>
                          <Input
                            value={adAdsenseSlot}
                            onChange={(e) => setAdAdsenseSlot(e.target.value)}
                            placeholder="ca-pub-xxxxx/xxxxxx"
                          />
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label>Click URL (optional)</Label>
                        <Input
                          value={adClickUrl}
                          onChange={(e) => setAdClickUrl(e.target.value)}
                          placeholder="https://..."
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Duration (seconds)</Label>
                          <Input
                            type="number"
                            value={adDuration}
                            onChange={(e) => setAdDuration(Number(e.target.value))}
                            min={3}
                            max={30}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Earnings per view (₹)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={adEarnings}
                            onChange={(e) => setAdEarnings(Number(e.target.value))}
                            min={0.1}
                          />
                        </div>
                      </div>

                      <Button type="submit" className="w-full" disabled={saving}>
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : editingAd ? 'Update Ad' : 'Add Ad'}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {ads.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    No ads yet. Add your first ad to start monetizing!
                  </div>
                ) : (
                  <div className="space-y-3">
                    {ads.map((ad) => (
                      <div key={ad.id} className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                        <div className="w-16 h-16 rounded bg-muted flex items-center justify-center">
                          {ad.ad_type === 'image' ? <Image className="h-6 w-6" /> : 
                           ad.ad_type === 'video' ? <Video className="h-6 w-6" /> : 
                           <Megaphone className="h-6 w-6" />}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{ad.title}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="capitalize">{ad.ad_type}</span>
                            <span>•</span>
                            <span>{ad.duration}s</span>
                            <span>•</span>
                            <span>₹{ad.earnings_per_view}/view</span>
                            <span>•</span>
                            <span>{ad.view_count} views</span>
                          </div>
                        </div>
                        <Button variant={ad.is_active ? "secondary" : "outline"} size="sm" onClick={() => toggleAdActive(ad)}>
                          {ad.is_active ? 'Active' : 'Inactive'}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openEditAdDialog(ad)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteAd(ad.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;
