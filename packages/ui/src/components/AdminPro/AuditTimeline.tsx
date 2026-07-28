import React from 'react';
import { Timeline, Spin } from 'antd';

interface AuditTimelineProps {
  logs: Array<{ id: string; action: string; details: any; createdAt: string }>;
  loading?: boolean;
}

export const AuditTimeline: React.FC<AuditTimelineProps> = ({ logs, loading }) => {
  if (loading) return <Spin />;

  return (
    <Timeline
      items={logs.map(log => ({
        color: log.action === 'delete' ? 'red' : 'green',
        children: (
          <div className="text-xs">
            <p className="font-semibold">{log.action}</p>
            <p className="text-gray-500">{new Date(log.createdAt).toLocaleString()}</p>
            <pre className="mt-1 bg-gray-100 p-1 rounded">{JSON.stringify(log.details, null, 2)}</pre>
          </div>
        )
      }))}
    />
  );
};
