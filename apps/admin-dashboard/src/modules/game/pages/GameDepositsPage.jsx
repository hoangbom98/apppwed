// frontend/admin-dashboard/src/modules/game/pages/GameDepositsPage.jsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Table, Tag, Button, Space, Select, App, Typography, Flex } from 'antd';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import api from '@admin/api/client';

const { Text } = Typography;

const STATUS_TAG = {
  pending:   'warning',
  success:   'success',
  completed: 'success',
  failed:    'error',
  cancelled: 'default',
};
const STATUS_LABEL = {
  pending: 'Chờ duyệt', success: 'Thành công',
  completed: 'Hoàn thành', failed: 'Thất bại', cancelled: 'Đã huỷ',
};

export default function GameDepositsPage() {
  const { modal, message } = App.useApp();
  const qc = useQueryClient();
  const [page, setPage]     = useState(1);
  const [status, setStatus] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['game-admin-deposits', page, status],
    queryFn:  () => api.get('/admin/finance/deposits', {
      params: { page, limit: 20, status: status || undefined },
    }).then(r => r.data),
  });

  const rows  = data?.data ?? [];
  const total = data?.total ?? data?.meta?.total ?? 0;

  const actionMut = useMutation({
    mutationFn: ({ id, action }) =>
      action === 'approve'
        ? api.patch(`/admin/finance/deposits/${id}/approve`)
        : api.patch(`/admin/finance/deposits/${id}/reject`),
    onSuccess: (_, { action }) => {
      message.success(action === 'approve' ? 'Đã duyệt thành công' : 'Đã từ chối');
      qc.invalidateQueries({ queryKey: ['game-admin-deposits'] });
    },
    onError: () => message.error('Có lỗi xảy ra'),
  });

  const handleAction = (record, action) => {
    modal.confirm({
      title:   action === 'approve' ? 'Xác nhận duyệt nạp tiền' : 'Xác nhận từ chối',
      content: `${action === 'approve' ? 'Duyệt' : 'Từ chối'} nạp ${Number(record.amount).toLocaleString('vi')} ₫ của ${record.user?.username ?? record.userId}?`,
      okText:  action === 'approve' ? 'Duyệt' : 'Từ chối',
      okType:  action === 'approve' ? 'primary' : 'danger',
      cancelText: 'Huỷ',
      onOk: () => actionMut.mutateAsync({ id: record.id, action }),
    });
  };

  const columns = [
    {
      title: 'User',
      key: 'user',
      render: (_, r) => (
        <div>
          <div>{r.user?.username ?? r.user?.email ?? '—'}</div>
          <Text type="secondary" style={{ fontSize: 11, fontFamily: 'monospace' }}>{r.userId}</Text>
        </div>
      ),
    },
    {
      title: 'Số tiền',
      dataIndex: 'amount',
      key: 'amount',
      render: v => <Text strong>{Number(v).toLocaleString('vi')} ₫</Text>,
    },
    {
      title: 'Phương thức',
      key: 'method',
      render: (_, r) => r.paymentMethod ?? r.method ?? r.gateway ?? '—',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: s => <Tag color={STATUS_TAG[s] ?? 'default'}>{STATUS_LABEL[s] ?? s}</Tag>,
    },
    {
      title: 'Ngày tạo',
      key: 'createdAt',
      render: (_, r) => new Date(r.createdAt ?? r.created_at).toLocaleString('vi'),
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_, r) =>
        r.status === 'pending' ? (
          <Space size="small">
            <Button
              type="primary" size="small" icon={<CheckOutlined />}
              onClick={() => handleAction(r, 'approve')}
              loading={actionMut.isPending}
            >Duyệt</Button>
            <Button
              danger size="small" icon={<CloseOutlined />}
              onClick={() => handleAction(r, 'reject')}
              loading={actionMut.isPending}
            >Từ chối</Button>
          </Space>
        ) : null,
    },
  ];

  return (
    <div className="space-y-4">
      <Flex align="center" justify="space-between" wrap="wrap" gap={12}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 900 }}>Game — Nạp tiền</div>
          <Text type="secondary">Quản lý yêu cầu nạp tiền từ người chơi</Text>
        </div>
        <Select
          value={status}
          onChange={v => { setStatus(v); setPage(1); }}
          style={{ width: 160 }}
          options={[
            { value: '',         label: 'Tất cả' },
            { value: 'pending',  label: 'Chờ duyệt' },
            { value: 'success',  label: 'Thành công' },
            { value: 'failed',   label: 'Thất bại' },
          ]}
        />
      </Flex>

      <Table
        dataSource={rows}
        columns={columns}
        loading={isLoading}
        rowKey="id"
        size="middle"
        pagination={{
          current:   page,
          pageSize:  20,
          total,
          onChange:  p => setPage(p),
          showTotal: t => `Tổng: ${t.toLocaleString()}`,
          showSizeChanger: false,
        }}
      />
    </div>
  );
}
