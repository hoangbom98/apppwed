// frontend/admin-dashboard/src/modules/hub/pages/index.jsx
// Hub module admin pages — all use the generic CrudPage component.
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import CrudPage from '@admin/modules/shared/components/CrudPage';
import api from '@admin/api/client';
import {
  adminGames, adminCategories, adminWebsites, adminTools,
  adminNews, adminPages, adminBanners, adminMenus, adminFeedbacks, adminSeo,
} from '../api';

const STATUS_OPTS = [
  { label: 'Active',   value: 'active' },
  { label: 'Inactive', value: 'inactive' },
];

export function AdminGamesPage() {
  return <CrudPage title="Games" queryKey="admin-games" api={adminGames} fields={[
    { key: 'name',        label: 'Tên game',  required: true },
    { key: 'slug',        label: 'Slug' },
    { key: 'category_id', label: 'Category',  type: 'number' },
    { key: 'publisher',   label: 'Publisher' },
    { key: 'link',        label: 'Link URL',  required: true },
    { key: 'image',       label: 'Image URL' },
    { key: 'sort_order',  label: 'Thứ tự',   type: 'number' },
    { key: 'status',      label: 'Trạng thái', type: 'select', options: STATUS_OPTS },
    { key: 'description', label: 'Mô tả',    type: 'textarea', listHide: true },
  ]} />;
}

export function AdminCategoriesPage() {
  return <CrudPage title="Danh mục" queryKey="admin-categories" api={adminCategories} fields={[
    { key: 'name',       label: 'Tên',        required: true },
    { key: 'slug',       label: 'Slug' },
    { key: 'icon',       label: 'Icon URL' },
    { key: 'sort_order', label: 'Thứ tự',    type: 'number' },
    { key: 'status',     label: 'Trạng thái', type: 'select', options: STATUS_OPTS },
  ]} />;
}

export function AdminWebsitesPage() {
  return <CrudPage title="Websites" queryKey="admin-websites" api={adminWebsites} fields={[
    { key: 'name',        label: 'Tên',       required: true },
    { key: 'url',         label: 'URL',       required: true },
    { key: 'category_id', label: 'Category',  type: 'number' },
    { key: 'description', label: 'Mô tả',    type: 'textarea', listHide: true },
    { key: 'status',      label: 'Trạng thái', type: 'select', options: STATUS_OPTS },
  ]} />;
}

export function AdminToolsPage() {
  return <CrudPage title="Công cụ" queryKey="admin-tools" api={adminTools} fields={[
    { key: 'name',        label: 'Tên',       required: true },
    { key: 'slug',        label: 'Slug' },
    { key: 'link',        label: 'URL',       required: true },
    { key: 'icon',        label: 'Icon URL' },
    { key: 'description', label: 'Mô tả',    type: 'textarea', listHide: true },
    { key: 'status',      label: 'Trạng thái', type: 'select', options: STATUS_OPTS },
  ]} />;
}

export function AdminNewsPage() {
  return <CrudPage title="Tin tức" queryKey="admin-news" api={adminNews} fields={[
    { key: 'title',       label: 'Tiêu đề',   required: true },
    { key: 'slug',        label: 'Slug' },
    { key: 'thumbnail',   label: 'Ảnh đại diện' },
    { key: 'content',     label: 'Nội dung',  type: 'textarea', listHide: true },
    { key: 'status',      label: 'Trạng thái', type: 'select', options: STATUS_OPTS },
  ]} />;
}

export function AdminPagesPage() {
  return <CrudPage title="Pages" queryKey="admin-pages" api={adminPages} fields={[
    { key: 'title',   label: 'Tiêu đề',   required: true },
    { key: 'slug',    label: 'Slug',      required: true },
    { key: 'content', label: 'Nội dung',  type: 'textarea', listHide: true },
    { key: 'status',  label: 'Trạng thái', type: 'select', options: STATUS_OPTS },
  ]} />;
}

export function AdminBannersPage() {
  return <CrudPage title="Banners" queryKey="admin-banners" api={adminBanners} fields={[
    { key: 'title',      label: 'Tiêu đề' },
    { key: 'image',      label: 'Ảnh URL',    required: true },
    { key: 'link',       label: 'Link URL' },
    { key: 'position',   label: 'Vị trí' },
    { key: 'sort_order', label: 'Thứ tự',    type: 'number' },
    { key: 'status',     label: 'Trạng thái', type: 'select', options: STATUS_OPTS },
  ]} />;
}

