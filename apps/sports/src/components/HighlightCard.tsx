import { Link } from 'react-router-dom';
import { Play } from 'lucide-react';
import { formatDuration } from '../utils/formatters';

interface Highlight {
  id: number;
  slug: string;
  title: string;
  thumbnail?: string;
  duration?: number;
  views: number;
  match?: {
    homeTeam: { name: string };
    awayTeam: { name: string };
  };
}

export default function HighlightCard({ highlight, onClick }: { highlight: Highlight; onClick?: () => void }) {
  const inner = (
    <div className="bg-gray-800 rounded-xl overflow-hidden group cursor-pointer">
      <div className="relative aspect-video bg-gray-700">
        {highlight.thumbnail
          ? <img src={highlight.thumbnail} alt={highlight.title} className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center text-gray-600 text-xs">Video</div>}
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-10 h-10 bg-white/90 rounded-full flex items-center justify-center">
            <Play size={16} className="text-gray-900 ml-0.5" />
          </div>
        </div>
        {highlight.duration && (
          <span className="absolute bottom-1.5 right-1.5 bg-black/70 text-white text-[10px] px-1 rounded">
            {formatDuration(highlight.duration)}
          </span>
        )}
      </div>
      <div className="p-2.5">
        <p className="text-sm font-medium line-clamp-2">{highlight.title}</p>
        {highlight.match && (
          <p className="text-xs text-gray-500 mt-0.5">
            {highlight.match.homeTeam.name} vs {highlight.match.awayTeam.name}
          </p>
        )}
      </div>
    </div>
  );

  if (onClick) return <div onClick={onClick}>{inner}</div>;
  return <Link to={`/highlights/${highlight.slug}`}>{inner}</Link>;
}
