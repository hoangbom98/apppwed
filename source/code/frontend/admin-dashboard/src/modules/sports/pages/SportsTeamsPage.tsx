// frontend/admin-dashboard/src/modules/sports/pages/SportsTeamsPage.tsx
import React from 'react';
import CrudPage from '@admin/modules/shared/components/CrudPage';
import { adminTeams } from '../api';

const FIELDS = [
  { key: 'name',     label: 'Tên đội',     required: true },
  { key: 'slug',     label: 'Slug',         required: true },
  { key: 'country',  label: 'Quốc gia' },
  { key: 'logo',     label: 'Logo URL',     listHide: true },
  { key: 'stadium',  label: 'Sân vận động', listHide: true },
  { key: 'leagueId', label: 'League ID',    type: 'number' },
];

export default function SportsTeamsPage() {
  return (
    <CrudPage title="Sports — Đội bóng" queryKey="sports-admin-teams" api={adminTeams} fields={FIELDS} />
  );
}
