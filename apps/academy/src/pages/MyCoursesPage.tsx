import { Link } from 'react-router-dom';
import { BookOpen, ChevronRight } from 'lucide-react';
import { useMyEnrollments } from '../hooks/useAcademy';

const STATUS_CONFIG = {
  active:    { label: 'Đang học',   color: '#065f46', bg: '#d1fae5' },
  completed: { label: 'Hoàn thành', color: '#1d4ed8', bg: '#dbeafe' },
  refunded:  { label: 'Đã hoàn',    color: '#991b1b', bg: '#fee2e2' },
};

export default function MyCoursesPage() {
  const { data: enrollments = [], isLoading } = useMyEnrollments();

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <div className="pt-2 mb-5">
        <h1 className="text-2xl font-black">Khóa học của tôi</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--ac-muted)' }}>
          {enrollments.length} khóa học đã đăng ký
        </p>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-white rounded-xl animate-pulse" style={{ border: '1px solid var(--ac-border)' }} />
          ))}
        </div>
      )}

      {!isLoading && enrollments.length === 0 && (
        <div className="py-16 text-center">
          <BookOpen size={48} color="var(--ac-muted)" className="mx-auto mb-3" />
          <p className="text-sm" style={{ color: 'var(--ac-muted)' }}>Bạn chưa đăng ký khóa học nào</p>
          <Link to="/courses"
            className="inline-block mt-4 px-6 py-2.5 rounded-xl font-semibold text-white text-sm"
            style={{ background: 'var(--ac-primary)' }}>
            Khám phá khóa học
          </Link>
        </div>
      )}

      <div className="space-y-3">
        {enrollments.map(enr => {
          const cfg = STATUS_CONFIG[enr.status] ?? STATUS_CONFIG.active;
          return (
            <Link key={enr.id} to={`/courses/${enr.course.slug}`}
              className="flex items-center gap-4 p-4 rounded-xl bg-white transition-all active:scale-[0.98]"
              style={{ border: '1px solid var(--ac-border)' }}>
              <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center"
                style={{ background: '#e0e7ff' }}>
                {enr.course.thumbnail
                  ? <img src={enr.course.thumbnail} alt="" className="w-full h-full object-cover" />
                  : <BookOpen size={24} color="#a5b4fc" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate">{enr.course.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: cfg.bg, color: cfg.color }}>
                    {cfg.label}
                  </span>
                  <span className="text-xs" style={{ color: 'var(--ac-muted)' }}>
                    {new Date(enr.createdAt).toLocaleDateString('vi-VN')}
                  </span>
                </div>
              </div>
              <ChevronRight size={16} color="var(--ac-muted)" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
