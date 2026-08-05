// Cross-project member management — view / ban-unban / adjust balance
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Table, Button, Tag, Input, Select, Modal, Form, InputNumber,
  Typography, Space, App, Flex,
} from 'antd';
import {
  SearchOutlined, StopOutlined, CheckCircleOutlined, EditOutlined,
} from '@ant-design/icons';
import api from '@admin/api/client';

const { Title, Text } = Typography;

const PROJECTS = [
  { code: 'all',    label: 'Tất cả' },
  { code: 'game',   label: 'Game' },
  { code: 'dating', label: 'Dating' },
  { code: 'trade',  label: 'Trade' },
  { code: 'sports', label: 'Sports' },
  { code: 'hub',    label: 'Hub' },
];

// ── Balance adjust modal ───────────────────────────────────────────────────────
function BalanceModal({ open, user, onOk, onCancel, loading }) {
  const [form] = Form.useForm();
  const handleOk = () =>
    form.validateFields().then(values => { onOk(values.amount); form.resetFields(); });

  return (
    <Modal
      open={open}
      title={`Điều chỉnh số dư — ${user?.username ?? user?.email}`}
      onOk={handleOk}
      onCancel={() => { form.resetFields(); onCancel(); }}
      okText="Áp dụng" cancelText="Huỷ"
      confirmLoading={loading}
      destroyOnHidden
    >
      <Space direction="vertical" className="w-full mt-2">
        <div>
          <Text type="secondary" className="text-xs">Số dư hiện tại</Text>
          <div className="font-mono font-bold text-base">
            {Number(user?.wallets?.find(w => w.currency === 'VND')?.balance ?? user?.balance ?? 0).toLocaleString('vi-VN')}₫
          </div>
        </div>
        <Form form={form} layout="vertical">
          <Form.Item name="amount" label="Số tiền (+/-)" rules={[{ required: true, message: 'Vui lòng nhập số tiền' }]}>
            <InputNumber className="w-full" placeholder="vd: 100000 hoặc -50000" formatter={v => v ? Number(v).toLocaleString() : ''} />
          </Form.Item>
        </Form>
      </Space>
    </Modal>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function ProjectUsers() {
  const { message } = App.useApp();
  const [project,      setProject]      = useState('all');
  const [page,         setPage]         = useState(1);
  const [search,       setSearch]       = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const qc = useQueryClient();

  const params = {
    page, limit: 20,
    search:  search  || undefined,
    project: project !== 'all' ? project : undefined,
  };

  const { data, isLoading } = useQuery({
    queryKey: ['adminProjectUsers', project, page, search],
    queryFn:  () => api.get('/admin/users', { params }).then(r => r.data),
    keepPreviousData: true,
  });

  const rows  = data?.data ?? [];
  const total = data?.meta?.total ?? data?.total ?? 0;

  const toggleStatus = useMutation({
    mutationFn: (userId) => api.patch(
      `/admin/users/${userId}/status`, {},
      { params: { project: project !== 'all' ? project : 'game' } }
    ),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['adminProjectUsers'] }); message.success('Đã cập nhật trạng thái'); },
    onError:   () => message.error('Lỗi khi thay đổi trạng thái'),
  });

  const adjustBalance = useMutation({
    mutationFn: ({ userId, amount }) => api.post(
      `/admin/users/${userId}/balance`,
      { amount, reason: 'Admin manual adjustment' },
      { params: { project: project !== 'all' ? project : 'game' } }
    ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['adminProjectUsers'] });
      setSelectedUser(null);
      message.success('Đã điều chỉnh số dư');
    },
    onError: () => message.error('Lỗi khi điều chỉnh số dư'),
  });

  const columns = [
    {
      title: 'Thành viên', key: 'user',
      render: (_, u) => (
        <div>
          <Text strong>{u.username ?? '—'}</Text>
          <div><Text type="secondary" className="text-xs">{u.email}</Text></div>
        </div>
      ),
    },
    {
      title: 'Số dư', key: 'balance',
      render: (_, u) => (
        <Text className="font-mono font-semibold text-xs">
          {(u.wallets?.find(w => w.currency === 'VND')?.balance ?? u.balance ?? 0).toLocaleString('vi-VN')}₫
        </Text>
      ),
    },
    {
      title: 'Role', dataIndex: 'role', key: 'role',
      render: v => <Tag color={v === 'admin' || v === 'super_admin' ? 'blue' : 'default'}>{v ?? 'user'}</Tag>,
    },
    {
      title: 'Trạng thái', dataIndex: 'status', key: 'status',
      render: v => <Tag color={v === 'active' ? 'success' : 'error'}>{v === 'active' ? 'Hoạt động' : 'Bị khóa'}</Tag>,
    },
    {
      title: 'Ngày tạo', dataIndex: 'createdAt', key: 'createdAt',
      render: v => <Text type="secondary" className="text-xs">{new Date(v ?? v?.created_at).toLocaleDateString('vi-VN')}</Text>,
    },
    {
      title: '', key: 'actions', width: 120,
      render: (_, record) => (
        <Space size={4}>
          <Button size="small" icon={<EditOutlined />} onClick={() => setSelectedUser(record)}>Chi tiết</Button>
          <Button
            size="small"
            danger={record.status === 'active'}
            icon={record.status === 'active' ? <StopOutlined /> : <CheckCircleOutlined />}
            loading={toggleStatus.isPending}
            onClick={() => toggleStatus.mutate(record.id)}
          />
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Flex justify="space-between" align="center" wrap="wrap" gap={12} className="mb-4">
        <Title level={4} className="m-0">Quản lý thành viên</Title>
        <Input
          allowClear prefix={<SearchOutlined />}
          placeholder="Tìm username / email..."
          className="w-[240px]"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
        />
      </Flex>

      {/* Project filter */}
      <Space size={4} className="mb-4 flex-wrap">
        {PROJECTS.map(p => (
          <Button key={p.code} size="small" type={project === p.code ? 'primary' : 'default'}
            onClick={() => { setProject(p.code); setPage(1); }}>
            {p.label}
          </Button>
        ))}
        <Text type="secondary" className="ml-auto text-xs">
          Tổng: <Text strong>{total.toLocaleString()}</Text>
        </Text>
      </Space>

      <Table
        dataSource={rows} columns={columns} rowKey="id"
        loading={isLoading} size="small" scroll={{ x: 800 }}
        pagination={{ current: page, pageSize: 20, total, showSizeChanger: false, showTotal: t => `${t} thành viên`, onChange: p => setPage(p) }}
      />

      <BalanceModal
        open={!!selectedUser}
        user={selectedUser}
        loading={adjustBalance.isPending}
        onOk={(amount) => adjustBalance.mutate({ userId: selectedUser.id, amount })}
        onCancel={() => setSelectedUser(null)}
      />
    </div>
  );
}
