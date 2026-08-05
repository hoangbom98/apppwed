import { Link } from 'react-router-dom';
import { formatRelativeTime } from '../utils/formatters';
import { Heart, MessageCircle, Share2 } from 'lucide-react';

interface Post {
  id: number;
  content?: string;
  images?: string[];
  type: string;
  likes: number;
  comments: number;
  createdAt: string;
  user: { id: number; fullName?: string; username?: string; avatar?: string };
}

export default function PostCard({ post, onLike }: { post: Post; onLike?: (id: number) => void }) {
  return (
    <div className="bg-gray-800 rounded-xl p-3">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        {post.user.avatar
          ? <img src={post.user.avatar} className="w-8 h-8 rounded-full object-cover" alt="" />
          : <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-xs font-bold">
              {(post.user.fullName || post.user.username || 'U')[0].toUpperCase()}
            </div>}
        <div>
          <p className="text-sm font-semibold leading-none">{post.user.fullName || post.user.username}</p>
          <p className="text-[10px] text-gray-500">{formatRelativeTime(post.createdAt)}</p>
        </div>
      </div>

      {/* Content */}
      {post.content && <p className="text-sm text-gray-200 mb-2 whitespace-pre-wrap">{post.content}</p>}

      {/* Images */}
      {post.images && post.images.length > 0 && (
        <div className={`grid gap-1 mb-2 ${post.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
          {post.images.map((img, i) => (
            <img key={i} src={img} className="w-full aspect-square object-cover rounded-lg" alt="" />
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-4 mt-2 pt-2 border-t border-gray-700/50">
        <button
          onClick={() => onLike?.(post.id)}
          className="flex items-center gap-1.5 text-gray-400 hover:text-red-400 transition-colors text-xs"
        >
          <Heart size={14} />{post.likes}
        </button>
        <Link to={`/community`} className="flex items-center gap-1.5 text-gray-400 text-xs">
          <MessageCircle size={14} />{post.comments}
        </Link>
        <button className="flex items-center gap-1.5 text-gray-400 text-xs ml-auto">
          <Share2 size={14} />
        </button>
      </div>
    </div>
  );
}
