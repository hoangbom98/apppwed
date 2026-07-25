// @ts-nocheck
// frontend/admin-dashboard/src/modules/hub/pages/AdminPagesPage.jsx
import React from 'react';
import CrudPage from '@admin/modules/shared/components/CrudPage';
import { adminPages } from '../api';

const FIELDS = [
  { key: 'title',   label: 'Tiêu đề', required: true },
  { key: 'slug',    label: 'Slug',     required: true },
  { key: 'content', label: 'Nội dung', type: 'textarea', listHide: true },
  { key: 'status',  label: 'Trạng thái', type: 'select',
    options: [
      { label: 'Đã xuất bản', value: 'published' },
      { label: 'Nháp',        value: 'draft' },
    ] },
];

export default function AdminPagesPage() {
  return (
    <CrudPage title="Trang CMS" queryKey="hub-admin-pages" api={adminPages} fields={FIELDS} />
  );
}
