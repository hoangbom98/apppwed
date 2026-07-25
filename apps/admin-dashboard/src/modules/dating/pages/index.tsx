// @ts-nocheck
// frontend/admin-dashboard/src/modules/dating/pages/index.jsx
import React from 'react';
import CrudPage from '@admin/modules/shared/components/CrudPage';
import {
  adminDatingUsers,
  adminDatingProfiles,
  adminDatingMatches,
  adminDatingGifts,
  adminDatingMoments,
  adminDatingReports,
} from '../api';

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
  return (
    <CrudPage
      title="Dating — Profiles"
      queryKey="dating-profiles"
      api={adminDatingProfiles}
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
  return (
    <CrudPage
      title="Dating — Matches"
      queryKey="dating-matches"
      api={adminDatingMatches}
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
  return (
    <CrudPage
      title="Dating — Quà tặng"
      queryKey="dating-gifts"
      api={adminDatingGifts}
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
  return (
    <CrudPage
      title="Dating — Moments"
      queryKey="dating-moments"
      api={adminDatingMoments}
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
  return (
    <CrudPage
      title="Dating — Báo cáo vi phạm"
      queryKey="dating-reports"
      api={adminDatingReports}
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
