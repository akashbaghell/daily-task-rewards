import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Upload as UploadIcon, Video, Image, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

const CATEGORIES = [
  'entertainment',
  'education',
  'gaming',
  'music',
  'sports',
  'news',
  'comedy',
  'technology',
  'lifestyle',
  'other'
];

const Upload = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('entertainment');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStep, setUploadStep] = useState('');
  
  const videoInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Login Required</h1>
          <p className="text-muted-foreground mb-6">You need to be logged in to upload videos.</p>
          <Button onClick={() => navigate('/auth')}>Login Now</Button>
        </div>
      </div>
    );
  }

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 100 * 1024 * 1024) {
        toast.error('Video file must be less than 100MB');
        return;
      }
      if (!file.type.startsWith('video/')) {
        toast.error('Please select a valid video file');
        return;
      }
      setVideoFile(file);
    }
  };

  const handleThumbnailSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Thumbnail must be less than 5MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file');
        return;
      }
      setThumbnailFile(file);
    }
  };

  const handleUpload = async () => {
    if (!title.trim()) {
      toast.error('Please enter a video title');
      return;
    }
    if (!videoFile) {
      toast.error('Please select a video file');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Step 1: Upload video
      setUploadStep('Uploading video...');
      const videoPath = `${user.id}/${Date.now()}_${videoFile.name}`;
      
      const { error: videoError } = await supabase.storage
        .from('videos')
        .upload(videoPath, videoFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (videoError) throw videoError;
      setUploadProgress(50);

      // Get video URL
      const { data: videoUrlData } = supabase.storage
        .from('videos')
        .getPublicUrl(videoPath);

      // Step 2: Upload thumbnail if provided
      let thumbnailUrl = null;
      if (thumbnailFile) {
        setUploadStep('Uploading thumbnail...');
        const thumbPath = `${user.id}/${Date.now()}_${thumbnailFile.name}`;
        
        const { error: thumbError } = await supabase.storage
          .from('thumbnails')
          .upload(thumbPath, thumbnailFile, {
            cacheControl: '3600',
            upsert: false,
          });

        if (thumbError) throw thumbError;

        const { data: thumbUrlData } = supabase.storage
          .from('thumbnails')
          .getPublicUrl(thumbPath);
        
        thumbnailUrl = thumbUrlData.publicUrl;
      }
      setUploadProgress(75);

      // Step 3: Create video record
      setUploadStep('Creating video record...');
      const { error: dbError } = await supabase
        .from('videos')
        .insert({
          title: title.trim(),
          description: description.trim() || null,
          category,
          youtube_id: '', // Empty for uploaded videos
          video_url: videoUrlData.publicUrl,
          thumbnail_url: thumbnailUrl,
          uploader_id: user.id,
          status: 'approved', // Auto-approve for now
        });

      if (dbError) throw dbError;
      setUploadProgress(100);

      toast.success('Video uploaded successfully!');
      navigate('/videos');
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to upload video');
    } finally {
      setUploading(false);
      setUploadStep('');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Button
          variant="ghost"
          size="sm"
          className="mb-6"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold font-display">Upload Video</h1>
            <p className="text-muted-foreground mt-2">
              Share your video and earn from ad revenue when people watch it
            </p>
          </div>

          {/* Video Upload */}
          <div className="space-y-2">
            <Label>Video File *</Label>
            <input
              ref={videoInputRef}
              type="file"
              accept="video/*"
              onChange={handleVideoSelect}
              className="hidden"
            />
            <div
              onClick={() => videoInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
                ${videoFile ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'}`}
            >
              {videoFile ? (
                <div className="flex items-center justify-center gap-3">
                  <CheckCircle className="h-8 w-8 text-primary" />
                  <div className="text-left">
                    <p className="font-medium">{videoFile.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(videoFile.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <Video className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="font-medium">Click to select video</p>
                  <p className="text-sm text-muted-foreground">Max 100MB • MP4, WebM, MOV</p>
                </>
              )}
            </div>
          </div>

          {/* Thumbnail Upload */}
          <div className="space-y-2">
            <Label>Thumbnail (Optional)</Label>
            <input
              ref={thumbnailInputRef}
              type="file"
              accept="image/*"
              onChange={handleThumbnailSelect}
              className="hidden"
            />
            <div
              onClick={() => thumbnailInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
                ${thumbnailFile ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'}`}
            >
              {thumbnailFile ? (
                <div className="flex items-center justify-center gap-3">
                  <CheckCircle className="h-6 w-6 text-primary" />
                  <p className="font-medium">{thumbnailFile.name}</p>
                </div>
              ) : (
                <>
                  <Image className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm">Click to add thumbnail</p>
                </>
              )}
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter video title"
              maxLength={100}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your video..."
              rows={4}
              maxLength={500}
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Upload Progress */}
          {uploading && (
            <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">{uploadStep}</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}

          {/* Revenue Info */}
          <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
            <h3 className="font-semibold mb-2">💰 Earn from your videos</h3>
            <p className="text-sm text-muted-foreground">
              You'll earn 70% of ad revenue when viewers watch ads on your videos. 
              The more views, the more you earn!
            </p>
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleUpload}
            disabled={uploading || !videoFile || !title.trim()}
            className="w-full"
            size="lg"
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <UploadIcon className="h-4 w-4 mr-2" />
                Upload Video
              </>
            )}
          </Button>
        </div>
      </main>
    </div>
  );
};

export default Upload;
