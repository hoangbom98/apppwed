// @ts-nocheck
// frontend/admin-dashboard/src/modules/shared/pages/RiskAudit.jsx
// Risk monitoring — 7 tabs: Summary, Suspicious Users, Risk Alerts, AML Alerts,
// Security Logs, IP Blacklist, Audit Log; backed by /admin/risk/* endpoints.
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Table, Tag, Button, Select, Input, Modal, Form, Tabs,
  Card, Statistic, Row, Col, App, Spin, Space, Typography,
} from 'antd';
import {
  SafetyOutlined, BarChartOutlined, AlertFilled, DollarOutlined,
  FileTextOutlined, StopOutlined, AuditOutlined, PlusOutlined,
} from '@ant-design/icons';
import api from '@admin/api/client';

const { Text } = Typography;

// ── Color maps → antd Tag color ───────────────────────────────────────────────
const riskColor  = { high: 'error', medium: 'warning', low: 'blue', critical: 'purple' };
const alertColor = { new: 'error', reviewed: 'warning', resolved: 'success', escalated: 'orange', dismissed: 'default' };
const sevColor   = { critical: 'purple', high: 'error', medium: 'warning', low: 'blue' };

// ── Shared pagination factory ──────────────────────────────────────────────────
const pagination = (page, total, setPage) => ({
  current: page,
  pageSize: 20,
  total,
  showTotal: t => `${t} bản ghi`,
  onChange:  setPage,
  size:      'small',
  showSizeChanger: false,
});

// ── 1. Summary ────────────────────────────────────────────────────────────────
function SummaryPanel() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-risk-summary'],
    queryFn:  () => api.get('/admin/risk/summary').then(r => r.data?.data ?? r.data),
    staleTime: 30_000,
  });

  const cards = [
    { label: 'Risk Alerts mới',       value: data?.newAlerts,     color: '#f87171' },
    { label: 'Cảnh báo cao',           value: data?.highAlerts,    color: '#fb923c' },
    { label: 'AML chưa xử lý',         value: data?.amlNew,        color: '#c084fc' },
    { label: 'Security logs hôm nay',  value: data?.secLogsToday,  color: '#facc15' },
    { label: 'IP bị block',            value: data?.blockedIps,    color: '#60a5fa' },
    { label: 'Người dùng bị khóa 7d',  value: data?.criticalUsers, color: '#9ca3af' },
  ];

  return (
    <Spin spinning={isLoading}>
      <Row gutter={[16, 16]}>
        {cards.map(c => (
          <Col key={c.label} xs={12} md={8}>
            <Card size="small">
              <Statistic
                title={c.label}
                value={c.value ?? '—'}
                valueStyle={{ color: c.color, fontSize: 24 }}
                prefix={<SafetyOutlined style={{ color: c.color, fontSize: 14 }} />}
              />
            </Card>
          </Col>
        ))}
      </Row>
    </Spin>
  );
}

