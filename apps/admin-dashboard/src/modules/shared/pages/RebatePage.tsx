// Rebate (Hoàn trả) Management — học từ RebateService.php + RebateController.php Boyue
// Route: /rebates
// Tabs: Stats | Rules (Luật hoàn trả) | Claims (Yêu cầu chờ duyệt)
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Table, Button, Tag, Input, Select, Modal, Form, InputNumber,
  Typography, Space, App, Flex, Tabs, Card, Row, Col, Statistic,
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined,
  CheckOutlined, CloseOutlined, ArrowUpOutlined, ArrowDownOutlined,
} from '@ant-design/icons';
import api from '@admin/api/client';

const { Title, Text } = Typography;

const GAME_TYPES = ['', 'RNG', 'LIVE', 'FISH', 'SPORTS', 'ESPORTS', 'PVP', 'ELOTTO', 'COCKFIGHT'];
const PERIODS    = ['daily', 'weekly', 'monthly'];
const PROJECTS   = ['game', 'dating', 'sports', 'trade'];
const STATUS_COLOR = { pending: 'warning', approved: 'success', rejected: 'error', active: 'success', inactive: 'default' };

function fmt(n) { return n == null ? '—' : Number(n).toLocaleString('vi-VN'); }

// ── Stats Panel ───────────────────────────────────────────────────────────────
function StatsPanel() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-rebate-stats'],
    queryFn:  () => api.get('/admin/rebates/stats').then(r => r.data?.data ?? r.data),
    staleTime: 30_000,
  });

  return (
    <Row gutter={[16, 16]}>
      {[
        { label: 'Chờ duyệt',    value: data?.pending,              color: '#f97316', icon: null },
        { label: 'Xuất hôm nay', value: data?.today?.amount,        color: '#10b981', suffix: '₫' },
        { label: 'Lượt hôm nay', value: data?.today?.count,         color: '#3b82f6' },
        { label: 'Xuất tháng',   value: data?.month?.amount,        color: '#a855f7', suffix: '₫' },
        { label: 'Lượt tháng',   value: data?.month?.count,         color: '#ec4899' },
      ].map(c => (
        <Col key={c.label} xs={12} sm={8} md={4}>
          <Card size="small">
            <Statistic
              title={c.label}
              value={c.value ?? 0}
              formatter={v => (c.suffix ? fmt(v) + c.suffix : Number(v).toLocaleString())}
              valueStyle={{ color: c.color, fontSize: 20 }}
              loading={isLoading}
            />
          </Card>
        </Col>
      ))}
    </Row>
  );
}

