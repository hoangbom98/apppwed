// @ts-nocheck
// packages/shared-ui/src/components/ArticleDetail.tsx
import React from 'react';

interface ArticleDetailProps {
  title?:     string;
  content?:   string;
  image?:     string;
  author?:    string;
  createdAt?: string;
  loading?:   boolean;
  [key: string]: any;
}

export const ArticleDetail: React.FC<ArticleDetailProps> = ({
  title, content, image, author, createdAt, loading,
}) => {
  if (loading) return <div style={{ padding: 32, textAlign: 'center' }}>Đang tải...</div>;
  return (
    <article style={{ maxWidth: 720, margin: '0 auto', padding: '0 16px' }}>
      {image && <img src={image} alt={title} style={{ width: '100%', borderRadius: 8, marginBottom: 16 }} />}
      <h1 style={{ marginBottom: 8 }}>{title}</h1>
      {(author || createdAt) && (
        <p style={{ color: '#57606a', fontSize: 13, marginBottom: 16 }}>
          {author && <span>{author}</span>}
          {author && createdAt && ' · '}
          {createdAt && <time>{createdAt}</time>}
        </p>
      )}
      {content && <div dangerouslySetInnerHTML={{ __html: content }} />}
    </article>
  );
};
