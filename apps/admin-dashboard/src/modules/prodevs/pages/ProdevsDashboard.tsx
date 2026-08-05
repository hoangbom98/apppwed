import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Typography } from 'antd';
import api from '@admin/api/client';
import { LkvipStatCard, LkvipGrid } from '@lkvip/ui';

const { Text } = Typography;

export default function ProdevsDashboard() {
  const { data } = useQuery({
    queryKey: ['prodevs-admin-stats'],
    queryFn:  () => api.get('/admin/prodevs/stats').then(r => r.data?.data ?? r.data),
    staleTime: 60_000,
  });

  const stats = [
    { title: 'Tổng dự án đã scaffold', value: data?.totalProjects   ?? 0 },
    { title: 'Templates có sẵn',        value: data?.totalTemplates  ?? 0 },
    { title: 'AI calls hôm nay',        value: data?.aiCallsToday    ?? 0 },
    { title: 'Builds thành công',       value: data?.successfulBuilds ?? 0 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <div style={{ fontSize: 22, fontWeight: 900 }}>ProDevs CLI — Tổng quan</div>
        <Text type="secondary">Thống kê scaffold, template, AI code generation</Text>
      </div>
      <LkvipGrid>
        {stats.map((s, i) => <LkvipStatCard key={i} {...s} />)}
      </LkvipGrid>
    </div>
  );
}
