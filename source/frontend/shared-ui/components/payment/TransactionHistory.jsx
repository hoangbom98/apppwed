/**
 * TransactionHistory.jsx — Shared paginated transaction history table.
 *
 * Usage (Game, Dating, Trade, Sports):
 *   import { TransactionHistory } from '@ui';
 *   <TransactionHistory />
 *
 * Fetches from GET /{project}/wallet/history?page=&limit=
 * Supports type filter (deposit | withdraw | bet | cashback | bonus | all)
 */
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/client';
import { formatVND, formatDateTime, formatRelativeTime } from '../../utils/formatters';
import DataTable from '../Layout/DataTable';
import Pagination from '../Pagination';
import Badge from '../Badge';

const project = import.meta.env.VITE_PROJECT || 'game';

const TYPE_FILTERS = [
  { label: 'Tất cả',   value: 'all' },
  { label: 'Nạp tiền', value: 'deposit' },
  { label: 'Rút tiền', value: 'withdraw' },
  { label: 'Cược',     value: 'bet' },
  { label: 'Thưởng',   value: 'bonus' },
  { label: 'Cashback', value: 'cashback' },
];

const AMOUNT_COLOR = {
  deposit:       'text-green-400',
  win:           'text-green-400',
  bonus:         'text-green-400',
  cashback:      'text-green-400',
  loyalty_redeem:'text-green-400',
  withdraw:      'text-red-400',
  bet:           'text-red-400',
  loss:          'text-red-400',
};

const TYPE_BADGE = {
  deposit:        { label: 'Nạp',      cls: 'bg-green-900/40 text-green-400' },
  withdraw:       { label: 'Rút',      cls: 'bg-red-900/40 text-red-400' },
  bet:            { label: 'Cược',     cls: 'bg-yellow-900/40 text-yellow-400' },
  win:            { label: 'Thắng',    cls: 'bg-green-900/40 text-green-400' },
  bonus:          { label: 'Thưởng',   cls: 'bg-blue-900/40 text-blue-400' },
  cashback:       { label: 'Cashback', cls: 'bg-purple-900/40 text-purple-400' },
  promo_bonus:    { label: 'KM',       cls: 'bg-pink-900/40 text-pink-400' },
  loyalty_redeem: { label: 'Đổi điểm',cls: 'bg-indigo-900/40 text-indigo-400' },
};

const LIMIT = 15;

/**
 * @param {{
 *   apiPath?:    string  – override default "/{project}/wallet/history"
 *   className?:  string
 * }} props
 */
export default function TransactionHistory({ apiPath, className = '' }) {
  const [page, setPage]       = useState(1);
  const [typeFilter, setType] = useState('all');

  const endpoint = apiPath || `/${project}/wallet/history`;

  const { data, isLoading } = useQuery({
    queryKey:  ['txnHistory', project, page, typeFilter],
    queryFn:   () =>
      api.get(endpoint, {
        params: { page, limit: LIMIT, ...(typeFilter !== 'all' && { type: typeFilter }) },
      }).then(r => r.data),
    keepPreviousData: true,
  });

  const rows  = data?.data  ?? [];
  const total = data?.meta?.total ?? 0;
  const pages = Math.ceil(total / LIMIT);

  const columns = [
    {
      key:    'type',
      label:  'Loại',
      render: (row) => {
        const badge = TYPE_BADGE[row.type] || { label: row.type, cls: 'bg-gray-700 text-gray-300' };
        return (
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badge.cls}`}>
            {badge.label}
          </span>
        );
      },
    },
    {
      key:    'amount',
      label:  'Số tiền',
      render: (row) => {
        const n    = Number(row.amount);
        const cls  = n > 0
          ? (AMOUNT_COLOR[row.type] || 'text-green-400')
          : 'text-red-400';
        return (
          <span className={`font-mono font-semibold ${cls}`}>
            {n > 0 ? '+' : ''}{formatVND(n)}
          </span>
        );
      },
    },
    {
      key:    'balanceAfter',
      label:  'Số dư sau',
      render: (row) => (
        <span className="text-gray-300 font-mono text-xs">
          {row.balanceAfter != null ? formatVND(row.balanceAfter) : '—'}
        </span>
      ),
    },
    {
      key:    'note',
      label:  'Ghi chú',
      render: (row) => (
        <span className="text-gray-400 text-xs truncate max-w-[140px] block">
          {row.note || row.description || '—'}
        </span>
      ),
    },
    {
      key:    'createdAt',
      label:  'Thời gian',
      render: (row) => (
        <span className="text-gray-400 text-xs" title={formatDateTime(row.createdAt)}>
          {formatRelativeTime(row.createdAt)}
        </span>
      ),
    },
  ];

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Type filter chips */}
      <div className="flex gap-2 flex-wrap">
        {TYPE_FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => { setType(f.value); setPage(1); }}
            className={[
              'px-3 py-1 rounded-full text-xs font-medium transition-colors',
              typeFilter === f.value
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700',
            ].join(' ')}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        rows={rows}
        loading={isLoading}
        keyField="id"
        emptyMessage="Chưa có giao dịch nào"
      />

      {/* Pagination */}
      {pages > 1 && (
        <Pagination page={page} total={pages} onChange={setPage} />
      )}
    </div>
  );
}
