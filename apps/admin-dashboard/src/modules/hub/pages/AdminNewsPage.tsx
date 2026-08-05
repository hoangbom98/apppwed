import React from 'react';
import CrudPage from '@admin/modules/shared/components/CrudPage';
import { adminNews } from '../api';

const FIELDS = [
  { key: 'title',     label: 'Tiêu đề',    required: true },
  { key: 'slug',      label: 'Slug',        required: true },
  { key: 'category',  label: 'Danh mục' },
  { key: 'author',    label: 'Tác giả' },
  { key: 'summary',   label: 'Tóm tắt',    type: 'textarea', listHide: true },
  { key: 'content',   label: 'Nội dung',   type: 'textarea', listHide: true },
  { key: 'thumbnail', label: 'Thumbnail',  listHide: true },
  { key: 'status',    label: 'Trạng thái', type: 'select',
    options: [
      { label: 'Đã xuất bản', value: 'published' },
      { label: 'Nháp',        value: 'draft' },
      { label: 'Ẩn',          value: 'hidden' },
    ] },
];

export default function AdminNewsPage() {
  return (
    <CrudPage title="Tin tức" queryKey="hub-admin-news" api={adminNews} fields={FIELDS} />
  );
}
