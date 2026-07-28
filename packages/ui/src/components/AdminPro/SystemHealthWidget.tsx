import React from 'react';
import { Card, Progress, Space, Typography } from 'antd';

export const SystemHealthWidget: React.FC<{ ping: number; cpuUsage: number }> = ({ ping, cpuUsage }) => {
  return (
    <Card size="small" title="System Health" className="shadow-sm">
      <Space direction="vertical" className="w-full">
        <Typography.Text>Latency: {ping}ms</Typography.Text>
        <Progress percent={cpuUsage} size="small" status={cpuUsage > 80 ? 'exception' : 'active'} />
      </Space>
    </Card>
  );
};
