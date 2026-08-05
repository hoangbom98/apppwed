import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, Search, GraduationCap, ChevronRight } from 'lucide-react';
// @ts-ignore
import * as hubApi from '@/api/hub';

interface Course {
  id: string | number;
  title: string;
  description: string;
  thumbnail?: string;
  level: string;
  price: number;
  currency: string;
  slug: string;
}

export default function AcademyPage() {
  const [level, setLevel] = useState('');

  const { data: coursesData, isLoading } = useQuery({
    queryKey: ['courses', level],
    queryFn: () => hubApi.getCourses({ level: level || undefined }),
    staleTime: 60_000,
  });

  const courses = coursesData?.data || [];

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-bold text-gray-100 flex items-center gap-3">
            <GraduationCap className="w-8 h-8 text-indigo-400" />
            LKVIP Academy
          </h1>
          <p className="text-gray-400 mt-2">Nâng cao kỹ năng chuyên môn với lộ trình đào tạo bài bản.</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            placeholder="Tìm khóa học..."
            className="bg-gray-800 border border-gray-700 rounded-full pl-10 pr-4 py-2 text-sm text-gray-200 outline-none focus:border-indigo-500 transition-colors w-64"
          />
        </div>
      </header>

      {/* Filter */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
        {['', 'beginner', 'intermediate', 'advanced'].map((lvl) => (
          <button
            key={lvl}
            onClick={() => setLevel(lvl)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold capitalize transition-all ${
              level === lvl
                ? 'bg-indigo-500 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            {lvl || 'Tất cả'}
          </button>
        ))}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 bg-gray-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course: Course) => (
            <div key={course.id} className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700 hover:border-indigo-500 transition-all flex flex-col group">
              <div className="h-40 bg-gray-700 relative">
                {course.thumbnail ? (
                  <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <BookOpen className="w-12 h-12 text-gray-600" />
                  </div>
                )}
                <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm px-2 py-1 rounded text-xs text-white">
                  {course.level}
                </div>
              </div>
              <div className="p-5 flex flex-col flex-grow">
                <h3 className="text-lg font-bold text-gray-100 mb-2 group-hover:text-indigo-400 transition-colors">{course.title}</h3>
                <p className="text-sm text-gray-400 line-clamp-2 mb-4 flex-grow">{course.description}</p>
                <div className="flex items-center justify-between mt-auto">
                  <span className="text-lg font-bold text-indigo-400">
                    {course.price > 0 ? `${course.price.toLocaleString()} ${course.currency}` : 'Miễn phí'}
                  </span>
                  <a href={`/academy/${course.slug}`} className="flex items-center gap-1 text-sm text-indigo-300 font-semibold hover:text-white transition-colors">
                    Chi tiết <ChevronRight className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
