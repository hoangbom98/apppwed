// frontend/admin-dashboard/src/modules/shared/pages/MonitorPage.jsx
// Realtime Monitor — live alerts, admin activity logs, online stats.
// Route: /monitor
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Table, Tag, Button, Space, Input, Tabs, Card, App, Typography, Flex, Progress,
} from 'antd';
import api from '@admin/api/client';
import { useAdminSocket } from '@admin/core/hooks/useAdminSocket';

const { Text } = Typography;

const LEVEL_TAG = { INFO: 'processing', WARNING: 'warning', CRITICAL: 'error' };

function fmt(n) { return n == null ? '0' : Number(n).toLocaleString('vi-VN'); }
function fmtTime(s) { return s ? new Date(s).toLocaleString('vi-VN') : '—'; }

// ── Online stats panel ────────────────────────────────────────────────────────
function OnlinePanel() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-monitor-online'],
    queryFn:  () => api.get('/admin/monitor/online').then(r => r.data?.data ?? r.data),
    refetchInterval: 30_000,
  });

  const byProject = data?.byProject ?? {};
  const total     = data?.total ?? 0;

  return (
    <Card size="small" title={
      <Flex align="center" gap={8}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ade80', animation: 'pulse 2s infinite' }} />
        <span>Người dùng trực tuyến</span>
        <Text style={{ marginLeft: 'auto', color: '#4ade80', fontSize: 20, fontWeight: 900 }}>{fmt(total)}</Text>
      </Flex>
    }>
      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {Array.from({ length: 4 }).map((_, i) => <div key={i} style={{ height: 20, background: 'rgba(255,255,255,0.05)', borderRadius: 4 }} />)}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {Object.entries(byProject).map(([proj, count]) => (
            <div key={proj} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Text type="secondary" style={{ fontSize: 11, width: 56, textTransform: 'uppercase' }}>{proj}</Text>
              <Progress
                percent={total > 0 ? Math.round((Number(count) / total) * 100) : 0}
                size="small"
                showInfo={false}
                strokeColor="#4ade80"
                style={{ flex: 1 }}
              />
              <Text style={{ fontSize: 12, width: 28, textAlign: 'right' }}>{count}</Text>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

// ── Alerts tab ────────────────────────────────────────────────────────────────
function AlertsTab() {
  const { message } = App.useApp();
  const qc = useQueryClient();
  const [page, setPage]   = useState(1);
  const [level, setLevel] = useState('');
  const [status, setSt]   = useState('PENDING');
  const [liveAlerts, setLiveAlerts] = useState([]);

  // WebSocket: listen for new alerts — logic preserved unchanged
  const socket = useAdminSocket();
  useEffect(() => {
    if (!socket) return;
    const handler = alert => setLiveAlerts(prev => [{ ...alert, _live: true }, ...prev].slice(0, 5));
    socket.on('alert', handler);
    return () => socket.off('alert', handler);
  }, [socket]);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-monitor-alerts', page, level, status],
    queryFn:  () => api.get('/admin/monitor/alerts', { params: { page, limit: 20, level: level || undefined, status: status || undefined } }).then(r => r.data),
    staleTime: 20_000,
  });

  const rows  = data?.data ?? [];
  const total = data?.meta?.total ?? data?.total ?? 0;

  const ackMut = useMutation({
    mutationFn: id => api.patch(`/admin/monitor/alerts/${id}/ack`),
    onSuccess:  () => { message.success('Đã xác nhận'); qc.invalidateQueries({ queryKey: ['admin-monitor-alerts'] }); },
  });
  const resMut = useMutation({
    mutationFn: id => api.patch(`/admin/monitor/alerts/${id}/resolve`),
    onSuccess:  () => { message.success('Đã giải quyết'); qc.invalidateQueries({ queryKey: ['admin-monitor-alerts'] }); },
  });

  const alertColumns = [
    {
      title: 'Level', key: 'level',
      render: (_, a) => <Tag color={LEVEL_TAG[a.level] ?? 'default'}>{a.level}</Tag>,
    },
    {
      title: 'Tiêu đề / Nội dung', key: 'title',
      render: (_, a) => (
        <div>
          <div style={{ fontWeight: 500 }}>{a.title}</div>
          {a.message && <Text type="secondary" style={{ fontSize: 12 }} ellipsis={{ tooltip: a.message }}>{a.message}</Text>}
        </div>
      ),
    },
    { title: 'Project', dataIndex: 'project', key: 'project', render: v => v ? <Tag>{v.toUpperCase()}</Tag> : '—' },
    { title: 'Thời gian', key: 'time', render: (_, a) => fmtTime(a.createdAt) },
    {
      title: 'Thao tác', key: 'action',
      render: (_, a) => (
        <Space size="small">
          {a.status === 'PENDING' && (
            <Button size="small" onClick={() => ackMut.mutate(a.id)} loading={ackMut.isPending}>Xác nhận</Button>
          )}
          {a.status !== 'RESOLVED' && (
            <Button size="small" type="primary" onClick={() => resMut.mutate(a.id)} loading={resMut.isPending}>Giải quyết</Button>
          )}
        </Space>
      ),
    },
  ];

  const levelOpts = [
    { value: '', label: 'Tất cả level' },
    { value: 'INFO', label: 'Info' },
    { value: 'WARNING', label: 'Warning' },
    { value: 'CRITICAL', label: 'Critical' },
  ];
  const statusOpts = [
    { value: 'PENDING', label: 'Chờ xử lý' },
    { value: 'ACKNOWLEDGED', label: 'Đã xác nhận' },
    { value: 'RESOLVED', label: 'Đã giải quyết' },
    { value: '', label: 'Tất cả' },
  ];

  return (
    <div className="space-y-4">
      {/* Live alerts banner */}
      {liveAlerts.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {liveAlerts.map((a, i) => (
            <div key={i} style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
              <Flex align="center" gap={8}>
                <Tag color={LEVEL_TAG[a.level] ?? 'default'}>{a.level}</Tag>
                <Text style={{ fontWeight: 600 }}>{a.title}</Text>
                {a.message && <Text type="secondary" style={{ fontSize: 12 }}>{a.message}</Text>}
                <Tag style={{ marginLeft: 'auto' }}>LIVE</Tag>
              </Flex>
            </div>
          ))}
        </div>
      )}

      <Space wrap>
        {levelOpts.map(o => (
          <Button
            key={o.value}
            size="small"
            type={level === o.value ? 'primary' : 'default'}
            onClick={() => { setLevel(o.value); setPage(1); }}
          >{o.label}</Button>
        ))}
        <span style={{ margin: '0 8px', color: 'rgba(255,255,255,0.3)' }}>|</span>
        {statusOpts.map(o => (
          <Button
            key={o.value}
            size="small"
            type={status === o.value ? 'primary' : 'default'}
            onClick={() => { setSt(o.value); setPage(1); }}
          >{o.label}</Button>
        ))}
      </Space>

      <Table
        dataSource={rows}
        columns={alertColumns}
        loading={isLoading}
        rowKey="id"
        size="middle"
        pagination={{ current: page, pageSize: 20, total, onChange: p => setPage(p), showTotal: t => `Tổng: ${fmt(t)}`, showSizeChanger: false }}
      />
    </div>
  );
}

// ── Admin logs tab ─────────────────────────────────────────────────────────────
function AdminLogsTab() {
  const [page, setPage]     = useState(1);
  const [module, setModule] = useState('');
  const [action, setAction] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-monitor-logs', page, module, action],
    queryFn:  () => api.get('/admin/monitor/logs', {
      params: { page, limit: 20, module: module || undefined, action: action || undefined },
    }).then(r => r.data),
    staleTime: 30_000,
  });

  const rows  = data?.data ?? [];
  const total = data?.meta?.total ?? data?.total ?? 0;

  const logColumns = [
    { title: 'Admin',  key: 'admin',   render: (_, l) => l.adminUsername ?? l.adminId },
    { title: 'Module', dataIndex: 'module', key: 'module', render: v => <Text code>{v}</Text> },
    { title: 'Action', dataIndex: 'action', key: 'action' },
    { title: 'Target', dataIndex: 'targetId', key: 'target', render: v => v ?? '—', ellipsis: true },
    { title: 'IP',     dataIndex: 'ip',       key: 'ip',     render: v => v ?? '—' },
    { title: 'Thời gian', key: 'time', render: (_, l) => fmtTime(l.createdAt) },
  ];

  return (
    <div className="space-y-4">
      <Space wrap>
        <Input
          placeholder="Lọc module..."
          value={module} onChange={e => { setModule(e.target.value); setPage(1); }}
          style={{ width: 160 }} allowClear
        />
        <Input
          placeholder="Lọc action..."
          value={action} onChange={e => { setAction(e.target.value); setPage(1); }}
          style={{ width: 160 }} allowClear
        />
      </Space>
      <Table
        dataSource={rows}
        columns={logColumns}
        loading={isLoading}
        rowKey="id"
        size="middle"
        pagination={{ current: page, pageSize: 20, total, onChange: p => setPage(p), showTotal: t => `Tổng: ${fmt(t)}`, showSizeChanger: false }}
      />
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function MonitorPage() {
  const [tab, setTab] = useState('alerts');

  const tabItems = [
    { key: 'alerts', label: 'Cảnh báo', children: <AlertsTab /> },
    { key: 'logs',   label: 'Lịch sử Admin', children: <AdminLogsTab /> },
  ];

  return (
    <div className="space-y-5">
      <div style={{ fontSize: 22, fontWeight: 900 }}>Giám sát thời gian thực</div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24, alignItems: 'start' }}>
        <Tabs activeKey={tab} onChange={setTab} items={tabItems} />
        <OnlinePanel />
      </div>
    </div>
  );
}
