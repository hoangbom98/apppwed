import React from 'react';
import CrudPage from '@admin/modules/shared/components/CrudPage';
import { adminWebsites } from '../api';

const FIELDS = [
  { key: 'name',        label: 'Tên',         required: true },
  { key: 'url',         label: 'URL',          required: true },
  { key: 'category',   label: 'Danh mục' },
  { key: 'description', label: 'Mô tả',        type: 'textarea', listHide: true },
  { key: 'thumbnail',   label: 'Thumbnail URL', listHide: true },
  { key: 'status',      label: 'Trạng thái',   type: 'select',
    options: [{ label: 'Hoạt động', value: 'active' }, { label: 'Ẩn', value: 'inactive' }] },
];

export default function AdminWebsitesPage() {
  return (
    <CrudPage title="Websites" queryKey="hub-admin-websites" api={adminWebsites} fields={FIELDS} />
  );
}
