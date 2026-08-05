import React from 'react';
import CrudPage from '@admin/modules/shared/components/CrudPage';
import { adminTools } from '../api';

const FIELDS = [
  { key: 'name',        label: 'Tên tool',    required: true },
  { key: 'slug',        label: 'Slug',         required: true },
  { key: 'category',   label: 'Danh mục' },
  { key: 'url',         label: 'URL' },
  { key: 'description', label: 'Mô tả',        type: 'textarea', listHide: true },
  { key: 'status',      label: 'Trạng thái',   type: 'select',
    options: [{ label: 'Hoạt động', value: 'active' }, { label: 'Ẩn', value: 'inactive' }] },
];

export default function AdminToolsPage() {
  return (
    <CrudPage title="Tools" queryKey="hub-admin-tools" api={adminTools} fields={FIELDS} />
  );
}
