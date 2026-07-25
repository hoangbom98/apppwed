// frontend/admin-dashboard/src/modules/shared/pages/Users.jsx
// Ant Design — Table, Drawer, Form, Tag, Select, Input, Button, Space, Avatar
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Table, Button, Modal, Form, Input, InputNumber, Select, Tag, Space,
  Typography, Row, Col, Card, App, Flex, Drawer, Avatar, Descriptions, Divider,
} from 'antd';
import {
  SearchOutlined, EditOutlined, StopOutlined, CheckCircleOutlined,
  MobileOutlined, ClockCircleOutlined, UserOutlined,
} from '@ant-design/icons';
import api from '@admin/api/client';

const { Text, Title } = Typography;

const PROJECTS = ['game', 'hub', 'dating', 'trade', 'sports'];
const PROJECT_LABELS = { game: 'Game', hub: 'Hub', dating: 'Dating', trade: 'Trade', sports: 'Sports' };
const PROJECT_COLOR  = { game: 'blue', hub: 'purple', dating: 'magenta', trade: 'gold', sports: 'cyan' };

const STATUS_COLOR = { active: 'success', suspended: 'warning', banned: 'error' };
const STATUS_LABEL = { active: 'Hoạt động', suspended: 'Tạm khóa', banned: 'Bị cấm' };

// ── Avatar initials ────────────────────────────────────────────────────────────
function UserAvatar({ user, size = 32 }) {
  const name = user?.username ?? user?.fullName ?? user?.email ?? '?';
  const initials = name.slice(0,2).toUpperCase();
  const colors = ['#3b82f6','#8b5cf6','#ec4899','#f97316','#14b8a6','#22c55e'];
  const bg = colors[(name.charCodeAt(0) ?? 0) % colors.length];
  return (
    <Avatar size={size} style={{ backgroundColor: bg, fontWeight: 700, fontSize: size * 0.4, flexShrink: 0 }}>
      {initials}
    </Avatar>
  );
}

// ── Balance adjust modal ────────────────────────────────────────────────────────
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
      okText="Cập nhật" cancelText="Huỷ"
      confirmLoading={loading}
      destroyOnHidden
    >
      <Space direction="vertical" className="w-full mt-2">
        <div>
          <Text type="secondary" className="text-xs">Số dư hiện tại</Text>
          <div className="font-mono font-bold text-base">{Number(user?.balance ?? 0).toLocaleString('vi-VN')}₫</div>
        </div>
        <Form form={form} layout="vertical">
          <Form.Item name="amount" label="Số tiền (+/-)" rules={[{ required: true, message: 'Vui lòng nhập số tiền' }]}>
            <InputNumber className="w-full" placeholder="vd: 100000 hoặc -50000" formatter={v => v ? Number(v).toLocaleString() : ''} />
          </Form.Item>
          <Form.Item name="reason" label="Lý do (tuỳ chọn)">
            <Input placeholder="Admin manual adjustment" />
          </Form.Item>
        </Form>
      </Space>
    </Modal>
  );
}

