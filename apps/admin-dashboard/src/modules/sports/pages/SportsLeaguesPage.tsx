// frontend/admin-dashboard/src/modules/sports/pages/SportsLeaguesPage.tsx
import React from 'react';
import CrudPage from '@admin/modules/shared/components/CrudPage';
import { adminLeagues } from '../api';

const FIELDS: Array<{
  key: string,
  label: string,
  type?: 'text'|'number'|'textarea'|'select',
  options?: Array<{label:string, value:string}>,
  required?: boolean,
  listHide?: boolean,
}> = [
  { key: 'name',    label: 'Tên giải đấu',   required: true },
  { key: 'slug',    label: 'Slug',            required: true },
  { key: 'country', label: 'Quốc gia' },
  { key: 'logo',    label: 'Logo URL',        listHide: true },
  { key: 'season',  label: 'Mùa giải (VD: 2024-25)' },
  { key: 'isActive', label: 'Trạng thái',     type: 'select',
    options: [{ label: 'Hoạt động', value: 'true' }, { label: 'Dừng', value: 'false' }] },
];

export default function SportsLeaguesPage() {
  return (
    <CrudPage title="Sports — Giải đấu" queryKey="sports-admin-leagues" api={adminLeagues} fields={FIELDS} />
  );
}
