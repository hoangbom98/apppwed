import React, { useState } from 'react';
import { Card, DatePicker, Button, Spin, Typography } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { LkvipStatCard, LkvipGrid } from '@lkvip/ui';
import { getFinanceSummary } from '../api';
import { fmtVND, fmtDate } from '@admin/modules/shared/utils/formatters';
import dayjs from 'dayjs';

const { Text } = Typography;

interface DailyPoint {
  date: string;
  deposit: number;
  withdraw: number;
}

function DepositWithdrawChart({ points }: { points: DailyPoint[] }) {
  if (!points.length) {
    return (
      <div className="flex items-center justify-center py-10 text-gray-500 text-sm">
        Không có dữ liệu theo ngày
      </div>
    );
  }

  const W = 600; const H = 120; const PAD = 40; const BAR_W = 10;
  const maxVal = Math.max(...points.flatMap(p => [p.deposit, p.withdraw]), 1);
  const step   = (W - PAD * 2) / (points.length || 1);

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H + 30}`} className="w-full" preserveAspectRatio="xMidYMid meet">
        {[0, 0.5, 1].map(f => {
          const y = H - f * H;
          return (
            <g key={f}>
              <line x1={PAD} y1={y} x2={W - PAD} y2={y} stroke="#374151" strokeWidth={1} strokeDasharray="4,4" />
              <text x={PAD - 4} y={y + 4} textAnchor="end" fontSize="9" fill="#6b7280">
                {fmtVND(maxVal * f)}
              </text>
            </g>
          );
        })}

        {points.map((p, i) => {
          const cx       = PAD + i * step + step / 2;
          const depositH = Math.max(2, (p.deposit  / maxVal) * H);
          const withdrawH= Math.max(2, (p.withdraw / maxVal) * H);

          return (
            <g key={i}>
              <rect
                x={cx - BAR_W - 1} y={H - depositH}
                width={BAR_W} height={depositH}
                fill="#10b981" rx={2} opacity={0.85}
              >
                <title>Nạp: {fmtVND(p.deposit)}</title>
              </rect>
              <rect
                x={cx + 1} y={H - withdrawH}
                width={BAR_W} height={withdrawH}
                fill="#ef4444" rx={2} opacity={0.85}
              >
                <title>Rút: {fmtVND(p.withdraw)}</title>
              </rect>
              <text x={cx} y={H + 14} textAnchor="middle" fontSize="8" fill="#6b7280">
                {p.date.slice(5)}
              </text>
            </g>
          );
        })}
      </svg>

      <div className="flex items-center justify-center gap-6 mt-1">
        <span className="flex items-center gap-1.5 text-xs text-gray-400">
          <span className="w-3 h-3 rounded-sm inline-block" style={{ background: '#10b981' }} />
          Nạp tiền
        </span>
        <span className="flex items-center gap-1.5 text-xs text-gray-400">
          <span className="w-3 h-3 rounded-sm inline-block" style={{ background: '#ef4444' }} />
          Rút tiền
        </span>
      </div>
    </div>
  );
}

export default function FinancialAnalysisPage() {
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(7, 'day'),
    dayjs(),
  ]);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['finance-summary', dateRange[0].format('YYYY-MM-DD'), dateRange[1].format('YYYY-MM-DD')],
    queryFn:  () => getFinanceSummary({
      start: dateRange[0].format('YYYY-MM-DD'),
      end:   dateRange[1].format('YYYY-MM-DD'),
    }),
    staleTime: 60_000,
  });

  const stats = [
    { title: 'Tổng nạp',           value: fmtVND(data?.totalDeposit  ?? 0) },
    { title: 'Tổng rút',           value: fmtVND(data?.totalWithdraw ?? 0), color: '#ef4444' },
    { title: 'Số giao dịch nạp',  value: data?.depositCount  ?? 0 },
    { title: 'Số giao dịch rút',  value: data?.withdrawCount ?? 0 },
    { title: 'Chênh lệch ròng',   value: fmtVND((data?.totalDeposit ?? 0) - (data?.totalWithdraw ?? 0)), color: '#3b82f6' },
    { title: 'GD thành công',      value: data?.successCount  ?? 0, color: '#10b981' },
  ];

  const dailyPoints: DailyPoint[] = data?.daily ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-black text-white">Phân tích tài chính</h1>
        <div className="flex gap-2">
          <DatePicker.RangePicker
            value={dateRange}
            onChange={v => v && setDateRange(v as [dayjs.Dayjs, dayjs.Dayjs])}
          />
          <Button type="primary" loading={isLoading} onClick={() => refetch()}>Truy vấn</Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Spin size="large" /></div>
      ) : (
        <>
          <LkvipGrid>
            {stats.map((s, i) => <LkvipStatCard key={i} {...s} />)}
          </LkvipGrid>

          <Card
            title={
              <div className="flex items-center justify-between">
                <span>Xu hướng Nạp / Rút theo ngày</span>
                {data?.periodLabel && (
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {fmtDate(dateRange[0].toDate())} — {fmtDate(dateRange[1].toDate())}
                  </Text>
                )}
              </div>
            }
          >
            <DepositWithdrawChart points={dailyPoints} />
          </Card>
        </>
      )}
    </div>
  );
}
