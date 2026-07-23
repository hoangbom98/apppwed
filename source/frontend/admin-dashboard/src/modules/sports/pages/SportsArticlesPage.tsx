// frontend/admin-dashboard/src/modules/sports/pages/SportsArticlesPage.tsx
import React from 'react';
import CrudPage from '@admin/modules/shared/components/CrudPage';
import { adminArticles } from '../api';

const FIELDS = [
  { key: 'title',       label: 'Tiêu đề',     required: true },
  { key: 'slug',        label: 'Slug',          required: true },
  { key: 'category',    label: 'Danh mục',      type: 'select',
    options: [
      { label: 'Tin tức',   value: 'news' },
      { label: 'Phân tích', value: 'analysis' },
      { label: 'Kiến thức', value: 'knowledge' },
    ] },
  { key: 'thumbnail',   label: 'Thumbnail URL', listHide: true },
  { key: 'summary',     label: 'Tóm tắt',       type: 'textarea', listHide: true },
  { key: 'content',     label: 'Nội dung',       type: 'textarea', listHide: true },
  { key: 'status',      label: 'Trạng thái',     type: 'select',
    options: [
      { label: 'Đã xuất bản', value: 'published' },
      { label: 'Nháp',        value: 'draft' },
    ] },
];

export default function SportsArticlesPage() {
  return (
    <CrudPage title="Sports — Bài viết" queryKey="sports-admin-articles" api={adminArticles} fields={FIELDS} />
  );
}