// ── Rule Form Modal ───────────────────────────────────────────────────────────
function RuleFormModal({ editing, open, onClose }) {
  const [form] = Form.useForm();
  const { message } = App.useApp();
  const qc    = useQueryClient();
  const isNew = !editing?.id;

  React.useEffect(() => {
    if (open) form.setFieldsValue(editing ?? { period: 'daily', project: 'game', status: 'active', rebateRate: 0.5, minBet: 0, sortOrder: 0 });
    else form.resetFields();
  }, [open, editing, form]);

  const mut = useMutation({
    mutationFn: values => isNew ? api.post('/admin/rebates/rules', values) : api.patch(`/admin/rebates/rules/${editing.id}`, values),
    onSuccess:  () => { message.success(isNew ? 'Đã tạo luật' : 'Đã cập nhật'); qc.invalidateQueries({ queryKey: ['admin-rebate-rules'] }); onClose(); },
    onError:    e => message.error(e?.response?.data?.message ?? 'Lỗi'),
  });

  return (
    <Modal
      open={open}
      title={isNew ? '+ Tạo luật hoàn trả' : `Sửa: ${editing?.name}`}
      onOk={() => form.validateFields().then(v => mut.mutate(v))}
      onCancel={onClose}
      okText={isNew ? 'Tạo' : 'Lưu'} cancelText="Huỷ"
      confirmLoading={mut.isPending}
      width={540}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" style={{ marginTop: 8 }}>
        <Form.Item name="name" label="Tên luật" rules={[{ required: true }]}>
          <Input placeholder="vd: Slot Daily Rebate 0.5%" />
        </Form.Item>
        <Row gutter={12}>
          <Col span={12}>
            <Form.Item name="gameType" label="Loại game">
              <Select options={GAME_TYPES.map(t => ({ label: t || 'Tất cả', value: t }))} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="period" label="Kỳ hoàn trả">
              <Select options={PERIODS.map(p => ({ label: p, value: p }))} />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={12}>
          <Col span={12}>
            <Form.Item name="rebateRate" label="% Hoàn trả" rules={[{ required: true }]}>
              <InputNumber style={{ width: '100%' }} min={0.01} max={100} step={0.01} addonAfter="%" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="minBet" label="Cược tối thiểu">
              <InputNumber style={{ width: '100%' }} min={0} formatter={v => Number(v).toLocaleString()} />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={12}>
          <Col span={12}>
            <Form.Item name="project" label="Dự án">
              <Select options={PROJECTS.map(p => ({ label: p, value: p }))} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="status" label="Trạng thái">
              <Select options={[{ label: 'Hoạt động', value: 'active' }, { label: 'Tắt', value: 'inactive' }]} />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
}

// ── Rules Tab ─────────────────────────────────────────────────────────────────
function RulesTab() {
  const { message, modal } = App.useApp();
  const qc    = useQueryClient();
  const [page, setPage]    = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing]   = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-rebate-rules', page],
    queryFn:  () => api.get('/admin/rebates/rules', { params: { page, limit: 20 } }).then(r => r.data),
    staleTime: 60_000,
  });
  const rows  = data?.data ?? [];
  const total = data?.meta?.total ?? data?.total ?? 0;

  const deleteMut = useMutation({
    mutationFn: id => api.delete(`/admin/rebates/rules/${id}`),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['admin-rebate-rules'] }); message.success('Đã xoá'); },
    onError:    e  => message.error(e?.response?.data?.message ?? 'Lỗi xoá'),
  });

  const columns = [
    { title: 'Tên luật',    dataIndex: 'name',       render: v => <Text strong>{v}</Text> },
    { title: 'Loại game',   dataIndex: 'gameType',   render: v => v ? <Tag>{v}</Tag> : <Text type="secondary">Tất cả</Text> },
    { title: '% Hoàn trả',  dataIndex: 'rebateRate', render: v => <Text style={{ color: '#10b981', fontWeight: 700 }}>{v}%</Text> },
    { title: 'Cược min',    dataIndex: 'minBet',     render: v => <Text style={{ fontSize: 12 }}>{fmt(v)}₫</Text> },
    { title: 'Kỳ',          dataIndex: 'period',     render: v => <Tag color="blue">{v}</Tag> },
    { title: 'Dự án',       dataIndex: 'project',    render: v => <Tag>{v}</Tag> },
    { title: 'Trạng thái',  dataIndex: 'status',     render: v => <Tag color={STATUS_COLOR[v] ?? 'default'}>{v}</Tag> },
    {
      title: '', key: 'actions', width: 100,
      render: (_, r) => (
        <Space size={4}>
          <Button size="small" icon={<EditOutlined />} onClick={() => { setEditing(r); setFormOpen(true); }} />
          <Button size="small" danger icon={<DeleteOutlined />} loading={deleteMut.isPending}
            onClick={() => modal.confirm({ title: `Xoá luật "${r.name}"?`, okText: 'Xoá', okButtonProps: { danger: true }, onOk: () => deleteMut.mutate(r.id) })} />
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-3">
      <Flex justify="flex-end">
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(null); setFormOpen(true); }}>Thêm luật</Button>
      </Flex>
      <Table dataSource={rows} columns={columns} rowKey="id" loading={isLoading} size="small"
        pagination={{ current: page, pageSize: 20, total, onChange: p => setPage(p), showSizeChanger: false }} />
      <RuleFormModal open={formOpen} editing={editing} onClose={() => { setFormOpen(false); setEditing(null); }} />
    </div>
  );
}

