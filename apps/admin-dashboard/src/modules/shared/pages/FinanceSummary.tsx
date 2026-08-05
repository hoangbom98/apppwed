// Finance overview: summary cards + 7-day trend chart + channel breakdown.
// Route: accessible from Finance.jsx as a tab.
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Segmented, Row, Col, Card, Statistic, Skeleton } from 'antd';
import api from '@admin/api/client';

function fmt(n) {
  if (n == null) return '—';
  return Number(n).toLocaleString('vi-VN') + ' ₫';
}

// ── Tiny SVG bar/line chart — UNCHANGED ────────────────────────────────────────
function MiniChart({ data, width = 600, height = 120 }) {
  if (!data || data.length === 0) return null;

  const deposits    = data.map(d => d.deposits    || 0);
  const withdrawals = data.map(d => d.withdrawals || 0);
  const maxVal      = Math.max(...deposits, ...withdrawals, 1);

  const BAR_W     = 32;
  const GAP       = 12;
  const TOTAL_W   = data.length * (BAR_W * 2 + GAP + 8);
  const PAD_LEFT  = 8;
  const PAD_BOT   = 20;
  const chartH    = height - PAD_BOT;

  const barH = (v) => Math.max(2, (v / maxVal) * chartH);

  return (
    <svg viewBox={`0 0 ${Math.max(TOTAL_W, width)} ${height}`} className="w-full" style={{ height }}>
      {data.map((d, i) => {
        const x      = PAD_LEFT + i * (BAR_W * 2 + GAP + 8);
        const depH   = barH(d.deposits || 0);
        const witH   = barH(d.withdrawals || 0);
        const label  = d.date ? d.date.slice(5) : '';
        return (
          <g key={i}>
            <rect x={x} y={chartH - depH} width={BAR_W} height={depH} rx={3} fill="#22c55e" opacity={0.85} />
            <rect x={x + BAR_W + 2} y={chartH - witH} width={BAR_W} height={witH} rx={3} fill="#ef4444" opacity={0.75} />
            <text x={x + BAR_W + 1} y={height - 3} textAnchor="middle" fill="#6b7280" fontSize="9">{label}</text>
          </g>
        );
      })}
      <g>
        <rect x={PAD_LEFT} y={height - 16} width={8} height={8} rx={1} fill="#22c55e" />
        <text x={PAD_LEFT + 10} y={height - 8} fill="#9ca3af" fontSize="9">Nạp</text>
        <rect x={PAD_LEFT + 40} y={height - 16} width={8} height={8} rx={1} fill="#ef4444" />
        <text x={PAD_LEFT + 50} y={height - 8} fill="#9ca3af" fontSize="9">Rút</text>
      </g>
    </svg>
  );
}

export default function FinanceSummary() {
  const [days, setDays] = useState(30);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-finance-summary', days],
    queryFn:  () => api.get('/admin/finance/summary', { params: { days } }).then(r => r.data),
    staleTime: 60_000,
  });

  const totals   = data?.data?.totals   ?? data?.totals   ?? {};
  const today    = data?.data?.today    ?? data?.today    ?? {};
  const pending  = data?.data?.pending  ?? data?.pending  ?? {};
  const channels = data?.data?.channels ?? data?.channels ?? [];
  const trend    = data?.data?.trend    ?? data?.trend    ?? [];

  return (
    <div className="space-y-6">
      {/* Period picker */}
      <Segmented
        options={[
          { label: '7 ngày',  value: 7  },
          { label: '14 ngày', value: 14 },
          { label: '30 ngày', value: 30 },
          { label: '90 ngày', value: 90 },
        ]}
        value={days}
        onChange={setDays}
      />

      {/* Stats cards */}
      {isLoading ? (
        <Row gutter={[12, 12]}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Col key={i} xs={12} md={8} xl={4}>
              <Card size="small"><Skeleton active paragraph={{ rows: 2 }} title={false} /></Card>
            </Col>
          ))}
        </Row>
      ) : (
        <Row gutter={[12, 12]}>
          <Col xs={12} md={8} xl={4}>
            <Card size="small">
              <Statistic
                title="Tổng nạp"
                value={fmt(totals.deposits)}
                valueStyle={{ color: '#4ade80', fontSize: 18 }}
                suffix={<span style={{ fontSize: 11, color: '#6b7280' }}>{totals.depositCount ?? 0} GD</span>}
              />
            </Card>
          </Col>
          <Col xs={12} md={8} xl={4}>
            <Card size="small">
              <Statistic
                title="Tổng rút"
                value={fmt(totals.withdrawals)}
                valueStyle={{ color: '#f87171', fontSize: 18 }}
                suffix={<span style={{ fontSize: 11, color: '#6b7280' }}>{totals.withdrawCount ?? 0} GD</span>}
              />
            </Card>
          </Col>
          <Col xs={12} md={8} xl={4}>
            <Card size="small">
              <Statistic
                title="Chênh lệch"
                value={fmt(totals.net)}
                valueStyle={{ color: totals.net >= 0 ? '#34d399' : '#fb7185', fontSize: 18 }}
              />
            </Card>
          </Col>
          <Col xs={12} md={8} xl={4}>
            <Card size="small">
              <Statistic
                title="Hôm nay – Nạp"
                value={fmt(today.deposits)}
                valueStyle={{ color: '#60a5fa', fontSize: 18 }}
              />
            </Card>
          </Col>
          <Col xs={12} md={8} xl={4}>
            <Card size="small">
              <Statistic
                title="Hôm nay – Rút"
                value={fmt(today.withdrawals)}
                valueStyle={{ color: '#fb923c', fontSize: 18 }}
              />
            </Card>
          </Col>
          <Col xs={12} md={8} xl={4}>
            <Card size="small">
              <Statistic
                title="Đang chờ duyệt"
                value={(pending.deposits ?? 0) + (pending.withdrawals ?? 0)}
                valueStyle={{ color: '#facc15', fontSize: 18 }}
                suffix={
                  <span style={{ fontSize: 11, color: '#6b7280' }}>
                    Nạp: {pending.deposits ?? 0} | Rút: {pending.withdrawals ?? 0}
                  </span>
                }
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* Trend chart */}
      {trend.length > 0 && (
        <Card title="Xu hướng 7 ngày gần nhất">
          <MiniChart data={trend} />
        </Card>
      )}

      {/* Channel breakdown */}
      {channels.length > 0 && (
        <Card title="Phân bổ kênh nạp">
          <div className="space-y-3">
            {channels.map((c, i) => {
              const total = channels.reduce((s, x) => s + (x.total || 0), 0);
              const pct   = total > 0 ? ((c.total / total) * 100).toFixed(1) : '0.0';
              return (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-20 text-xs text-gray-400 shrink-0 uppercase">{c.method ?? '—'}</div>
                  <div className="flex-1 bg-gray-800 rounded-full h-2 overflow-hidden">
                    <div className="h-2 bg-blue-500 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="text-xs text-gray-300 w-12 text-right">{pct}%</div>
                  <div className="text-xs text-gray-500 w-28 text-right">{fmt(c.total)}</div>
                  <div className="text-xs text-gray-600 w-12 text-right">{c.count} GD</div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
