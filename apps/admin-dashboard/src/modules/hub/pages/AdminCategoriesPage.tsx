// @ts-nocheck
// frontend/admin-dashboard/src/modules/hub/pages/AdminCategoriesPage.jsx
import React from 'react';
import CrudPage from '@admin/modules/shared/components/CrudPage';
import { adminCategories } from '../api';

const FIELDS = [
  { key: 'name',  label: 'Tên',        required: true },
  { key: 'slug',  label: 'Slug',        required: true },
  { key: 'type',  label: 'Loại',        type: 'select',
    options: [
      { label: 'Game',    value: 'game' },
      { label: 'News',    value: 'news' },
      { label: 'Tool',    value: 'tool' },
      { label: 'Website', value: 'website' },
    ] },
  { key: 'icon',        label: 'Icon URL',   listHide: true },
  { key: 'description', label: 'Mô tả',      type: 'textarea', listHide: true },
];

export default function AdminCategoriesPage() {
  return (
    <CrudPage title="Danh mục" queryKey="hub-admin-categories" api={adminCategories} fields={FIELDS} />
  );
}