// ── User detail drawer ──────────────────────────────────────────────────────────
function UserDetailDrawer({ open, user, project, onAdjustOpen, onClose }) {
  if (!user) return null;
  const regDate = user.createdAt ?? user.created_at;
  const lastLogin = user.lastLoginAt;
  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={
        <Flex gap={12} align="center">
          <UserAvatar user={user} size={36} />
          <div>
            <div className="font-bold text-base">{user.username ?? '—'}</div>
            <Text type="secondary" className="text-xs">{user.email}</Text>
          </div>
        </Flex>
      }
      width={420}
      footer={
        <Flex gap={8} justify="flex-end">
          <Button type="primary" onClick={onAdjustOpen}>Điều chỉnh số dư</Button>
          <Button onClick={onClose}>Đóng</Button>
        </Flex>
      }
    >
      <div className="space-y-4">
        {/* KPI mini */}
        <Row gutter={[12, 12]}>
          <Col span={12}>
            <div className="rounded-lg border border-gray-700 p-3 text-center">
              <Text type="secondary" className="text-[11px] block">Số dư</Text>
              <div className="text-lg font-bold font-mono mt-1">{Number(user.balance ?? 0).toLocaleString('vi-VN')}₫</div>
            </div>
          </Col>
          <Col span={12}>
            <div className="rounded-lg border border-gray-700 p-3 text-center">
              <Text type="secondary" className="text-[11px] block">Tổng nạp</Text>
              <div className="text-lg font-bold font-mono mt-1 text-emerald-400">{Number(user.totalDeposit ?? 0).toLocaleString('vi-VN')}₫</div>
            </div>
          </Col>
        </Row>

        <Descriptions column={1} size="small" bordered>
          <Descriptions.Item label="ID">
            <Text code className="text-[11px]">{user.id}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="Username"><Text strong>{user.username ?? '—'}</Text></Descriptions.Item>
          <Descriptions.Item label="Họ tên">{user.fullName ?? '—'}</Descriptions.Item>
          <Descriptions.Item label="Email">{user.email ?? '—'}</Descriptions.Item>
          <Descriptions.Item label="Phone">{user.phone ?? '—'}</Descriptions.Item>
          <Descriptions.Item label="Role"><Tag color={user.role === 'admin' ? 'blue' : 'default'}>{user.role ?? 'user'}</Tag></Descriptions.Item>
          <Descriptions.Item label="Trạng thái"><Tag color={STATUS_COLOR[user.status] ?? 'default'}>{STATUS_LABEL[user.status] ?? user.status}</Tag></Descriptions.Item>
          <Descriptions.Item label={<><ClockCircleOutlined className="mr-1" />Đăng ký</>}>
            {regDate ? new Date(regDate).toLocaleString('vi-VN') : '—'}
          </Descriptions.Item>
          {lastLogin && (
            <Descriptions.Item label={<><ClockCircleOutlined className="mr-1" />Đăng nhập gần nhất</>}>
              {new Date(lastLogin).toLocaleString('vi-VN')}
            </Descriptions.Item>
          )}
          {user.deviceCount != null && (
            <Descriptions.Item label={<><MobileOutlined className="mr-1" />Thiết bị</>}>
              <Tag>{user.deviceCount} thiết bị</Tag>
            </Descriptions.Item>
          )}
          {user.referralCode && (
            <Descriptions.Item label="Mã giới thiệu">
              <Text code>{user.referralCode}</Text>
            </Descriptions.Item>
          )}
        </Descriptions>
      </div>
    </Drawer>
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

  const { data, isLoading } = useQuery({
    queryKey: ['adminUsers', project, page, search, statusFilter],
    queryFn:  () => api.get('/admin/users', {
      params: { project, page, limit: 20, search: search || undefined, status: statusFilter || undefined },
    }).then(r => r.data?.data ?? r.data),
  });

  const { data: summary } = useQuery({
    queryKey: ['adminUserSummary'],
    queryFn:  () => api.get('/admin/users/summary').then(r => r.data?.data ?? r.data),
    staleTime: 60_000,
  });

  const rows  = data?.data  ?? [];
  const total = data?.total ?? 0;

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

  const columns = [
    {
      title: '', key: 'avatar', width: 44,
      render: (_, record) => <UserAvatar user={record} size={30} />,
    },
    { title: 'Username', dataIndex: 'username', key: 'username',
      render: (v, r) => (
        <div>
          <Text strong className="cursor-pointer hover:text-blue-400" onClick={() => setDetailUser(r)}>{v}</Text>
          {r.lastLoginAt && <div><Text type="secondary" className="text-[11px]">{new Date(r.lastLoginAt).toLocaleDateString('vi-VN')}</Text></div>}
        </div>
      )},
    { title: 'Email',    dataIndex: 'email',    key: 'email', render: v => <Text type="secondary" className="text-xs">{v}</Text> },
    { title: 'Số dư',    dataIndex: 'balance',  key: 'balance', render: v => <Text className="font-mono text-xs">{Number(v ?? 0).toLocaleString('vi-VN')}₫</Text> },
    { title: 'Role',     dataIndex: 'role',     key: 'role', render: v => <Tag color={v === 'admin' ? 'blue' : 'default'}>{v ?? 'user'}</Tag> },
    { title: 'Trạng thái', dataIndex: 'status', key: 'status',
      render: v => <Tag color={STATUS_COLOR[v] ?? 'default'}>{STATUS_LABEL[v] ?? (v ?? 'active')}</Tag>,
    },
    { title: 'Thiết bị', dataIndex: 'deviceCount', key: 'devices',
      render: v => v != null ? <Tag icon={<MobileOutlined />}>{v}</Tag> : '—',
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

      {/* ── Project summary cards ── */}
      {summary && (
        <Row gutter={[12, 12]} className="mb-5">
          {PROJECTS.map(p => (
            <Col key={p} xs={12} sm={8} md={4}>
              <Card size="small" hoverable onClick={() => { setProject(p); setPage(1); }}
                className={`cursor-pointer ${project === p ? 'border-blue-500 bg-blue-50' : ''}`}>
                <div className="text-[11px] font-semibold">
                  <Tag color={PROJECT_COLOR[p]} className="mb-1">{PROJECT_LABELS[p]}</Tag>
                </div>
                <div className="text-[22px] font-extrabold">{(summary[p] ?? 0).toLocaleString()}</div>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {/* ── Filters ── */}
      <Flex gap={12} wrap="wrap" align="center" className="mb-4">
        <Space size={4}>
          {PROJECTS.map(p => (
            <Button key={p} size="small" type={project === p ? 'primary' : 'default'} onClick={() => { setProject(p); setPage(1); }}>
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
            { label: 'Hoạt động',          value: 'active' },
            { label: 'Tạm khóa',           value: 'suspended' },
            { label: 'Bị cấm',             value: 'banned' },
          ]}
        />
        <Text type="secondary" className="ml-auto text-xs">
          Tổng: <Text strong>{total.toLocaleString()}</Text>
        </Text>
      </Flex>

      {/* ── Table ── */}
      <Table
        dataSource={rows} columns={columns} rowKey="id"
        loading={isLoading} size="small" scroll={{ x: 950 }}
        pagination={{
          current: page, pageSize: 20, total,
          showSizeChanger: false,
          showTotal: t => `${t} người dùng`,
          onChange: p => setPage(p),
        }}
      />

      {/* ── Detail drawer ── */}
      <UserDetailDrawer
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
