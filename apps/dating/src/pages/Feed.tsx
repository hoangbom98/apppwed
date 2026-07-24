import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getFeed, likePost, unlikePost } from '@/api/feed';
import { useAuthStore } from '@/store/authStore';
import Avatar from '@/components/common/Avatar';
import { Heart, MessageCircle, Share2, MoreHorizontal, Plus, Video, Image as ImageIcon, Smile } from 'lucide-react';
import { formatTime } from '@/utils/formatters';
import BottomSheet from '@/components/common/BottomSheet';

function PostCard({ post, onLike, onComment }: { post: any; onLike: () => void; onComment: () => void }) {
  const navigate = useNavigate();
  return (
    <div className="bg-white border-b border-gray-50 pb-2">
      <div className="flex items-center gap-3 px-4 py-3">
        <Avatar src={post.author.avatar} name={post.author.full_name} size={40}
          className="cursor-pointer" />
        <div className="flex-1 cursor-pointer" onClick={() => navigate(`/profile/${post.author.id}`)}>
          <p className="font-semibold text-sm text-gray-900">{post.author.full_name}</p>
          <p className="text-xs text-gray-400">{formatTime(post.created_at)}</p>
        </div>
        <button className="text-gray-400"><MoreHorizontal size={18} /></button>
      </div>

      {/* Content */}
      {post.content && <p className="text-sm text-gray-800 px-4 mb-2 leading-relaxed">{post.content}</p>}

      {/* Media */}
      {post.images?.length > 0 && (
        <div className={`grid ${post.images.length > 1 ? 'grid-cols-2' : 'grid-cols-1'} gap-0.5`}>
          {post.images.slice(0, 4).map((img: string, idx: number) => (
            <div key={idx} className={`relative ${post.images.length === 1 ? 'aspect-video' : 'aspect-square'} overflow-hidden`}>
              <img src={img} alt="" className="w-full h-full object-cover" />
              {idx === 3 && post.images.length > 4 && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <span className="text-white font-bold text-xl">+{post.images.length - 4}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Tags */}
      {post.hashtags?.length > 0 && (
        <div className="px-4 mt-2 flex flex-wrap gap-1">
          {post.hashtags.map((tag: string) => (
            <span key={tag} className="text-pink-500 text-xs font-medium">#{tag}</span>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-4 px-4 pt-3 pb-1">
        <button onClick={onLike} className="flex items-center gap-1.5 text-gray-500 hover:text-pink-500 transition-colors">
          <Heart size={20} className={post.is_liked ? 'fill-pink-500 text-pink-500' : ''} />
          <span className="text-xs font-medium">{post.like_count || 0}</span>
        </button>
        <button onClick={onComment} className="flex items-center gap-1.5 text-gray-500">
          <MessageCircle size={20} />
          <span className="text-xs font-medium">{post.comment_count || 0}</span>
        </button>
        <button className="flex items-center gap-1.5 text-gray-500 ml-auto">
          <Share2 size={18} />
        </button>
      </div>
    </div>
  );
}

export default function Feed() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [showCompose, setShowCompose] = useState(false);

  const { data, fetchNextPage, hasNextPage, isFetching } = useInfiniteQuery({
    queryKey: ['feed'],
    queryFn: ({ pageParam = 0 }) => getFeed({ offset: pageParam, limit: 10 }),
    initialPageParam: 0,
    getNextPageParam: (last: any, all) => last.has_more ? all.length * 10 : undefined,
  });

  const likeMut = useMutation({
    mutationFn: ({ id, liked }: { id: number; liked: boolean }) => liked ? unlikePost(id) : likePost(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['feed'] }),
  });

  const posts = data?.pages.flatMap((p: any) => p.posts || []) || [];

  return (
    <div>
      <div className="px-4 pt-4 pb-3 border-b border-gray-50 flex items-center gap-3">
        <Avatar src={user?.avatar} name={user?.full_name} size={36} />
        <button onClick={() => setShowCompose(true)}
          className="flex-1 bg-gray-100 rounded-full px-4 py-2.5 text-sm text-gray-400 text-left">
          Bạn đang nghĩ gì?
        </button>
        <button onClick={() => setShowCompose(true)} className="p-2.5 bg-pink-500 rounded-full text-white">
          <Plus size={16} />
        </button>
      </div>

      <div>
        {posts.map((post: any) => (
          <PostCard key={post.id} post={post}
            onLike={() => likeMut.mutate({ id: post.id, liked: post.is_liked })}
            onComment={() => {}}
          />
        ))}
      </div>

      {hasNextPage && (
        <button onClick={() => fetchNextPage()} disabled={isFetching}
          className="w-full py-4 text-sm text-pink-500 font-medium">
          {isFetching ? 'Đang tải...' : 'Tải thêm'}
        </button>
      )}

      {posts.length === 0 && !isFetching && (
        <div className="flex flex-col items-center py-16">
          <div className="text-5xl mb-3">🌸</div>
          <p className="text-gray-400 text-sm">Chưa có bài viết nào</p>
        </div>
      )}

      {/* Compose Sheet */}
      <BottomSheet isOpen={showCompose} onClose={() => setShowCompose(false)} title="Đăng bài viết">
        <div className="space-y-4 pt-2">
          <div className="flex items-start gap-3">
            <Avatar src={user?.avatar} name={user?.full_name} size={36} />
            <textarea placeholder="Bạn đang nghĩ gì?" rows={4}
              className="flex-1 text-sm text-gray-900 outline-none resize-none placeholder-gray-400" />
          </div>
          <div className="flex items-center gap-4 border-t border-gray-100 pt-3">
            <button className="flex items-center gap-1.5 text-gray-500 text-sm"><ImageIcon size={18} /> Ảnh</button>
            <button className="flex items-center gap-1.5 text-gray-500 text-sm"><Video size={18} /> Video</button>
            <button className="flex items-center gap-1.5 text-gray-500 text-sm"><Smile size={18} /> Cảm xúc</button>
            <button className="ml-auto px-5 py-2 bg-pink-500 text-white rounded-xl text-sm font-semibold">
              Đăng
            </button>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}
