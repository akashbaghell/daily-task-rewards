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
  IndianRupee, Eye, Clock, CheckCircle, XCircle, TrendingUp
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
  profiles?: {
    full_name: string | null;
  };
}

interface Stats {
  totalUsers: number;
  totalVideos: number;
  totalViews: number;
  totalEarnings: number;
  pendingWithdrawals: number;
}

const categories = ['entertainment', 'education', 'tech', 'music'];

const Admin = () => {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const navigate = useNavigate();

  const [videos, setVideos] = useState<VideoType[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalVideos: 0,
    totalViews: 0,
    totalEarnings: 0,
    pendingWithdrawals: 0,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<VideoType | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [youtubeId, setYoutubeId] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('entertainment');
  const [isFeatured, setIsFeatured] = useState(false);

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
    await Promise.all([fetchVideos(), fetchWithdrawals(), fetchStats()]);
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
      .select(`
        *,
        profiles:user_id (full_name)
      `)
      .order('created_at', { ascending: false });

    if (data) setWithdrawals(data as WithdrawalRequest[]);
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

    setStats({
      totalUsers: usersCount || 0,
      totalVideos: videosCount || 0,
      totalViews,
      totalEarnings,
      pendingWithdrawals: pendingCount || 0,
    });
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

    // If approved, deduct from wallet
    if (action === 'approved') {
      await supabase.rpc('process_withdrawal', {
        p_user_id: userId,
        p_amount: amount
      }).catch(() => {
        // Fallback: direct update if rpc doesn't exist
        supabase
          .from('user_wallets')
          .update({
            balance: supabase.rpc('subtract', { a: 'balance', b: amount }),
            total_withdrawn: supabase.rpc('add', { a: 'total_withdrawn', b: amount })
          })
          .eq('user_id', userId);
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
        <div className="grid gap-4 md:grid-cols-5 mb-8">
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
        </div>

        <Tabs defaultValue="videos" className="space-y-6">
          <TabsList>
            <TabsTrigger value="videos" className="gap-2">
              <Video className="h-4 w-4" />
              Videos
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
                              <p><strong>User:</strong> {withdrawal.profiles?.full_name || 'Unknown'}</p>
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
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;
