// @ts-nocheck
// apps/admin-dashboard/src/modules/shared/pages/SystemHealthPage.tsx
// Route: /settings/health
// Hiển thị real-time health status: services, PM2, DNS, Redis, DB
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, Row, Col, Tag, Table, Progress, Typography, Spin, Statistic, Alert, Badge } from 'antd';
import {
  ReloadOutlined, CheckCircleOutlined, CloseCircleOutlined,
  WarningOutlined, GlobalOutlined, NodeIndexOutlined,
} from '@ant-design/icons';
import api from '@admin/api/client';

const { Text, Title } = Typography;

// ── Types ──────────────────────────────────────────────────────────────────────
interface ServiceStatus {
  name: string; url: string; type: string;
  status: 'online' | 'offline' | 'warning' | 'degraded';
  responseTime: number; details: string;
}

interface Pm2Process {
  name: string; status: string;
  cpu: number; memory: number; uptime: number; pid: number | null;
}

interface DnsRecord {
  hostname: string; ip: string; expected: string; resolved: boolean;
}

// ── Helpers ────────────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  online:   { color: 'success', icon: <CheckCircleOutlined />, label: 'Online'   },
  offline:  { color: 'error',   icon: <CloseCircleOutlined />, label: 'Offline'  },
  warning:  { color: 'warning', icon: <WarningOutlined />,     label: 'Warning'  },
  degraded: { color: 'warning', icon: <WarningOutlined />,     label: 'Degraded' },
};

function statusTag(s: string) {
  const cfg = STATUS_CONFIG[s] ?? STATUS_CONFIG.warning;
  return <Tag color={cfg.color} icon={cfg.icon}>{cfg.label}</Tag>;
}

