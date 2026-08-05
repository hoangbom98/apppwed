import { useParams, useNavigate } from 'react-router-dom';
import { ArticleDetail } from '@ui/index';
import api from '../api/client';

export default function KnowledgeDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate  = useNavigate();

  return (
    <div className="min-h-screen bg-white">
      <ArticleDetail
        slug={slug!}
        lang="vi"
        apiClient={api}
        onBack={() => navigate(-1)}
      />
    </div>
  );
}
