// frontend/admin-dashboard/src/modules/shared/pages/SystemPage.jsx
// Route: /settings/system
// Upgraded: disk usage, PM2 process list, one-click restart
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  App, Button, Card, Statistic, Switch, Alert, Spin, Descriptions, Row, Col, Typography, Tag, Table, Progress,
} from 'antd';
import {
  ReloadOutlined, AlertOutlined, NodeIndexOutlined, ClockCircleOutlined,
  LaptopOutlined, ToolOutlined, DatabaseOutlined, HddOutlined, CaretRightOutlined, PoweroffOutlined,
} from '@ant-design/icons';
import api from '@admin/api/client';

const { Text } = Typography;

// ── Memory bar ────────────────────────────────────────────────────────────────
function MemBar({ label, used, total }) {
  const pct      = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;
  const barColor = pct > 80 ? '#ef4444' : pct > 60 ? '#eab308' : '#3b82f6';
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-gray-400">
        <span>{label}</span>
        <span>{used} MB / {total} MB ({pct}%)</span>
      </div>
      <Progress percent={pct} size="small" showInfo={false} strokeColor={barColor} />
    </div>
  );
}

// ── Disk usage bar ─────────────────────────────────────────────────────────────
function DiskBar({ label, used, total }) {
  if (total == null || total === 0) return null;
  const pct = Math.min(100, Math.round((used / total) * 100));
  const barColor = pct > 85 ? '#ef4444' : pct > 70 ? '#eab308' : '#10b981';
  const fmt = v => v >= 1024 ? `${(v / 1024).toFixed(1)} GB` : `${v} MB`;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-gray-400">
        <span>{label}</span>
        <span>{fmt(used)} / {fmt(total)} ({pct}%)</span>
      </div>
      <Progress percent={pct} size="small" showInfo={false} strokeColor={barColor} />
    </div>
  );
}

// ── PM2 Process list ───────────────────────────────────────────────────────────
function PM2Panel({ processes, onRestart, isRestarting }) {
  if (!processes?.length) return null;

  const STATUS_COLOR = { online: 'success', stopped: 'default', errored: 'error', launching: 'processing' };

  const columns = [
    { title: 'Name',    dataIndex: 'name',   key: 'name',   render: v => <Text strong>{v}</Text> },
    { title: 'PID',     dataIndex: 'pid',    key: 'pid',    render: v => <Text code>{v ?? '—'}</Text> },
    { title: 'Status',  dataIndex: 'status', key: 'status', render: v => <Tag color={STATUS_COLOR[v] ?? 'default'}>{v}</Tag> },
    { title: 'CPU',     dataIndex: 'cpu',    key: 'cpu',    render: v => `${v ?? 0}%` },
    { title: 'Memory',  dataIndex: 'memory', key: 'memory', render: v => v ? `${Math.round(v / 1024 / 1024)} MB` : '—' },
    { title: 'Uptime',  dataIndex: 'uptime', key: 'uptime', render: v => v ?? '—' },
    { title: 'Restarts', dataIndex: 'restarts', key: 'restarts', render: v => v ?? 0 },
    {
      title: '', key: 'actions', width: 80,
      render: (_, r) => (
        <Button size="small" icon={<CaretRightOutlined />} loading={isRestarting} onClick={() => onRestart(r.name)}>
          Restart
        </Button>
      ),
    },
  ];

  return (
    <Card title={<span><DatabaseOutlined className="mr-2 text-green-400" />PM2 Processes</span>}>
      <Table dataSource={processes} columns={columns} rowKey="name" size="small" pagination={false} scroll={{ x: 700 }} />
    </Card>
  );
}