// ── Claims Tab ────────────────────────────────────────────────────────────────
function ClaimsTab() {
  const { message } = App.useApp();
  const qc = useQueryClient();
  const [page,       setPage]   = useState(1);
  const [statusF,    setStatus] = useState('pending');
  const [projectF,   setProj]   = useState('');
  const [note,       setNote]   = useState('');
  const [confirming, setConf]   = useState(null); // { id, action }

  const { data, isLoading } = useQuery({
    queryKey: ['admin-rebate-claims', page, statusF, projectF],
    queryFn:  () => api.get('/admin/rebates/claims', {
      params: { page, limit: 20, status: statusF || undefined, project: projectF || undefined },
    }).then(r => r.data),
    staleTime: 15_000,
  });
  const rows  = data?.data ?? [];
  const total = data?.meta?.total ?? data?.total ?? 0;

  const approveMut = useMutation({
    mutationFn: ({ id }) => api.patch(`/admin/rebates/claims/${id}/approve`, { note }),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['admin-rebate-claims'] }); qc.invalidateQueries({ queryKey: ['admin-rebate-stats'] }); setConf(null); setNote(''); message.success('Đã duyệt hoàn trả'); },
    onError:    () => message.error('Lỗi khi duyệt'),
  });
  const rejectMut = useMutation({
    mutationFn: ({ id }) => api.patch(`/admin/rebates/claims/${id}/reject`, { note }),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['admin-rebate-claims'] }); setConf(null); setNote(''); message.success('Đã từ chối'); },
    onError:    () => message.error('Lỗi khi từ chối'),
  });

  const columns = [
    { title: 'User ID',     dataIndex: 'userId',      render: v => <Text code style={{ fontSize: 11 }}>{v}</Text> },
    { title: 'Rule',        key: 'rule',              render: (_, r) => r.rule?.name ?? `#${r.ruleId}` },
    { title: 'Kỳ',          dataIndex: 'period',      render: v => <Text style={{ fontSize: 12 }}>{v}</Text> },
    { title: 'Tổng cược',   dataIndex: 'totalBet',    render: v => <Text style={{ fontSize: 12 }}>{fmt(v)}₫</Text> },
    { title: 'Hoàn trả',    dataIndex: 'rebateAmount',render: v => <Text strong style={{ color: '#10b981' }}>{fmt(v)}₫</Text> },
    { title: 'Dự án',       dataIndex: 'project',     render: v => <Tag>{v}</Tag> },
    { title: 'Trạng thái',  dataIndex: 'status',      render: v => <Tag color={STATUS_COLOR[v] ?? 'default'}>{v}</Tag> },
    { title: 'Ngày tạo',    dataIndex: 'createdAt',   render: v => <Text type="secondary" style={{ fontSize: 11 }}>{new Date(v).toLocaleDateString('vi')}</Text> },
    {
      title: 'Thao tác', key: 'actions', width: 130,
      render: (_, r) => r.status === 'pending' ? (
        <Space size={4}>
          <Button size="small" type="primary" icon={<CheckOutlined />} onClick={() => setConf({ id: r.id, action: 'approve' })}>Duyệt</Button>
          <Button size="small" danger icon={<CloseOutlined />} onClick={() => setConf({ id: r.id, action: 'reject' })}>Từ chối</Button>
        </Space>
      ) : null,
    },
  ];

  const FILTER_OPTS = [['pending','Chờ duyệt'],['approved','Đã duyệt'],['rejected','Từ chối'],['','Tất cả']];

  return (
    <div className="space-y-3">
      <Flex gap={8} wrap="wrap" align="center">
        <Space size={4}>
          {FILTER_OPTS.map(([v, l]) => (
            <Button key={v} size="small" type={statusF === v ? 'primary' : 'default'} onClick={() => { setStatus(v); setPage(1); }}>{l}</Button>
          ))}
        </Space>
        <Select size="small" style={{ width: 120 }} value={projectF} onChange={v => { setProj(v); setPage(1); }}
          options={[{ label: 'Tất cả dự án', value: '' }, ...PROJECTS.map(p => ({ label: p, value: p }))]} />
      </Flex>

      <Table dataSource={rows} columns={columns} rowKey="id" loading={isLoading} size="small" scroll={{ x: 900 }}
        pagination={{ current: page, pageSize: 20, total, showSizeChanger: false, showTotal: t => `${t} yêu cầu`, onChange: p => setPage(p) }} />

      <Modal
        open={!!confirming}
        title={confirming?.action === 'approve' ? 'Xác nhận duyệt hoàn trả' : 'Xác nhận từ chối'}
        onOk={() => confirming?.action === 'approve' ? approveMut.mutate({ id: confirming.id }) : rejectMut.mutate({ id: confirming.id })}
        onCancel={() => { setConf(null); setNote(''); }}
        okText="Xác nhận" cancelText="Huỷ"
        okButtonProps={{ danger: confirming?.action === 'reject', loading: approveMut.isPending || rejectMut.isPending }}
        destroyOnClose
      >
        <Form layout="vertical" style={{ marginTop: 8 }}>
          <Form.Item label="Ghi chú (tuỳ chọn)">
            <Input placeholder="Lý do..." value={note} onChange={e => setNote(e.target.value)} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function RebatePage() {
  const TAB_ITEMS = [
    { key: 'stats',  label: 'Tổng quan',       children: <StatsPanel /> },
    { key: 'rules',  label: 'Luật hoàn trả',   children: <RulesTab /> },
    { key: 'claims', label: 'Yêu cầu duyệt',   children: <ClaimsTab /> },
  ];

  return (
    <div>
      <Title level={4} style={{ marginBottom: 20 }}>Quản lý Hoàn trả (Rebate)</Title>
      <Tabs defaultActiveKey="stats" items={TAB_ITEMS} />
    </div>
  );
}
