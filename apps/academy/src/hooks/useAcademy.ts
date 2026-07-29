import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface Course {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  thumbnail: string | null;
  price: number;
  currency: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  totalLessons: number;
  totalDuration: number;
  status: string;
}

export interface Lesson {
  id: string;
  title: string;
  content: string | null;
  videoUrl: string | null;
  duration: number;
  order: number;
  isFree: boolean;
}

export interface CourseDetail extends Course {
  lessons: Lesson[];
}

export interface Enrollment {
  id: string;
  courseId: string;
  paidAmount: number;
  status: 'active' | 'completed' | 'refunded';
  createdAt: string;
  course: Course;
}

export interface ProgressPayload {
  lessonId: string;
  watchedSecs: number;
}

// ── Hooks ──────────────────────────────────────────────────────────────────────

export function useCourses(filters: { level?: string } = {}) {
  return useQuery<Course[]>({
    queryKey: ['courses', filters],
    queryFn: async () => {
      const { data } = await api.get('/hub/courses', { params: filters });
      return data.data ?? data;
    },
    staleTime: 60_000,
  });
}

export function useCourseDetail(slug: string) {
  return useQuery<CourseDetail>({
    queryKey: ['course', slug],
    queryFn: async () => {
      const { data } = await api.get(`/hub/courses/${slug}`);
      return data.data ?? data;
    },
    enabled: !!slug,
  });
}

export function useMyEnrollments() {
  return useQuery<Enrollment[]>({
    queryKey: ['my-enrollments'],
    queryFn: async () => {
      const { data } = await api.get('/hub/my-courses');
      return data.data ?? data;
    },
  });
}

export function useEnrollCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { courseId: string; referenceId: string }) =>
      api.post(`/hub/courses/${payload.courseId}/enroll`, { referenceId: payload.referenceId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-enrollments'] });
    },
  });
}

export function useUpdateProgress() {
  return useMutation({
    mutationFn: ({ enrollmentId, ...body }: { enrollmentId: string } & ProgressPayload) =>
      api.put(`/hub/enrollments/${enrollmentId}/progress`, body),
  });
}
