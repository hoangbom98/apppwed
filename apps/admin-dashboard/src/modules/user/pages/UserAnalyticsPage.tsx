// @ts-nocheck
import React from 'react';
import { Card, Spin } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { LkvipStatCard, LkvipGrid } from '@lkvip/ui';
import { getUserStats } from '../api';

export default function UserAnalyticsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['user-analytics'],
    queryFn: getUserStats,
    staleTime: 60_000,
  });

  if (isLoading) return <div className="flex justify-center py-20"><Spin size="large" /></div>;

  const stats = [
    { title: 'Tổng người dùng', value: data?.totalUsers ?? 0 },
    { title: 'Người đặt cược', value: data?.bettingUsers ?? 0 },
    { title: 'Nạp lần đầu', value: data?.firstDepositUsers ?? 0 },
    { title: 'Người mới', value: data?.newUsers ?? 0, color: '#52c41a' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black text-white">Phân tích người dùng</h1>
      <LkvipGrid>
        {stats.map((s, i) => (
          <LkvipStatCard key={i} {...s} />
        ))}
      </LkvipGrid>
      <Card title="Xu hướng hoạt động">
        {/* Biểu đồ hoạt động ở đây */}
      </Card>
    </div>
  );
}
