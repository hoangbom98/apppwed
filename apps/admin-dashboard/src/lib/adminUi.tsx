/**
 * apps/admin-dashboard/src/lib/adminUi.tsx
 *
 * Shared UI primitives & format helpers dùng chung toàn admin-dashboard.
 * Import từ đây thay vì định nghĩa lại trong mỗi page.
 *
 * ─── Format helpers ───────────────────────────────────────────────────────────
 *   fmtVND(n)          →  "1.000.000 ₫"   (or "—" if null)
 *   fmtNum(n)          →  "1.000.000"
 *   fmtPct(n)          →  "12.5%"
 *   fmtDate(d)         →  locale vi datetime string
 *   fmtMono(v)         →  <Text code> monospace
 *
 * ─── Status maps ──────────────────────────────────────────────────────────────
 *   STATUS_COLOR        Ant Design Tag color map  (active/pending/success/…)
 *   STATUS_VI           Vietnamese label map
 *   <StatusTag status>  Ready-made Ant Design Tag
 *
 * ─── Composites ───────────────────────────────────────────────────────────────
 *   <DateRangeFilter>   From/To date inputs + search/reset buttons
 *   <UserCell>          username + userId monospace
 *   <AmountCell>        colorized VND amount
 *   <PageHeader>        Title + description + optional right slot
 */
import React, { type ReactNode } from 'react';
import { Tag, Typography, Flex, Button, Space, DatePicker } from 'antd';
import type { Dayjs } from 'dayjs';

const { Text } = Typography;
const { RangePicker } = DatePicker;

// ═══════════════════════════════════════════════════════════════════════════
// FORMAT HELPERS
// ═══════════════════════════════════════════════════════════════════════════

/** Format number as VND with ₫ suffix, returns "—" for null/undefined */
export const fmtVND = (n: number | null | undefined): string =>
  n == null ? '—' : Number(n).toLocaleString('vi-VN') + ' ₫';

/** Format as vi-VN locale integer, returns "—" for null/undefined */
export const fmtNum = (n: number | null | undefined): string =>
  n == null ? '—' : Number(n).toLocaleString('vi-VN');

/** Format as percentage with 1 decimal, returns "—" for null/undefined */
export const fmtPct = (n: number | null | undefined): string =>
  n == null ? '—' : Number(n).toFixed(1) + '%';

/** Format as percentage with decimal from 0–1 rate (e.g. 0.005 → "0.50%") */
export const fmtRate = (n: number | null | undefined): string =>
  n == null ? '—' : (Number(n) * 100).toFixed(2) + '%';

/** Format datetime to vi-VN locale string */
export const fmtDate = (d: string | Date | null | undefined): string =>
  d ? new Date(d).toLocaleString('vi-VN') : '—';

// ═══════════════════════════════════════════════════════════════════════════
// STATUS MAPS — covers all modules (game / trade / dating / sports)
// ═══════════════════════════════════════════════════════════════════════════

export const STATUS_COLOR: Record<string, string> = {
  // Generic
  active:       'success',
  inactive:     'default',
  maintenance:  'warning',
  // Finance
  pending:      'processing',
  processing:   'warning',
  approved:     'success',
  success:      'success',
  completed:    'success',
  failed:       'error',
  rejected:     'error',
  cancelled:    'default',
  expired:      'default',
  // Game sessions
  playing:      'processing',
  finished:     'success',
  error:        'error',
  // Lottery / bets
  PENDING:      'processing',
  WIN:          'success',
  LOSE:         'error',
  CANCELLED:    'default',
  // KYC
  submitted:    'processing',
  verified:     'success',
  // Dating
  banned:       'error',
  suspended:    'warning',
  // Generic flag
  online:       'success',
  offline:      'default',
  open:         'success',
  closed:       'default',
};

export const STATUS_VI: Record<string, string> = {
  active:       'Hoạt động',
  inactive:     'Tắt',
  maintenance:  'Bảo trì',
  pending:      'Chờ duyệt',
  processing:   'Đang xử lý',
  approved:     'Đã duyệt',
  success:      'Thành công',
  completed:    'Hoàn thành',
  failed:       'Thất bại',
  rejected:     'Từ chối',
  cancelled:    'Đã hủy',
  expired:      'Hết hạn',
  playing:      'Đang chơi',
  finished:     'Kết thúc',
  error:        'Lỗi',
  PENDING:      'Chờ kết quả',
  WIN:          'Thắng',
  LOSE:         'Thua',
  CANCELLED:    'Đã hủy',
  submitted:    'Đã nộp',
  verified:     'Đã xác minh',
  banned:       'Bị cấm',
  suspended:    'Tạm dừng',
  online:       'Online',
  offline:      'Offline',
  open:         'Mở',
  closed:       'Đóng',
};

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