function fmtUptime(ms: number) {
  if (!ms) return '—';
  const s = Math.floor((Date.now() - ms) / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  return d > 0 ? `${d}d ${h}h` : h > 0 ? `${h}h ${m}m` : `${m}m`;
}

// ── Sub-components ────────────────────────────────────────────────────────────
function SummaryCards({ services }: { services: ServiceStatus[] }) {
  const total   = services.length;
  const online  = services.filter(s => s.status === 'online').length;
  const offline = services.filter(s => s.status === 'offline').length;
  const avgMs   = services.length
    ? Math.round(services.reduce((a, s) => a + s.responseTime, 0) / services.length)
    : 0;

  return (
    <Row gutter={[16, 16]}>
      {[
        { title: 'Online',   value: online,        suffix: `/ ${total}`, color: '#52c41a' },
        { title: 'Offline',  value: offline,        suffix: 'dịch vụ',   color: offline ? '#ff4d4f' : '#52c41a' },
        { title: 'Avg RT',   value: avgMs,          suffix: 'ms',        color: avgMs > 500 ? '#faad14' : '#52c41a' },
        { title: 'Tình trạng', value: offline === 0 ? 'Tốt' : 'Có lỗi',  color: offline === 0 ? '#52c41a' : '#ff4d4f' },
      ].map(({ title, value, suffix, color }) => (
        <Col xs={12} md={6} key={title}>
          <Card size="small">
            <Statistic title={title} value={value} suffix={suffix} valueStyle={{ color }} />
          </Card>
        </Col>
      ))}
    </Row>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function SystemHealthPage() {
  const {
    data: servicesData, isLoading: servicesLoading, refetch: refetchServices, dataUpdatedAt,
  } = useQuery({
    queryKey: ['admin-health-services'],
    queryFn:  () => api.get('/admin/health/services').then(r => r.data?.data ?? r.data),
    refetchInterval: 30_000,
    staleTime: 20_000,
  });

  const { data: pm2Data, isLoading: pm2Loading, refetch: refetchPm2 } = useQuery({
    queryKey: ['admin-health-pm2'],
    queryFn:  () => api.get('/admin/health/pm2').then(r => r.data?.data ?? r.data),
    refetchInterval: 30_000,
  });

  const { data: dnsData, isLoading: dnsLoading } = useQuery({
    queryKey: ['admin-health-dns'],
    queryFn:  () => api.get('/admin/health/dns').then(r => r.data?.data ?? r.data),
    refetchInterval: 60_000,
  });

  const services: ServiceStatus[] = Array.isArray(servicesData) ? servicesData : [];
  const pm2:      Pm2Process[]    = Array.isArray(pm2Data) ? pm2Data : [];
  const dns:      DnsRecord[]     = Array.isArray(dnsData)  ? dnsData  : [];

  const handleRefreshAll = () => { refetchServices(); refetchPm2(); };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <Title level={4} className="!mb-0">Sức khoẻ hệ thống</Title>
          <Text type="secondary" className="text-xs">
            Tự động refresh 30s · Cập nhật lúc:{' '}
            {dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString('vi-VN') : '—'}
          </Text>
        </div>
        <button
          onClick={handleRefreshAll}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
        >
          <ReloadOutlined /> Refresh
        </button>
      </div>

      {/* Summary */}
      {!servicesLoading && <SummaryCards services={services} />}

      {/* Services */}
      <Card
        title={<><NodeIndexOutlined className="mr-2" />Dịch vụ & Endpoints</>}
        size="small"
        extra={<Badge count={services.filter(s => s.status === 'offline').length} color="red" showZero={false} />}
      >
        {servicesLoading ? <Spin /> : (
          <Table
            dataSource={services}
            rowKey="name"
            size="small"
            pagination={false}
            columns={[
              { title: 'Tên', dataIndex: 'name', width: 100, render: t => <Text strong>{t}</Text> },
              { title: 'Loại', dataIndex: 'type', width: 90,
                render: t => <Tag color={t === 'backend' ? 'blue' : t === 'infra' ? 'orange' : 'default'}>{t}</Tag> },
              { title: 'Trạng thái', dataIndex: 'status', width: 110, render: statusTag },
              { title: 'Thời gian', dataIndex: 'responseTime',
                render: ms => <Text type={ms > 500 ? 'warning' : undefined}>{ms}ms</Text> },
              { title: 'Chi tiết', dataIndex: 'details', render: t => <Text type="secondary" className="text-xs">{t}</Text> },
            ]}
          />
        )}
      </Card>

      {/* PM2 Processes */}
      <Card
        title={<><NodeIndexOutlined className="mr-2" />PM2 Processes</>}
        size="small"
      >
        {pm2Loading ? <Spin /> : pm2.length === 0 ? (
          <Alert type="info" message="Không có dữ liệu PM2 (chỉ hiển thị trên VPS)" showIcon />
        ) : (
          <Table
            dataSource={pm2}
            rowKey="name"
            size="small"
            pagination={false}
            columns={[
              { title: 'App', dataIndex: 'name', render: t => <Text strong>{t}</Text> },
              { title: 'Status', dataIndex: 'status', render: s => (
                <Tag color={s === 'online' ? 'success' : 'error'}>{s}</Tag>
              )},
              { title: 'CPU', dataIndex: 'cpu', width: 100,
                render: v => <Progress percent={v} size="small" status={v > 80 ? 'exception' : 'active'} style={{ width: 80 }} /> },
              { title: 'RAM', dataIndex: 'memory', width: 80,
                render: v => <Text type={v > 300 ? 'warning' : undefined}>{v} MB</Text> },
              { title: 'Uptime', dataIndex: 'uptime', render: fmtUptime },
              { title: 'PID', dataIndex: 'pid', width: 70, render: v => <Text type="secondary">{v ?? '—'}</Text> },
            ]}
          />
        )}
      </Card>

      {/* DNS */}
      <Card
        title={<><GlobalOutlined className="mr-2" />DNS Records</>}
        size="small"
        extra={dns.length > 0 && (
          <Tag color={dns.every(d => d.resolved) ? 'success' : 'error'}>
            {dns.filter(d => d.resolved).length}/{dns.length} OK
          </Tag>
        )}
      >
        {dnsLoading ? <Spin /> : dns.length === 0 ? (
          <Alert type="info" message="Không có dữ liệu DNS" showIcon />
        ) : (
          <Table
            dataSource={dns}
            rowKey="hostname"
            size="small"
            pagination={false}
            columns={[
              { title: 'Hostname', dataIndex: 'hostname', render: t => <Text code className="text-xs">{t}</Text> },
              { title: 'IP hiện tại', dataIndex: 'ip', render: t => <Text className="text-xs">{t}</Text> },
              { title: 'IP kỳ vọng', dataIndex: 'expected', render: t => <Text type="secondary" className="text-xs">{t}</Text> },
              { title: 'Trạng thái', dataIndex: 'resolved',
                render: v => v
                  ? <Tag color="success" icon={<CheckCircleOutlined />}>OK</Tag>
                  : <Tag color="error" icon={<CloseCircleOutlined />}>FAIL</Tag> },
            ]}
          />
        )}
      </Card>
    </div>
  );
}
