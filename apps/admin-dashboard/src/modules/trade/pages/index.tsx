// @ts-nocheck
// frontend/admin-dashboard/src/modules/trade/pages/index.tsx
import React from 'react';
import CrudPage from '@admin/modules/shared/components/CrudPage';
import {
  adminTradeUsers,
  adminTradeKyc,
  adminTradeOrders,
  adminTradeWallets,
} from '../api';

const STATUS_OPTS = [
  { label: 'Active',    value: 'active' },
  { label: 'Suspended', value: 'suspended' },
  { label: 'Banned',    value: 'banned' },
];

const KYC_STATUS_OPTS = [
  { label: 'Pending',   value: 'pending' },
  { label: 'Approved',  value: 'approved' },
  { label: 'Rejected',  value: 'rejected' },
];

// ── Users ─────────────────────────────────────────────────────────────────────
export const TradeUsersPage: React.FC = () => {
  return (
    <CrudPage
      title="Trade — Người dùng"
      queryKey="trade-users"
      api={adminTradeUsers}
      fields={[
        { key: 'username',  label: 'Username' },
        { key: 'email',     label: 'Email' },
        { key: 'kycStatus', label: 'KYC', type: 'select', options: KYC_STATUS_OPTS },
        { key: 'status',    label: 'Trạng thái', type: 'select', options: STATUS_OPTS },
        { key: 'createdAt', label: 'Ngày tạo' },
      ]}
    />
  );
};

// ── KYC queue ─────────────────────────────────────────────────────────────────
export const TradeKycPage: React.FC = () => {
  return (
    <CrudPage
      title="Trade — KYC Queue"
      queryKey="trade-kyc"
      api={adminTradeKyc}
      fields={[
        { key: 'userId',    label: 'User ID' },
        { key: 'docType',   label: 'Loại giấy tờ' },
        { key: 'docNumber', label: 'Số giấy tờ' },
        { key: 'status',    label: 'Trạng thái', type: 'select', options: KYC_STATUS_OPTS },
        { key: 'createdAt', label: 'Ngày nộp' },
      ]}
    />
  );
};

// ── Orders ────────────────────────────────────────────────────────────────────
export const TradeOrdersPage: React.FC = () => {
  return (
    <CrudPage
      title="Trade — Lệnh giao dịch"
      queryKey="trade-orders"
      api={adminTradeOrders}
      fields={[
        { key: 'id',        label: 'Order ID' },
        { key: 'userId',    label: 'User ID' },
        { key: 'symbol',    label: 'Symbol' },
        { key: 'side',      label: 'Chiều', type: 'select', options: [
          { label: 'Mua',  value: 'buy' },
          { label: 'Bán',  value: 'sell' },
        ]},
        { key: 'quantity',  label: 'Số lượng',  type: 'number' },
        { key: 'price',     label: 'Giá',       type: 'number' },
        { key: 'total',     label: 'Tổng',      type: 'number' },
        { key: 'status',    label: 'Trạng thái', type: 'select', options: [
          { label: 'Open',      value: 'open' },
          { label: 'Filled',    value: 'filled' },
          { label: 'Cancelled', value: 'cancelled' },
          { label: 'Partial',   value: 'partial' },
        ]},
        { key: 'createdAt', label: 'Thời gian' },
      ]}
    />
  );
};

// ── Wallets ───────────────────────────────────────────────────────────────────
export const TradeWalletsPage: React.FC = () => {
  return (
    <CrudPage
      title="Trade — Ví người dùng"
      queryKey="trade-wallets"
      api={adminTradeWallets}
      fields={[
        { key: 'userId',    label: 'User ID' },
        { key: 'currency',  label: 'Loại tiền' },
        { key: 'balance',   label: 'Số dư',    type: 'number' },
        { key: 'frozen',    label: 'Đóng băng',type: 'number' },
        { key: 'address',   label: 'Địa chỉ ví', listHide: true },
        { key: 'updatedAt', label: 'Cập nhật lần cuối' },
      ]}
    />
  );
};
