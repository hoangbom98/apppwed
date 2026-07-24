// frontend/admin-dashboard/src/modules/dating/pages/DatingGiftsPage.jsx
import React from 'react';
import CrudPage from '@admin/modules/shared/components/CrudPage';
import client from '@admin/api/client';

const giftsApi = {
  list:   (params) => client.get('/dating/admin/gifts', { params }),
  get:    (id)     => client.get(`/dating/admin/gifts/${id}`),
  create: (body)   => client.post('/dating/admin/gifts', body),
  update: (id, b)  => client.put(`/dating/admin/gifts/${id}`, b),
  remove: (id)     => client.delete(`/dating/admin/gifts/${id}`),
};

const FIELDS = [
  { key: 'name',     label: 'Tên quà',       required: true },
  { key: 'image',    label: 'Hình ảnh URL',   required: true },
  { key: 'price',    label: 'Giá coins',       type: 'number', required: true },
  { key: 'category', label: 'Danh mục',        type: 'select',
    options: [
      { label: 'Thông thường', value: 'normal' },
      { label: 'VIP',          value: 'vip' },
      { label: 'Đặc biệt',     value: 'special' },
    ] },
  { key: 'isActive', label: 'Trạng thái',      type: 'select',
    options: [{ label: 'Hoạt động', value: 'true' }, { label: 'Ẩn', value: 'false' }] },
];

export default function DatingGiftsPage() {
  return (
    <CrudPage title="Dating — Quà tặng" queryKey="dating-admin-gifts" api={giftsApi} fields={FIELDS} />
  );
}
