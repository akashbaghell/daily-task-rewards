import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { 
  Upload, 
  Video, 
  IndianRupee, 
  Eye, 
  TrendingUp,
  Plus,
  Trash2,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';

interface CreatorVideo {
  id: string;
  title: string;
  thumbnail_url: string | null;
  view_count: number;
  total_earnings: number;
  status: string;
  created_at: string;
}

interface CreatorStats {
  totalVideos: number;
  totalViews: number;
  totalEarnings: number;
  pendingEarnings: number;
}

const CreatorDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [videos, setVideos] = useState<CreatorVideo[]>([]);
  const [stats, setStats] = useState<CreatorStats>({
    totalVideos: 0,
    totalViews: 0,
    totalEarnings: 0,
    pendingEarnings: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    const fetchCreatorData = async () => {
      // Fetch creator's videos
      const { data: videosData } = await supabase
        .from('videos')
        .select('id, title, thumbnail_url, view_count, total_earnings, status, created_at')
        .eq('uploader_id', user.id)
        .order('created_at', { ascending: false });

      if (videosData) {
        setVideos(videosData as CreatorVideo[]);
        
        // Calculate stats
        const totalViews = videosData.reduce((sum, v) => sum + (v.view_count || 0), 0);
        const totalEarnings = videosData.reduce((sum, v) => sum + Number(v.total_earnings || 0), 0);
        
        setStats({
          totalVideos: videosData.length,
          totalViews,
          totalEarnings,
          pendingEarnings: 0,
        });
      }

      setLoading(false);
    };

    fetchCreatorData();
  }, [user, navigate]);

  const handleDeleteVideo = async (videoId: string) => {
    if (!confirm('Are you sure you want to delete this video?')) return;

    const { error } = await supabase
      .from('videos')
      .delete()
      .eq('id', videoId);

    if (error) {
      toast.error('Failed to delete video');
    } else {
      setVideos(videos.filter(v => v.id !== videoId));
      toast.success('Video deleted');
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold font-display">Creator Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Manage your videos and track earnings
            </p>
          </div>
          <Button onClick={() => navigate('/upload')} className="gap-2">
            <Plus className="h-4 w-4" />
            Upload Video
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Videos
              </CardTitle>
              <Video className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalVideos}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Views
              </CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalViews.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Earnings
              </CardTitle>
              <IndianRupee className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                ₹{stats.totalEarnings.toFixed(2)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Revenue Share
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">70%</div>
              <p className="text-xs text-muted-foreground">of ad revenue</p>
            </CardContent>
          </Card>
        </div>

        {/* Videos Table */}
        <Card>
          <CardHeader>
            <CardTitle>Your Videos</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : videos.length === 0 ? (
              <div className="text-center py-12">
                <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No videos yet</h3>
                <p className="text-muted-foreground mb-4">
                  Upload your first video and start earning from ad revenue
                </p>
                <Button onClick={() => navigate('/upload')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Upload Video
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Video</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Views</TableHead>
                    <TableHead className="text-right">Earnings</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {videos.map((video) => (
                    <TableRow key={video.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-16 h-9 rounded bg-muted overflow-hidden flex-shrink-0">
                            {video.thumbnail_url ? (
                              <img 
                                src={video.thumbnail_url} 
                                alt={video.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Video className="h-4 w-4 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <span className="font-medium line-clamp-1">{video.title}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium
                          ${video.status === 'approved' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                            video.status === 'pending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' :
                            'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'}`}>
                          {video.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {(video.view_count || 0).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right text-green-600">
                        ₹{Number(video.total_earnings || 0).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(`/watch/${video.id}`)}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteVideo(video.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default CreatorDashboard;