// ── 2. Suspicious users ───────────────────────────────────────────────────────
function SuspiciousUsers() {
  const [level, setLevel] = useState(undefined);
  const [page,  setPage]  = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-risk-users', level, page],
    queryFn:  () => api.get('/admin/risk/users', { params: { level, page, limit: 20 } }).then(r => r.data),
    staleTime: 60_000,
  });

  const rows  = data?.data ?? [];
  const total = data?.meta?.total ?? data?.total ?? 0;

  const columns = [
    { title: 'User ID',      dataIndex: 'userId',     key: 'userId',     render: v => <Text code className="text-xs">{v}</Text> },
    { title: 'Dự án',        dataIndex: 'project',    key: 'project',    render: v => v ?? '—' },
    { title: 'Lý do',        dataIndex: 'reason',     key: 'reason',     ellipsis: true },
    { title: 'Mức độ',       dataIndex: 'level',      key: 'level',      render: v => <Tag color={riskColor[v] ?? 'default'}>{v ?? 'low'}</Tag> },
    { title: 'Điểm rủi ro',  dataIndex: 'score',      key: 'score',      render: v => <Text code className="text-xs">{v ?? '—'}</Text> },
    { title: 'Phát hiện lúc',dataIndex: 'detectedAt', key: 'detectedAt', render: v => v ? new Date(v).toLocaleString('vi') : '—' },
  ];

  return (
    <Space direction="vertical" className="w-full">
      <Select
        size="small"
        placeholder="Mức độ: Tất cả"
        allowClear
        style={{ width: 180 }}
        value={level}
        onChange={v => { setLevel(v); setPage(1); }}
        options={[
          { value: 'high',   label: 'Cao' },
          { value: 'medium', label: 'Trung bình' },
          { value: 'low',    label: 'Thấp' },
        ]}
      />
      <Table
        dataSource={rows} columns={columns} rowKey={(r, i) => r.id ?? i}
        loading={isLoading} size="small" scroll={{ x: 700 }}
        pagination={pagination(page, total, setPage)}
      />
    </Space>
  );
}

// ── 3. Risk Alerts ────────────────────────────────────────────────────────────
function RiskAlerts() {
  const [status, setStatus] = useState('new');
  const [page,   setPage]   = useState(1);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-risk-alerts', status, page],
    queryFn:  () => api.get('/admin/risk/alerts', { params: { status: status || undefined, page, limit: 20 } }).then(r => r.data),
    staleTime: 15_000,
  });

  const updateMut = useMutation({
    mutationFn: ({ id, newStatus }) => api.patch(`/admin/risk/alerts/${id}`, { status: newStatus }),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['admin-risk-alerts'] }),
  });

  const rows  = data?.data ?? [];
  const total = data?.meta?.total ?? data?.total ?? 0;

  const columns = [
    { title: 'ID',         dataIndex: 'id',        key: 'id',        render: v => <Text code className="text-xs">{v?.slice(0,8)}…</Text> },
    { title: 'User',       dataIndex: 'userId',    key: 'userId',    render: v => <Text code className="text-xs">{v}</Text> },
    { title: 'Rule',       key: 'rule',            render: (_, r)  => r.rule?.name ?? '—' },
    { title: 'Trạng thái', dataIndex: 'status',    key: 'status',    render: v => <Tag color={alertColor[v] ?? 'default'}>{v}</Tag> },
    { title: 'Thời gian',  dataIndex: 'createdAt', key: 'createdAt', render: v => new Date(v).toLocaleString('vi') },
    {
      title: 'Thao tác', key: 'actions',
      render: (_, r) => r.status === 'new' ? (
        <Space size={4}>
          <Button size="small" loading={updateMut.isPending}
            onClick={() => updateMut.mutate({ id: r.id, newStatus: 'reviewed' })}>Đã xem</Button>
          <Button size="small" type="primary" loading={updateMut.isPending}
            onClick={() => updateMut.mutate({ id: r.id, newStatus: 'resolved' })}>Giải quyết</Button>
        </Space>
      ) : null,
    },
  ];

  return (
    <Space direction="vertical" className="w-full">
      <Select
        size="small"
        placeholder="Trạng thái"
        allowClear
        style={{ width: 180 }}
        value={status || undefined}
        onChange={v => { setStatus(v ?? 'new'); setPage(1); }}
        options={[
          { value: 'new',      label: 'Mới' },
          { value: 'reviewed', label: 'Đã xem' },
          { value: 'resolved', label: 'Đã giải quyết' },
        ]}
      />
      <Table
        dataSource={rows} columns={columns} rowKey="id"
        loading={isLoading} size="small" scroll={{ x: 700 }}
        pagination={pagination(page, total, setPage)}
      />
    </Space>
  );
}