// ── Inner page (uses App context) ─────────────────────────────────────────────
function SystemPageInner() {
  const { message } = App.useApp();
  const qc = useQueryClient();

  const { data: sys, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['systemInfo'],
    queryFn:  () => api.get('/admin/stats/system').then(r => r.data?.data ?? r.data),
    refetchInterval: 30000,
  });

  const toggleMaintenance = useMutation({
    mutationFn: (enabled) => api.post('/admin/stats/system/maintenance', { enabled }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['systemInfo'] });
      const mode = res.data?.data?.maintenanceMode;
      if (mode) {
        message.warning('⚠️ Maintenance mode BẬT — users sẽ thấy trang bảo trì');
      } else {
        message.success('✅ Maintenance mode TẮT');
      }
    },
    onError: () => message.error('Lỗi khi thay đổi maintenance mode'),
  });

  const restartProcess = useMutation({
    mutationFn: (name) => api.post('/admin/stats/system/restart', { name }),
    onSuccess: (_, name) => { message.success(`Đã restart: ${name}`); qc.invalidateQueries({ queryKey: ['systemInfo'] }); },
    onError: () => message.error('Lỗi khi restart process'),
  });

  const isMaintenance = sys?.maintenanceMode ?? false;
  const pm2 = sys?.pm2 ?? [];
  const disk = sys?.disk ?? null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Hệ thống</h1>
          <p className="text-sm text-gray-400 mt-0.5">Thông tin server, tài nguyên và chế độ bảo trì</p>
        </div>
        <Button icon={<ReloadOutlined />} loading={isFetching} onClick={() => refetch()}>Làm mới</Button>
      </div>

      {/* Maintenance banner */}
      {isMaintenance && (
        <Alert type="warning" showIcon message="Maintenance mode đang bật"
          description="Tất cả người dùng thấy trang bảo trì. Admin vẫn có thể đăng nhập." />
      )}

      {isLoading ? (
        <div className="flex justify-center py-12"><Spin size="large" /></div>
      ) : (
        <>
          {/* KPI cards */}
          <Row gutter={[16, 16]}>
            <Col xs={12} lg={6}>
              <Card size="small">
                <Statistic title="Node.js" value={sys?.node ?? '—'} prefix={<NodeIndexOutlined style={{ color: '#4ade80' }} />} valueStyle={{ color: '#4ade80', fontSize: 16 }} />
              </Card>
            </Col>
            <Col xs={12} lg={6}>
              <Card size="small">
                <Statistic title="Uptime" value={sys?.uptimeHuman ?? '—'} prefix={<ClockCircleOutlined style={{ color: '#60a5fa' }} />} valueStyle={{ color: '#60a5fa', fontSize: 16 }}
                  suffix={sys?.pid ? <Text type="secondary" style={{ fontSize: 11 }}>PID {sys.pid}</Text> : null} />
              </Card>
            </Col>
            <Col xs={12} lg={6}>
              <Card size="small">
                <Statistic title="Platform" value={sys?.platform ?? '—'} prefix={<LaptopOutlined style={{ color: '#c084fc' }} />} valueStyle={{ color: '#c084fc', fontSize: 16 }}
                  suffix={sys?.env ? <Text type="secondary" style={{ fontSize: 11 }}>{sys.env}</Text> : null} />
              </Card>
            </Col>
            <Col xs={12} lg={6}>
              <Card size="small">
                <Statistic title="Maintenance" value={isMaintenance ? 'BẬT' : 'TẮT'}
                  prefix={<AlertOutlined style={{ color: isMaintenance ? '#f87171' : '#4ade80' }} />}
                  valueStyle={{ color: isMaintenance ? '#f87171' : '#4ade80', fontSize: 16 }} />
              </Card>
            </Col>
          </Row>

          {/* Memory + Disk bars */}
          <Card title={<span><ToolOutlined className="text-blue-400 mr-2" />Bộ nhớ (MB)</span>}>
            <div className="space-y-4">
              <MemBar label="Heap Used" used={sys?.memory?.heapUsed ?? 0} total={sys?.memory?.heapTotal ?? 1} />
              <MemBar label="RSS"       used={sys?.memory?.rss ?? 0}      total={sys?.memory?.heapTotal ?? 1} />
            </div>
          </Card>

          {/* Disk usage */}
          {disk && (
            <Card title={<span><HddOutlined className="text-yellow-400 mr-2" />Dung lượng ổ đĩa</span>}>
              <div className="space-y-4">
                {Array.isArray(disk)
                  ? disk.map((d, i) => <DiskBar key={i} label={d.path ?? d.filesystem ?? `Disk ${i+1}`} used={d.usedMB ?? d.used} total={d.totalMB ?? d.total} />)
                  : <DiskBar label={disk.path ?? 'Root'} used={disk.usedMB ?? disk.used} total={disk.totalMB ?? disk.total} />
                }
              </div>
            </Card>
          )}

          {/* PM2 Processes */}
          <PM2Panel processes={pm2} isRestarting={restartProcess.isPending} onRestart={name => restartProcess.mutate(name)} />

          {/* Maintenance toggle */}
          <Card title="⚙️ Maintenance Mode">
            <div className="flex items-center justify-between">
              <div className="max-w-md">
                <p className="text-sm text-gray-200">Chế độ bảo trì</p>
                <p className="text-xs text-gray-500 mt-0.5">Khi bật, tất cả request từ user sẽ nhận được 503. Admin dashboard vẫn hoạt động.</p>
              </div>
              <Switch checked={isMaintenance} loading={toggleMaintenance.isPending} onChange={(checked) => toggleMaintenance.mutate(checked)} checkedChildren="BẬT" unCheckedChildren="TẮT" />
            </div>
          </Card>

          {/* Raw info table */}
          <Card title="📋 Thông tin chi tiết">
            <Descriptions bordered size="small" column={1}>
              <Descriptions.Item label="Node.js version">{sys?.node ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="Environment">{sys?.env ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="Platform">{sys?.platform ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="Process ID">{sys?.pid ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="Uptime (giây)">{sys?.uptime ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="RSS Memory">{sys?.memory?.rss != null ? `${sys.memory.rss} MB` : '—'}</Descriptions.Item>
              <Descriptions.Item label="Heap Used">{sys?.memory?.heapUsed != null ? `${sys.memory.heapUsed} MB` : '—'}</Descriptions.Item>
              <Descriptions.Item label="Heap Total">{sys?.memory?.heapTotal != null ? `${sys.memory.heapTotal} MB` : '—'}</Descriptions.Item>
              <Descriptions.Item label="External Memory">{sys?.memory?.external != null ? `${sys.memory.external} MB` : '—'}</Descriptions.Item>
              <Descriptions.Item label="Cập nhật lúc">{sys?.timestamp ? new Date(sys.timestamp).toLocaleString('vi-VN') : '—'}</Descriptions.Item>
            </Descriptions>
          </Card>
        </>
      )}
    </div>
  );
}

export default function SystemPage() {
  return (
    <App>
      <SystemPageInner />
    </App>
  );
}
