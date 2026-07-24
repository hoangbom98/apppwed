import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPosts, createPost, likePost } from '../api/sports';
import PostCard from '../components/PostCard';
import { useAuthStore } from '../store/authStore';
import { Plus, X } from 'lucide-react';

export default function CommunityPage() {
  const { isLoggedIn } = useAuthStore();
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [content, setContent] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['posts'],
    queryFn: () => getPosts({ limit: 20 }),
    staleTime: 60_000,
  });
  const posts: any[] = data?.posts || [];

  const createMutation = useMutation({
    mutationFn: () => createPost({ content, type: 'text' }),
    onSuccess: () => {
      setContent('');
      setShowCreate(false);
      qc.invalidateQueries({ queryKey: ['posts'] });
    },
  });

  const likeMutation = useMutation({
    mutationFn: likePost,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['posts'] }),
  });

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-base font-bold">🏟️ Cộng đồng</h1>
        {isLoggedIn && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1 px-3 py-1.5 bg-green-600 rounded-full text-xs font-semibold"
          >
            <Plus size={12} /> Đăng bài
          </button>
        )}
      </div>

      {/* Create post modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center p-4">
          <div className="bg-gray-900 rounded-2xl w-full max-w-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Đăng bài mới</h3>
              <button onClick={() => setShowCreate(false)}><X size={18} /></button>
            </div>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              rows={4}
              placeholder="Chia sẻ suy nghĩ của bạn về thể thao..."
              className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-sm resize-none focus:outline-none focus:border-green-500"
            />
            <div className="flex gap-2 mt-3">
              <button onClick={() => setShowCreate(false)} className="flex-1 py-2 bg-gray-800 rounded-xl text-sm font-medium">Hủy</button>
              <button
                onClick={() => content.trim() && createMutation.mutate()}
                disabled={!content.trim() || createMutation.isPending}
                className="flex-1 py-2 bg-green-600 rounded-xl text-sm font-semibold disabled:opacity-50"
              >Đăng</button>
            </div>
          </div>
        </div>
      )}

      {/* Feed */}
      {isLoading && (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-32 bg-gray-800 rounded-xl animate-pulse" />)}
        </div>
      )}

      <div className="space-y-3">
        {posts.map((p: any) => (
          <PostCard key={p.id} post={p} onLike={(id) => isLoggedIn && likeMutation.mutate(id)} />
        ))}
      </div>

      {!isLoading && posts.length === 0 && (
        <div className="text-center py-16 text-gray-500">
          <p className="text-3xl mb-3">🏟️</p>
          <p>Chưa có bài viết nào. Hãy là người đầu tiên!</p>
        </div>
      )}
    </div>
  );
}
