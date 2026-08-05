import { useState } from 'react';
import Link from 'next/link';
import { BookOpen, Search, GraduationCap, ChevronRight } from 'lucide-react';
import { useCourses, type Course } from '../hooks/useAcademy';

const LEVEL_LABELS: Record<string, string> = {
  '': 'Tất cả',
  beginner: 'Cơ bản',
  intermediate: 'Trung cấp',
  advanced: 'Nâng cao',
};

function CourseCard({ course }: { course: Course }) {
  return (
    <Link
      href={`/courses/${course.slug}`}
      className="bg-white rounded-xl overflow-hidden border transition-all flex flex-col group hover:border-indigo-400 active:scale-[0.98]"
      style={{ border: '1px solid var(--ac-border)' }}
    >
      <div className="h-40 relative" style={{ background: '#e0e7ff' }}>
        {course.thumbnail
          ? <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center">
              <BookOpen size={40} color="#a5b4fc" />
            </div>
        }
        <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm px-2 py-0.5 rounded text-xs text-white capitalize">
          {LEVEL_LABELS[course.level] ?? course.level}
        </div>
        {course.price === 0 && (
          <div className="absolute top-3 left-3 px-2 py-0.5 rounded text-xs font-bold text-white"
            style={{ background: 'var(--ac-primary)' }}>Miễn phí</div>
        )}
      </div>
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="text-sm font-bold mb-1 group-hover:text-indigo-600 transition-colors line-clamp-2"
          style={{ color: 'var(--ac-text)' }}>{course.title}</h3>
        <p className="text-xs line-clamp-2 mb-3 flex-grow" style={{ color: 'var(--ac-muted)' }}>
          {course.description}
        </p>
        <div className="flex items-center justify-between mt-auto">
          <span className="text-sm font-bold" style={{ color: 'var(--ac-primary)' }}>
            {course.price > 0
              ? `${Number(course.price).toLocaleString('vi')} ${course.currency}`
              : 'Miễn phí'}
          </span>
          <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: 'var(--ac-primary)' }}>
            Chi tiết <ChevronRight size={14} />
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function CoursesPage() {
  const [level, setLevel] = useState('');
  const [search, setSearch] = useState('');
  const { data: courses = [], isLoading } = useCourses({ level: level || undefined });

  const filtered = search
    ? courses.filter(c => c.title.toLowerCase().includes(search.toLowerCase()))
    : courses;

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <header className="flex flex-col gap-3 mb-6 pt-2">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2">
            <GraduationCap size={26} color="var(--ac-primary)" />
            LKVIP Academy
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--ac-muted)' }}>
            Nâng cao kỹ năng với lộ trình đào tạo bài bản
          </p>
        </div>
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" color="var(--ac-muted)" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm khóa học..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
            style={{ background: '#fff', border: '1px solid var(--ac-border)' }}
          />
        </div>
      </header>

      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {Object.entries(LEVEL_LABELS).map(([val, label]) => (
          <button key={val} onClick={() => setLevel(val)}
            className="px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all"
            style={{
              background: level === val ? 'var(--ac-primary)' : '#fff',
              color:      level === val ? '#fff' : 'var(--ac-text)',
              border:     `1px solid ${level === val ? 'var(--ac-primary)' : 'var(--ac-border)'}`,
            }}>
            {label}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-56 bg-white rounded-xl animate-pulse" style={{ border: '1px solid var(--ac-border)' }} />
          ))}
        </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <div className="py-16 text-center">
          <BookOpen size={40} color="var(--ac-muted)" className="mx-auto mb-3" />
          <p style={{ color: 'var(--ac-muted)' }}>Không tìm thấy khóa học nào</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        {filtered.map(c => <CourseCard key={c.id} course={c} />)}
      </div>
    </div>
  );
}
