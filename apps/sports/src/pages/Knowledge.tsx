import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import { ArticleList } from '@ui/index';
import api from '../api/client';

const CATEGORIES = [
  { value: '',           label: 'Tất cả' },
  { value: 'general',    label: 'Tổng quan' },
  { value: 'rules',      label: 'Quy tắc' },
  { value: 'faq',        label: 'FAQ' },
  { value: 'tutorial',   label: 'Hướng dẫn' },
];

export default function Knowledge() {
  const navigate  = useNavigate();
  const [category, setCategory] = useState('');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3">
        <BookOpen size={22} className="text-green-500" />
        <div>
          <h1 className="text-lg font-bold text-gray-900">Trung tâm trợ giúp</h1>
          <p className="text-xs text-gray-500">Tìm câu trả lời nhanh chóng</p>
        </div>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto px-4 py-3 bg-white border-b border-gray-100 no-scrollbar">
        {CATEGORIES.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setCategory(value)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              category === value
                ? 'bg-green-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Article list */}
      <div className="bg-white mt-2 rounded-xl mx-3 shadow-sm overflow-hidden pt-3">
        <ArticleList
          category={category}
          apiClient={api}
          onSelectArticle={(article) => navigate(`/knowledge/${article.slug}`)}
        />
      </div>
    </div>
  );
}
