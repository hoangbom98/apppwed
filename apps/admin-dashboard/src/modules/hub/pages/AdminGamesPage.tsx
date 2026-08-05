import React from 'react';
import CrudPage from '@admin/modules/shared/components/CrudPage';
import { adminGames } from '../api';

const FIELDS = [
  { key: 'name',        label: 'Tên game',   required: true },
  { key: 'slug',        label: 'Slug',        required: true },
  { key: 'category',   label: 'Danh mục' },
  { key: 'platform',   label: 'Nền tảng' },
  { key: 'url',         label: 'URL',         listHide: true },
  { key: 'description', label: 'Mô tả',       type: 'textarea', listHide: true },
  { key: 'status',      label: 'Trạng thái',  type: 'select',
    options: [{ label: 'Hoạt động', value: 'active' }, { label: 'Ẩn', value: 'inactive' }] },
];

export default function AdminGamesPage() {
  return (
    <CrudPage title="Games" queryKey="hub-admin-games" api={adminGames} fields={FIELDS} />
  );
}
