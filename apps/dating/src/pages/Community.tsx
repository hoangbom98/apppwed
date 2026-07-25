import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getPosts } from '@/api/community';
import { COMMUNITY_TOPICS } from '@/utils/constants';
import PageHeader from '@/components/common/PageHeader';
import Avatar from '@/components/common/Avatar';
import { Heart, MessageCircle, Plus } from 'lucide-react';
import { GlobalOutlined, MessageOutlined } from '@ant-design/icons';
import { formatTime } from '@/utils/formatters';

export default function Community() {
  const navigate = useNavigate();
  const [topic, setTopic] = useState('');
  const { data } = useQuery({
    queryKey: ['community-posts', topic],
    queryFn: () => getPosts(topic || undefined),
  });
  const posts = data?.posts || [];

  return (
    <div>
      <PageHeader title="Cộng đồng" rightSlot={
        <button className="p-2 rounded-full bg-pink-500 text-white"><Plus size={18} /></button>
      } />

      {/* Topic pills */}
      <div className="flex gap-2 px-4 pb-4 overflow-x-auto scrollbar-none">
        <button onClick={() => setTopic('')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap ${!topic ? 'bg-pink-500 text-white' : 'bg-gray-100 text-gray-600'}`}>
          <GlobalOutlined /> Tất cả
        </button>
        {COMMUNITY_TOPICS.map(t => (
          <button key={t.id} onClick={() => setTopic(t.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${topic === t.id ? 'bg-pink-500 text-white' : t.color}`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {posts.length === 0 ? (
        <div className="flex flex-col items-center py-16">
          <div className="text-5xl mb-3"><MessageOutlined style={{ fontSize: 48, color: '#d1d5db' }} /></div>
          <p className="text-gray-400 text-sm">Chưa có bài viết</p>
        </div>
      ) : (
        <div className="space-y-3 px-4">
          {posts.map((p: any) => (
            <div key={p.id} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
              <div className="flex items-center gap-2.5 mb-3">
                <Avatar src={p.author?.avatar} name={p.author?.full_name} size={36} />
                <div>
                  <p className="font-semibold text-sm text-gray-900">{p.author?.full_name}</p>
                  <p className="text-xs text-gray-400">{formatTime(p.created_at)}</p>
                </div>
                <span className="ml-auto text-xs bg-pink-50 text-pink-600 px-2 py-0.5 rounded-full font-medium">
                  {p.topic}
                </span>
              </div>
              <h4 className="font-bold text-gray-900 text-sm mb-1">{p.title}</h4>
              <p className="text-gray-600 text-xs line-clamp-3">{p.content}</p>
              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-50">
                <button className="flex items-center gap-1.5 text-gray-400 text-xs">
                  <Heart size={14} className={p.is_liked ? 'fill-pink-500 text-pink-500' : ''} /> {p.like_count}
                </button>
                <button className="flex items-center gap-1.5 text-gray-400 text-xs">
                  <MessageCircle size={14} /> {p.comment_count}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