// ── 4. AML Alerts ─────────────────────────────────────────────────────────────
function AmlAlerts() {
  const [status, setStatus] = useState('new');
  const [page,   setPage]   = useState(1);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-aml-alerts', status, page],
    queryFn:  () => api.get('/admin/risk/aml', { params: { status: status || undefined, page, limit: 20 } }).then(r => r.data),
    staleTime: 15_000,
  });

  const updateMut = useMutation({
    mutationFn: ({ id, newStatus }) => api.patch(`/admin/risk/aml/${id}`, { status: newStatus }),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['admin-aml-alerts'] }),
  });

  const rows  = data?.data ?? [];
  const total = data?.meta?.total ?? data?.total ?? 0;

  const columns = [
    { title: 'ID',         dataIndex: 'id',        key: 'id',        render: v => <Text code className="text-xs">{v?.slice(0,8)}…</Text> },
    { title: 'User',       dataIndex: 'userId',    key: 'userId',    render: v => <Text code className="text-xs">{v}</Text> },
    { title: 'Loại',       key: 'type',            render: (_, r)  => r.alertType ?? r.type ?? '—' },
    { title: 'Số tiền',    dataIndex: 'amount',    key: 'amount',    render: v => v ? <Text strong className="text-xs">{Number(v).toLocaleString('vi')}₫</Text> : '—' },
    { title: 'Trạng thái', dataIndex: 'status',    key: 'status',    render: v => <Tag color={alertColor[v] ?? 'default'}>{v}</Tag> },
    { title: 'Thời gian',  dataIndex: 'createdAt', key: 'createdAt', render: v => new Date(v).toLocaleString('vi') },
    {
      title: 'Thao tác', key: 'actions',
      render: (_, r) => r.status === 'new' ? (
        <Space size={4}>
          <Button size="small" loading={updateMut.isPending}
            onClick={() => updateMut.mutate({ id: r.id, newStatus: 'reviewed' })}>Xem</Button>
          <Button size="small" type="primary" loading={updateMut.isPending}
            onClick={() => updateMut.mutate({ id: r.id, newStatus: 'cleared' })}>Xoá</Button>
          <Button size="small" danger loading={updateMut.isPending}
            onClick={() => updateMut.mutate({ id: r.id, newStatus: 'escalated' })}>Escalate</Button>
        </Space>
      ) : null,
    },
  ];

  return (
    <Space direction="vertical" className="w-full">
      <Select
        size="small"
        placeholder="Trạng thái"
        allowClear
        style={{ width: 200 }}
        value={status || undefined}
        onChange={v => { setStatus(v ?? 'new'); setPage(1); }}
        options={[
          { value: 'new',       label: 'Mới' },
          { value: 'reviewed',  label: 'Đã xem' },
          { value: 'escalated', label: 'Escalated' },
          { value: 'cleared',   label: 'Đã xử lý' },
        ]}
      />
      <Table
        dataSource={rows} columns={columns} rowKey="id"
        loading={isLoading} size="small" scroll={{ x: 800 }}
        pagination={pagination(page, total, setPage)}
      />
    </Space>
  );
}

