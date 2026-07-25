import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getArticle, getArticleComments, addArticleComment } from '../api/sports';
import { formatDateTime } from '../utils/formatters';
import CommentItem from '../components/CommentItem';
import { useAuthStore } from '../store/authStore';

export default function ArticleDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { isLoggedIn } = useAuthStore();
  const qc = useQueryClient();
  const [text, setText] = useState('');

  const { data: article, isLoading } = useQuery({
    queryKey: ['article', slug],
    queryFn: () => getArticle(slug!),
    staleTime: 300_000,
  });

  const { data: commentsData } = useQuery({
    queryKey: ['article-comments', article?.id],
    queryFn: () => getArticleComments(article!.id),
    enabled: !!article?.id,
    staleTime: 60_000,
  });
  const comments: any[] = commentsData?.comments || [];

  const commentMutation = useMutation({
    mutationFn: (content: string) => addArticleComment({ newsId: article!.id, content }),
    onSuccess: () => { setText(''); qc.invalidateQueries({ queryKey: ['article-comments', article?.id] }); },
  });

  if (isLoading) return (
    <div className="p-4 space-y-3">
      {[1,2,3].map(i => <div key={i} className="h-12 bg-gray-800 rounded animate-pulse" />)}
    </div>
  );
  if (!article) return <div className="p-4 text-gray-400">Không tìm thấy bài viết.</div>;

  return (
    <div className="p-4 pb-8">
      {article.image && (
        <img src={article.image} alt={article.title} className="w-full h-48 object-cover rounded-xl mb-4" />
      )}
      <span className="text-xs text-green-400 font-semibold uppercase">{article.category}</span>
      <h1 className="text-xl font-bold mt-1 mb-2">{article.title}</h1>
      <p className="text-xs text-gray-500 mb-4">
        {article.author?.fullName || 'Ban biên tập'} · {formatDateTime(article.publishedAt || article.createdAt)} · {article.views} lượt xem
      </p>
      <div className="prose prose-invert text-sm leading-relaxed text-gray-200" dangerouslySetInnerHTML={{ __html: article.content }} />

      {/* Comments */}
      <div className="mt-8 border-t border-gray-800 pt-4">
        <h3 className="text-sm font-semibold text-gray-300 mb-3">Bình luận ({comments.length})</h3>
        {isLoggedIn && (
          <div className="flex gap-2 mb-4">
            <input value={text} onChange={e => setText(e.target.value)}
              placeholder="Viết bình luận..."
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500" />
            <button onClick={() => text.trim() && commentMutation.mutate(text.trim())}
              className="px-4 py-2 bg-green-600 rounded-lg text-sm font-semibold disabled:opacity-50"
              disabled={commentMutation.isPending}>Gửi</button>
          </div>
        )}
        <div>{comments.map((c: any) => <CommentItem key={c.id} comment={c} />)}</div>
      </div>
    </div>
  );
}
