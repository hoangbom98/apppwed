// @ts-nocheck
import React from 'react';
import { Spin } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { LkvipStatCard, LkvipGrid } from '@lkvip/ui';
import { getDashboardStats } from '../api';

export default function StatisticsOverviewPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-dashboard-stats'],
    queryFn: getDashboardStats,
    staleTime: 30_000,
  });

  if (isLoading) return <div className="flex justify-center py-20"><Spin size="large" /></div>;

  const stats = [
    { title: 'Trực tuyến', value: data?.online ?? 0, suffix: 'người' },
    { title: 'Lợi nhuận hôm nay', value: Number(data?.profit ?? 0).toLocaleString('vi-VN'), suffix: 'đ', color: '#ff4d4f' },
    { title: 'Số dư nền tảng', value: Number(data?.balance ?? 0).toLocaleString('vi-VN'), suffix: 'đ' },
    { title: 'Đăng ký hôm nay', value: data?.registrations ?? 0, suffix: 'người', color: '#52c41a' },
    { title: 'Hoạt động hôm nay', value: data?.active ?? 0, suffix: 'người' },
    { title: 'Nạp tiền hôm nay', value: Number(data?.deposits ?? 0).toLocaleString('vi-VN'), suffix: 'đ' },
    { title: 'Rút tiền hôm nay', value: Number(data?.withdrawals ?? 0).toLocaleString('vi-VN'), suffix: 'đ', color: '#ff4d4f' },
    { title: 'Cược hôm nay', value: Number(data?.bets ?? 0).toLocaleString('vi-VN'), suffix: 'đ' },
    { title: 'Trao thưởng hôm nay', value: Number(data?.payouts ?? 0).toLocaleString('vi-VN'), suffix: 'đ' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black text-white">Tổng quan thống kê</h1>
      <LkvipGrid>
        {stats.map((s, i) => (
          <LkvipStatCard key={i} {...s} />
        ))}
      </LkvipGrid>
    </div>
  );
}