export function AdminMenusPage() {
  return <CrudPage title="Menus" queryKey="admin-menus" api={adminMenus} fields={[
    { key: 'label',      label: 'Nhãn',      required: true },
    { key: 'link',       label: 'URL',       required: true },
    { key: 'icon',       label: 'Icon' },
    { key: 'parent_id',  label: 'Parent ID', type: 'number' },
    { key: 'sort_order', label: 'Thứ tự',   type: 'number' },
    { key: 'status',     label: 'Trạng thái', type: 'select', options: STATUS_OPTS },
  ]} />;
}

export function AdminFeedbacksPage() {
  return <CrudPage title="Phản hồi" queryKey="admin-feedbacks" api={adminFeedbacks} fields={[
    { key: 'subject', label: 'Chủ đề' },
    { key: 'message', label: 'Nội dung', type: 'textarea', listHide: true },
    { key: 'status',  label: 'Trạng thái', type: 'select', options: [
      { label: 'Mới',        value: 'new' },
      { label: 'Đang xử lý', value: 'processing' },
      { label: 'Đã đóng',   value: 'closed' },
    ]},
  ]} />;
}

export function AdminSeoPage() {
  return <CrudPage title="SEO" queryKey="admin-seo" api={adminSeo} fields={[
    { key: 'page',             label: 'Trang',          required: true },
    { key: 'title',            label: 'Title' },
    { key: 'description',      label: 'Description',    type: 'textarea', listHide: true },
    { key: 'keywords',         label: 'Keywords' },
    { key: 'og_image',         label: 'OG Image URL' },
  ]} />;
}

// ── System Settings Page (admin_db.system_settings) ─────────────────────────
export function AdminSettingsPage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(null);
  const [newValue, setNewValue] = useState('');
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const { data: settings = [], isLoading } = useQuery({
    queryKey: ['adminSystemSettings'],
    queryFn: () => api.get('/admin/settings').then(r => r.data?.data ?? r.data ?? []),
  });

  const saveMutation = useMutation({
    mutationFn: ({ key, value }) => api.put(`/admin/settings/${encodeURIComponent(key)}`, { value }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['adminSystemSettings'] });
      setEditing(null);
      showToast('Đã lưu cài đặt');
    },
    onError: (err) => showToast(err?.response?.data?.message || 'Lỗi khi lưu', 'error'),
  });

  // Group by group field
  const groups = settings.reduce((acc, s) => {
    const g = s.group || 'general';
    if (!acc[g]) acc[g] = [];
    acc[g].push(s);
    return acc;
  }, {});

  const GROUP_LABEL = {
    general: 'Cài đặt chung',
    domains: 'Domain / URL',
    email:   'Email',
    social:  'Mạng xã hội',
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black text-white">Cài đặt hệ thống</h1>

      {isLoading && (
        <div className="py-16 text-center text-gray-500">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          Đang tải...
        </div>
      )}

      {!isLoading && Object.entries(groups).map(([group, items]) => (
        <div key={group} className="border border-gray-800 rounded-xl overflow-hidden">
          <div className="px-5 py-3 bg-gray-800 text-sm font-semibold text-gray-200">
            {GROUP_LABEL[group] || group}
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-900 text-gray-500 text-xs">
              <tr>
                <th className="px-4 py-2 text-left font-medium">Key</th>
                <th className="px-4 py-2 text-left font-medium">Giá trị</th>
                <th className="px-4 py-2 text-left font-medium">Mô tả</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {items.map(s => (
                <tr key={s.key} className="border-t border-gray-800 hover:bg-gray-800/40">
                  <td className="px-4 py-3 font-mono text-blue-400 text-xs">{s.key}</td>
                  <td className="px-4 py-3 text-gray-300 max-w-[260px] truncate">{s.value}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{s.description || '—'}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => { setEditing(s); setNewValue(s.value); }}
                      className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-200 px-3 py-1 rounded"
                    >Sửa</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-lg p-6 space-y-4">
            <h2 className="text-lg font-bold text-white">Sửa cài đặt</h2>
            <p className="text-xs text-gray-500">
              Key: <span className="font-mono text-blue-400">{editing.key}</span>
              {editing.description && <span className="ml-2 text-gray-400">— {editing.description}</span>}
            </p>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Giá trị mới</label>
              <input
                type="text"
                value={newValue}
                onChange={e => setNewValue(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => saveMutation.mutate({ key: editing.key, value: newValue })}
                disabled={saveMutation.isPending}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm disabled:opacity-60"
              >
                {saveMutation.isPending ? 'Đang lưu...' : 'Lưu'}
              </button>
              <button
                onClick={() => setEditing(null)}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-200 py-2 rounded-lg text-sm"
              >Huỷ</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-lg text-sm font-medium shadow-xl ${
          toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'
        }`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
