// frontend/admin-dashboard/src/modules/sports/pages/index.tsx
import React from 'react';
import CrudPage from '@admin/modules/shared/components/CrudPage';
import api from '@admin/api/client';
import { adminSportsUsers } from '../api';

const STATUS_OPTS = [
  { label: 'Active',    value: 'active' },
  { label: 'Suspended', value: 'suspended' },
  { label: 'Banned',    value: 'banned' },
];

// ── Users ─────────────────────────────────────────────────────────────────────
export const SportsUsersPage: React.FC = () => {
  return (
    <CrudPage
      title="Sports — Người dùng"
      queryKey="sports-users"
      api={adminSportsUsers}
      fields={[
        { key: 'username',  label: 'Username' },
        { key: 'email',     label: 'Email' },
        { key: 'balance',   label: 'Số dư', type: 'number' },
        { key: 'status',    label: 'Trạng thái', type: 'select', options: STATUS_OPTS },
        { key: 'createdAt', label: 'Ngày tạo' },
      ]}
    />
  );
};

// ── Leagues ───────────────────────────────────────────────────────────────────
export const SportsLeaguesPage: React.FC = () => {
  const leaguesApi = {
    list:   (params: any) => api.get('/sports/admin/leagues', { params }),
    create: (body: any)   => api.post('/sports/admin/leagues', body),
    update: (id: string | number, b: any)  => api.put(`/sports/admin/leagues/${id}`, b),
    remove: (id: string | number)     => api.delete(`/sports/admin/leagues/${id}`),
  };
  return (
    <CrudPage
      title="Sports — Giải đấu"
      queryKey="sports-leagues"
      api={leaguesApi}
      fields={[
        { key: 'name',      label: 'Tên giải',   required: true },
        { key: 'slug',      label: 'Slug' },
        { key: 'country',   label: 'Quốc gia' },
        { key: 'season',    label: 'Mùa giải' },
        { key: 'logoUrl',   label: 'Logo URL' },
        { key: 'status',    label: 'Trạng thái', type: 'select', options: [
          { label: 'Active',   value: 'active' },
          { label: 'Inactive', value: 'inactive' },
        ]},
      ]}
    />
  );
};

// ── Teams ─────────────────────────────────────────────────────────────────────
export const SportsTeamsPage: React.FC = () => {
  const teamsApi = {
    list:   (params: any) => api.get('/sports/admin/teams', { params }),
    create: (body: any)   => api.post('/sports/admin/teams', body),
    update: (id: string | number, b: any)  => api.put(`/sports/admin/teams/${id}`, b),
    remove: (id: string | number)     => api.delete(`/sports/admin/teams/${id}`),
  };
  return (
    <CrudPage
      title="Sports — Đội bóng"
      queryKey="sports-teams"
      api={teamsApi}
      fields={[
        { key: 'name',      label: 'Tên đội',    required: true },
        { key: 'shortCode', label: 'Viết tắt' },
        { key: 'leagueId',  label: 'Giải đấu',  type: 'number' },
        { key: 'country',   label: 'Quốc gia' },
        { key: 'logoUrl',   label: 'Logo URL' },
      ]}
    />
  );
};

// ── Matches ───────────────────────────────────────────────────────────────────
export const SportsMatchesPage: React.FC = () => {
  const matchesApi = {
    list:   (params: any) => api.get('/sports/admin/matches', { params }),
    create: (body: any)   => api.post('/sports/admin/matches', body),
    update: (id: string | number, b: any)  => api.put(`/sports/admin/matches/${id}`, b),
    remove: (id: string | number)     => api.delete(`/sports/admin/matches/${id}`),
  };
  return (
    <CrudPage
      title="Sports — Trận đấu"
      queryKey="sports-matches"
      api={matchesApi}
      fields={[
        { key: 'homeTeamId',  label: 'Đội nhà',    type: 'number' },
        { key: 'awayTeamId',  label: 'Đội khách',  type: 'number' },
        { key: 'leagueId',    label: 'Giải đấu',   type: 'number' },
        { key: 'kickoffTime', label: 'Giờ bóng lăn' },
        { key: 'homeScore',   label: 'Tỷ số nhà',  type: 'number' },
        { key: 'awayScore',   label: 'Tỷ số khách',type: 'number' },
        { key: 'status',      label: 'Trạng thái', type: 'select', options: [
          { label: 'Scheduled',  value: 'scheduled' },
          { label: 'Live',       value: 'live' },
          { label: 'Finished',   value: 'finished' },
          { label: 'Cancelled',  value: 'cancelled' },
        ]},
      ]}
    />
  );
};

// ── Bets ──────────────────────────────────────────────────────────────────────
export const SportsBetsPage: React.FC = () => {
  const betsApi = {
    list:   (params: any) => api.get('/sports/admin/bets', { params }),
    create: () => Promise.reject(new Error('Not supported')),
    update: (id: string | number, b: any) => api.patch(`/sports/admin/bets/${id}`, b),
    remove: () => Promise.reject(new Error('Not supported')),
  };
  return (
    <CrudPage
      title="Sports — Cược"
      queryKey="sports-bets"
      api={betsApi}
      fields={[
        { key: 'userId',    label: 'User ID' },
        { key: 'matchId',   label: 'Match ID' },
        { key: 'betType',   label: 'Loại cược' },
        { key: 'amount',    label: 'Số tiền',   type: 'number' },
        { key: 'odds',      label: 'Tỷ lệ',     type: 'number' },
        { key: 'payout',    label: 'Thắng',     type: 'number' },
        { key: 'status',    label: 'Trạng thái', type: 'select', options: [
          { label: 'Pending',  value: 'pending' },
          { label: 'Won',      value: 'won' },
          { label: 'Lost',     value: 'lost' },
          { label: 'Void',     value: 'void' },
        ]},
        { key: 'createdAt', label: 'Thời gian' },
      ]}
    />
  );
};

// ── Articles ──────────────────────────────────────────────────────────────────
export const SportsArticlesPage: React.FC = () => {
  const articlesApi = {
    list:   (params: any) => api.get('/sports/admin/articles', { params }),
    create: (body: any)   => api.post('/sports/admin/articles', body),
    update: (id: string | number, b: any)  => api.put(`/sports/admin/articles/${id}`, b),
    remove: (id: string | number)     => api.delete(`/sports/admin/articles/${id}`),
  };
  return (
    <CrudPage
      title="Sports — Bài viết"
      queryKey="sports-articles"
      api={articlesApi}
      fields={[
        { key: 'title',      label: 'Tiêu đề',  required: true },
        { key: 'slug',       label: 'Slug' },
        { key: 'thumbnail',  label: 'Ảnh đại diện' },
        { key: 'content',    label: 'Nội dung', type: 'textarea', listHide: true },
        { key: 'status',     label: 'Trạng thái', type: 'select', options: [
          { label: 'Draft',    value: 'draft' },
          { label: 'Published',value: 'published' },
          { label: 'Archived', value: 'archived' },
        ]},
        { key: 'publishedAt',label: 'Ngày đăng' },
      ]}
    />
  );
};
