// @ts-nocheck
// frontend/admin-dashboard/src/modules/game/pages/index.jsx
// Game module admin pages — all exported individually.
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import CrudPage from '@admin/modules/shared/components/CrudPage';
import api from '@admin/api/client';
import {
  adminGameUsers,
  adminGameDeposits,
  adminGameWithdrawals,
  adminGameRounds,
  adminGameProviders,
  getGameStats,
} from '../api';

const STATUS_OPTS = [
  { label: 'Active',    value: 'active' },
  { label: 'Suspended', value: 'suspended' },
  { label: 'Banned',    value: 'banned' },
];

const DEPOSIT_STATUS_OPTS = [
  { label: 'Pending',  value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
];

// ── Stats bar (shared across game pages) ──────────────────────────────────────
function GameStatsBar() {
  const { data } = useQuery({ queryKey: ['game-stats'], queryFn: getGameStats });
  if (!data) return null;
  const cards = [
    { label: 'Users',             value: data.usersByProject?.game ?? '—' },
    { label: 'Deposits hôm nay',  value: data.todayDeposits          ?? '—' },
    { label: 'Withdrawals chờ',   value: data.pendingWithdrawals     ?? '—' },
    { label: 'Sessions đang chạy',value: data.activeSessions         ?? '—' },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
      {cards.map(c => (
        <div key={c.label} className="bg-gray-800 border border-gray-700 rounded-xl p-3">
          <p className="text-2xl font-black text-white">{Number(c.value || 0).toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-1">{c.label}</p>
        </div>
      ))}
    </div>
  );
}

// ── Pages ─────────────────────────────────────────────────────────────────────
export function GameUsersPage() {
  return (
    <div>
      <GameStatsBar />
      <CrudPage
        title="Game — Người dùng"
        queryKey="game-users"
        api={adminGameUsers}
        fields={[
          { key: 'username',  label: 'Username' },
          { key: 'email',     label: 'Email' },
          { key: 'balance',   label: 'Số dư',      type: 'number' },
          { key: 'vipLevel',  label: 'VIP' },
          { key: 'status',    label: 'Trạng thái', type: 'select', options: STATUS_OPTS },
          { key: 'createdAt', label: 'Ngày tạo' },
        ]}
      />
    </div>
  );
}

export function GameDepositsPage() {
  return (
    <CrudPage
      title="Game — Nạp tiền"
      queryKey="game-deposits"
      api={adminGameDeposits}
      fields={[
        { key: 'id',        label: 'ID' },
        { key: 'amount',    label: 'Số tiền',     type: 'number' },
        { key: 'method',    label: 'Phương thức' },
        { key: 'status',    label: 'Trạng thái',  type: 'select', options: DEPOSIT_STATUS_OPTS },
        { key: 'createdAt', label: 'Ngày tạo' },
      ]}
    />
  );
}

export function GameWithdrawalsPage() {
  return (
    <CrudPage
      title="Game — Rút tiền"
      queryKey="game-withdrawals"
      api={adminGameWithdrawals}
      fields={[
        { key: 'id',        label: 'ID' },
        { key: 'amount',    label: 'Số tiền',     type: 'number' },
        { key: 'bankName',  label: 'Ngân hàng' },
        { key: 'status',    label: 'Trạng thái',  type: 'select', options: DEPOSIT_STATUS_OPTS },
        { key: 'createdAt', label: 'Ngày tạo' },
      ]}
    />
  );
}

export function GameRoundsPage() {
  return (
    <CrudPage
      title="Game — Rounds / Sessions"
      queryKey="game-rounds"
      api={adminGameRounds}
      fields={[
        { key: 'id',         label: 'Round ID' },
        { key: 'gameType',   label: 'Game' },
        { key: 'playerId',   label: 'Player' },
        { key: 'betAmount',  label: 'Cược',     type: 'number' },
        { key: 'result',     label: 'Kết quả' },
        { key: 'payout',     label: 'Thắng',    type: 'number' },
        { key: 'status',     label: 'Trạng thái', type: 'select', options: [
          { label: 'Active',     value: 'active' },
          { label: 'Completed',  value: 'completed' },
          { label: 'Cancelled',  value: 'cancelled' },
        ]},
        { key: 'createdAt',  label: 'Thời gian' },
      ]}
    />
  );
}

export function GameProvidersPage() {
  return (
    <CrudPage
      title="Game — Nhà cung cấp"
      queryKey="game-providers"
      api={adminGameProviders}
      fields={[
        { key: 'name',        label: 'Tên',           required: true },
        { key: 'code',        label: 'Code',          required: true },
        { key: 'apiEndpoint', label: 'API Endpoint',  listHide: true },
        { key: 'rtp',         label: 'RTP (%)',       type: 'number' },
        { key: 'status',      label: 'Trạng thái',   type: 'select', options: [
          { label: 'Active',   value: 'active' },
          { label: 'Inactive', value: 'inactive' },
        ]},
      ]}
    />
  );
}
