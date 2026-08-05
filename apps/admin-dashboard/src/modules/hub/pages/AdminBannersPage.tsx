import React from 'react';
import CrudPage from '@admin/modules/shared/components/CrudPage';
import { adminBanners } from '../api';

const FIELDS = [
  { key: 'title',    label: 'Tiêu đề',   required: true },
  { key: 'image',    label: 'Image URL',  required: true },
  { key: 'link',     label: 'Link URL' },
  { key: 'position', label: 'Vị trí',    type: 'select',
    options: [
      { label: 'Top',     value: 'top' },
      { label: 'Middle',  value: 'middle' },
      { label: 'Bottom',  value: 'bottom' },
      { label: 'Sidebar', value: 'sidebar' },
    ] },
  { key: 'status',   label: 'Trạng thái', type: 'select',
    options: [{ label: 'Hoạt động', value: 'active' }, { label: 'Tắt', value: 'inactive' }] },
];

export default function AdminBannersPage() {
  return (
    <CrudPage title="Banners" queryKey="hub-admin-banners" api={adminBanners} fields={FIELDS} />
  );
}
