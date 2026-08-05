import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Typography, Flex } from 'antd';
import api from '@admin/api/client';
import { LkvipStatCard, LkvipGrid } from '@lkvip/ui';

const { Text } = Typography;

export default function SocialDashboard() {
  const { data } = useQuery({
    queryKey: ['social-admin-stats'],
    queryFn:  () => api.get('/social/admin/stats').then(r => r.data?.data ?? r.data),
    staleTime: 30_000,
  });

  const stats = [
    { title: 'Tổng người dùng',    value: data?.totalUsers    ?? 0 },
    { title: 'Bài đăng hôm nay',   value: data?.postsToday    ?? 0 },
    { title: 'Báo cáo chưa xử lý', value: data?.pendingReports ?? 0 },
    { title: 'Đang trực tuyến',    value: data?.onlineUsers   ?? 0 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <div style={{ fontSize: 22, fontWeight: 900 }}>Social App — Tổng quan</div>
        <Text type="secondary">Thống kê hoạt động mạng xã hội</Text>
      </div>
      <LkvipGrid>
        {stats.map((s, i) => (
          <LkvipStatCard key={i} {...s} />
        ))}
      </LkvipGrid>
    </div>
  );
}