// ── StatusTag ────────────────────────────────────────────────────────────────
interface StatusTagProps { status: string; custom?: Record<string, string>; customColor?: Record<string, string> }

export function StatusTag({ status, custom, customColor }: StatusTagProps) {
  const label = (custom?.[status] ?? STATUS_VI[status] ?? status);
  const color = (customColor?.[status] ?? STATUS_COLOR[status] ?? 'default');
  return <Tag color={color}>{label}</Tag>;
}

// ── UserCell ─────────────────────────────────────────────────────────────────
interface UserCellProps { username?: string; userId?: string; email?: string }

export function UserCell({ username, userId, email }: UserCellProps) {
  return (
    <div>
      <div className="font-medium text-sm">{username ?? email ?? '—'}</div>
      {userId && (
        <Text type="secondary" style={{ fontSize: 10, fontFamily: 'monospace' }}>{userId}</Text>
      )}
    </div>
  );
}

// ── AmountCell ───────────────────────────────────────────────────────────────
interface AmountCellProps { amount: number | null | undefined; positive?: boolean; negative?: boolean }

export function AmountCell({ amount, positive, negative }: AmountCellProps) {
  const n   = Number(amount ?? 0);
  const color = positive ? '#4ade80' : negative ? '#ef4444' : n > 0 ? '#4ade80' : n < 0 ? '#ef4444' : undefined;
  const prefix = positive && n > 0 ? '+' : '';
  return (
    <Text style={{ color, fontFamily: 'monospace', fontSize: 12 }}>
      {prefix}{fmtVND(n)}
    </Text>
  );
}

// ── DateRangeFilter ───────────────────────────────────────────────────────────
interface DateRangeFilterProps {
  from:      string;
  to:        string;
  setFrom:   (v: string) => void;
  setTo:     (v: string) => void;
  onSearch:  () => void;
  onReset:   () => void;
  /** If true, use AntD RangePicker instead of plain <input type=date> */
  antd?:     boolean;
  value?:    [Dayjs, Dayjs] | null;
  onChange?: (v: [Dayjs, Dayjs] | null) => void;
}

export function DateRangeFilter({ from, to, setFrom, setTo, onSearch, onReset, antd, value, onChange }: DateRangeFilterProps) {
  if (antd) {
    return (
      <Space wrap>
        <RangePicker value={value as any} onChange={onChange as any} placeholder={['Từ ngày', 'Đến ngày']} size="small" />
        <Button size="small" type="primary" onClick={onSearch}>Tìm kiếm</Button>
        <Button size="small" onClick={onReset}>Đặt lại</Button>
      </Space>
    );
  }
  return (
    <div className="flex gap-2 flex-wrap items-end">
      <div>
        <label className="text-xs text-gray-500 block mb-1">Từ ngày</label>
        <input type="date" value={from} onChange={e => setFrom(e.target.value)}
          className="border border-gray-300 dark:border-gray-600 rounded px-2 py-1.5 text-sm bg-white dark:bg-gray-800" />
      </div>
      <div>
        <label className="text-xs text-gray-500 block mb-1">Đến ngày</label>
        <input type="date" value={to} onChange={e => setTo(e.target.value)}
          className="border border-gray-300 dark:border-gray-600 rounded px-2 py-1.5 text-sm bg-white dark:bg-gray-800" />
      </div>
      <button onClick={onSearch} className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700">Tìm kiếm</button>
      <button onClick={onReset} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm hover:bg-gray-50 dark:hover:bg-gray-700">Đặt lại</button>
    </div>
  );
}

// ── PageHeader ────────────────────────────────────────────────────────────────
interface PageHeaderProps {
  title:        string;
  description?: string;
  extra?:       ReactNode;
  meta?:        string;   // e.g. "Tổng: 123"
}

export function PageHeader({ title, description, extra, meta }: PageHeaderProps) {
  return (
    <Flex align="center" justify="space-between" wrap="wrap" gap={12}>
      <div>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white m-0">{title}</h2>
        {(description || meta) && (
          <Text type="secondary" style={{ fontSize: 12 }}>
            {description ?? ''}{description && meta ? ' — ' : ''}{meta ?? ''}
          </Text>
        )}
      </div>
      {extra != null && <Space wrap>{extra as React.ReactNode as any}</Space>}
    </Flex>
  );
}

// ── StatCard (mini KPI card) ──────────────────────────────────────────────────
interface StatCardProps {
  label:  string;
  value:  string | number | ReactNode;
  sub?:   string;
  color?: string;
}

const STAT_COLORS = {
  blue:   '#3b82f6', green:  '#10b981', red:    '#ef4444',
  amber:  '#f59e0b', purple: '#8b5cf6', gray:   '#6b7280',
};

export function StatCard({ label, value, sub, color = STAT_COLORS.blue }: StatCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className="text-xl font-bold" style={{ color }}>{value}</div>
      {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
    </div>
  );
}

export { STAT_COLORS };
