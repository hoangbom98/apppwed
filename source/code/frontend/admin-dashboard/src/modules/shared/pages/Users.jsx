// frontend/admin-dashboard/src/modules/shared/pages/Users.jsx
// Ant Design — Table, Modal, Form, Tag, Select, Input, Button, Space
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Table, Button, Modal, Form, Input, InputNumber, Select, Tag, Space,
  Typography, Row, Col, Card, App, Flex,
} from 'antd';
import {
  SearchOutlined, EditOutlined, StopOutlined, CheckCircleOutlined,
} from '@ant-design/icons';
import api from '@admin/api/client';

const { Text, Title } = Typography;

const PROJECTS = ['game', 'hub', 'dating', 'trade', 'sports'];
const PROJECT_LABELS = { game: 'Game', hub: 'Hub', dating: 'Dating', trade: 'Trade', sports: 'Sports' };
const PROJECT_COLOR  = { game: 'blue', hub: 'purple', dating: 'magenta', trade: 'gold', sports: 'cyan' };

const STATUS_COLOR = {
  active:    'success',
  suspended: 'warning',
  banned:    'error',
};
const STATUS_LABEL = { active: 'Hoạt động', suspended: 'Tạm khóa', banned: 'Bị cấm' };

// ── Balance adjust modal ───────────────────────────────────────────────────────
function BalanceModal({ open, user, project, onOk, onCancel, loading }) {
  const [form] = Form.useForm();
  const handleOk = () =>
    form.validateFields().then(values => { onOk(values.amount, values.reason); form.resetFields(); });

  return (
    <Modal
      open={open}
      title={`Điều chỉnh số dư — ${user?.username ?? user?.email}`}
      onOk={handleOk}
      onCancel={() => { form.resetFields(); onCancel(); }}
      okText="Cập nhật"
      cancelText="Huỷ"
      confirmLoading={loading}
      destroyOnHidden
    >
      <Space direction="vertical" className="w-full mt-2">
        <div>
          <Text type="secondary" className="text-xs">Số dư hiện tại</Text>
          <div className="font-mono font-bold text-base">
            {Number(user?.balance ?? 0).toLocaleString('vi-VN')}₫
          </div>
        </div>
        <Form form={form} layout="vertical">
          <Form.Item name="amount" label="Số tiền (+/-)" rules={[{ required: true, message: 'Vui lòng nhập số tiền' }]}>
            <InputNumber
              className="w-full"
              placeholder="vd: 100000 hoặc -50000"
              formatter={v => v ? Number(v).toLocaleString() : ''}
            />
          </Form.Item>
          <Form.Item name="reason" label="Lý do (tuỳ chọn)">
            <Input placeholder="Admin manual adjustment" />
          </Form.Item>
        </Form>
      </Space>
    </Modal>
  );
}

