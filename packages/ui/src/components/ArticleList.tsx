// packages/shared-ui/src/components/ArticleList.tsx
import React from 'react';

interface Article {
  id:        string | number;
  title:     string;
  summary?:  string;
  image?:    string;
  createdAt?: string;
  slug?:     string;
  [key: string]: any;
}

interface ArticleListProps {
  articles?:        Article[];
  loading?:         boolean;
  onSelect?:        (article: Article) => void;
  onSelectArticle?: (article: Article) => void;
  emptyText?:       string;
  category?:        string;
  apiClient?:       any;
}

export const ArticleList: React.FC<ArticleListProps> = ({
  articles = [], loading = false, onSelect, onSelectArticle, emptyText = 'Chưa có bài viết',
}) => {
  const handleSelect = (article: Article) => {
    onSelect?.(article);
    onSelectArticle?.(article);
  };
  if (loading) return <div style={{ padding: 24, textAlign: 'center' }}>Đang tải...</div>;
  if (!articles.length) return <div style={{ padding: 24, textAlign: 'center', color: '#8892b0' }}>{emptyText}</div>;
  return (
    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
      {articles.map((a) => (
        <li key={a.id}
            onClick={() => handleSelect(a)}
            style={{ padding: '12px 0', borderBottom: '1px solid #e5e7eb', cursor: onSelect ? 'pointer' : 'default' }}>
          <strong>{a.title}</strong>
          {a.summary && <p style={{ margin: '4px 0 0', color: '#57606a', fontSize: 13 }}>{a.summary}</p>}
        </li>
      ))}
    </ul>
  );
};