// ── 5. Security Logs ──────────────────────────────────────────────────────────
function SecurityLogs() {
  const [type,     setType] = useState(undefined);
  const [severity, setSev]  = useState(undefined);
  const [page,     setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-security-logs', type, severity, page],
    queryFn:  () => api.get('/admin/risk/security-logs', {
      params: { type, severity, page, limit: 20 },
    }).then(r => r.data),
    staleTime: 15_000,
  });

  const rows  = data?.data ?? [];
  const total = data?.meta?.total ?? data?.total ?? 0;

  const columns = [
    { title: 'IP',           dataIndex: 'ip',        key: 'ip',        render: v => <Text code className="text-xs">{v}</Text> },
    { title: 'Loại',         dataIndex: 'type',      key: 'type',      render: v => v ?? '—' },
    { title: 'Mức độ',       dataIndex: 'severity',  key: 'severity',  render: v => <Tag color={sevColor[v] ?? 'default'}>{v}</Tag> },
    { title: 'Endpoint',     key: 'endpoint',        ellipsis: true,   render: (_, r) => r.endpoint ?? r.path ?? '—' },
    { title: 'User Agent',   dataIndex: 'userAgent', key: 'ua',        ellipsis: true, render: v => v ? v.slice(0,50) : '—' },
    { title: 'Thời gian',    dataIndex: 'createdAt', key: 'createdAt', render: v => new Date(v).toLocaleString('vi') },
  ];

  return (
    <Space direction="vertical" className="w-full">
      <Space size={8}>
        <Select
          size="small"
          placeholder="Loại: Tất cả"
          allowClear
          style={{ width: 180 }}
          value={type}
          onChange={v => { setType(v); setPage(1); }}
          options={['brute_force', 'injection', 'ddos', 'geo_risk', 'bot', 'suspicious_ip'].map(t => ({ value: t, label: t }))}
        />
        <Select
          size="small"
          placeholder="Mức độ: Tất cả"
          allowClear
          style={{ width: 160 }}
          value={severity}
          onChange={v => { setSev(v); setPage(1); }}
          options={['critical', 'high', 'medium', 'low'].map(s => ({ value: s, label: s }))}
        />
      </Space>
      <Table
        dataSource={rows} columns={columns} rowKey={(r, i) => r.id ?? i}
        loading={isLoading} size="small" scroll={{ x: 800 }}
        pagination={pagination(page, total, setPage)}
      />
    </Space>
  );
}

// ── 6. IP Blacklist ───────────────────────────────────────────────────────────
function IpBlacklist() {
  const { modal } = App.useApp();
  const [page,   setPage]   = useState(1);
  const [adding, setAdding] = useState(false);
  const [form]              = Form.useForm();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-ip-blacklist', page],
    queryFn:  () => api.get('/admin/risk/ip-blacklist', { params: { page, limit: 20 } }).then(r => r.data),
    staleTime: 30_000,
  });

  const addMut = useMutation({
    mutationFn: (body) => api.post('/admin/risk/ip-blacklist', body),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ['admin-ip-blacklist'] });
      form.resetFields();
      setAdding(false);
    },
  });

  const removeMut = useMutation({
    mutationFn: (ip) => api.delete(`/admin/risk/ip-blacklist/${encodeURIComponent(ip)}`),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['admin-ip-blacklist'] }),
  });

  const rows  = data?.data ?? [];
  const total = data?.meta?.total ?? data?.total ?? 0;

  const columns = [
    { title: 'IP',       dataIndex: 'ip',        key: 'ip',       render: v => <Text code style={{ color: '#f87171' }}>{v}</Text> },
    { title: 'Lý do',    dataIndex: 'reason',    key: 'reason',   ellipsis: true },
    { title: 'Loại',     dataIndex: 'type',      key: 'type' },
    { title: 'Thêm bởi', dataIndex: 'addedBy',   key: 'addedBy',  render: v => v ?? '—' },
    { title: 'Hết hạn',  dataIndex: 'expiresAt', key: 'expiresAt',render: v => v ? new Date(v).toLocaleDateString('vi') : 'Vĩnh viễn' },
    {
      title: '', key: 'actions',
      render: (_, r) => (
        <Button
          size="small" danger
          loading={removeMut.isPending}
          onClick={() => {
            modal.confirm({
              title: 'Xoá block IP',
              content: `Xoá block IP ${r.ip}?`,
              onOk: () => removeMut.mutate(r.ip),
              okButtonProps: { danger: true },
            });
          }}
        >
          Xoá
        </Button>
      ),
    },
  ];

  return (
    <Space direction="vertical" className="w-full">
      <div className="flex justify-end">
        <Button
          type="primary"
          danger
          icon={<PlusOutlined />}
          onClick={() => setAdding(true)}
        >
          Block IP
        </Button>
      </div>

      <Table
        dataSource={rows} columns={columns} rowKey={(r, i) => r.ip ?? i}
        loading={isLoading} size="small" scroll={{ x: 700 }}
        pagination={pagination(page, total, setPage)}
      />

      <Modal
        open={adding}
        title="Block IP"
        onCancel={() => { setAdding(false); form.resetFields(); }}
        onOk={() =>
          form.validateFields().then(values =>
            addMut.mutate({ ip: values.ip, reason: values.reason, durationDays: 30 })
          )
        }
        okText="Block 30 ngày"
        okButtonProps={{ danger: true, loading: addMut.isPending }}
        cancelText="Huỷ"
        destroyOnClose
      >
        <Form form={form} layout="vertical" className="mt-4">
          <Form.Item name="ip" label="Địa chỉ IP" rules={[{ required: true, message: 'Nhập địa chỉ IP' }]}>
            <Input placeholder="192.168.1.1" />
          </Form.Item>
          <Form.Item name="reason" label="Lý do" rules={[{ required: true, message: 'Nhập lý do' }]}>
            <Input placeholder="Spam, brute force, ..." />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}

