import { forwardRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface VideoCardProps {
  id: string;
  title: string;
  youtubeId: string;
  thumbnailUrl: string | null;
  category: string;
}

export const VideoCard = forwardRef<HTMLDivElement, VideoCardProps>(
  ({ id, title, youtubeId, thumbnailUrl, category }, ref) => {
    const navigate = useNavigate();
    const thumbnail = thumbnailUrl || `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`;

    const categoryColors: Record<string, string> = {
      entertainment: 'bg-pink-500/10 text-pink-600',
      education: 'bg-blue-500/10 text-blue-600',
      tech: 'bg-purple-500/10 text-purple-600',
      music: 'bg-green-500/10 text-green-600',
    };

    return (
      <Card
        ref={ref}
        className="group cursor-pointer overflow-hidden border-0 shadow-md transition-all hover:shadow-xl hover:-translate-y-1"
        onClick={() => navigate(`/watch/${id}`)}
      >
        <div className="relative aspect-video overflow-hidden">
          <img
            src={thumbnail}
            alt={title}
            loading="lazy"
            width={480}
            height={270}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={(e) => {
              (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">
              <Play className="h-6 w-6 ml-1" />
            </div>
          </div>
          <span
            className={`absolute top-3 left-3 px-2 py-1 rounded-md text-xs font-medium capitalize ${
              categoryColors[category] || 'bg-muted text-muted-foreground'
            }`}
          >
            {category}
          </span>
        </div>
        <CardContent className="p-4">
          <h3 className="font-medium text-foreground line-clamp-2 group-hover:text-primary transition-colors">
            {title}
          </h3>
        </CardContent>
      </Card>
    );
  }
);

VideoCard.displayName = 'VideoCard';