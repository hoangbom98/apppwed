import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, Lock, Play, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCourseDetail, useMyEnrollments, useEnrollCourse } from '../hooks/useAcademy';

export default function CourseDetailPage() {
  const { slug = '' } = useParams<{ slug: string }>();
  const nav = useNavigate();
  const { data: course, isLoading } = useCourseDetail(slug);
  const { data: enrollments = [] }  = useMyEnrollments();
  const { mutateAsync, isPending }  = useEnrollCourse();

  const enrollment = enrollments.find(e => e.courseId === course?.id);
  const isEnrolled = !!enrollment;

  const handleEnroll = async () => {
    if (!course) return;
    try {
      await mutateAsync({ courseId: course.id, referenceId: crypto.randomUUID() });
      toast.success('Đăng ký khóa học thành công!');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;
      toast.error(msg ?? 'Đăng ký thất bại');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: 'var(--ac-primary) transparent transparent transparent' }} />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-8">
        <BookOpen size={48} color="var(--ac-muted)" />
        <p style={{ color: 'var(--ac-muted)' }}>Khóa học không tồn tại</p>
        <button onClick={() => nav(-1)} className="text-sm font-semibold" style={{ color: 'var(--ac-primary)' }}>← Quay lại</button>
      </div>
    );
  }

  return (
    <div className="pb-8">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3"
        style={{ background: 'var(--ac-bg)' }}>
        <button onClick={() => nav(-1)}
          className="w-8 h-8 flex items-center justify-center rounded-full"
          style={{ background: 'var(--ac-surface)' }}>
          <ArrowLeft size={18} />
        </button>
        <h1 className="font-bold text-sm line-clamp-1">{course.title}</h1>
      </div>

      {/* Hero */}
      <div className="mx-4 rounded-2xl overflow-hidden">
        {course.thumbnail
          ? <img src={course.thumbnail} alt={course.title} className="w-full h-48 object-cover" />
          : <div className="h-48 flex items-center justify-center" style={{ background: 'var(--ac-card-bg)' }}>
              <BookOpen size={56} color="rgba(255,255,255,0.6)" />
            </div>
        }
      </div>

      <div className="mx-4 mt-4">
        <h2 className="text-xl font-black">{course.title}</h2>
        {course.description && (
          <p className="text-sm mt-2" style={{ color: 'var(--ac-muted)' }}>{course.description}</p>
        )}

        {/* Meta */}
        <div className="flex gap-3 mt-3 flex-wrap">
          {[
            { label: 'Cấp độ', value: course.level },
            { label: 'Bài học', value: `${course.totalLessons} bài` },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-lg px-3 py-1.5 text-xs"
              style={{ background: '#e0e7ff', color: 'var(--ac-primary)' }}>
              <span className="opacity-70">{label}: </span><strong>{value}</strong>
            </div>
          ))}
        </div>

        {/* Enroll button */}
        {!isEnrolled ? (
          <button onClick={handleEnroll} disabled={isPending}
            className="w-full mt-5 py-4 rounded-xl font-bold text-white disabled:opacity-50 active:scale-[0.98] transition-all"
            style={{ background: 'var(--ac-primary)' }}>
            {isPending ? 'Đang xử lý...' : course.price > 0
              ? `Đăng ký — ${Number(course.price).toLocaleString('vi')} ${course.currency}`
              : 'Đăng ký miễn phí'}
          </button>
        ) : (
          <div className="w-full mt-5 py-3 rounded-xl font-semibold text-center text-sm flex items-center justify-center gap-2"
            style={{ background: '#d1fae5', color: '#065f46' }}>
            <CheckCircle2 size={16} /> Đã đăng ký
          </div>
        )}
      </div>

      {/* Lessons */}
      {course.lessons.length > 0 && (
        <div className="mx-4 mt-6">
          <h3 className="font-bold text-base mb-3">Nội dung khóa học</h3>
          <div className="space-y-2">
            {course.lessons.map((lesson, idx) => {
              const accessible = isEnrolled || lesson.isFree;
              return (
                <div key={lesson.id}
                  className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ background: 'var(--ac-surface)', border: '1px solid var(--ac-border)', opacity: accessible ? 1 : 0.65 }}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: accessible ? '#e0e7ff' : '#f3f4f6' }}>
                    {accessible
                      ? <Play size={14} color="var(--ac-primary)" />
                      : <Lock size={14} color="var(--ac-muted)" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{idx + 1}. {lesson.title}</p>
                    {lesson.duration > 0 && (
                      <p className="text-xs" style={{ color: 'var(--ac-muted)' }}>
                        {Math.floor(lesson.duration / 60)} phút
                      </p>
                    )}
                  </div>
                  {lesson.isFree && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded"
                      style={{ background: '#d1fae5', color: '#065f46' }}>Free</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
