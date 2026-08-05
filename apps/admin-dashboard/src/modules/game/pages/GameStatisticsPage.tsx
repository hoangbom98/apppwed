import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import client from '@admin/api/client';
import { fmtVND, fmtNum, fmtPct } from '@admin/modules/shared/utils/formatters';

const COLOR = {
  green:  '#10b981',
  red:    '#ef4444',
  blue:   '#3b82f6',
  amber:  '#f59e0b',
  purple: '#8b5cf6',
  gray:   '#6b7280',
};

// ── tiny bar chart (SVG) ─────────────────────────────────────────────────────
function BarChart({ data = [], xKey = 'date', yKeys = [{ key: 'total', color: COLOR.blue, label: 'Tổng' }], height = 120 }) {
  if (!data.length) return <div className="text-center text-gray-400 py-8 text-sm">Không có dữ liệu</div>;
  const allVals = data.flatMap(d => yKeys.map(y => Number(d[y.key] || 0)));
  const maxVal  = Math.max(...allVals, 1);
  const W = 600; const H = height; const PAD = 32; const BAR_W = Math.max(6, Math.floor((W - PAD * 2) / data.length / yKeys.length) - 2);
  return (
    <svg viewBox={`0 0 ${W} ${H + 20}`} className="w-full" preserveAspectRatio="xMidYMid meet">
      {data.map((d, i) => {
        const groupW = yKeys.length * (BAR_W + 2);
        const groupX = PAD + i * ((W - PAD * 2) / data.length) + ((W - PAD * 2) / data.length - groupW) / 2;
        return (
          <g key={i}>
            {yKeys.map((y, j) => {
              const val = Number(d[y.key] || 0);
              const bh  = Math.max(2, (val / maxVal) * (H - 10));
              const bx  = groupX + j * (BAR_W + 2);
              const by  = H - bh;
              return <rect key={j} x={bx} y={by} width={BAR_W} height={bh} fill={y.color} rx="2" opacity="0.85">
                <title>{y.label}: {fmtVND(val)}</title>
              </rect>;
            })}
            <text x={groupX + groupW / 2} y={H + 14} textAnchor="middle" fontSize="9" fill={COLOR.gray}>
              {String(d[xKey]).slice(5)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ── stat card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color = COLOR.blue }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className="text-xl font-bold" style={{ color }}>{value}</div>
      {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
    </div>
  );
}

// ── tabs ─────────────────────────────────────────────────────────────────────
const TABS = [
  { key: 'overview', label: 'Tổng quan' },
  { key: 'finance',  label: 'Tài chính' },
  { key: 'profit',   label: 'Lợi nhuận' },
  { key: 'users',    label: 'Người dùng' },
  { key: 'team',     label: 'Đại lý' },
];

// ═══════════════════════════════════════════════════════════════════════════
// TAB — Overview
// ═══════════════════════════════════════════════════════════════════════════
function OverviewTab() {
  const { data, isLoading } = useQuery({
    queryKey: ['stats-overview'],
    queryFn:  () => client.get('/game/admin/statistics/overview').then(r => r.data?.data),
    refetchInterval: 60_000,
  });
  const { data: rechargeTrend } = useQuery({
    queryKey: ['stats-recharge-trend', 7],
    queryFn:  () => client.get('/game/admin/statistics/recharge-trend', { params: { days: 7 } }).then(r => r.data?.data),
  });
  const { data: betTrend } = useQuery({
    queryKey: ['stats-bet-trend', 7],
    queryFn:  () => client.get('/game/admin/statistics/bet-trend', { params: { days: 7 } }).then(r => r.data?.data),
  });

  if (isLoading) return <div className="text-center py-16 text-gray-400">Đang tải...</div>;

  const d = data || {};
  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Tổng người dùng"  value={fmtNum(d.totalUsers)}      sub={`+${fmtNum(d.newUsersToday)} hôm nay`} color={COLOR.blue} />
        <StatCard label="Đang hoạt động"   value={fmtNum(d.activeUsersToday)} sub="hôm nay"                               color={COLOR.green} />
        <StatCard label="Nạp hôm nay"      value={fmtVND(d.depositToday)}    sub={`Tháng: ${fmtVND(d.depositMonth)}`}    color={COLOR.amber} />
        <StatCard label="Lợi nhuận tháng"  value={fmtVND(d.profitMonth)}     sub={`Hôm nay: ${fmtVND(d.profitToday)}`}  color={d.profitMonth >= 0 ? COLOR.green : COLOR.red} />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Rút hôm nay"     value={fmtVND(d.withdrawToday)}   sub={`Tháng: ${fmtVND(d.withdrawMonth)}`}  color={COLOR.red} />
        <StatCard label="Cược hôm nay"    value={fmtVND(d.betAmountToday)}  sub={`Tháng: ${fmtVND(d.betAmountMonth)}`} color={COLOR.purple} />
        <StatCard label="Nạp tháng"       value={fmtVND(d.depositMonth)}    color={COLOR.blue} />
        <StatCard label="Rút tháng"       value={fmtVND(d.withdrawMonth)}   color={COLOR.red} />
      </div>
      {/* Trend charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="text-sm font-semibold mb-3">Xu hướng nạp 7 ngày</div>
          <BarChart data={rechargeTrend?.data || []} xKey="date" yKeys={[{ key: 'total', color: COLOR.blue, label: 'Nạp' }]} />
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="text-sm font-semibold mb-3">Xu hướng cược 7 ngày</div>
          <BarChart data={betTrend?.data || []} xKey="date"
            yKeys={[
              { key: 'bet', color: COLOR.purple, label: 'Cược' },
              { key: 'ggr', color: COLOR.green,  label: 'GGR'  },
            ]} />
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB — Finance
// ═══════════════════════════════════════════════════════════════════════════
function FinanceTab() {
  const [from, setFrom] = useState('');
  const [to,   setTo]   = useState('');
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['stats-finance', from, to],
    queryFn:  () => client.get('/game/admin/statistics/finance', { params: { from, to } }).then(r => r.data?.data),
  });
  const d = data || {};
  return (
    <div className="space-y-6">
      {/* Date filter */}
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
        <button onClick={() => refetch()} className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700">Tìm kiếm</button>
        <button onClick={() => { setFrom(''); setTo(''); }} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm hover:bg-gray-50 dark:hover:bg-gray-700">Đặt lại</button>
      </div>
      {isLoading ? <div className="text-center py-8 text-gray-400">Đang tải...</div> : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard label="Tổng nạp"     value={fmtVND(d.totalDeposit)}   sub={`${fmtNum(d.depositCount)} lệnh`}   color={COLOR.blue} />
            <StatCard label="Tổng rút"     value={fmtVND(d.totalWithdraw)}  sub={`${fmtNum(d.withdrawCount)} lệnh`}  color={COLOR.red} />
            <StatCard label="Lợi nhuận gộp" value={fmtVND(d.totalProfit)}  color={d.totalProfit >= 0 ? COLOR.green : COLOR.red} />
            <StatCard label="Tỷ lệ rút/nạp" value={fmtPct(d.totalDeposit ? (d.totalWithdraw / d.totalDeposit) * 100 : null)} color={COLOR.amber} />
          </div>
          {/* Trend */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="text-sm font-semibold mb-3">Xu hướng nạp / rút theo ngày</div>
            <BarChart data={d.trendData || []} xKey="date"
              yKeys={[
                { key: 'deposits',    color: COLOR.blue, label: 'Nạp'  },
                { key: 'withdrawals', color: COLOR.red,  label: 'Rút'   },
              ]} />
          </div>
          {/* Gateway breakdown */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="text-sm font-semibold mb-3">Phân tích theo kênh nạp</div>
            <table className="w-full text-sm">
              <thead><tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-2 text-gray-500 font-medium">Kênh</th>
                <th className="text-right py-2 text-gray-500 font-medium">Số lệnh</th>
                <th className="text-right py-2 text-gray-500 font-medium">Tổng nạp</th>
              </tr></thead>
              <tbody>{(d.gatewayBreakdown || []).map((g, i) => (
                <tr key={i} className="border-b border-gray-100 dark:border-gray-700/50">
                  <td className="py-2 font-mono uppercase">{g.gateway}</td>
                  <td className="py-2 text-right">{fmtNum(g.count)}</td>
                  <td className="py-2 text-right font-medium text-blue-600">{fmtVND(g.amount)}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB — Profit
// ═══════════════════════════════════════════════════════════════════════════
function ProfitTab() {
  const [from, setFrom] = useState('');
  const [to,   setTo]   = useState('');
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['stats-profit', from, to],
    queryFn:  () => client.get('/game/admin/statistics/profit', { params: { from, to } }).then(r => r.data?.data),
  });
  const d = data || {};
  return (
    <div className="space-y-6">
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
        <button onClick={() => refetch()} className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700">Tìm kiếm</button>
        <button onClick={() => { setFrom(''); setTo(''); }} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm hover:bg-gray-50 dark:hover:bg-gray-700">Đặt lại</button>
      </div>
      {isLoading ? <div className="text-center py-8 text-gray-400">Đang tải...</div> : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <StatCard label="Lợi nhuận gộp" value={fmtVND(d.grossProfit)}   color={d.grossProfit >= 0 ? COLOR.green : COLOR.red} />
            <StatCard label="Rebate đã trả"  value={fmtVND(d.rebatePaid)}    color={COLOR.amber} />
            <StatCard label="Hoa hồng đã trả" value={fmtVND(d.commissionPaid)} color={COLOR.purple} />
            <StatCard label="Tổng nạp"      value={fmtVND(d.grossDeposit)}  color={COLOR.blue} />
            <StatCard label="Tổng rút"      value={fmtVND(d.grossWithdraw)} color={COLOR.red} />
            <StatCard label="Lợi nhuận thuần" value={fmtVND(d.netProfit)}   color={d.netProfit >= 0 ? COLOR.green : COLOR.red} sub="sau rebate + hoa hồng" />
          </div>
          {/* Waterfall-style table */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="text-sm font-semibold mb-3">Phân tích lợi nhuận</div>
            <table className="w-full text-sm">
              <thead><tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-2 text-gray-500 font-medium">Hạng mục</th>
                <th className="text-right py-2 text-gray-500 font-medium">Giá trị</th>
              </tr></thead>
              <tbody>{(d.breakdown || []).map((b, i) => (
                <tr key={i} className="border-b border-gray-100 dark:border-gray-700/50">
                  <td className="py-2">{b.label}</td>
                  <td className={`py-2 text-right font-medium ${b.value >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {fmtVND(b.value)}
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB — Users
// ═══════════════════════════════════════════════════════════════════════════
function UsersTab() {
  const [from, setFrom] = useState('');
  const [to,   setTo]   = useState('');
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['stats-users', from, to],
    queryFn:  () => client.get('/game/admin/statistics/users', { params: { from, to } }).then(r => r.data?.data),
  });
  const d = data || {};
  return (
    <div className="space-y-6">
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
        <button onClick={() => refetch()} className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700">Tìm kiếm</button>
        <button onClick={() => { setFrom(''); setTo(''); }} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm hover:bg-gray-50 dark:hover:bg-gray-700">Đặt lại</button>
      </div>
      {isLoading ? <div className="text-center py-8 text-gray-400">Đang tải...</div> : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <StatCard label="Tổng người dùng"  value={fmtNum(d.totalUsers)}  color={COLOR.blue} />
            <StatCard label="Đăng ký mới"       value={fmtNum(d.newUsers)}   color={COLOR.green} />
            <StatCard label="Đang hoạt động"    value={fmtNum(d.activeUsers)} color={COLOR.purple} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Daily registration trend */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <div className="text-sm font-semibold mb-3">Đăng ký theo ngày</div>
              <BarChart data={d.dailyTrend || []} xKey="date" yKeys={[{ key: 'count', color: COLOR.green, label: 'Đăng ký' }]} />
            </div>
            {/* VIP distribution */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <div className="text-sm font-semibold mb-3">Phân bổ VIP</div>
              <table className="w-full text-sm">
                <thead><tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-2 text-gray-500">Cấp VIP</th>
                  <th className="text-right py-2 text-gray-500">Số lượng</th>
                  <th className="text-right py-2 text-gray-500">Tỷ lệ</th>
                </tr></thead>
                <tbody>{(d.vipDistribution || []).sort((a, b) => a.level - b.level).map((v, i) => (
                  <tr key={i} className="border-b border-gray-100 dark:border-gray-700/50">
                    <td className="py-1.5 font-medium text-amber-600">VIP {v.level}</td>
                    <td className="py-1.5 text-right">{fmtNum(v.count)}</td>
                    <td className="py-1.5 text-right text-gray-500">
                      {fmtPct(d.totalUsers ? (v.count / d.totalUsers) * 100 : 0)}
                    </td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB — Team / Agent
// ═══════════════════════════════════════════════════════════════════════════
function TeamTab() {
  const [from, setFrom] = useState('');
  const [to,   setTo]   = useState('');
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['stats-team', from, to],
    queryFn:  () => client.get('/game/admin/statistics/team', { params: { from, to } }).then(r => r.data?.data),
  });
  const d = data || {};
  return (
    <div className="space-y-6">
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
        <button onClick={() => refetch()} className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700">Tìm kiếm</button>
        <button onClick={() => { setFrom(''); setTo(''); }} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm hover:bg-gray-50 dark:hover:bg-gray-700">Đặt lại</button>
      </div>
      {isLoading ? <div className="text-center py-8 text-gray-400">Đang tải...</div> : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-2 gap-4">
            <StatCard label="Hoa hồng đã trả" value={fmtVND(d.commissionPaid)} color={COLOR.amber} />
            <StatCard label="Giới thiệu mới"   value={fmtNum(d.newReferrals)}  color={COLOR.green} />
          </div>
          {/* Top agents */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="text-sm font-semibold mb-3">Top 10 Đại lý</div>
            <table className="w-full text-sm">
              <thead><tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-2 text-gray-500">#</th>
                <th className="text-left py-2 text-gray-500">Tên đăng nhập</th>
                <th className="text-right py-2 text-gray-500">Tuyến dưới</th>
                <th className="text-right py-2 text-gray-500">Tổng hoa hồng</th>
                <th className="text-center py-2 text-gray-500">VIP</th>
              </tr></thead>
              <tbody>{(d.topAgents || []).map((a, i) => (
                <tr key={i} className="border-b border-gray-100 dark:border-gray-700/50">
                  <td className="py-2 text-gray-400">{i + 1}</td>
                  <td className="py-2 font-medium">{a.username || '—'}</td>
                  <td className="py-2 text-right">{fmtNum(a.downlineCount)}</td>
                  <td className="py-2 text-right text-amber-600 font-medium">{fmtVND(a.totalCommission)}</td>
                  <td className="py-2 text-center text-xs text-blue-600">VIP {a.vipLevel}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Main page
// ═══════════════════════════════════════════════════════════════════════════
export default function GameStatisticsPage() {
  const [tab, setTab] = useState('overview');

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Thống kê</h1>
        <p className="text-sm text-gray-500 mt-0.5">Phân tích tài chính, người dùng và đại lý toàn hệ thống</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
              tab === t.key
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {tab === 'overview' && <OverviewTab />}
        {tab === 'finance'  && <FinanceTab />}
        {tab === 'profit'   && <ProfitTab />}
        {tab === 'users'    && <UsersTab />}
        {tab === 'team'     && <TeamTab />}
      </div>
    </div>
  );
}
