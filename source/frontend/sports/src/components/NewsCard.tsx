import React from 'react';
import { Link } from 'react-router-dom';
import { formatRelativeTime } from '../utils/formatters';

interface Article {
  id: number;
  slug: string;
  title: string;
  summary?: string;
  image?: string;
  category: string;
  publishedAt?: string;
  createdAt: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  news:     'bg-blue-600/20 text-blue-400',
  transfer: 'bg-purple-600/20 text-purple-400',
  analysis: 'bg-yellow-600/20 text-yellow-400',
  interview:'bg-green-600/20 text-green-400',
  opinion:  'bg-red-600/20 text-red-400',
};

export default function NewsCard({ article }: { article: Article }) {
  const colorClass = CATEGORY_COLORS[article.category] || 'bg-gray-600/20 text-gray-400';
  const timeStr = formatRelativeTime(article.publishedAt || article.createdAt);

  return (
    <Link to={`/news/${article.slug}`} className="block">
      <div className="bg-gray-800 rounded-xl overflow-hidden flex gap-3 p-3">
        {article.image && (
          <img src={article.image} alt={article.title} className="w-24 h-16 object-cover rounded-lg flex-shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${colorClass}`}>
              {article.category.toUpperCase()}
            </span>
            <span className="text-[10px] text-gray-500">{timeStr}</span>
          </div>
          <p className="text-sm font-medium line-clamp-2 leading-snug">{article.title}</p>
        </div>
      </div>
    </Link>
  );
}
