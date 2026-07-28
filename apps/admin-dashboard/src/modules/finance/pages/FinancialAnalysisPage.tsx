// @ts-nocheck
import React, { useState } from 'react';
import { Card, DatePicker, Button, Spin } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { LkvipStatCard, LkvipGrid } from '@lkvip/ui';
import { getFinanceSummary } from '../api';
import dayjs from 'dayjs';

export default function FinancialAnalysisPage() {
  const [dateRange, setDateRange] = useState([dayjs().subtract(7, 'day'), dayjs()]);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['finance-summary', dateRange],
    queryFn: () => getFinanceSummary({
      start: dateRange[0].format('YYYY-MM-DD'),
      end:   dateRange[1].format('YYYY-MM-DD'),
    }),
    staleTime: 60_000,
  });

  if (isLoading) return <div className="flex justify-center py-20"><Spin size="large" /></div>;

  const stats = [
    { title: 'Tổng nạp', value: Number(data?.totalDeposit ?? 0).toLocaleString('vi-VN'), suffix: 'đ' },
    { title: 'Tổng rút', value: Number(data?.totalWithdraw ?? 0).toLocaleString('vi-VN'), suffix: 'đ', color: '#ff4d4f' },
    { title: 'Số giao dịch nạp', value: data?.depositCount ?? 0 },
    { title: 'Số giao dịch rút', value: data?.withdrawCount ?? 0 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-white">Phân tích tài chính</h1>
        <div className="flex gap-2">
          <DatePicker.RangePicker value={dateRange} onChange={(v) => v && setDateRange(v)} />
          <Button type="primary" onClick={() => refetch()}>Truy vấn</Button>
        </div>
      </div>

      <LkvipGrid>
        {stats.map((s, i) => (
          <LkvipStatCard key={i} {...s} />
        ))}
      </LkvipGrid>

      <Card title="Xu hướng chênh lệch nạp/rút">
        {/* Biểu đồ tài chính ở đây */}
      </Card>
    </div>
  );
}