// ── User detail modal ──────────────────────────────────────────────────────────
function UserDetailModal({ open, user, project, onAdjustOpen, onClose }) {
  if (!user) return null;
  const fields = [
    ['ID',        user.id],
    ['Username',  user.username],
    ['Họ tên',    user.fullName ?? '—'],
    ['Email',     user.email],
    ['Role',      user.role],
    ['Trạng thái',user.status],
    ['Số dư',     Number(user.balance ?? 0).toLocaleString('vi-VN') + '₫'],
    ['Ngày tạo',  new Date(user.createdAt ?? user.created_at).toLocaleString('vi-VN')],
  ];
  return (
    <Modal open={open} title="Chi tiết người dùng" footer={[
      <Button key="balance" type="primary" onClick={onAdjustOpen}>Điều chỉnh số dư</Button>,
      <Button key="close" onClick={onClose}>Đóng</Button>,
    ]} onCancel={onClose} destroyOnHidden>
      <Row gutter={[16, 12]} className="mt-2">
        {fields.map(([k, v]) => (
          <Col key={k} span={12}>
            <Text type="secondary" className="text-[11px]">{k}</Text>
            <div className="text-[13px] break-all">{v ?? '—'}</div>
          </Col>
        ))}
      </Row>
    </Modal>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function Users() {
  const { message } = App.useApp();
  const [project,      setProject]      = useState('game');
  const [page,         setPage]         = useState(1);
  const [search,       setSearch]       = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [detailUser,   setDetailUser]   = useState(null);
  const [balanceOpen,  setBalanceOpen]  = useState(false);
  const qc = useQueryClient();

  // ── Fetch users ──────────────────────────────────────────────────────────────
  const { data, isLoading } = useQuery({
    queryKey: ['adminUsers', project, page, search, statusFilter],
    queryFn:  () => api.get('/admin/users', {
      params: { project, page, limit: 20, search: search || undefined, status: statusFilter || undefined },
    }).then(r => r.data?.data ?? r.data),
  });

  // ── User summary ─────────────────────────────────────────────────────────────
  const { data: summary } = useQuery({
    queryKey: ['adminUserSummary'],
    queryFn:  () => api.get('/admin/users/summary').then(r => r.data?.data ?? r.data),
    staleTime: 60_000,
  });

  const rows       = data?.data  ?? [];
  const total      = data?.total ?? 0;

  // ── Mutations ─────────────────────────────────────────────────────────────────
  const toggleStatus = useMutation({
    mutationFn: (userId) => api.patch(`/admin/users/${userId}/status`, {}, { params: { project } }),
    onSuccess:  (res) => { qc.invalidateQueries({ queryKey: ['adminUsers'] }); message.success(`Đã cập nhật: ${res.data?.data?.newStatus ?? ''}`); },
    onError:    () => message.error('Lỗi khi thay đổi trạng thái'),
  });

  const adjustBalance = useMutation({
    mutationFn: ({ userId, amount, reason }) =>
      api.post(`/admin/users/${userId}/balance`, { amount, reason: reason || 'Admin adjustment' }, { params: { project } }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['adminUsers'] });
      setBalanceOpen(false);
      message.success(`Số dư mới: ${Number(res.data?.data?.newBalance ?? 0).toLocaleString('vi-VN')}₫`);
    },
    onError: () => message.error('Lỗi khi điều chỉnh số dư'),
  });

  // ── Table columns ─────────────────────────────────────────────────────────────
  const columns = [
    { title: 'ID',       dataIndex: 'id',       key: 'id', width: 70, render: v => <Text type="secondary" className="text-[11px] font-mono">#{v}</Text> },
    { title: 'Username', dataIndex: 'username', key: 'username', render: v => <Text strong>{v}</Text> },
    { title: 'Email',    dataIndex: 'email',    key: 'email', render: v => <Text type="secondary" className="text-xs">{v}</Text> },
    { title: 'Họ tên',   dataIndex: 'fullName', key: 'fullName', render: v => v ?? '—' },
    { title: 'Số dư',    dataIndex: 'balance',  key: 'balance', render: v => <Text className="font-mono text-xs">{Number(v ?? 0).toLocaleString('vi-VN')}₫</Text> },
    { title: 'Role',     dataIndex: 'role',     key: 'role', render: v => <Tag color={v === 'admin' ? 'blue' : 'default'}>{v ?? 'user'}</Tag> },
    { title: 'Trạng thái', dataIndex: 'status', key: 'status',
      render: v => <Tag color={STATUS_COLOR[v] ?? 'default'}>{STATUS_LABEL[v] ?? (v ?? 'active')}</Tag>,
    },
    { title: 'Ngày tạo', dataIndex: 'createdAt', key: 'createdAt',
      render: v => <Text type="secondary" className="text-[11px]">{new Date(v ?? Date.now()).toLocaleDateString('vi-VN')}</Text>,
    },
    {
      title: '', key: 'actions', width: 120,
      render: (_, record) => (
        <Space size={4}>
          <Button size="small" icon={<EditOutlined />} onClick={() => setDetailUser(record)}>Xem</Button>
          <Button
            size="small"
            danger={record.status === 'active'}
            icon={record.status === 'active' ? <StopOutlined /> : <CheckCircleOutlined />}
            loading={toggleStatus.isPending}
            onClick={() => toggleStatus.mutate(record.id)}
          >
            {record.status === 'active' ? 'Ban' : 'Unban'}
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Title level={4} className="mb-4">Quản lý người dùng</Title>

      {/* ── Project summary cards ─────────────────────────────────────── */}
      {summary && (
        <Row gutter={[12, 12]} className="mb-5">
          {PROJECTS.map(p => (
            <Col key={p} xs={12} sm={8} md={4}>
              <Card
                size="small"
                hoverable
                onClick={() => { setProject(p); setPage(1); }}
                className={`cursor-pointer ${project === p ? 'border-blue-500 bg-blue-50' : ''}`}
              >
                <div className="text-[11px] font-semibold">
                  <Tag color={PROJECT_COLOR[p]} className="mb-1">{PROJECT_LABELS[p]}</Tag>
                </div>
                <div className="text-[22px] font-extrabold">{(summary[p] ?? 0).toLocaleString()}</div>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {/* ── Filters ──────────────────────────────────────────────────── */}
      <Flex gap={12} wrap="wrap" align="center" className="mb-4">
        <Space size={4}>
          {PROJECTS.map(p => (
            <Button
              key={p} size="small"
              type={project === p ? 'primary' : 'default'}
              onClick={() => { setProject(p); setPage(1); }}
            >
              {PROJECT_LABELS[p]}
            </Button>
          ))}
        </Space>
        <Input
          allowClear prefix={<SearchOutlined />}
          placeholder="Tìm username / email..."
          className="w-[220px]"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
        />
        <Select
          className="w-[170px]" value={statusFilter}
          onChange={v => { setStatusFilter(v); setPage(1); }}
          options={[
            { label: 'Tất cả trạng thái', value: '' },
            { label: 'Hoạt động', value: 'active' },
            { label: 'Tạm khóa',  value: 'suspended' },
            { label: 'Bị cấm',   value: 'banned' },
          ]}
        />
        <Text type="secondary" className="ml-auto text-xs">
          Tổng: <Text strong>{total.toLocaleString()}</Text>
        </Text>
      </Flex>

      {/* ── Table ──────────────────────────────────────────────────────── */}
      <Table
        dataSource={rows}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        size="small"
        scroll={{ x: 900 }}
        pagination={{
          current:   page,
          pageSize:  20,
          total,
          showSizeChanger: false,
          showTotal: t => `${t} người dùng`,
          onChange:  p => setPage(p),
        }}
      />

      {/* ── Modals ─────────────────────────────────────────────────────── */}
      <UserDetailModal
        open={!!detailUser}
        user={detailUser}
        project={project}
        onAdjustOpen={() => setBalanceOpen(true)}
        onClose={() => setDetailUser(null)}
      />
      <BalanceModal
        open={balanceOpen}
        user={detailUser}
        project={project}
        loading={adjustBalance.isPending}
        onOk={(amount, reason) => adjustBalance.mutate({ userId: detailUser.id, amount, reason })}
        onCancel={() => setBalanceOpen(false)}
      />
    </div>
  );
}
