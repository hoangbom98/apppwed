// @ts-nocheck
import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import type { ChartPoint } from '@/api/apiBangDieuKhien';

interface Props {
  data: ChartPoint[];
}

const formatYAxis = (value: number) => {
  if (value >= 1_000_000) return `${value / 1_000_000}M`;
  if (value >= 1_000)    return `${value / 1_000}K`;
  return `${value}`;
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1a1f2e] border border-white/10 rounded-xl p-3 shadow-2xl text-xs">
      <p className="text-gray-400 mb-2 font-medium">{label}</p>
      {payload.map((entry: any) => (
        <div key={entry.dataKey} className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
          <span className="text-gray-300">{entry.name}:</span>
          <span className="text-white font-semibold">
            {(entry.value as number).toLocaleString('vi-VN')} ₫
          </span>
        </div>
      ))}
    </div>
  );
};

export default function TransactionChart({ data }: Props) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/5 backdrop-blur-sm p-4">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-white">Biểu đồ giao dịch 14 ngày</h3>
        <p className="text-xs text-gray-400 mt-0.5">Nạp tiền · Rút tiền · Tổng cược</p>
      </div>

      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorDeposit" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#10b981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="colorWithdraw" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="colorBet" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#8b5cf6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis
            dataKey="date"
            tick={{ fill: '#9ca3af', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={formatYAxis}
            tick={{ fill: '#9ca3af', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={45}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: 12, color: '#9ca3af', paddingTop: 8 }}
            formatter={(value) => {
              const map: Record<string, string> = {
                deposit: 'Nạp tiền',
                withdraw: 'Rút tiền',
                bet: 'Tổng cược',
              };
              return map[value] || value;
            }}
          />
          <Area
            type="monotone"
            dataKey="deposit"
            stroke="#10b981"
            strokeWidth={2}
            fill="url(#colorDeposit)"
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
          />
          <Area
            type="monotone"
            dataKey="withdraw"
            stroke="#ef4444"
            strokeWidth={2}
            fill="url(#colorWithdraw)"
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
          />
          <Area
            type="monotone"
            dataKey="bet"
            stroke="#8b5cf6"
            strokeWidth={2}
            fill="url(#colorBet)"
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