// ── 7. Audit Log ──────────────────────────────────────────────────────────────
function AuditLog() {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-audit-log', page],
    queryFn:  () => api.get('/admin/logs/audit', { params: { page, limit: 20 } }).then(r => r.data),
    staleTime: 15_000,
  });

  const rows  = data?.data ?? [];
  const total = data?.meta?.total ?? data?.total ?? 0;

  const columns = [
    { title: 'Admin',      key: 'admin',     render: (_, r) => r.admin?.username ?? r.adminId },
    { title: 'Hành động',  dataIndex: 'action',    key: 'action',    render: v => <Text code className="text-xs">{v}</Text> },
    { title: 'Đối tượng',  dataIndex: 'target',    key: 'target',    ellipsis: true, render: v => v ?? '—' },
    { title: 'IP',         dataIndex: 'ip',        key: 'ip',        render: v => <Text code className="text-xs">{v ?? '—'}</Text> },
    { title: 'Thời gian',  dataIndex: 'createdAt', key: 'createdAt', render: v => v ? new Date(v).toLocaleString('vi') : '—' },
  ];

  return (
    <Table
      dataSource={rows} columns={columns} rowKey={(r, i) => r.id ?? i}
      loading={isLoading} size="small" scroll={{ x: 700 }}
      pagination={pagination(page, total, setPage)}
    />
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
const TABS = [
  { key: 'summary', label: 'Tổng quan',       icon: <BarChartOutlined />,  children: <SummaryPanel /> },
  { key: 'users',   label: 'Nguy cơ cao',      icon: <SafetyOutlined />,    children: <SuspiciousUsers /> },
  { key: 'alerts',  label: 'Risk Alerts',      icon: <AlertFilled />,       children: <RiskAlerts /> },
  { key: 'aml',     label: 'AML',               icon: <DollarOutlined />,    children: <AmlAlerts /> },
  { key: 'seclog',  label: 'Security Logs',    icon: <FileTextOutlined />,  children: <SecurityLogs /> },
  { key: 'ipblock', label: 'IP Blacklist',      icon: <StopOutlined />,      children: <IpBlacklist /> },
  { key: 'audit',   label: 'Nhật ký Admin',    icon: <AuditOutlined />,     children: <AuditLog /> },
];

function RiskAuditInner() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-white">Rủi ro & Bảo mật</h1>
      <Tabs
        defaultActiveKey="summary"
        type="line"
        items={TABS.map(t => ({
          key:      t.key,
          label:    t.label,
          children: t.children,
        }))}
      />
    </div>
  );
}

export default function RiskAudit() {
  return (
    <App>
      <RiskAuditInner />
    </App>
  );
}
