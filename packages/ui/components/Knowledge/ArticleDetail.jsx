// frontend/shared-ui/components/Knowledge/ArticleDetail.jsx
import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import Badge from '../Badge';
import Spinner from '../Spinner';
import Button from '../Button';

export default function ArticleDetail({ slug, lang, onBack }) {
  const [article, setArticle]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [liked, setLiked]       = useState(false);
  const [liking, setLiking]     = useState(false);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    setLoading(true);
    setError('');
    setLiked(false);

    const params = lang ? { lang } : {};
    api.get(`/knowledge/${slug}`, { params })
      .then((res) => {
        if (!cancelled) {
          setArticle(res.data?.data ?? res.data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.response?.data?.message ?? 'Failed to load article.');
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [slug, lang]);

  const handleLike = async () => {
    if (liked || liking) return;
    setLiking(true);
    try {
      await api.post(`/knowledge/${slug}/like`);
      setLiked(true);
      // Optimistically bump the view/like counter shown from local state
      setArticle((a) => a ? { ...a, likes: (a.likes ?? 0) + 1 } : a);
    } catch {
      // silently fail (unauthenticated or already liked)
    } finally {
      setLiking(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Back button */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors self-start"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : error ? (
        <p className="text-sm text-red-500 text-center py-10">{error}</p>
      ) : article ? (
        <article className="flex flex-col gap-4">
          {/* Title row */}
          <div className="flex flex-col gap-2">
            <div className="flex items-start justify-between gap-3">
              <h1 className="text-xl font-bold text-gray-900 leading-snug">{article.title}</h1>
              {article.category && (
                <Badge variant="info" className="shrink-0 mt-0.5">{article.category}</Badge>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                {article.views ?? 0} views
              </span>
              {article.likes !== undefined && (
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 116.364 6.364L12 20.364l-7.682-7.682a4.5 4.5 0 010-6.364z" />
                  </svg>
                  {article.likes} likes
                </span>
              )}
            </div>
          </div>

          {/* Article body */}
          <div
            className="prose prose-sm max-w-none text-gray-700 leading-relaxed"
            /* eslint-disable-next-line react/no-danger */
            dangerouslySetInnerHTML={{ __html: article.content }}
          />

          {/* Like button */}
          <div className="pt-2 border-t border-gray-100">
            <Button
              variant={liked ? 'secondary' : 'outline'}
              size="sm"
              loading={liking}
              disabled={liked}
              onClick={handleLike}
              className="gap-1.5"
            >
              <svg className="w-4 h-4" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 116.364 6.364L12 20.364l-7.682-7.682a4.5 4.5 0 010-6.364z" />
              </svg>
              {liked ? 'Liked!' : 'Helpful?'}
            </Button>
          </div>
        </article>
      ) : null}
    </div>
  );
}
