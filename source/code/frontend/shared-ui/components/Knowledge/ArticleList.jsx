// frontend/shared-ui/components/Knowledge/ArticleList.jsx
import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { useDebounce } from '../../hooks/useDebounce';
import Badge from '../Badge';
import Spinner from '../Spinner';

export default function ArticleList({ category, lang, onSelectArticle }) {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [search, setSearch]     = useState('');
  const debouncedSearch         = useDebounce(search, 400);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    const params = {};
    if (category)         params.category = category;
    if (lang)             params.lang     = lang;
    if (debouncedSearch)  params.q        = debouncedSearch;

    api.get('/knowledge', { params })
      .then((res) => {
        if (!cancelled) {
          setArticles(res.data?.data ?? res.data ?? []);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.response?.data?.message ?? 'Failed to load articles.');
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [category, lang, debouncedSearch]);

  return (
    <div className="flex flex-col gap-4">
      {/* Search */}
      <div className="relative">
        <span className="absolute inset-y-0 left-3 flex items-center text-gray-400 pointer-events-none">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" strokeLinecap="round" />
          </svg>
        </span>
        <input
          type="search"
          placeholder="Search articles…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
        />
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner size="md" />
        </div>
      ) : error ? (
        <p className="text-sm text-red-500 text-center py-8">{error}</p>
      ) : articles.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-12">No articles found.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {articles.map((article) => (
            <li key={article.id ?? article.slug}>
              <button
                onClick={() => onSelectArticle?.(article)}
                className="w-full text-left rounded-xl border border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm transition-all px-4 py-3 flex flex-col gap-1.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-medium text-sm text-gray-800 leading-snug">
                    {article.title}
                  </span>
                  {article.category && (
                    <Badge variant="info" className="shrink-0">{article.category}</Badge>
                  )}
                </div>
                {article.summary && (
                  <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                    {article.summary}
                  </p>
                )}
                <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                  {article.views ?? 0} views
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
