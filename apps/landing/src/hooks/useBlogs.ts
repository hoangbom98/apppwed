import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

// ── Types ──────────────────────────────────────────────────────────────────────
export interface Blog {
  _id: string;
  title: string;
  slug: string;
  summary?: string;
  content: string;
  coverImage?: string;
  author?: string;
  tags?: string[];
  views?: number;
  published: boolean;
  createdAt: string;
}

// ── Public hooks ───────────────────────────────────────────────────────────────

export function useBlogs(page = 1, limit = 9) {
  return useQuery({
    queryKey: ['blogs', page, limit],
    queryFn: async () => {
      const { data } = await api.get('/api/public/blogs', { page, limit } as Record<string, unknown>);
      return data;
    },
    staleTime: 120_000,
    placeholderData: (prev) => prev,
  });
}

export function useBlogBySlug(slug: string) {
  return useQuery<Blog>({
    queryKey: ['blog', slug],
    queryFn: async () => {
      const { data } = await api.get(`/api/public/blogs/${slug}`);
      return data.blog ?? data;
    },
    enabled: !!slug,
    staleTime: 120_000,
  });
}

// ── Admin hooks ────────────────────────────────────────────────────────────────

export function useAdminBlogs() {
  return useQuery({
    queryKey: ['admin-blogs'],
    queryFn: async () => {
      const { data } = await api.get('/api/dashboard/blogs');
      return data;
    },
  });
}

export function useAdminBlogById(id: string) {
  return useQuery<Blog>({
    queryKey: ['admin-blog', id],
    queryFn: async () => {
      const { data } = await api.get(`/api/public/blogs/id/${id}`);
      return data.blog ?? data;
    },
    enabled: !!id,
  });
}

export function useCreateBlog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (formData: FormData) => api.postForm('/api/dashboard/blogs', formData),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-blogs'] }),
  });
}

export function useUpdateBlog(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (formData: FormData) => api.postForm(`/api/dashboard/blogs/${id}`, formData),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-blogs'] });
      qc.invalidateQueries({ queryKey: ['admin-blog', id] });
    },
  });
}

export function useDeleteBlog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/dashboard/blogs/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-blogs'] }),
  });
}
