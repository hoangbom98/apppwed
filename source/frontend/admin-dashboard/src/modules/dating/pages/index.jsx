// frontend/admin-dashboard/src/modules/dating/pages/index.jsx
import React from 'react';
import CrudPage from '@admin/modules/shared/components/CrudPage';
import api from '@admin/api/client';
import { adminDatingUsers } from '../api';

const STATUS_OPTS = [
  { label: 'Active',    value: 'active' },
  { label: 'Suspended', value: 'suspended' },
  { label: 'Banned',    value: 'banned' },
];

const GENDER_OPTS = [
  { label: 'Nam',   value: 'male' },
  { label: 'Nữ',   value: 'female' },
  { label: 'Khác', value: 'other' },
];

const REPORT_OPTS = [
  { label: 'Pending',  value: 'pending' },
  { label: 'Reviewed', value: 'reviewed' },
  { label: 'Resolved', value: 'resolved' },
];

// ── Users ─────────────────────────────────────────────────────────────────────
export function DatingUsersPage() {
  return (
    <CrudPage
      title="Dating — Người dùng"
      queryKey="dating-users"
      api={adminDatingUsers}
      fields={[
        { key: 'username',  label: 'Username' },
        { key: 'email',     label: 'Email' },
        { key: 'phone',     label: 'SĐT' },
        { key: 'gender',    label: 'Giới tính', type: 'select', options: GENDER_OPTS },
        { key: 'vipLevel',  label: 'VIP' },
        { key: 'status',    label: 'Trạng thái', type: 'select', options: STATUS_OPTS },
        { key: 'createdAt', label: 'Ngày tạo' },
      ]}
    />
  );
}

// ── Profiles ──────────────────────────────────────────────────────────────────
export function DatingProfilesPage() {
  const profilesApi = {
    list:   (params) => api.get('/dating/admin/profiles', { params }),
    create: () => Promise.reject(new Error('Not supported')),
    update: (id, b) => api.patch(`/dating/admin/profiles/${id}`, b),
    remove: (id)    => api.delete(`/dating/admin/profiles/${id}`),
  };
  return (
    <CrudPage
      title="Dating — Profiles"
      queryKey="dating-profiles"
      api={profilesApi}
      fields={[
        { key: 'userId',    label: 'User ID' },
        { key: 'nickname',  label: 'Tên hiển thị' },
        { key: 'age',       label: 'Tuổi',       type: 'number' },
        { key: 'city',      label: 'Thành phố' },
        { key: 'bio',       label: 'Bio',        type: 'textarea', listHide: true },
        { key: 'verified',  label: 'Xác minh',   type: 'select', options: [
          { label: 'Đã xác minh', value: 'true' },
          { label: 'Chưa',        value: 'false' },
        ]},
      ]}
    />
  );
}

// ── Matches ───────────────────────────────────────────────────────────────────
export function DatingMatchesPage() {
  const matchesApi = {
    list:   (params) => api.get('/dating/admin/matches', { params }),
    create: () => Promise.reject(new Error('Not supported')),
    update: () => Promise.reject(new Error('Not supported')),
    remove: (id) => api.delete(`/dating/admin/matches/${id}`),
  };
  return (
    <CrudPage
      title="Dating — Matches"
      queryKey="dating-matches"
      api={matchesApi}
      fields={[
        { key: 'user1Id',   label: 'User 1' },
        { key: 'user2Id',   label: 'User 2' },
        { key: 'status',    label: 'Trạng thái', type: 'select', options: [
          { label: 'Pending',  value: 'pending' },
          { label: 'Matched',  value: 'matched' },
          { label: 'Unmatched',value: 'unmatched' },
        ]},
        { key: 'createdAt', label: 'Ngày match' },
      ]}
    />
  );
}

// ── Gifts ─────────────────────────────────────────────────────────────────────
export function DatingGiftsPage() {
  const giftsApi = {
    list:   (params) => api.get('/dating/admin/gifts', { params }),
    create: (body)   => api.post('/dating/admin/gifts', body),
    update: (id, b)  => api.put(`/dating/admin/gifts/${id}`, b),
    remove: (id)     => api.delete(`/dating/admin/gifts/${id}`),
  };
  return (
    <CrudPage
      title="Dating — Quà tặng"
      queryKey="dating-gifts"
      api={giftsApi}
      fields={[
        { key: 'name',      label: 'Tên quà',   required: true },
        { key: 'imageUrl',  label: 'Ảnh URL' },
        { key: 'coins',     label: 'Giá (coins)', type: 'number', required: true },
        { key: 'category',  label: 'Loại' },
        { key: 'status',    label: 'Trạng thái', type: 'select', options: [
          { label: 'Active',   value: 'active' },
          { label: 'Inactive', value: 'inactive' },
        ]},
      ]}
    />
  );
}

// ── Moments ───────────────────────────────────────────────────────────────────
export function DatingMomentsPage() {
  const momentsApi = {
    list:   (params) => api.get('/dating/admin/moments', { params }),
    create: () => Promise.reject(new Error('Not supported')),
    update: (id, b)  => api.patch(`/dating/admin/moments/${id}`, b),
    remove: (id)     => api.delete(`/dating/admin/moments/${id}`),
  };
  return (
    <CrudPage
      title="Dating — Moments"
      queryKey="dating-moments"
      api={momentsApi}
      fields={[
        { key: 'userId',    label: 'User ID' },
        { key: 'content',   label: 'Nội dung', type: 'textarea', listHide: true },
        { key: 'mediaUrl',  label: 'Media URL' },
        { key: 'likes',     label: 'Likes',    type: 'number' },
        { key: 'status',    label: 'Trạng thái', type: 'select', options: [
          { label: 'Active',  value: 'active' },
          { label: 'Hidden',  value: 'hidden' },
          { label: 'Deleted', value: 'deleted' },
        ]},
        { key: 'createdAt', label: 'Ngày đăng' },
      ]}
    />
  );
}

// ── Reports ───────────────────────────────────────────────────────────────────
export function DatingReportsPage() {
  const reportsApi = {
    list:   (params) => api.get('/dating/admin/reports', { params }),
    create: () => Promise.reject(new Error('Not supported')),
    update: (id, b)  => api.patch(`/dating/admin/reports/${id}`, b),
    remove: () => Promise.reject(new Error('Not supported')),
  };
  return (
    <CrudPage
      title="Dating — Báo cáo vi phạm"
      queryKey="dating-reports"
      api={reportsApi}
      fields={[
        { key: 'reporterId', label: 'Người báo cáo' },
        { key: 'targetId',   label: 'Người bị báo cáo' },
        { key: 'reason',     label: 'Lý do' },
        { key: 'detail',     label: 'Chi tiết', type: 'textarea', listHide: true },
        { key: 'status',     label: 'Xử lý', type: 'select', options: REPORT_OPTS },
        { key: 'createdAt',  label: 'Ngày báo cáo' },
      ]}
    />
  );
}
